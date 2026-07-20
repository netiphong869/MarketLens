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

    for (const score of [result.technical.score, result.fundamental?.score, result.events.score, result.risk.score, result.quality.score, result.horizons?.short]) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isFinite(score)).toBe(true);
    }
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
    expect(result.horizons).toBeNull();
  });

  it("rejects unsupported security types without inventing a score", () => {
    const source = createMockAnalysisResponse("SPY");
    source.profile.securityType = "etf";
    const result = analyzeSnapshot({ symbol: "SPY", quote: source.quote, profile: source.profile, candles: source.candles, fundamentals: null, events: [] });
    expect(result.quality.stopped).toBe(true);
    expect(result.quality.missing).toContain("ประเภทหลักทรัพย์ยังไม่รองรับ");
    expect(result.horizons).toBeNull();
  });

  it("handles negative earnings and extreme debt without NaN", () => {
    const source = createMockAnalysisResponse("RISK");
    const fundamentals = { ...source.fundamentals!, epsGrowthYoY: -250, netMargin: -80, netDebtToEbitda: 50, interestCoverage: -2 };
    const result = analyzeSnapshot({ symbol: "RISK", quote: source.quote, profile: source.profile, candles: source.candles, fundamentals, events: source.events });
    expect(Number.isFinite(result.fundamental!.score)).toBe(true);
    expect(result.risk.score).toBeGreaterThan(50);
  });
});
