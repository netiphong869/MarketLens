import { describe, expect, it, vi } from "vitest";

import { TwelveDataProvider } from "@/providers/twelve-data/provider";

describe("TwelveDataProvider", () => {
  it("normalizes quote and candles without exposing the API key", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            symbol: "FN",
            close: "461.96",
            change: "17.30",
            percent_change: "3.89",
            currency: "USD",
            is_market_open: false,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
            values: [
              {
                datetime: "2026-07-17",
                open: "450",
                high: "465",
                low: "448",
                close: "461.96",
                volume: "1200000",
              },
            ],
          }),
          { status: 200 },
        ),
      );
    const provider = new TwelveDataProvider("super-secret", fetchFn);

    const quote = await provider.getQuote("FN");
    const candles = await provider.getCandles("FN", "1d", 220);

    expect(quote.price).toBe(461.96);
    expect(candles[0]).toMatchObject({ close: 461.96, volume: 1_200_000 });
    expect(JSON.stringify({ quote, candles })).not.toContain("super-secret");
  });
});
