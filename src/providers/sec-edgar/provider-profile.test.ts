import { describe, expect, it, vi } from "vitest";

import { SecEdgarProvider } from "@/providers/sec-edgar/provider";

describe("SecEdgarProvider company profile", () => {
  it("builds a traceable company identity from the SEC ticker mapping", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          0: {
            cik_str: 320193,
            ticker: "AAPL",
            title: "Apple Inc.",
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const profile = await new SecEdgarProvider(
      "MarketLens test contact@example.com",
      fetchFn,
    ).getProfile("aapl");

    expect(profile).toMatchObject({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchange: "US",
      country: "US",
      sector: null,
      industry: null,
      securityType: "common_stock",
      marketCap: null,
      description: null,
      provenance: {
        provider: "SEC EDGAR",
        mode: "delayed",
      },
    });
  });
});
