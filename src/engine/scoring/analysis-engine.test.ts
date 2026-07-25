import { describe, expect, it } from "vitest";

import { analyzeSnapshot } from "@/engine/scoring/analysis-engine";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("analyzeSnapshot", () => {
  it("produces transparent, clamped scores for complete stock data", () => {
    const source = createMockAnalysisResponse("FN");
    const result = analyzeSnapshot({
      symbol: source.symbol,
      quote: source.quote,
      profile: source.profile,
      candles: source.candles,
      fundamentals: source.fundamentals,
      events: source.events,
    });

    for (const score of [result.technical.score, result.fundamental?.score, result.events.score, result.risk.score, result.quality.score]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isFinite(score)).toBe(true);
    }
    expect(result.horizons.short).toMatchObject({
      score: null,
      status: "partial",
      missingModules: ["market"],
    });
    expect(result.technical.reasons.length).toBeGreaterThan(0);
    expect(result.quality.stopped).toBe(false);
  });

  it("blocks final horizon scores when quality is below 60", () => {
    const source = createMockAnalysisResponse("FN");
    const result = analyzeSnapshot({
      symbol: "FN",
      quote: source.quote,
      profile: source.profile,
      candles: { "15m": [], "1h": [], "4h": [], "1d": [] },
      fundamentals: null,
      events: [],
    });

    expect(result.quality.score).toBeLessThan(60);
    expect(result.quality.stopped).toBe(true);
    expect(result.horizons.short).toMatchObject({
      score: null,
      status: "insufficient",
    });
    expect(result.horizons.medium).toMatchObject({
      score: null,
      status: "insufficient",
    });
    expect(result.horizons.long).toMatchObject({
      score: null,
      status: "insufficient",
    });
  });

  it("rejects unsupported security types without inventing a score", () => {
    const source = createMockAnalysisResponse("SPY");
    source.profile.securityType = "etf";
    const result = analyzeSnapshot({ symbol: "SPY", quote: source.quote, profile: source.profile, candles: source.candles, fundamentals: null, events: [] });
    expect(result.quality.stopped).toBe(true);
    expect(result.quality.missing).toContain("ประเภทหลักทรัพย์ยังไม่รองรับ");
    expect(result.horizons.long.status).toBe("insufficient");
  });

  it("handles negative earnings and extreme debt without NaN", () => {
    const source = createMockAnalysisResponse("RISK");
    const fundamentals = { ...source.fundamentals!, epsGrowthYoY: -250, netMargin: -80, netDebtToEbitda: 50, interestCoverage: -2 };
    const result = analyzeSnapshot({ symbol: "RISK", quote: source.quote, profile: source.profile, candles: source.candles, fundamentals, events: source.events });
    expect(Number.isFinite(result.fundamental!.score)).toBe(true);
    expect(result.risk.score).toBeGreaterThan(50);
  });

  it("reports Q=85 transparently while coverage shows missing fundamentals, market, and news", () => {
    const source = createMockAnalysisResponse("AAPL");
    const result = analyzeSnapshot({
      symbol: "AAPL",
      quote: source.quote,
      profile: source.profile,
      candles: source.candles,
      fundamentals: null,
      events: [],
    });

    expect(result.quality.score).toBe(85);
    expect(result.quality.components).toEqual({
      traceability: 20,
      candles: 60,
      fundamentals: 0,
      price: 5,
    });
    expect(result.coverage).toMatchObject({
      technical: { percent: 100, status: "complete" },
      fundamental: { percent: 0, status: "insufficient" },
      market: { percent: 0, status: "insufficient" },
      news: { percent: 0, status: "insufficient" },
    });
    expect(result.market.score).toBeNull();
    expect(result.events.score).toBeNull();
    expect(result.risk.components.financial).toBeNull();
    expect(result.risk.components.dilution).toBeNull();
    expect(result.risk.components.event).toBeNull();
    expect(result.horizons.short.status).toBe("partial");
    expect(result.horizons.short.score).toBeNull();
    expect(result.horizons.medium.status).toBe("insufficient");
    expect(result.horizons.long.status).toBe("insufficient");
  });

  it("calculates fundamental coverage only from available fields without substituting zeros", () => {
    const source = createMockAnalysisResponse("AAPL");
    const fundamentals = {
      ...source.fundamentals!,
      revenueGrowthThreeYear: null,
      epsGrowthYoY: null,
      netDebtToEbitda: null,
      interestCoverage: null,
      roic: null,
      estimatedWacc: null,
      pe: null,
      evToSales: null,
      evToEbitda: null,
      priceToFreeCashFlow: null,
      sharesGrowthYoY: null,
      earningsBeatsLastFour: null,
      guidance: "unknown" as const,
    };

    const result = analyzeSnapshot({
      symbol: "AAPL",
      quote: source.quote,
      profile: source.profile,
      candles: source.candles,
      fundamentals,
      events: [],
    });

    expect(result.fundamental?.availableWeight).toBeGreaterThan(0);
    expect(result.fundamental?.availableWeight).toBeLessThan(100);
    expect(result.fundamental?.components.debt).toBeNull();
    expect(result.fundamental?.components.valuation).toBeNull();
    expect(result.coverage.fundamental.status).toBe("partial");
  });
});
