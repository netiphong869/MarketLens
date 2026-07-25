import { AppError } from "@/lib/errors/app-error";
import { requestJson } from "@/lib/api/http";
import type { ProviderFetch } from "@/providers/contracts";
import {
  normalizeCompanyFacts,
  selectRequiredCompanyFacts,
} from "@/providers/sec-edgar/normalizer";
import type { CompanyProfile } from "@/types/market";

export const SEC_COMPANY_FACTS_MAX_BYTES = 6 * 1024 * 1024;
const SEC_COMPANY_FACTS_HOST = "data.sec.gov";

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

  private async getCompanyFacts(symbol: string): Promise<unknown> {
    const record = await this.getTickerRecord(symbol);
    if (!record) return null;
    const cik = String(record.cik_str).padStart(10, "0");
    return this.requestCompanyFacts(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
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

  private async requestCompanyFacts(urlValue: string): Promise<unknown> {
    const url = new URL(urlValue);
    if (
      url.protocol !== "https:" ||
      url.hostname !== SEC_COMPANY_FACTS_HOST ||
      !url.pathname.startsWith("/api/xbrl/companyfacts/")
    ) {
      throw providerUnavailable("SEC Company Facts URL ไม่อยู่ใน allowlist");
    }
    const response = await this.fetchFn(url, {
      headers: this.headers(),
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      throw providerUnavailable("SEC Company Facts ไม่พร้อมใช้งาน");
    }
    if (
      response.redirected ||
      (response.url && new URL(response.url).hostname !== SEC_COMPANY_FACTS_HOST)
    ) {
      throw providerUnavailable("SEC Company Facts พยายาม redirect");
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("application/json")) {
      throw providerUnavailable("SEC Company Facts ไม่ได้ส่ง JSON");
    }
    const statedSize = Number(response.headers.get("content-length") ?? "0");
    if (statedSize > SEC_COMPANY_FACTS_MAX_BYTES) {
      throw providerUnavailable("SEC Company Facts มีขนาดเกินเพดาน");
    }
    const body = await readBoundedBody(response, SEC_COMPANY_FACTS_MAX_BYTES);
    try {
      return selectRequiredCompanyFacts(JSON.parse(body));
    } catch {
      throw providerUnavailable("SEC Company Facts JSON ไม่ถูกต้อง");
    }
  }
}

async function readBoundedBody(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw providerUnavailable("SEC Company Facts มีขนาดเกินเพดาน");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function providerUnavailable(message: string): AppError {
  return new AppError("PROVIDER_UNAVAILABLE", message, 502, false);
}
