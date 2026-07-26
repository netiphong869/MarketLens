import { describe, expect, it, vi } from "vitest";

import { buildLiveAnalysis } from "@/services/live-analysis-builder";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";
import { AppError } from "@/lib/errors/app-error";

describe("buildLiveAnalysis", () => {
  it("orchestrates normalized providers and recalculates scores", async () => {
    const fixture = createMockAnalysisResponse("FN");
    const market = { getQuote: vi.fn(async () => fixture.quote), getCandles: vi.fn(async (_symbol: string, frame: keyof typeof fixture.candles) => fixture.candles[frame]) };
    const result = await buildLiveAnalysis("FN", { market, company: { getProfile: async () => fixture.profile, getFundamentals: async () => fixture.fundamentals }, news: { getEvents: async () => fixture.events } });
    expect(market.getCandles).toHaveBeenCalledTimes(4);
    expect(result.mode).toBe("live");
    expect(result.scores.quality.stopped).toBe(false);
    expect(result.summarySource).toBe("template");
    expect(result.technicalSnapshot["1d"].ema200).not.toBeNull();
    expect(result.technicalSnapshot["15m"].timeframe).toBe("15m");
    expect(result.technicalSnapshot["1d"].calculatedAt).toBe(
      result.generatedAt,
    );
  });

  it("keeps partial analysis honest when optional providers fail", async () => {
    const fixture = createMockAnalysisResponse("FN");
    const result = await buildLiveAnalysis("FN", { market: { getQuote: async () => fixture.quote, getCandles: async (_symbol: string, frame: keyof typeof fixture.candles) => fixture.candles[frame] }, company: { getProfile: async () => fixture.profile, getFundamentals: async () => { throw new Error("SEC down"); } }, news: { getEvents: async () => { throw new Error("news down"); } } });
    expect(result.mode).toBe("partial");
    expect(result.fundamentals).toBeNull();
    expect(result.providerIssues).toEqual([
      { provider: "SEC EDGAR", code: "UNAVAILABLE", httpStatus: null },
      { provider: "Finnhub", code: "UNAVAILABLE", httpStatus: null },
    ]);
    expect(result.scores.coverage.fundamental.percent).toBe(0);
    expect(result.scores.coverage.news.percent).toBe(0);
    expect(result.scores.horizons.medium.status).toBe("insufficient");
    expect(result.summary.limitations.length).toBeGreaterThan(0);
  });

  it("adds real market context to the engine and keeps a market failure partial", async () => {
    const fixture = createMockAnalysisResponse("FN");
    const context = {
      benchmarkSymbol: "SPY",
      sectorSymbol: "XLK",
      stockReturns: { "1d": 2, "5d": 5, "20d": 10, "60d": 20 },
      benchmarkReturns: { "1d": 1, "5d": 2, "20d": 5, "60d": 8 },
      sectorReturns: { "1d": 1, "5d": 3, "20d": 7, "60d": 12 },
      benchmarkTrend: "up" as const,
      sectorTrend: "up" as const,
      volatilityPercentile: 30,
      provenance: fixture.quote.provenance,
    };
    const base = {
      market: {
        getQuote: async () => fixture.quote,
        getCandles: async (_symbol: string, frame: keyof typeof fixture.candles) =>
          fixture.candles[frame],
      },
      company: {
        getProfile: async () => fixture.profile,
        getFundamentals: async () => fixture.fundamentals,
      },
      news: { getEvents: async () => fixture.events },
    };

    const success = await buildLiveAnalysis("FN", {
      ...base,
      marketContext: { getContext: async () => context },
    });
    expect(success.marketContext).toEqual(context);
    expect(success.scores.market.score).not.toBeNull();

    const partial = await buildLiveAnalysis("FN", {
      ...base,
      marketContext: {
        getContext: async () => {
          throw new AppError(
            "PROVIDER_RATE_LIMITED",
            "market rate limited",
            429,
            false,
          );
        },
      },
    });
    expect(partial.mode).toBe("partial");
    expect(partial.marketContext).toBeNull();
    expect(partial.providerIssues).toContainEqual({
      provider: "Twelve Data Market",
      code: "RATE_LIMITED",
      httpStatus: 429,
    });
  });
});
