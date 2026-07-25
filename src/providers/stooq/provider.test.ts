import { describe, expect, it, vi } from "vitest";

import { StooqProvider } from "@/providers/stooq/provider";

describe("StooqProvider", () => {
  it("parses a verified CSV schema into daily candles", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        "Date,Open,High,Low,Close,Volume\n2026-07-24,210,215,208,214,1000000\n",
        { status: 200, headers: { "content-type": "text/csv" } },
      ),
    );

    const candles = await new StooqProvider(fetchFn).getDailyCandles("AAPL");

    expect(candles).toEqual([
      {
        time: "2026-07-24T00:00:00.000Z",
        open: 210,
        high: 215,
        low: 208,
        close: 214,
        volume: 1_000_000,
        closed: true,
      },
    ]);
  });

  it("marks HTTP 200 HTML challenges unavailable instead of claiming backup data", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("<html><script>verify your browser</script></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );

    await expect(
      new StooqProvider(fetchFn).getDailyCandles("AAPL"),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      retryable: false,
    });
  });
});
