import { adx, atr, ema, macd, obv, rsi } from "@/engine/indicators/indicators";
import type {
  AnalysisCoverage,
  HorizonAssessment,
  HorizonScores,
  ModuleCoverage,
  QualityResult,
  RiskResult,
  ScoreBreakdown,
} from "@/types/analysis";
import type {
  Candle,
  CompanyProfile,
  FinancialMetrics,
  MarketEvent,
  Quote,
  Timeframe,
} from "@/types/market";

interface Snapshot {
  symbol: string;
  quote: Quote;
  profile: CompanyProfile;
  candles: Record<Timeframe, Candle[]>;
  fundamentals: FinancialMetrics | null;
  events: MarketEvent[];
}

export interface EngineResult {
  technical: ScoreBreakdown;
  market: ScoreBreakdown;
  fundamental: ScoreBreakdown | null;
  events: ScoreBreakdown;
  risk: RiskResult;
  quality: QualityResult;
  coverage: AnalysisCoverage;
  horizons: HorizonScores;
}

const timeframeWeight: Record<Timeframe, number> = {
  "1d": 0.4,
  "4h": 0.3,
  "1h": 0.2,
  "15m": 0.1,
};

export function analyzeSnapshot(snapshot: Snapshot): EngineResult {
  const technical = scoreTechnical(snapshot.candles);
  const fundamental = snapshot.fundamentals
    ? scoreFundamental(snapshot.fundamentals)
    : null;
  const events = scoreEvents(snapshot.events);
  const market = unavailableScore(
    "MARKET_CONTEXT_PENDING",
    "ยังไม่มีบริบทตลาดและกลุ่มอุตสาหกรรมครบถ้วน",
  );
  const coverage = scoreCoverage(technical, fundamental, market, events);
  const quality = scoreQuality(snapshot, coverage);
  const risk = scoreRisk(snapshot, technical, fundamental);
  const horizons = scoreHorizons(
    technical,
    market,
    fundamental,
    events,
    risk,
    quality,
    coverage,
  );
  return {
    technical,
    market,
    fundamental,
    events,
    risk,
    quality,
    coverage,
    horizons,
  };
}

function scoreQuality(
  input: Snapshot,
  coverage: AnalysisCoverage,
): QualityResult {
  const supported = input.profile.securityType === "common_stock";
  const completeFrames = Object.values(input.candles).filter(
    (items) => items.length >= 50,
  ).length;
  const traceability = 20;
  const candles = completeFrames * 15;
  const fundamentals = round(15 * (coverage.fundamental.percent / 100));
  const price =
    Number.isFinite(input.quote.price) && input.quote.price > 0 ? 5 : 0;
  let score = traceability + candles + fundamentals + price;
  const missing: string[] = [];
  if (!supported) {
    score = Math.min(score, 20);
    missing.push("ประเภทหลักทรัพย์ยังไม่รองรับ");
  }
  if (completeFrames < 4) missing.push("แท่งเทียนหลายกรอบเวลาไม่ครบ");
  if (coverage.fundamental.percent === 0) missing.push("ข้อมูลงบการเงิน");
  else if (coverage.fundamental.status === "partial")
    missing.push("ข้อมูลงบการเงินบางรายการ");
  if (coverage.market.percent === 0) missing.push("บริบทตลาดและกลุ่ม");
  if (coverage.news.percent === 0) missing.push("ข่าวและเหตุการณ์");
  score = clamp(score);
  return {
    score,
    availableWeight: 100,
    stopped: score < 60 || !supported,
    missing,
    conflicts: [],
    reasons: [
      {
        code: "QUALITY_TRACEABILITY",
        label: "ข้อมูลมีแหล่งที่มาและโครงสร้างตรวจสอบได้",
        impact: traceability,
      },
      {
        code: "QUALITY_CANDLES",
        label: `มีกรอบเวลาที่พร้อมคำนวณ ${completeFrames}/4`,
        impact: candles,
      },
      {
        code: "QUALITY_FUNDAMENTALS",
        label: `ความครอบคลุมข้อมูลงบ ${coverage.fundamental.percent}%`,
        impact: fundamentals,
      },
      {
        code: "QUALITY_PRICE",
        label: "ราคาล่าสุดผ่านการตรวจพื้นฐาน",
        impact: price,
      },
    ],
    warnings:
      score < 60
        ? ["ข้อมูลไม่เพียงพอสำหรับสรุปคะแนนปลายทาง"]
        : missing.length
          ? ["Quality ผ่านเกณฑ์ แต่ Coverage บางหมวดยังไม่ครบ"]
          : [],
    components: { traceability, candles, fundamentals, price },
  };
}

