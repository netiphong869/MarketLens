import type { Candle } from "@/types/market";

export type NullableSeries = Array<number | null>;

export function ema(values: number[], period: number): NullableSeries {
  const result: NullableSeries = Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return result;
  let current =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = current;
  const multiplier = 2 / (period + 1);
  for (let index = period; index < values.length; index += 1) {
    current = (values[index] - current) * multiplier + current;
    result[index] = finiteOrNull(current);
  }
  return result;
}

export function rsi(values: number[], period = 14): NullableSeries {
  const result: NullableSeries = Array(values.length).fill(null);
  if (values.length <= period) return result;
  let gains = 0;
  let losses = 0;
  for (let index = 1; index <= period; index += 1) {
    const change = values[index] - values[index - 1];
    gains += Math.max(0, change);
    losses += Math.max(0, -change);
  }
  let averageGain = gains / period;
  let averageLoss = losses / period;
  result[period] = rsiValue(averageGain, averageLoss);
  for (let index = period + 1; index < values.length; index += 1) {
    const change = values[index] - values[index - 1];
    averageGain = (averageGain * (period - 1) + Math.max(0, change)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(0, -change)) / period;
    result[index] = rsiValue(averageGain, averageLoss);
  }
  return result;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): { line: NullableSeries; signal: NullableSeries; histogram: NullableSeries } {
  const fastSeries = ema(values, fast);
  const slowSeries = ema(values, slow);
  const line = values.map((_, index) =>
    fastSeries[index] === null || slowSeries[index] === null
      ? null
      : fastSeries[index]! - slowSeries[index]!,
  );
  const first = line.findIndex((value) => value !== null);
  const signalValues =
    first < 0
      ? []
      : ema(
          line.slice(first).map((value) => value ?? 0),
          signalPeriod,
        );
  const signal: NullableSeries = Array(values.length).fill(null);
  signalValues.forEach((value, index) => {
    signal[first + index] = value;
  });
  const histogram = line.map((value, index) =>
    value === null || signal[index] === null ? null : value - signal[index]!,
  );
  return { line, signal, histogram };
}

export function atr(candles: Candle[], period = 14): NullableSeries {
  const tr = candles.map((item, index) =>
    index === 0
      ? item.high - item.low
      : Math.max(
          item.high - item.low,
          Math.abs(item.high - candles[index - 1].close),
          Math.abs(item.low - candles[index - 1].close),
        ),
  );
  return wilder(tr, period);
}

export function adx(candles: Candle[], period = 14): NullableSeries {
  const result: NullableSeries = Array(candles.length).fill(null);
  if (period <= 0 || candles.length < period * 2 - 1) return result;
  const tr: number[] = [];
  const plus: number[] = [];
  const minus: number[] = [];
  candles.forEach((item, index) => {
    if (index === 0) {
      tr.push(item.high - item.low);
      plus.push(0);
      minus.push(0);
      return;
    }
    const up = item.high - candles[index - 1].high;
    const down = candles[index - 1].low - item.low;
    tr.push(
      Math.max(
        item.high - item.low,
        Math.abs(item.high - candles[index - 1].close),
        Math.abs(item.low - candles[index - 1].close),
      ),
    );
    plus.push(up > down && up > 0 ? up : 0);
    minus.push(down > up && down > 0 ? down : 0);
  });
  const atrSeries = wilder(tr, period);
  const plusSeries = wilder(plus, period);
  const minusSeries = wilder(minus, period);
  const dx: NullableSeries = candles.map((_, index) => {
    const base = atrSeries[index];
    if (
      base === null ||
      plusSeries[index] === null ||
      minusSeries[index] === null
    )
      return null;
    if (base === 0) return 0;
    const p = (100 * plusSeries[index]!) / base;
    const m = (100 * minusSeries[index]!) / base;
    return p + m === 0 ? 0 : (100 * Math.abs(p - m)) / (p + m);
  });
  const firstDxIndex = dx.findIndex((value) => value !== null);
  if (firstDxIndex < 0 || candles.length - firstDxIndex < period) return result;
  const seedIndex = firstDxIndex + period - 1;
  let current =
    dx
      .slice(firstDxIndex, seedIndex + 1)
      .reduce<number>((sum, value) => sum + (value ?? 0), 0) / period;
  result[seedIndex] = finiteOrNull(current);
  for (let index = seedIndex + 1; index < candles.length; index += 1) {
    const value = dx[index];
    if (value === null) continue;
    current = (current * (period - 1) + value) / period;
    result[index] = finiteOrNull(current);
  }
  return result;
}

export function bollinger(
  values: number[],
  period = 20,
  multiplier = 2,
): { middle: NullableSeries; upper: NullableSeries; lower: NullableSeries } {
  const middle: NullableSeries = Array(values.length).fill(null);
  const upper: NullableSeries = Array(values.length).fill(null);
  const lower: NullableSeries = Array(values.length).fill(null);
  for (let index = period - 1; index < values.length; index += 1) {
    const slice = values.slice(index - period + 1, index + 1);
    const mean = slice.reduce((sum, value) => sum + value, 0) / period;
    const deviation = Math.sqrt(
      slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period,
    );
    middle[index] = mean;
    upper[index] = mean + multiplier * deviation;
    lower[index] = mean - multiplier * deviation;
  }
  return { middle, upper, lower };
}

export function obv(candles: Candle[]): number[] {
  let current = 0;
  return candles.map((item, index) => {
    if (index > 0)
      current +=
        item.close > candles[index - 1].close
          ? item.volume
          : item.close < candles[index - 1].close
            ? -item.volume
            : 0;
    return current;
  });
}

function wilder(values: number[], period: number): NullableSeries {
  const result: NullableSeries = Array(values.length).fill(null);
  if (values.length < period) return result;
  let current =
    values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  result[period - 1] = current;
  for (let index = period; index < values.length; index += 1) {
    current = (current * (period - 1) + values[index]) / period;
    result[index] = finiteOrNull(current);
  }
  return result;
}
function rsiValue(gain: number, loss: number): number {
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}
function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}
