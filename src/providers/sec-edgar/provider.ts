import { AppError } from "@/lib/errors/app-error";
import { requestJson } from "@/lib/api/http";
import type { ProviderFetch } from "@/providers/contracts";
import { normalizeCompanyFacts } from "@/providers/sec-edgar/normalizer";
import type { CompanyProfile } from "@/types/market";

interface TickerRecord {
  ticker: string;
  cik_str: number;
  title: string;
}
export class SecEdgarProvider {
  readonly name = "SEC EDGAR";
  constructor(
    private readonly userAgent: string,
    private readonly fetchFn: ProviderFetch = fetch,
  ) {}

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const record = await this.getTickerRecord(symbol);
    if (!record) {
      throw new AppError(
        "SYMBOL_NOT_FOUND",
        "ไม่พบชื่อย่อหุ้นใน SEC EDGAR",
        404,
        false,
      );
    }
    return {
      symbol: record.ticker.toUpperCase(),
      name: record.title,
      exchange: "US",
      country: "US",
      sector: null,
      industry: null,
      securityType: "common_stock",
      marketCap: null,
      description: null,
      provenance: {
        provider: this.name,
        mode: "delayed",
        asOf: new Date().toISOString(),
        sourceUrl: "https://www.sec.gov/files/company_tickers.json",
      },
    };
  }

  async getCompanyFacts(symbol: string): Promise<unknown> {
    const record = await this.getTickerRecord(symbol);
    if (!record) return null;
    const cik = String(record.cik_str).padStart(10, "0");
    return requestJson(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { fetchFn: this.fetchFn, headers: this.headers() },
    );
  }
  async getFundamentals(symbol: string) {
    return normalizeCompanyFacts(await this.getCompanyFacts(symbol));
  }
  private async getTickerRecord(symbol: string): Promise<TickerRecord | null> {
    const tickers = await requestJson<Record<string, TickerRecord>>(
      "https://www.sec.gov/files/company_tickers.json",
      { fetchFn: this.fetchFn, headers: this.headers() },
    );
    return (
      Object.values(tickers).find(
        (item) => item.ticker.toUpperCase() === symbol.toUpperCase(),
      ) ?? null
    );
  }
  private headers(): HeadersInit {
    return { "User-Agent": this.userAgent, Accept: "application/json" };
  }
}