function scoreTechnical(
  frames: Record<Timeframe, Candle[]>,
): ScoreBreakdown {
  let total = 0;
  let available = 0;
  const reasons: ScoreBreakdown["reasons"] = [];
  const components: Record<string, number | null> = {};
  (Object.keys(timeframeWeight) as Timeframe[]).forEach((frame) => {
    const candles = frames[frame];
    if (candles.length < 50) {
      components[frame] = null;
      return;
    }
    const closes = candles.map((item) => item.close);
    const last = closes.at(-1)!;
    const e20 = ema(closes, 20).at(-1);
    const e50 = ema(closes, 50).at(-1);
    const e200 = ema(closes, 200).at(-1);
    const momentumRsi = rsi(closes).at(-1);
    const histogram = macd(closes).histogram.at(-1);
    const strength = adx(candles).at(-1);
    const volatility = atr(candles).at(-1);
    const volume = candles.at(-1)!.volume;
    const averageVolume =
      candles.slice(-20).reduce((sum, item) => sum + item.volume, 0) /
      Math.min(20, candles.length);
    const volumeTrend = obv(candles);
    let score = 50;
    if (e20 != null) score += last > e20 ? 8 : -8;
    if (e20 != null && e50 != null) score += e20 > e50 ? 8 : -8;
    if (e50 != null && e200 != null) score += e50 > e200 ? 10 : -10;
    if (momentumRsi != null)
      score +=
        momentumRsi >= 50 && momentumRsi <= 70
          ? 7
          : momentumRsi > 80
            ? -5
            : momentumRsi < 30
              ? -4
              : 0;
    if (histogram != null) score += histogram > 0 ? 6 : -6;
    if (strength != null && strength > 25)
      score += last > (e50 ?? last) ? 4 : -4;
    if (volume > averageVolume * 1.2)
      score += last > (e20 ?? last) ? 4 : -4;
    if (
      volumeTrend.length > 20 &&
      volumeTrend.at(-1)! > volumeTrend.at(-20)!
    )
      score += 3;
    if (volatility != null && volatility / last > 0.08) score -= 4;
    score = clamp(score);
    components[frame] = score;
    total += score * timeframeWeight[frame];
    available += timeframeWeight[frame];
  });
  const score = available ? clamp(total / available) : null;
  if (score !== null) {
    reasons.push({
      code: "MULTI_TIMEFRAME",
      label: "รวมแนวโน้ม โมเมนตัม ปริมาณ และความผันผวนหลายกรอบเวลา",
      impact: score - 50,
    });
  }
  return {
    score,
    availableWeight: Math.round(available * 100),
    reasons,
    warnings: available < 1 ? ["บางกรอบเวลามีข้อมูลไม่ครบ"] : [],
    components,
  };
}

interface FundamentalCriterion {
  key: keyof FinancialMetrics;
  weight: number;
  group: "growth" | "profitability" | "debt" | "roicWacc" | "valuation" | "business";
  code: string;
  label: string;
  evaluate: (value: number) => number;
}

