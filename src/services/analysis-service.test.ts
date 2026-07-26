import { describe, expect, it, vi } from "vitest";

import { TtlCache } from "@/lib/cache/ttl-cache";
import { DailyUsageCounter } from "@/lib/usage/daily-limit";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";
import { AnalysisService } from "@/services/analysis-service";

describe("AnalysisService", () => {
  it("caches a successful analysis and consumes one daily use", async () => {
    const build = vi.fn(async (symbol: string) => createMockAnalysisResponse(symbol));
    const service = new AnalysisService({
      build,
      cache: new TtlCache(() => 1_000),
      usage: new DailyUsageCounter(10, () => new Date("2026-07-18T01:00:00Z")),
      ttlSeconds: 300,
    });

    const first = await service.analyze("fn", "device-a");
    const second = await service.analyze("FN", "device-a");

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(build).toHaveBeenCalledTimes(1);
    expect(second.usage.remaining).toBe(9);
  });

  it("does not consume usage when analysis fails", async () => {
    const usage = new DailyUsageCounter(10);
    const service = new AnalysisService({
      build: async () => Promise.reject(new Error("provider down")),
      cache: new TtlCache(),
      usage,
      ttlSeconds: 300,
    });

    await expect(service.analyze("FN", "device-a")).rejects.toThrow("provider down");
    expect(usage.status("device-a").remaining).toBe(10);
  });

  it("rejects an uncached request before calling providers when the daily limit is exhausted", async () => {
    const build = vi.fn(async (symbol: string) => createMockAnalysisResponse(symbol));
    const service = new AnalysisService({
      build,
      cache: new TtlCache(),
      usage: new DailyUsageCounter(1),
      ttlSeconds: 300,
    });

    await service.analyze("AAPL", "device-a");
    await expect(service.analyze("MSFT", "device-a")).rejects.toMatchObject({
      code: "DAILY_LIMIT_REACHED",
    });
    expect(build).toHaveBeenCalledTimes(1);
  });
});
