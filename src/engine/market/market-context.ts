import type { Candle, MarketContext } from "@/types/market";

type ReturnPeriod = "1d" | "5d" | "20d" | "60d";
type TrendDirection = "up" | "sideways" | "down" | "unknown";

const RETURN_PERIODS: readonly ReturnPeriod[] = ["1d", "5d", "20d", "60d"];
const PERIOD_DAYS: Record<ReturnPeriod, number> = {
  "1d": 1,
  "5d": 5,
  "20d": 20,
  "60d": 60,
};
const PERIOD_WEIGHTS: Record<ReturnPeriod, number> = {
  "1d": 0.1,
  "5d": 0.2,
  "20d": 0.35,
  "60d": 0.35,
};

export interface BuildMarketContextInput {
  benchmarkSymbol: string;
  sectorSymbol: string | null;
  stockDaily: Candle[];
  benchmarkDaily: Candle[];
  sectorDaily: Candle[];
  source?: string;
  fetchedAt?: string;
}

export function buildMarketContext(input: BuildMarketContextInput): MarketContext {
  const stockReturns = calculateReturns(input.stockDaily);
  const benchmarkReturns = calculateReturns(input.benchmarkDaily);
  const sectorReturns = input.sectorSymbol
    ? calculateReturns(input.sectorDaily)
    : emptyReturns();

  return {
    benchmarkSymbol: input.benchmarkSymbol,
    sectorSymbol: input.sectorSymbol,
    stockReturns,
    benchmarkReturns,
    sectorReturns,
    benchmarkTrend: inferTrend(benchmarkReturns),
    sectorTrend: input.sectorSymbol ? inferTrend(sectorReturns) : "unknown",
    volatilityPercentile: calculateVolatilityPercentile(input.stockDaily),
    provenance: {
      provider: input.source ?? "Twelve Data",
      mode: "realtime",
      asOf: input.fetchedAt ?? new Date().toISOString(),
    },
  };
}

function calculateReturns(candles: Candle[]): Record<ReturnPeriod, number | null> {
  const closed = candles
    .filter((candle) => candle.closed && Number.isFinite(candle.close))
    .sort((left, right) => left.time.localeCompare(right.time));
  const latest = closed.at(-1);

  return Object.fromEntries(
    RETURN_PERIODS.map((period) => {
      const previous = closed.at(-(PERIOD_DAYS[period] + 1));
      if (!latest || !previous || previous.close <= 0) return [period, null];

      return [
        period,
        round(((latest.close - previous.close) / previous.close) * 100, 2),
      ];
    }),
  ) as Record<ReturnPeriod, number | null>;
}

function emptyReturns(): Record<ReturnPeriod, null> {
  return { "1d": null, "5d": null, "20d": null, "60d": null };
}

function inferTrend(returns: Record<ReturnPeriod, number | null>): TrendDirection {
  let weightedReturn = 0;
  let availableWeight = 0;
  for (const period of RETURN_PERIODS) {
    const value = returns[period];
    if (value === null) continue;
    weightedReturn += value * PERIOD_WEIGHTS[period];
    availableWeight += PERIOD_WEIGHTS[period];
  }

  if (availableWeight === 0) return "unknown";
  const normalized = weightedReturn / availableWeight;
  if (normalized >= 2) return "up";
  if (normalized <= -2) return "down";
  return "sideways";
}

function calculateVolatilityPercentile(candles: Candle[]): number | null {
  const closes = candles
    .filter((candle) => candle.closed && candle.close > 0)
    .sort((left, right) => left.time.localeCompare(right.time))
    .map((candle) => candle.close);
  if (closes.length < 60) return null;

  const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index]));
  const rolling = rollingStandardDeviation(returns, 20);
  const current = rolling.at(-1);
  if (current === undefined || rolling.length < 2) return null;
  return round(
    (rolling.filter((value) => value <= current).length / rolling.length) * 100,
    1,
  );
}

function rollingStandardDeviation(values: number[], window: number): number[] {
  const output: number[] = [];
  for (let index = window - 1; index < values.length; index += 1) {
    const sample = values.slice(index - window + 1, index + 1);
    const mean = sample.reduce((sum, value) => sum + value, 0) / sample.length;
    const variance =
      sample.reduce((sum, value) => sum + (value - mean) ** 2, 0) / sample.length;
    output.push(Math.sqrt(variance));
  }
  return output;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
