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
    expect(Object.keys(result.technicalSnapshot)).toEqual([
      "15m",
      "1h",
      "4h",
      "1d",
    ]);
    expect(result.technicalSnapshot["1d"].ema200).not.toBeNull();
    expect(result.technicalSnapshot["1d"].calculatedAt).toBe(
      source.generatedAt,
    );
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

  it("scores a bullish market with a sector that outperforms the benchmark", () => {
    const source = createMockAnalysisResponse("AAPL");
    const result = analyzeSnapshot({
      symbol: "AAPL",
      quote: source.quote,
      profile: source.profile,
      candles: source.candles,
      fundamentals: source.fundamentals,
      events: source.events,
      marketContext: {
        benchmarkSymbol: "SPY",
        sectorSymbol: "XLK",
        stockReturns: { "1d": 2, "5d": 6, "20d": 15, "60d": 30 },
        benchmarkReturns: { "1d": 1, "5d": 3, "20d": 8, "60d": 12 },
        sectorReturns: { "1d": 1.5, "5d": 4, "20d": 10, "60d": 18 },
        benchmarkTrend: "up",
        sectorTrend: "up",
        volatilityPercentile: 25,
        provenance: source.quote.provenance,
      },
    });

    expect(result.market.score).toBeGreaterThan(70);
    expect(result.market.availableWeight).toBe(100);
    expect(result.coverage.market).toMatchObject({
      percent: 100,
      status: "complete",
    });
  });

  it("scores a bearish market and reports partial weight when VIX-style volatility is missing", () => {
    const source = createMockAnalysisResponse("AAPL");
    const result = analyzeSnapshot({
      symbol: "AAPL",
      quote: source.quote,
      profile: source.profile,
      candles: source.candles,
      fundamentals: source.fundamentals,
      events: source.events,
      marketContext: {
        benchmarkSymbol: "SPY",
        sectorSymbol: "XLK",
        stockReturns: { "1d": -3, "5d": -8, "20d": -20, "60d": -30 },
        benchmarkReturns: { "1d": -1, "5d": -4, "20d": -10, "60d": -15 },
        sectorReturns: { "1d": -2, "5d": -6, "20d": -14, "60d": -22 },
        benchmarkTrend: "down",
        sectorTrend: "down",
        volatilityPercentile: null,
        provenance: source.quote.provenance,
      },
    });

    expect(result.market.score).toBeLessThan(40);
    expect(result.market.availableWeight).toBe(90);
    expect(result.coverage.market.status).toBe("complete");
    expect(result.market.components.volatility).toBeNull();
  });

  it("withholds the short horizon when technical coverage is below 85 percent", () => {
    const source = createMockAnalysisResponse("AAPL");
    const result = analyzeSnapshot({
      symbol: "AAPL",
      quote: source.quote,
      profile: source.profile,
      candles: { ...source.candles, "1h": source.candles["1h"].slice(0, 20) },
      fundamentals: source.fundamentals,
      events: source.events,
      marketContext: bullishMarketContext(source.quote.provenance),
    });

    expect(result.coverage.technical.percent).toBeLessThan(85);
    expect(result.horizons.short).toMatchObject({
      score: null,
      status: "insufficient",
    });
  });

  it("allows a short horizon with partial fundamentals but keeps medium and long honest", () => {
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
      events: source.events,
      marketContext: bullishMarketContext(source.quote.provenance),
    });

    expect(result.coverage.fundamental.percent).toBeGreaterThanOrEqual(25);
    expect(result.coverage.fundamental.percent).toBeLessThan(50);
    expect(result.horizons.short.status).toBe("available");
    expect(result.horizons.medium.status).toBe("insufficient");
    expect(result.horizons.long.status).toBe("insufficient");
  });
});

function bullishMarketContext(
  provenance: ReturnType<typeof createMockAnalysisResponse>["quote"]["provenance"],
) {
  return {
    benchmarkSymbol: "SPY",
    sectorSymbol: "XLK",
    stockReturns: { "1d": 2, "5d": 6, "20d": 15, "60d": 30 },
    benchmarkReturns: { "1d": 1, "5d": 3, "20d": 8, "60d": 12 },
    sectorReturns: { "1d": 1.5, "5d": 4, "20d": 10, "60d": 18 },
    benchmarkTrend: "up" as const,
    sectorTrend: "up" as const,
    volatilityPercentile: 25,
    provenance,
  };
}
