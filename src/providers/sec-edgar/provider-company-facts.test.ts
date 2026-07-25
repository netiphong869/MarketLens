import { describe, expect, it, vi } from "vitest";

import {
  SEC_COMPANY_FACTS_MAX_BYTES,
  SecEdgarProvider,
} from "@/providers/sec-edgar/provider";

const tickerPayload = {
  0: { cik_str: 320193, ticker: "AAPL", title: "Apple Inc." },
};

function companyFactsPayload(paddingBytes = 0): string {
  return JSON.stringify({
    facts: {
      "us-gaap": {
        RevenueFromContractWithCustomerExcludingAssessedTax: {
          units: {
            USD: [
              {
                fy: 2024,
                form: "10-K",
                filed: "2024-11-01",
                val: 100,
              },
              {
                fy: 2025,
                form: "10-K",
                filed: "2025-11-01",
                val: 120,
              },
            ],
          },
        },
        UnusedConceptThatMustNotBeRetained: {
          label: "x".repeat(paddingBytes),
        },
      },
    },
  });
}

function secFetch(companyFactsBody: string, contentType = "application/json") {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    void _init;
    const url = String(input);
    if (url.includes("company_tickers.json")) {
      return new Response(JSON.stringify(tickerPayload), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(companyFactsBody, {
      status: 200,
      headers: { "content-type": contentType },
    });
  });
}

describe("SecEdgarProvider Company Facts boundary", () => {
  it("accepts a valid Company Facts JSON response larger than the shared 1 MB cap", async () => {
    const fetchFn = secFetch(companyFactsPayload(1_100_000));

    const fundamentals = await new SecEdgarProvider(
      "MarketLens test contact@example.com",
      fetchFn,
    ).getFundamentals("AAPL");

    expect(fundamentals?.revenueGrowthYoY).toBe(20);
    expect(String(fetchFn.mock.calls[1][0])).toMatch(
      /^https:\/\/data\.sec\.gov\/api\/xbrl\/companyfacts\/CIK\d{10}\.json$/,
    );
    expect(fetchFn.mock.calls[1][1]).toMatchObject({
      redirect: "error",
    });
  });

  it("rejects a decompressed response larger than the SEC-specific cap", async () => {
    const fetchFn = secFetch(
      companyFactsPayload(SEC_COMPANY_FACTS_MAX_BYTES + 1),
    );

    await expect(
      new SecEdgarProvider(
        "MarketLens test contact@example.com",
        fetchFn,
      ).getFundamentals("AAPL"),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      retryable: false,
    });
  });

  it("rejects non-JSON Company Facts responses such as an HTML challenge", async () => {
    const fetchFn = secFetch("<html>challenge</html>", "text/html");

    await expect(
      new SecEdgarProvider(
        "MarketLens test contact@example.com",
        fetchFn,
      ).getFundamentals("AAPL"),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
  });

  it("rejects a redirected Company Facts response", async () => {
    const redirected = new Response(companyFactsPayload(), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    Object.defineProperty(redirected, "redirected", { value: true });
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tickerPayload), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(redirected);

    await expect(
      new SecEdgarProvider(
        "MarketLens test contact@example.com",
        fetchFn,
      ).getFundamentals("AAPL"),
    ).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
  });
});
