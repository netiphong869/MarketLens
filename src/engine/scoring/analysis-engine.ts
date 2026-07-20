import { adx, atr, ema, macd, obv, rsi } from "@/engine/indicators/indicators";
import type { HorizonScores, QualityResult, RiskResult, ScoreBreakdown } from "@/types/analysis";
import type { Candle, CompanyProfile, FinancialMetrics, MarketEvent, Quote, Timeframe } from "@/types/market";

interface Snapshot { symbol: string; quote: Quote; profile: CompanyProfile; candles: Record<Timeframe, Candle[]>; fundamentals: FinancialMetrics | null; events: MarketEvent[] }
export interface EngineResult { technical: ScoreBreakdown; market: ScoreBreakdown; fundamental: ScoreBreakdown | null; events: ScoreBreakdown; risk: RiskResult; quality: QualityResult; horizons: HorizonScores | null }
const timeframeWeight: Record<Timeframe, number> = { "1d": 0.4, "4h": 0.3, "1h": 0.2, "15m": 0.1 };

export function analyzeSnapshot(snapshot: Snapshot): EngineResult {
  const quality = scoreQuality(snapshot);
  const technical = scoreTechnical(snapshot.candles);
  const fundamental = snapshot.fundamentals ? scoreFundamental(snapshot.fundamentals) : null;
  const events = scoreEvents(snapshot.events);
  const market = neutralScore("MARKET_CONTEXT_PENDING", "ยังไม่มีบริบทตลาดและกลุ่มอุตสาหกรรมครบถ้วน");
  const risk = scoreRisk(snapshot, technical, fundamental);
  const horizons = quality.stopped || !fundamental ? null : horizonScores(technical.score, market.score, fundamental.score, events.score, risk.penalty);
  return { technical, market, fundamental, events, risk, quality, horizons };
}

function scoreQuality(input: Snapshot): QualityResult {
  const supported = input.profile.securityType === "common_stock";
  const completeFrames = Object.values(input.candles).filter((items) => items.length >= 50).length;
  let score = 20 + completeFrames * 15 + (input.fundamentals ? 15 : 0) + (Number.isFinite(input.quote.price) && input.quote.price > 0 ? 5 : 0);
  const missing: string[] = [];
  if (!supported) { score = Math.min(score, 20); missing.push("ประเภทหลักทรัพย์ยังไม่รองรับ"); }
  if (completeFrames < 4) missing.push("แท่งเทียนหลายกรอบเวลาไม่ครบ");
  if (!input.fundamentals) missing.push("ข้อมูลงบการเงิน");
  score = clamp(score);
  return { score, availableWeight: 100, stopped: score < 60 || !supported, missing, conflicts: [], reasons: [{ code: "QUALITY_COMPLETENESS", label: `มีกรอบเวลาที่พร้อมคำนวณ ${completeFrames}/4`, impact: score }], warnings: score < 60 ? ["ข้อมูลไม่เพียงพอสำหรับสรุปคะแนนปลายทาง"] : [], components: { price: input.quote.price > 0 ? 5 : 0, candles: completeFrames * 15, fundamentals: input.fundamentals ? 15 : 0, traceability: 20 } };
}

function scoreTechnical(frames: Record<Timeframe, Candle[]>): ScoreBreakdown {
  let total = 0; let available = 0; const reasons: ScoreBreakdown["reasons"] = []; const components: Record<string, number | null> = {};
  (Object.keys(timeframeWeight) as Timeframe[]).forEach((frame) => {
    const candles = frames[frame]; if (candles.length < 50) { components[frame] = null; return; }
    const closes = candles.map((item) => item.close); const last = closes.at(-1)!;
    const e20 = ema(closes, 20).at(-1); const e50 = ema(closes, 50).at(-1); const e200 = ema(closes, 200).at(-1);
    const r = rsi(closes).at(-1); const m = macd(closes).histogram.at(-1); const strength = adx(candles).at(-1); const volatility = atr(candles).at(-1);
    const volume = candles.at(-1)!.volume; const averageVolume = candles.slice(-20).reduce((sum, item) => sum + item.volume, 0) / Math.min(20, candles.length);
    const volumeTrend = obv(candles); let score = 50;
    if (e20 != null) score += last > e20 ? 8 : -8;
    if (e20 != null && e50 != null) score += e20 > e50 ? 8 : -8;
    if (e50 != null && e200 != null) score += e50 > e200 ? 10 : -10;
    if (r != null) score += r >= 50 && r <= 70 ? 7 : r > 80 ? -5 : r < 30 ? -4 : 0;
    if (m != null) score += m > 0 ? 6 : -6;
    if (strength != null && strength > 25) score += last > (e50 ?? last) ? 4 : -4;
    if (volume > averageVolume * 1.2) score += last > (e20 ?? last) ? 4 : -4;
    if (volumeTrend.length > 20 && volumeTrend.at(-1)! > volumeTrend.at(-20)!) score += 3;
    if (volatility != null && volatility / last > 0.08) score -= 4;
    score = clamp(score); components[frame] = score; total += score * timeframeWeight[frame]; available += timeframeWeight[frame];
  });
  const score = available ? clamp(total / available) : 50;
  reasons.push({ code: "MULTI_TIMEFRAME", label: "รวมแนวโน้ม โมเมนตัม ปริมาณ และความผันผวนหลายกรอบเวลา", impact: score - 50 });
  return { score, availableWeight: Math.round(available * 100), reasons, warnings: available < 1 ? ["บางกรอบเวลามีข้อมูลไม่ครบ"] : [], components };
}