const fundamentalCriteria: FundamentalCriterion[] = [
  { key: "revenueGrowthYoY", weight: 12.5, group: "growth", code: "REVENUE_GROWTH", label: "การเติบโตรายได้เทียบปีก่อน", evaluate: (v) => v > 10 ? 100 : v > 0 ? 65 : 20 },
  { key: "revenueGrowthThreeYear", weight: 6.25, group: "growth", code: "REVENUE_CAGR", label: "การเติบโตรายได้สามปี", evaluate: (v) => v > 10 ? 100 : v > 0 ? 65 : 20 },
  { key: "epsGrowthYoY", weight: 6.25, group: "growth", code: "EPS_GROWTH", label: "การเติบโตของกำไรต่อหุ้น", evaluate: (v) => v > 15 ? 100 : v > 0 ? 65 : 20 },
  { key: "grossMargin", weight: 5, group: "profitability", code: "GROSS_MARGIN", label: "อัตรากำไรขั้นต้น", evaluate: positiveMargin },
  { key: "operatingMargin", weight: 5, group: "profitability", code: "OPERATING_MARGIN", label: "อัตรากำไรจากการดำเนินงาน", evaluate: positiveMargin },
  { key: "netMargin", weight: 5, group: "profitability", code: "NET_MARGIN", label: "อัตรากำไรสุทธิ", evaluate: positiveMargin },
  { key: "freeCashFlowMargin", weight: 5, group: "profitability", code: "FCF", label: "กระแสเงินสดอิสระ", evaluate: positiveMargin },
  { key: "netDebtToEbitda", weight: 8, group: "debt", code: "LEVERAGE", label: "หนี้สุทธิเทียบ EBITDA", evaluate: (v) => v < 1 ? 100 : v < 3 ? 70 : v < 5 ? 40 : 10 },
  { key: "interestCoverage", weight: 7, group: "debt", code: "INTEREST_COVERAGE", label: "ความสามารถจ่ายดอกเบี้ย", evaluate: (v) => v > 8 ? 100 : v > 3 ? 70 : v > 1 ? 40 : 10 },
  { key: "pe", weight: 5, group: "valuation", code: "PE", label: "P/E", evaluate: valuationMultiple },
  { key: "evToSales", weight: 3, group: "valuation", code: "EV_SALES", label: "EV/Sales", evaluate: valuationMultiple },
  { key: "evToEbitda", weight: 4, group: "valuation", code: "EV_EBITDA", label: "EV/EBITDA", evaluate: valuationMultiple },
  { key: "priceToFreeCashFlow", weight: 3, group: "valuation", code: "PRICE_FCF", label: "Price/FCF", evaluate: valuationMultiple },
  { key: "sharesGrowthYoY", weight: 5, group: "business", code: "DILUTION", label: "แนวโน้มจำนวนหุ้น", evaluate: (v) => v <= 0 ? 100 : v <= 2 ? 70 : v <= 5 ? 40 : 10 },
  { key: "earningsBeatsLastFour", weight: 3, group: "business", code: "EARNINGS_BEATS", label: "ผลประกอบการเทียบคาดการณ์", evaluate: (v) => clamp(v / 4 * 100) },
];

