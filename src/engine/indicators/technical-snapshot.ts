import { adx, atr, ema, macd, obv, rsi } from "@/engine/indicators/indicators";
import type {
  TechnicalSnapshot,
  TechnicalSnapshotMetric,
} from "@/types/analysis";
import type { Candle, Timeframe } from "@/types/market";

const timeframes: Timeframe[] = ["15m", "1h", "4h", "1d"];

const minimumCandles: Partial<Record<TechnicalSnapshotMetric, number>> = {
  latestClose: 1,
  ema20: 20,
  ema50: 50,
  ema100: 100,
  ema200: 200,
  rsi14: 15,
  macdLine: 26,
  macdSignal: 34,
  macdHistogram: 34,
  adx14: 27,
  atr14: 14,
  averageVolume20: 20,
  volumeRatio: 20,
};

export function calculateTechnicalSnapshots(
  frames: Record<Timeframe, Candle[]>,
  calculatedAt: string,
): Record<Timeframe, TechnicalSnapshot> {
  return Object.fromEntries(
    timeframes.map((timeframe) => [
      timeframe,
      calculateTechnicalSnapshot(
        frames[timeframe] ?? [],
        timeframe,
        calculatedAt,
      ),
    ]),
  ) as Record<Timeframe, TechnicalSnapshot>;
}

export function calculateTechnicalSnapshot(
  candles: Candle[],
  timeframe: Timeframe,
  calculatedAt: string,
): TechnicalSnapshot {
  const closes = candles.map((candle) => candle.close);
  const macdSeries = macd(closes);
  const latestVolume = candles.at(-1)?.volume;
  const recentVolume = candles.slice(-20).map((candle) => candle.volume);
  const currentVolume = usableVolume(latestVolume) ? latestVolume : null;
  const averageVolume20 =
    recentVolume.length === 20 && recentVolume.every(usableVolume)
      ? recentVolume.reduce((sum, value) => sum + value, 0) / 20
      : null;
  const volumeRatio =
    currentVolume !== null && averageVolume20 !== null && averageVolume20 > 0
      ? currentVolume / averageVolume20
      : null;
  const canCalculateObv =
    candles.length > 0 &&
    candles.every((candle) => usableVolume(candle.volume));
  const snapshot: TechnicalSnapshot = {
    timeframe,
    latestClose: finitePositive(candles.at(-1)?.close),
    ema20: latest(ema(closes, 20)),
    ema50: latest(ema(closes, 50)),
    ema100: latest(ema(closes, 100)),
    ema200: latest(ema(closes, 200)),
    rsi14: latest(rsi(closes, 14)),
    macdLine: latest(macdSeries.line),
    macdSignal: latest(macdSeries.signal),
    macdHistogram: latest(macdSeries.histogram),
    adx14: latest(adx(candles, 14)),
    atr14: latest(atr(candles, 14)),
    currentVolume,
    averageVolume20,
    volumeRatio,
    obv: canCalculateObv ? finite(obv(candles).at(-1)) : null,
    calculatedAt,
    unavailable: {},
  };

  snapshot.unavailable = unavailableReasons(snapshot, candles.length);
  return snapshot;
}

function unavailableReasons(
  snapshot: TechnicalSnapshot,
  candleCount: number,
): TechnicalSnapshot["unavailable"] {
  const unavailable: TechnicalSnapshot["unavailable"] = {};
  const metrics = Object.keys(minimumCandles) as TechnicalSnapshotMetric[];
  for (const metric of metrics) {
    if (snapshot[metric] !== null) continue;
    const required = minimumCandles[metric]!;
    unavailable[metric] =
      `ข้อมูลแท่งเทียนไม่เพียงพอสำหรับ ${metricLabel(metric)} ` +
      `(ต้องมี ${required} แท่ง; มี ${candleCount} แท่ง)`;
  }
  if (snapshot.latestClose === null && candleCount > 0) {
    unavailable.latestClose = "ราคาปิดล่าสุดไม่ถูกต้อง";
  }
  for (const metric of [
    "currentVolume",
    "averageVolume20",
    "volumeRatio",
    "obv",
  ] as const) {
    if (snapshot[metric] === null && unavailable[metric] === undefined) {
      unavailable[metric] = "ไม่มี Volume ที่ใช้คำนวณได้";
    }
  }
  return unavailable;
}

function metricLabel(metric: TechnicalSnapshotMetric): string {
  return {
    latestClose: "ราคาปิดล่าสุด",
    ema20: "EMA20",
    ema50: "EMA50",
    ema100: "EMA100",
    ema200: "EMA200",
    rsi14: "RSI14",
    macdLine: "MACD line",
    macdSignal: "MACD signal",
    macdHistogram: "MACD histogram",
    adx14: "ADX14",
    atr14: "ATR14",
    currentVolume: "Volume ล่าสุด",
    averageVolume20: "Volume เฉลี่ย 20 แท่ง",
    volumeRatio: "Volume ratio",
    obv: "OBV",
  }[metric];
}

function latest(values: Array<number | null>): number | null {
  return finite(values.at(-1));
}

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function finitePositive(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function usableVolume(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
