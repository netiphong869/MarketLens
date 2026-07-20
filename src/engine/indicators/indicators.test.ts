import { describe, expect, it } from "vitest";

import { adx, atr, bollinger, ema, macd, obv, rsi } from "@/engine/indicators/indicators";
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
  it("calculates finite values for a complete series", () => {
    const closes = candles.map((item) => item.close);
    expect(ema(closes, 20).at(-1)).toBeGreaterThan(0);
    expect(rsi(closes, 14).at(-1)).toBeGreaterThan(50);
    expect(macd(closes).histogram.at(-1)).toBeTypeOf("number");
    expect(atr(candles, 14).at(-1)).toBeGreaterThan(0);
    expect(adx(candles, 14).at(-1)).toBeGreaterThanOrEqual(0);
    expect(bollinger(closes, 20).upper.at(-1)).toBeGreaterThan(bollinger(closes, 20).lower.at(-1)!);
    expect(obv(candles).at(-1)).toBeGreaterThan(0);
  });

  it("returns null placeholders instead of NaN for insufficient data", () => {
    expect(ema([1, 2], 20)).toEqual([null, null]);
    expect(rsi([1, 2], 14).every((value) => value === null)).toBe(true);
  });
});
