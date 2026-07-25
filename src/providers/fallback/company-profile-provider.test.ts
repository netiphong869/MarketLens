import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { FallbackCompanyProfileProvider } from "@/providers/fallback/company-profile-provider";
import type { CompanyProfile } from "@/types/market";

const secProfile: CompanyProfile = {
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
    asOf: "2026-07-25T00:00:00.000Z",
  },
};

describe("FallbackCompanyProfileProvider", () => {
  it("uses the SEC identity when Finnhub rejects its credential", async () => {
    const provider = new FallbackCompanyProfileProvider(
      {
        getProfile: async () => {
          throw new AppError(
            "PROVIDER_AUTH_ERROR",
            "provider rejected authentication",
            502,
            false,
          );
        },
      },
      {
        getProfile: async () => secProfile,
      },
    );

    await expect(provider.getProfile("AAPL")).resolves.toEqual(secProfile);
  });
});
