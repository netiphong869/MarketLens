import { describe, expect, it, vi } from "vitest";

import { TtlCache } from "@/lib/cache/ttl-cache";
import { MarketContextProvider } from "@/providers/twelve-data/market-context-provider";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";
import type { Candle } from "@/types/market";

describe("MarketContextProvider", () => {
  it("uses SPY and the mapped sector ETF and shares a fifteen-minute cache", async () => {
    const fixture = createMockAnalysisResponse("AAPL");
    const calls: string[] = [];
    const getCandles = vi.fn(async (symbol: string): Promise<Candle[]> => {
      calls.push(symbol);
      return fixture.candles["1d"];
    });
    const provider = new MarketContextProvider(
      { getCandles },
      new TtlCache<Candle[]>(),
    );

    const first = await provider.getContext(
      "AAPL",
      "Technology",
      fixture.candles["1d"],
    );
    const second = await provider.getContext(
      "MSFT",
      "Technology",
      fixture.candles["1d"],
    );

    expect(first.benchmarkSymbol).toBe("SPY");
    expect(first.sectorSymbol).toBe("XLK");
    expect(second.sectorSymbol).toBe("XLK");
    expect(calls).toEqual(["SPY", "XLK"]);
    expect(getCandles).toHaveBeenCalledTimes(2);
  });

  it("does not invent a sector benchmark when the sector is unknown", async () => {
    const fixture = createMockAnalysisResponse("AAPL");
    const getCandles = vi.fn(async (): Promise<Candle[]> => fixture.candles["1d"]);
    const provider = new MarketContextProvider(
      { getCandles },
      new TtlCache<Candle[]>(),
    );

    const result = await provider.getContext(
      "AAPL",
      "Unmapped sector",
      fixture.candles["1d"],
    );

    expect(result.sectorSymbol).toBeNull();
    expect(result.sectorTrend).toBe("unknown");
    expect(getCandles).toHaveBeenCalledTimes(1);
  });
});