function scoreFundamental(value: FinancialMetrics): ScoreBreakdown {
  let weightedScore = 0;
  let availableWeight = 0;
  const groupTotals = new Map<string, { weighted: number; weight: number }>();
  const reasons: ScoreBreakdown["reasons"] = [];
  for (const criterion of fundamentalCriteria) {
    const raw = value[criterion.key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    const metricScore = clamp(criterion.evaluate(raw));
    weightedScore += metricScore * criterion.weight;
    availableWeight += criterion.weight;
    const group = groupTotals.get(criterion.group) ?? { weighted: 0, weight: 0 };
    group.weighted += metricScore * criterion.weight;
    group.weight += criterion.weight;
    groupTotals.set(criterion.group, group);
    reasons.push({
      code: criterion.code,
      label: criterion.label,
      impact: round((metricScore - 50) * criterion.weight / 100),
      evidence: String(raw),
    });
  }
  if (
    value.roic !== null &&
    value.estimatedWacc !== null &&
    Number.isFinite(value.roic) &&
    Number.isFinite(value.estimatedWacc)
  ) {
    const metricScore = value.roic > value.estimatedWacc ? 100 : 20;
    weightedScore += metricScore * 15;
    availableWeight += 15;
    groupTotals.set("roicWacc", { weighted: metricScore * 15, weight: 15 });
    reasons.push({
      code: "ROIC_WACC",
      label: "ROIC เทียบต้นทุนเงินทุนโดยประมาณ",
      impact: round((metricScore - 50) * 0.15),
    });
  }
  if (value.guidance !== "unknown") {
    const metricScore =
      value.guidance === "raised" ? 100 : value.guidance === "maintained" ? 60 : 10;
    weightedScore += metricScore * 2;
    availableWeight += 2;
    const group = groupTotals.get("business") ?? { weighted: 0, weight: 0 };
    group.weighted += metricScore * 2;
    group.weight += 2;
    groupTotals.set("business", group);
  }
  const components: Record<string, number | null> = {};
  for (const group of ["growth", "profitability", "debt", "roicWacc", "valuation", "business"]) {
    const valueForGroup = groupTotals.get(group);
    components[group] = valueForGroup
      ? clamp(valueForGroup.weighted / valueForGroup.weight)
      : null;
  }
  const roundedWeight = round(availableWeight);
  return {
    score: availableWeight ? clamp(weightedScore / availableWeight) : null,
    availableWeight: roundedWeight,
    reasons,
    warnings: [
      ...(value.estimatedWacc === null
        ? ["ไม่มีข้อมูลเพียงพอสำหรับ WACC"]
        : []),
      ...(roundedWeight < 70
        ? [`ข้อมูลพื้นฐานครอบคลุม ${roundedWeight}% ของน้ำหนักที่กำหนด`]
        : []),
    ],
    components,
  };
}

function scoreEvents(events: MarketEvent[]): ScoreBreakdown {
  if (!events.length) {
    return unavailableScore(
      "NEWS_UNAVAILABLE",
      "ไม่มีข้อมูลข่าวที่ยืนยันได้ในช่วงวิเคราะห์",
    );
  }
  let score = 50;
  const reasons = events.map((event) => {
    const authority = {
      official: 1,
      major_news: 0.8,
      analyst: 0.55,
      unverified: 0.2,
    }[event.authority];
    const impact =
      (event.direction === "positive"
        ? 1
        : event.direction === "negative"
          ? -1
          : 0) *
      event.severity *
      authority *
      2;
    score += impact;
    return {
      code: `EVENT_${event.category.toUpperCase()}`,
      label: event.title,
      impact,
    };
  });
  return {
    score: clamp(score),
    availableWeight: 100,
    reasons,
    warnings: [],
    components: { eventCount: events.length },
  };
}

function scoreRisk(
  input: Snapshot,
  technical: ScoreBreakdown,
  fundamental: ScoreBreakdown | null,
): RiskResult {
  const daily = input.candles["1d"];
  const atrValue = atr(daily).at(-1);
  const price = daily.at(-1)?.close ?? input.quote.price;
  const components: Record<string, number | null> = {
    volatility: null,
    liquidity: null,
    event: null,
    financial: null,
    technicalDamage: null,
    dilution: null,
    concentration: null,
    fundamentalScore: fundamental?.score ?? null,
  };
  const weighted: Array<{ value: number; weight: number }> = [];
  if (atrValue && price > 0) {
    components.volatility = clamp(atrValue / price * 500);
    weighted.push({ value: components.volatility, weight: 20 });
  }
  const averageDollarVolume =
    daily.length > 0
      ? daily.slice(-20).reduce((sum, candle) => sum + candle.close * candle.volume, 0) /
        Math.min(20, daily.length)
      : null;
  if (averageDollarVolume !== null) {
    components.liquidity =
      averageDollarVolume >= 20_000_000
        ? 10
        : averageDollarVolume >= 5_000_000
          ? 35
          : 75;
    weighted.push({ value: components.liquidity, weight: 15 });
  }
  if (input.events.length) {
    components.event = input.events.reduce(
      (max, item) =>
        Math.max(
          max,
          item.direction === "negative" ? item.severity * 15 : 0,
        ),
      0,
    );
    weighted.push({ value: components.event, weight: 15 });
  }
  const financial = financialRisk(input.fundamentals);
  if (financial !== null) {
    components.financial = financial;
    weighted.push({ value: financial, weight: 20 });
  }
  if (technical.score !== null) {
    components.technicalDamage = clamp(100 - technical.score);
    weighted.push({ value: components.technicalDamage, weight: 10 });
  }
  if (input.fundamentals?.sharesGrowthYoY !== null && input.fundamentals?.sharesGrowthYoY !== undefined) {
    components.dilution = clamp(
      Math.max(0, input.fundamentals.sharesGrowthYoY) * 5,
    );
    weighted.push({ value: components.dilution, weight: 10 });
  }
  const availableWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const score = availableWeight
    ? clamp(
        weighted.reduce((sum, item) => sum + item.value * item.weight, 0) /
          availableWeight,
      )
    : 0;
  const criticalFinancialRisk = Boolean(
    input.fundamentals &&
      ((input.fundamentals.netDebtToEbitda ?? 0) >= 8 ||
        (input.fundamentals.interestCoverage ?? 2) < 0 ||
        (input.fundamentals.netMargin ?? 0) <= -30),
  );
  const adjustedScore = criticalFinancialRisk ? Math.max(65, score) : score;
  const penalty: RiskResult["penalty"] =
    adjustedScore <= 30
      ? 0
      : adjustedScore <= 50
        ? 3
        : adjustedScore <= 70
          ? 8
          : adjustedScore <= 85
            ? 15
            : 25;
  return {
    score: adjustedScore,
    availableWeight,
    penalty,
    reasons: Object.entries(components)
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .map(([code, value]) => ({
        code: code.toUpperCase(),
        label: riskLabel(code),
        impact: value,
      })),
    warnings: [
      "คะแนนสูงหมายถึงความเสี่ยงสูง",
      ...(availableWeight < 70
        ? [`ข้อมูลความเสี่ยงครอบคลุม ${availableWeight}%`]
        : []),
    ],
    components,
  };
}

function financialRisk(value: FinancialMetrics | null): number | null {
  if (!value) return null;
  const parts: number[] = [];
  if (value.netDebtToEbitda !== null)
    parts.push(clamp(value.netDebtToEbitda * 8));
  if (value.netMargin !== null) parts.push(value.netMargin < 0 ? 75 : 15);
  if (value.interestCoverage !== null)
    parts.push(value.interestCoverage < 1 ? 90 : value.interestCoverage < 3 ? 55 : 15);
  return parts.length
    ? clamp(parts.reduce((sum, item) => sum + item, 0) / parts.length)
    : null;
}

function scoreCoverage(
  technical: ScoreBreakdown,
  fundamental: ScoreBreakdown | null,
  market: ScoreBreakdown,
  events: ScoreBreakdown,
): AnalysisCoverage {
  return {
    technical: moduleCoverage(technical.availableWeight, [
      ...(technical.availableWeight < 100 ? ["แท่งเทียนบางกรอบเวลา"] : []),
    ]),
    fundamental: moduleCoverage(fundamental?.availableWeight ?? 0, [
      ...(fundamental ? ["รายการงบที่ผู้ให้บริการไม่มี"] : ["ข้อมูลงบการเงิน"]),
    ]),
    market: moduleCoverage(market.availableWeight, [
      "บริบทตลาดและกลุ่มอุตสาหกรรม",
    ]),
    news: moduleCoverage(events.availableWeight, ["ข่าวและเหตุการณ์"]),
  };
}

function moduleCoverage(percent: number, missing: string[]): ModuleCoverage {
  const normalized = clamp(percent);
  return {
    percent: normalized,
    status:
      normalized >= 85
        ? "complete"
        : normalized > 0
          ? "partial"
          : "insufficient",
    missing: normalized >= 100 ? [] : missing,
  };
}

function scoreHorizons(
  technical: ScoreBreakdown,
  market: ScoreBreakdown,
  fundamental: ScoreBreakdown | null,
  events: ScoreBreakdown,
  risk: RiskResult,
  quality: QualityResult,
  coverage: AnalysisCoverage,
): HorizonScores {
  if (quality.stopped) {
    const stopped = insufficientAssessment([
      "technical",
      "fundamental",
      "market",
      "news",
    ]);
    return { short: stopped, medium: stopped, long: stopped };
  }
  const values = {
    technical: technical.score,
    fundamental: fundamental?.score ?? null,
    market: market.score,
    news: events.score,
  };
  return {
    short: horizonAssessment(
      values,
      coverage,
      risk.penalty,
      { technical: 0.5, market: 0.2, news: 0.2, fundamental: 0.1 },
      ["technical"],
    ),
    medium: horizonAssessment(
      values,
      coverage,
      risk.penalty,
      { technical: 0.35, market: 0.2, fundamental: 0.3, news: 0.15 },
      ["technical", "fundamental"],
    ),
    long: horizonAssessment(
      values,
      coverage,
      risk.penalty,
      { fundamental: 0.6, technical: 0.15, market: 0.1, news: 0.15 },
      ["fundamental"],
    ),
  };
}

function horizonAssessment(
  values: Record<keyof AnalysisCoverage, number | null>,
  coverage: AnalysisCoverage,
  penalty: number,
  weights: Partial<Record<keyof AnalysisCoverage, number>>,
  required: Array<keyof AnalysisCoverage>,
): HorizonAssessment {
  const missingModules = (Object.keys(weights) as Array<keyof AnalysisCoverage>)
    .filter((module) => values[module] === null || coverage[module].percent < 50);
  if (required.some((module) => missingModules.includes(module))) {
    return insufficientAssessment(missingModules);
  }
  if (missingModules.length) {
    return { score: null, status: "partial", missingModules };
  }
  const score = Object.entries(weights).reduce(
    (sum, [module, weight]) =>
      sum + values[module as keyof AnalysisCoverage]! * weight!,
    0,
  );
  return {
    score: clamp(score - penalty),
    status: "available",
    missingModules: [],
  };
}

function insufficientAssessment(
  missingModules: Array<keyof AnalysisCoverage>,
): HorizonAssessment {
  return { score: null, status: "insufficient", missingModules };
}

function unavailableScore(code: string, warning: string): ScoreBreakdown {
  return {
    score: null,
    availableWeight: 0,
    reasons: [{ code, label: warning, impact: 0 }],
    warnings: [warning],
    components: {},
  };
}

function positiveMargin(value: number): number {
  return value > 15 ? 100 : value > 5 ? 75 : value > 0 ? 55 : 15;
}

function valuationMultiple(value: number): number {
  if (value <= 0) return 20;
  if (value < 15) return 85;
  if (value < 30) return 70;
  if (value < 50) return 50;
  return 25;
}

function riskLabel(code: string): string {
  return {
    volatility: "ความผันผวนจาก ATR",
    liquidity: "ความเสี่ยงด้านสภาพคล่อง",
    event: "ความเสี่ยงจากเหตุการณ์",
    financial: "ความเสี่ยงทางการเงิน",
    technicalDamage: "ความเสียหายของโครงสร้างราคา",
    dilution: "ความเสี่ยงจากการเพิ่มจำนวนหุ้น",
    concentration: "ความเสี่ยงจากการกระจุกตัว",
    fundamentalScore: "คะแนนพื้นฐานที่ใช้ประกอบ",
  }[code] ?? code;
}

function clamp(value: number): number {
  return round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
