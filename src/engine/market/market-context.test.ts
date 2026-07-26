import { describe, expect, it } from "vitest";

import { buildMarketContext } from "@/engine/market/market-context";
import type { Candle } from "@/types/market";

describe("buildMarketContext", () => {
  it("calculates 1D, 5D, 20D and 60D returns from closed daily candles", () => {
    const context = buildMarketContext({
      stockDaily: candles(100, 0.5),
      benchmarkDaily: candles(100, 0.2),
      sectorDaily: candles(100, 0.3),
      benchmarkSymbol: "SPY",
      sectorSymbol: "XLK",
    });

    expect(context.stockReturns["1d"]).toBeCloseTo(0.33, 1);
    expect(context.stockReturns["5d"]).toBeCloseTo(1.7, 1);
    expect(context.stockReturns["20d"]).toBeCloseTo(7.17, 1);
    expect(context.stockReturns["60d"]).toBeCloseTo(25.1, 1);
    expect(context.benchmarkTrend).toBe("up");
    expect(context.sectorTrend).toBe("up");
  });

  it("keeps volatility unavailable when there is not enough benchmark history", () => {
    const context = buildMarketContext({
      stockDaily: candles(30, 0.5),
      benchmarkDaily: candles(30, -0.2),
      sectorDaily: [],
      benchmarkSymbol: "SPY",
      sectorSymbol: null,
    });

    expect(context.benchmarkTrend).toBe("down");
    expect(context.sectorTrend).toBe("unknown");
    expect(context.volatilityPercentile).toBeNull();
    expect(context.sectorReturns["20d"]).toBeNull();
  });
});

function candles(length: number, dailyChange: number): Candle[] {
  return Array.from({ length }, (_, index) => {
    const close = 100 + index * dailyChange;
    return {
      time: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
      open: close - 0.1,
      high: close + 0.5,
      low: close - 0.5,
      close,
      volume: 1_000_000,
      closed: true,
    };
  });
}
