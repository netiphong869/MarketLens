import { describe, expect, it } from "vitest";

import { TtlCache } from "@/lib/cache/ttl-cache";

describe("TtlCache", () => {
  it("returns a cached value only before its expiry", () => {
    let now = 1_000;
    const cache = new TtlCache<string>(() => now);

    cache.set("FN:analysis", "fresh", 300);
    expect(cache.get("FN:analysis")).toBe("fresh");

    now = 301_001;
    expect(cache.get("FN:analysis")).toBeUndefined();
  });

  it("keeps endpoint and timeframe keys independent", () => {
    const cache = new TtlCache<number>(() => 0);
    cache.set("FN:history:1d", 1, 300);
    cache.set("FN:history:1h", 2, 300);

    expect(cache.get("FN:history:1d")).toBe(1);
    expect(cache.get("FN:history:1h")).toBe(2);
  });
});
