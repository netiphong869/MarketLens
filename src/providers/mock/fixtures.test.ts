import { describe, expect, it } from "vitest";

import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("mock analysis fixtures", () => {
  it("uses a realistic interval for each requested timeframe", () => {
    const analysis = createMockAnalysisResponse();
    const interval = (frame: "15m" | "1h" | "4h" | "1d") =>
      new Date(analysis.candles[frame][1].time).getTime() -
      new Date(analysis.candles[frame][0].time).getTime();

    expect(interval("15m")).toBe(15 * 60 * 1000);
    expect(interval("1h")).toBe(60 * 60 * 1000);
    expect(interval("4h")).toBe(4 * 60 * 60 * 1000);
    expect(interval("1d")).toBe(24 * 60 * 60 * 1000);
  });

  it("uses distinct OHLCV patterns so each timeframe has its own snapshot values", () => {
    const analysis = createMockAnalysisResponse();
    const latestCloses = (["15m", "1h", "4h", "1d"] as const).map(
      (timeframe) => analysis.technicalSnapshot[timeframe].latestClose,
    );

    expect(new Set(latestCloses).size).toBe(4);
  });
});
