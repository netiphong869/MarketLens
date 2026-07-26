import { describe, expect, it } from "vitest";

import { calculateTechnicalSnapshots } from "@/engine/indicators/technical-snapshot";
import type { Candle, Timeframe } from "@/types/market";

const calculatedAt = "2026-07-26T12:00:00.000Z";

describe("calculateTechnicalSnapshots", () => {
  it("calculates every requested indicator and volume metric from existing OHLCV", () => {
    const frames = Object.fromEntries(
      (["15m", "1h", "4h", "1d"] as Timeframe[]).map(
        (timeframe, frameIndex) => [
          timeframe,
          risingCandles(220, frameIndex * 100),
        ],
      ),
    ) as Record<Timeframe, Candle[]>;

    const result = calculateTechnicalSnapshots(frames, calculatedAt);
    const daily = result["1d"];

    expect(Object.keys(result)).toEqual(["15m", "1h", "4h", "1d"]);
    expect(daily).toMatchObject({
      timeframe: "1d",
      latestClose: 520,
      currentVolume: 220,
      averageVolume20: 210.5,
      calculatedAt,
      unavailable: {},
    });
    expect(daily.ema20).not.toBeNull();
    expect(daily.ema50).not.toBeNull();
    expect(daily.ema100).not.toBeNull();
    expect(daily.ema200).not.toBeNull();
    expect(daily.rsi14).toBe(100);
    expect(daily.macdLine).not.toBeNull();
    expect(daily.macdSignal).not.toBeNull();
    expect(daily.macdHistogram).not.toBeNull();
    expect(daily.adx14).not.toBeNull();
    expect(daily.atr14).not.toBeNull();
    expect(daily.volumeRatio).toBeCloseTo(220 / 210.5, 10);
    expect(daily.obv).toBe(24_309);
    expect(result["15m"].latestClose).toBe(220);
    expect(result["1h"].latestClose).toBe(320);
    expect(result["4h"].latestClose).toBe(420);
  });

  it("uses null and field-specific reasons when candles or volume are insufficient", () => {
    const short = risingCandles(10, 0).map((candle) => ({
      ...candle,
      volume: 0,
    }));
    const frames = {
      "15m": short,
      "1h": short,
      "4h": short,
      "1d": short,
    };

    const snapshot = calculateTechnicalSnapshots(frames, calculatedAt)["15m"];

    expect(snapshot.latestClose).toBe(10);
    expect(snapshot.ema20).toBeNull();
    expect(snapshot.ema200).toBeNull();
    expect(snapshot.rsi14).toBeNull();
    expect(snapshot.macdLine).toBeNull();
    expect(snapshot.adx14).toBeNull();
    expect(snapshot.atr14).toBeNull();
    expect(snapshot.currentVolume).toBeNull();
    expect(snapshot.averageVolume20).toBeNull();
    expect(snapshot.volumeRatio).toBeNull();
    expect(snapshot.obv).toBeNull();
    expect(snapshot.unavailable.ema20).toMatch(/ข้อมูลแท่งเทียนไม่เพียงพอ/);
    expect(snapshot.unavailable.ema200).toMatch(/ต้องมี 200 แท่ง/);
    expect(snapshot.unavailable.currentVolume).toMatch(/ไม่มี Volume/);
    expect(snapshot.unavailable.obv).toMatch(/ไม่มี Volume/);
    expect(Object.values(snapshot).some((value) => Number.isNaN(value))).toBe(
      false,
    );
  });

  it("preserves the insufficient-candle reason when volume exists but its 20-period average cannot be calculated", () => {
    const short = risingCandles(10, 0);
    const frames = {
      "15m": short,
      "1h": short,
      "4h": short,
      "1d": short,
    };

    const snapshot = calculateTechnicalSnapshots(frames, calculatedAt)["15m"];

    expect(snapshot.currentVolume).toBe(10);
    expect(snapshot.obv).toBe(54);
    expect(snapshot.averageVolume20).toBeNull();
    expect(snapshot.volumeRatio).toBeNull();
    expect(snapshot.unavailable.averageVolume20).toMatch(
      /ข้อมูลแท่งเทียนไม่เพียงพอ/,
    );
    expect(snapshot.unavailable.volumeRatio).toMatch(
      /ข้อมูลแท่งเทียนไม่เพียงพอ/,
    );
    expect(snapshot.unavailable.averageVolume20).not.toMatch(/ไม่มี Volume/);
  });
});

function risingCandles(length: number, closeOffset: number): Candle[] {
  return Array.from({ length }, (_, index) => {
    const close = closeOffset + index + 1;
    return {
      time: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
      open: close - 0.5,
      high: close + 1,
      low: close - 1,
      close,
      volume: index + 1,
      closed: true,
    };
  });
}
