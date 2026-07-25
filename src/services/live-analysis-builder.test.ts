import { describe, expect, it, vi } from "vitest";

import { buildLiveAnalysis } from "@/services/live-analysis-builder";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("buildLiveAnalysis", () => {
  it("orchestrates normalized providers and recalculates scores", async () => {
    const fixture = createMockAnalysisResponse("FN");
    const market = { getQuote: vi.fn(async () => fixture.quote), getCandles: vi.fn(async (_symbol: string, frame: keyof typeof fixture.candles) => fixture.candles[frame]) };
    const result = await buildLiveAnalysis("FN", { market, company: { getProfile: async () => fixture.profile, getFundamentals: async () => fixture.fundamentals }, news: { getEvents: async () => fixture.events } });
    expect(market.getCandles).toHaveBeenCalledTimes(4);
    expect(result.mode).toBe("live");
    expect(result.scores.quality.stopped).toBe(false);
    expect(result.summarySource).toBe("template");
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
});
