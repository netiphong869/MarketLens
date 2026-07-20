import { describe, expect, it } from "vitest";

import { normalizeCompanyFacts } from "@/providers/sec-edgar/normalizer";

const unit = (values: Array<{ fy: number; val: number }>) => ({ units: { USD: values.map((item) => ({ ...item, form: "10-K", fp: "FY", filed: `${item.fy + 1}-02-01`, end: `${item.fy}-12-31` })) } });

describe("SEC company facts normalizer", () => {
  it("derives growth and margins from annual facts", () => {
    const result = normalizeCompanyFacts({ facts: { "us-gaap": {
      RevenueFromContractWithCustomerExcludingAssessedTax: unit([{ fy: 2024, val: 100 }, { fy: 2025, val: 120 }]),
      GrossProfit: unit([{ fy: 2025, val: 48 }]),
      OperatingIncomeLoss: unit([{ fy: 2025, val: 24 }]),
      NetIncomeLoss: unit([{ fy: 2025, val: 18 }]),
      EarningsPerShareDiluted: { units: { "USD/shares": [{ fy: 2024, val: 2, form: "10-K", fp: "FY", filed: "2025-02-01", end: "2024-12-31" }, { fy: 2025, val: 3, form: "10-K", fp: "FY", filed: "2026-02-01", end: "2025-12-31" }] } },
    } } }, "2026-07-18T00:00:00Z");
    expect(result?.revenueGrowthYoY).toBe(20);
    expect(result?.epsGrowthYoY).toBe(50);
    expect(result?.grossMargin).toBe(40);
    expect(result?.operatingMargin).toBe(20);
    expect(result?.netMargin).toBe(15);
  });
});
