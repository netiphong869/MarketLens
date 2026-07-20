import { describe, expect, it, vi } from "vitest";

import { FinnhubProvider } from "@/providers/finnhub/provider";

describe("Finnhub events", () => {
  it("normalizes sourced company news without guessing sentiment", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 7, datetime: 1784304000, headline: "Company reports results", source: "Reuters", url: "https://example.test/news", category: "company" }]), { status: 200 }));
    const events = await new FinnhubProvider("secret", fetchFn).getEvents("FN", "2026-07-01", "2026-07-18");
    expect(events[0]).toMatchObject({ direction: "neutral", authority: "major_news", category: "earnings" });
  });
});
