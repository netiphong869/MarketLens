import { describe, expect, it, vi } from "vitest";

import { FinnhubProvider } from "@/providers/finnhub/provider";

describe("FinnhubProvider authentication", () => {
  it("sends the API key in X-Finnhub-Token and never in the URL", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ticker: "AAPL",
          name: "Apple Inc.",
          exchange: "NASDAQ",
          country: "US",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    await new FinnhubProvider("sensitive-test-token", fetchFn).getProfile(
      "AAPL",
    );

    const [url, init] = fetchFn.mock.calls[0];
    expect(String(url)).not.toContain("sensitive-test-token");
    expect(String(url)).not.toContain("token=");
    expect(new Headers(init?.headers).get("X-Finnhub-Token")).toBe(
      "sensitive-test-token",
    );
  });
});
