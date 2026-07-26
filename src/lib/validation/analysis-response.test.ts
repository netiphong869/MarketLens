import { describe, expect, it } from "vitest";

import { parseAnalysisApiResult } from "@/lib/validation/analysis-response";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("parseAnalysisApiResult", () => {
  it("accepts an analysis envelope with finite nullable snapshots", () => {
    const response = makeAnalysisResponse();
    const input = {
      data: response,
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(parseAnalysisApiResult(input)).toEqual(input);
  });

  it("rejects a response that omits the technical snapshot contract", () => {
    const response = makeAnalysisResponse();
    const input = {
      data: { ...response, technicalSnapshot: undefined },
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(() => parseAnalysisApiResult(input)).toThrow();
  });

  it("rejects a null indicator that has no specific unavailable reason", () => {
    const response = makeAnalysisResponse();
    response.technicalSnapshot["1d"].ema200 = null;
    delete response.technicalSnapshot["1d"].unavailable.ema200;
    const input = {
      data: response,
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(() => parseAnalysisApiResult(input)).toThrow();
  });

  it("rejects a response that omits deterministic horizon verdicts", () => {
    const response = makeAnalysisResponse();
    const input = {
      data: {
        ...response,
        summary: {
          ...response.summary,
          horizons: undefined,
        },
      },
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(() => parseAnalysisApiResult(input)).toThrow();
  });

  it("rejects a positive horizon that hides its score", () => {
    const response = makeAnalysisResponse();
    response.summary.horizons.long.status = "positive";
    response.summary.horizons.long.score = null;
    const input = {
      data: response,
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(() => parseAnalysisApiResult(input)).toThrow();
  });

  it("rejects an insufficient horizon that still exposes a score", () => {
    const response = makeAnalysisResponse();
    response.summary.horizons.short.status = "insufficient";
    response.summary.horizons.short.score = 70;
    const input = {
      data: response,
      cached: false,
      usage: { used: 1, remaining: 9, limit: 10 },
    };

    expect(() => parseAnalysisApiResult(input)).toThrow();
  });
});
