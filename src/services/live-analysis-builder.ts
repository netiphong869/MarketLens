import { analyzeSnapshot } from "@/engine/scoring/analysis-engine";
import { createTemplateSummary } from "@/engine/summary/template-summary";
import type { AnalysisResponse, PriceZone, ProviderIssue } from "@/types/analysis";
import type { Candle, CompanyProfile, FinancialMetrics, MarketEvent, Quote, Timeframe } from "@/types/market";

interface MarketProvider { getQuote(symbol: string): Promise<Quote>; getCandles(symbol: string, timeframe: Timeframe, outputSize?: number): Promise<Candle[]> }
interface CompanyProvider { getProfile(symbol: string): Promise<CompanyProfile>; getFundamentals(symbol: string): Promise<FinancialMetrics | null> }
interface NewsProvider { getEvents(symbol: string, from: string, to: string): Promise<MarketEvent[]> }
interface Dependencies { market: MarketProvider; company: CompanyProvider; news: NewsProvider }

export async function buildLiveAnalysis(symbol: string, dependencies: Dependencies): Promise<AnalysisResponse> {
  const [quote, profile, ...frameResults] = await Promise.all([
    dependencies.market.getQuote(symbol), dependencies.company.getProfile(symbol),
    ...(["15m", "1h", "4h", "1d"] as Timeframe[]).map((frame) => dependencies.market.getCandles(symbol, frame, 220)),
  ]);
  const candles = Object.fromEntries((["15m", "1h", "4h", "1d"] as Timeframe[]).map((frame, index) => [frame, frameResults[index]])) as Record<Timeframe, Candle[]>;
  const today = new Date(); const from = new Date(today.getTime() - 30 * 86_400_000).toISOString().slice(0, 10); const to = today.toISOString().slice(0, 10);
  const [fundamentalResult, eventResult] = await Promise.allSettled([dependencies.company.getFundamentals(symbol), dependencies.news.getEvents(symbol, from, to)]);
  const fundamentals = fundamentalResult.status === "fulfilled" ? fundamentalResult.value : null;
  const events = eventResult.status === "fulfilled" ? eventResult.value : [];
  const providerIssues: ProviderIssue[] = [
    ...(fundamentalResult.status === "rejected"
      ? [providerIssue("SEC EDGAR", fundamentalResult.reason)]
      : []),
    ...(eventResult.status === "rejected"
      ? [providerIssue("Finnhub", eventResult.reason)]
      : []),
  ];
  const mode = fundamentalResult.status === "rejected" || eventResult.status === "rejected" ? "partial" : "live";
  const scores = analyzeSnapshot({ symbol, quote, profile, candles, fundamentals, events });
  const { supports, resistances } = priceZones(candles["1d"]);
  const response: AnalysisResponse = {
    symbol, mode, generatedAt: new Date().toISOString(), quote, profile, candles, fundamentals, events, scores, supports, resistances,
    summary: { overview: "", strengths: [], weaknesses: [], watchItems: [], scenarios: [], limitations: [], disclaimer: "" }, summarySource: "template", summaryModel: null, providerIssues,
    confidenceMessage: "ยังไม่มีข้อมูล Backtest และ Paper Trade เพียงพอสำหรับประเมินความมั่นใจเชิงสถิติ",
  };
  response.summary = createTemplateSummary(response);
  if (mode === "partial") response.summary.limitations.unshift("ผู้ให้บริการข้อมูลเสริมบางรายไม่พร้อมใช้งาน ผลลัพธ์นี้เป็นการวิเคราะห์บางส่วน");
  return response;
}

function providerIssue(
  provider: ProviderIssue["provider"],
  error: unknown,
): ProviderIssue {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (code === "PROVIDER_AUTH_ERROR")
    return { provider, code: "AUTH_ERROR", httpStatus: providerHttpStatus(error) ?? 401 };
  if (code === "PROVIDER_RATE_LIMITED")
    return { provider, code: "RATE_LIMITED", httpStatus: 429 };
  if (code === "REQUEST_TIMEOUT")
    return { provider, code: "TIMEOUT", httpStatus: null };
  return { provider, code: "UNAVAILABLE", httpStatus: null };
}

function providerHttpStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "providerStatus" in error.cause &&
    typeof error.cause.providerStatus === "number"
  ) {
    return error.cause.providerStatus;
  }
  return null;
}

function priceZones(candles: Candle[]): { supports: PriceZone[]; resistances: PriceZone[] } {
  if (candles.length < 20) return { supports: [], resistances: [] };
  const recent = candles.slice(-120); const price = recent.at(-1)!.close;
  const lows = recent.filter((item, index) => index >= 2 && index < recent.length - 2 && item.low <= Math.min(...recent.slice(index - 2, index + 3).map((value) => value.low))).map((item) => item.low).filter((value) => value < price).sort((a, b) => b - a);
  const highs = recent.filter((item, index) => index >= 2 && index < recent.length - 2 && item.high >= Math.max(...recent.slice(index - 2, index + 3).map((value) => value.high))).map((item) => item.high).filter((value) => value > price).sort((a, b) => a - b);
  const zone = (value: number, kind: PriceZone["kind"]): PriceZone => ({ low: round(value * 0.995), high: round(value * 1.005), strength: 60, timeframe: "1d", kind });
  return { supports: unique(lows).slice(0, 2).map((value) => zone(value, "support")), resistances: unique(highs).slice(0, 2).map((value) => zone(value, "resistance")) };
}
function unique(values: number[]): number[] { return values.filter((value, index) => index === 0 || Math.abs(value / values[index - 1] - 1) > 0.02); }
function round(value: number): number { return Math.round(value * 100) / 100; }
