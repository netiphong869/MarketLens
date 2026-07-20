import { requestJson } from "@/lib/api/http";
import type { ProviderFetch } from "@/providers/contracts";
import { normalizeCompanyFacts } from "@/providers/sec-edgar/normalizer";

interface TickerRecord { ticker: string; cik_str: number; title: string }
export class SecEdgarProvider {
  readonly name = "SEC EDGAR";
  constructor(private readonly userAgent: string, private readonly fetchFn: ProviderFetch = fetch) {}
  async getCompanyFacts(symbol: string): Promise<unknown> {
    const tickers = await requestJson<Record<string, TickerRecord>>("https://www.sec.gov/files/company_tickers.json", { fetchFn: this.fetchFn, headers: this.headers() });
    const record = Object.values(tickers).find((item) => item.ticker.toUpperCase() === symbol.toUpperCase());
    if (!record) return null;
    const cik = String(record.cik_str).padStart(10, "0");
    return requestJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { fetchFn: this.fetchFn, headers: this.headers() });
  }
  async getFundamentals(symbol: string) { return normalizeCompanyFacts(await this.getCompanyFacts(symbol)); }
  private headers(): HeadersInit { return { "User-Agent": this.userAgent, Accept: "application/json" }; }
}