function scoreFundamental(value: FinancialMetrics): ScoreBreakdown {
  let score = 50; const reasons: ScoreBreakdown["reasons"] = [];
  const apply = (condition: boolean, impact: number, code: string, label: string) => { score += condition ? impact : -impact; reasons.push({ code, label, impact: condition ? impact : -impact }); };
  if (value.revenueGrowthYoY !== null) apply(value.revenueGrowthYoY > 10, 8, "REVENUE_GROWTH", "การเติบโตรายได้เทียบปีก่อน");
  if (value.epsGrowthYoY !== null) apply(value.epsGrowthYoY > 15, 8, "EPS_GROWTH", "การเติบโตของกำไรต่อหุ้น");
  if (value.freeCashFlowMargin !== null) apply(value.freeCashFlowMargin > 0, 7, "FCF", "ธุรกิจสร้างกระแสเงินสดอิสระ");
  if (value.netMargin !== null) apply(value.netMargin > 0, 6, "NET_MARGIN", "กำไรสุทธิเป็นบวก");
  if (value.netDebtToEbitda !== null) apply(value.netDebtToEbitda < 3, 8, "LEVERAGE", "หนี้สุทธิเทียบ EBITDA");
  if (value.interestCoverage !== null) apply(value.interestCoverage > 3, 5, "INTEREST_COVERAGE", "ความสามารถจ่ายดอกเบี้ย");
  if (value.roic !== null && value.estimatedWacc !== null) apply(value.roic > value.estimatedWacc, 8, "ROIC_WACC", "ROIC เทียบต้นทุนเงินทุนโดยประมาณ");
  if (value.sharesGrowthYoY !== null) apply(value.sharesGrowthYoY <= 2, 5, "DILUTION", "แนวโน้มจำนวนหุ้น");
  return { score: clamp(score), availableWeight: 100, reasons, warnings: value.estimatedWacc === null ? ["ไม่มีข้อมูลเพียงพอสำหรับ WACC"] : [], components: { growth: clamp(50 + (value.revenueGrowthYoY ?? 0)), profitability: value.netMargin, debt: value.netDebtToEbitda, valuation: value.pe, quality: value.roic } };
}

function scoreEvents(events: MarketEvent[]): ScoreBreakdown { let score = 50; const reasons = events.map((event) => { const authority = { official: 1, major_news: 0.8, analyst: 0.55, unverified: 0.2 }[event.authority]; const impact = (event.direction === "positive" ? 1 : event.direction === "negative" ? -1 : 0) * event.severity * authority * 2; score += impact; return { code: `EVENT_${event.category.toUpperCase()}`, label: event.title, impact }; }); return { score: clamp(score), availableWeight: events.length ? 100 : 0, reasons, warnings: events.length ? [] : ["ไม่พบเหตุการณ์ที่เชื่อถือได้ในช่วงวิเคราะห์"], components: { eventCount: events.length } }; }

function scoreRisk(input: Snapshot, technical: ScoreBreakdown, fundamental: ScoreBreakdown | null): RiskResult {
  const daily = input.candles["1d"]; const atrValue = atr(daily).at(-1); const price = daily.at(-1)?.close ?? input.quote.price;
  const volatility = atrValue && price ? clamp(atrValue / price * 500) : 10;
  const f = input.fundamentals; const financial = f ? clamp((f.netDebtToEbitda ?? 1) * 8 + ((f.netMargin ?? 0) < 0 ? 25 : 0) + ((f.interestCoverage ?? 4) < 1 ? 20 : 0)) : 30;
  const dilution = f?.sharesGrowthYoY === null || f?.sharesGrowthYoY === undefined ? 10 : clamp(Math.max(0, f.sharesGrowthYoY) * 5);
  const event = input.events.reduce((max, item) => Math.max(max, item.direction === "negative" ? item.severity * 15 : 0), 0);
  const damage = clamp(100 - technical.score);
  const weighted = clamp(volatility * 0.2 + 10 * 0.15 + event * 0.15 + financial * 0.2 + damage * 0.1 + dilution * 0.1 + 20 * 0.1);
  const criticalFinancialRisk = Boolean(f && ((f.netDebtToEbitda ?? 0) >= 8 || (f.interestCoverage ?? 2) < 0 || (f.netMargin ?? 0) <= -30));
  const score = criticalFinancialRisk ? Math.max(65, weighted) : weighted;
  const penalty: RiskResult["penalty"] = score <= 30 ? 0 : score <= 50 ? 3 : score <= 70 ? 8 : score <= 85 ? 15 : 25;
  return { score, availableWeight: 100, penalty, reasons: [{ code: "VOLATILITY", label: "ความผันผวนจาก ATR", impact: volatility }, { code: "FINANCIAL_RISK", label: "ความเสี่ยงทางการเงิน", impact: financial }, { code: "TECHNICAL_DAMAGE", label: "ความเสียหายของโครงสร้างราคา", impact: damage }], warnings: ["คะแนนสูงหมายถึงความเสี่ยงสูง"], components: { volatility, liquidity: 10, event, financial, technicalDamage: damage, dilution, concentration: 20, fundamentalScore: fundamental?.score ?? null } };
}

function horizonScores(t: number, m: number, f: number, e: number, penalty: number): HorizonScores { return { short: clamp(t * 0.5 + m * 0.2 + e * 0.2 + f * 0.1 - penalty), medium: clamp(t * 0.35 + m * 0.2 + f * 0.3 + e * 0.15 - penalty), long: clamp(f * 0.6 + t * 0.15 + m * 0.1 + e * 0.15 - penalty) }; }
function neutralScore(code: string, warning: string): ScoreBreakdown { return { score: 50, availableWeight: 0, reasons: [{ code, label: warning, impact: 0 }], warnings: [warning], components: {} }; }
function clamp(value: number): number { return Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)) * 100) / 100; }
