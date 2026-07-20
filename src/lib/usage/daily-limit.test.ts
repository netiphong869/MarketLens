import { describe, expect, it } from "vitest";

import { DailyUsageCounter } from "@/lib/usage/daily-limit";

describe("DailyUsageCounter", () => {
  it("increments only when a caller commits a successful analysis", () => {
    const counter = new DailyUsageCounter(2, () => new Date("2026-07-18T16:00:00Z"));

    expect(counter.status("personal")).toEqual({ used: 0, remaining: 2, limit: 2 });
    counter.commitSuccess("personal");
    expect(counter.status("personal")).toEqual({ used: 1, remaining: 1, limit: 2 });
  });

  it("rejects success commits after the daily limit", () => {
    const counter = new DailyUsageCounter(1, () => new Date("2026-07-18T16:00:00Z"));
    counter.commitSuccess("personal");

    expect(() => counter.commitSuccess("personal")).toThrowError(/ครบจำนวน/);
  });

  it("resets on a new Bangkok calendar day", () => {
    let now = new Date("2026-07-18T16:59:00Z");
    const counter = new DailyUsageCounter(2, () => now);
    counter.commitSuccess("personal");

    now = new Date("2026-07-18T17:01:00Z");
    expect(counter.status("personal")).toEqual({ used: 0, remaining: 2, limit: 2 });
  });
});
