import { describe, expect, it } from "vitest";

import { cacheStrategyFor } from "@/lib/pwa/cache-policy";

describe("PWA cache policy", () => {
  it("never cache-firsts analysis API responses", () => {
    expect(cacheStrategyFor(new URL("https://marketlens.test/api/analyze"))).toBe("network-only");
  });

  it("cache-firsts immutable static assets", () => {
    expect(cacheStrategyFor(new URL("https://marketlens.test/_next/static/app.js"))).toBe("cache-first");
  });
});
