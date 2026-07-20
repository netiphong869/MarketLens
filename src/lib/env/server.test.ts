import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/server";

describe("parseServerEnv", () => {
  it("defaults to safe mock-mode settings when secrets are absent", () => {
    const env = parseServerEnv({});

    expect(env.MOCK_DATA_MODE).toBe(true);
    expect(env.DAILY_ANALYSIS_LIMIT).toBe(10);
    expect(env.CACHE_TTL_SECONDS).toBe(300);
    expect(env.TWELVE_DATA_API_KEY).toBeUndefined();
  });

  it("parses explicit false and numeric limits", () => {
    const env = parseServerEnv({
      MOCK_DATA_MODE: "false",
      DAILY_ANALYSIS_LIMIT: "7",
      CACHE_TTL_SECONDS: "120",
    });

    expect(env.MOCK_DATA_MODE).toBe(false);
    expect(env.DAILY_ANALYSIS_LIMIT).toBe(7);
    expect(env.CACHE_TTL_SECONDS).toBe(120);
  });

  it("rejects unsafe numeric limits", () => {
    expect(() => parseServerEnv({ DAILY_ANALYSIS_LIMIT: "0" })).toThrowError(
      /DAILY_ANALYSIS_LIMIT/,
    );
  });
});
