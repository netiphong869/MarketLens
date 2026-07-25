import type { CompanyProfile } from "@/types/market";

interface CompanyProfileProvider {
  getProfile(symbol: string): Promise<CompanyProfile>;
}

export class FallbackCompanyProfileProvider {
  constructor(
    private readonly primary: CompanyProfileProvider,
    private readonly fallback: CompanyProfileProvider,
  ) {}

  async getProfile(symbol: string): Promise<CompanyProfile> {
    try {
      return await this.primary.getProfile(symbol);
    } catch {
      return this.fallback.getProfile(symbol);
    }
  }
}
