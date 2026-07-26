import { describe, expect, it } from "vitest";

import {
  adx,
  atr,
  bollinger,
  ema,
  macd,
  obv,
  rsi,
} from "@/engine/indicators/indicators";
import type { Candle } from "@/types/market";

const candles: Candle[] = Array.from({ length: 220 }, (_, index) => ({
  time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
  open: 100 + index * 0.5,
  high: 102 + index * 0.5,
  low: 98 + index * 0.5,
  close: 101 + index * 0.5 + Math.sin(index / 5),
  volume: 1000 + index * 10,
  closed: true,
}));

describe("technical indicators", () => {
  it("calculates EMA from the seeded simple average", () => {
    expect(ema([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("calculates RSI14 with Wilder smoothing", () => {
    const rising = Array.from({ length: 16 }, (_, index) => index + 1);
    expect(rsi(rising, 14).at(-1)).toBe(100);
  });

  it("calculates MACD line, signal, and histogram independently", () => {
    const constant = Array.from({ length: 40 }, () => 10);
    const result = macd(constant);
    expect(result.line.at(-1)).toBe(0);
    expect(result.signal.at(-1)).toBe(0);
    expect(result.histogram.at(-1)).toBe(0);
  });

  it("calculates ATR14 from true ranges", () => {
    const uniformRange = Array.from({ length: 20 }, (_, index) => ({
      time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      open: index,
      high: index + 1,
      low: index - 1,
      close: index,
      volume: 100,
      closed: true,
    }));
    expect(atr(uniformRange, 14).at(-1)).toBe(2);
  });

  it("calculates ADX14 from directional movement and true range", () => {
    const steadyTrend = Array.from({ length: 40 }, (_, index) => ({
      time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      open: index,
      high: index + 1,
      low: index - 1,
      close: index,
      volume: 100,
      closed: true,
    }));
    expect(adx(steadyTrend, 14).at(-1)).toBe(100);
    expect(adx(steadyTrend.slice(0, 26), 14).at(-1)).toBeNull();
    expect(adx(steadyTrend.slice(0, 27), 14).at(-1)).toBe(100);
  });

  it("calculates OBV from signed volume changes", () => {
    const sample = [10, 12, 11, 11].map((close, index) => ({
      time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      open: close,
      high: close + 1,
      low: close - 1,
      close,
      volume: [100, 200, 50, 400][index],
      closed: true,
    }));
    expect(obv(sample)).toEqual([0, 200, 150, 150]);
  });

  it("calculates Bollinger bands around the rolling mean", () => {
    const closes = candles.map((item) => item.close);
    const bands = bollinger(closes, 20);
    expect(bands.upper.at(-1)).toBeGreaterThan(bands.middle.at(-1)!);
    expect(bands.middle.at(-1)).toBeGreaterThan(bands.lower.at(-1)!);
  });

  it("returns null placeholders instead of NaN for insufficient data", () => {
    expect(ema([1, 2], 20)).toEqual([null, null]);
    expect(rsi([1, 2], 14).every((value) => value === null)).toBe(true);
  });
});
