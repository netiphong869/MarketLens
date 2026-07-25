import { z } from "zod";
import { requestJson } from "@/lib/api/http";
import type { ProviderFetch } from "@/providers/contracts";
import type { CompanyProfile, MarketEvent } from "@/types/market";

const profileSchema = z.object({ ticker: z.string(), name: z.string(), exchange: z.string().default(""), country: z.string().default("US"), finnhubIndustry: z.string().optional(), marketCapitalization: z.number().optional() });
export class FinnhubProvider {
  readonly name = "Finnhub";
  constructor(private readonly apiKey: string, private readonly fetchFn: ProviderFetch = fetch) {}
  async getProfile(symbol: string): Promise<CompanyProfile> {
    const search = new URLSearchParams({ symbol });
    const profile = profileSchema.parse(await requestJson<unknown>(`https://finnhub.io/api/v1/stock/profile2?${search}`, { fetchFn: this.fetchFn, headers: this.headers() }));
    return { symbol: profile.ticker, name: profile.name, exchange: profile.exchange, country: profile.country, sector: profile.finnhubIndustry ?? null, industry: profile.finnhubIndustry ?? null, securityType: "common_stock", marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : null, description: null, provenance: { provider: this.name, mode: "realtime", asOf: new Date().toISOString() } };
  }

  async getEvents(symbol: string, from: string, to: string): Promise<MarketEvent[]> {
    const search = new URLSearchParams({ symbol, from, to });
    const raw = await requestJson<unknown>(`https://finnhub.io/api/v1/company-news?${search}`, { fetchFn: this.fetchFn, headers: this.headers() });
    const news = z.array(z.object({ id: z.union([z.number(), z.string()]), datetime: z.number(), headline: z.string(), source: z.string().default(""), url: z.string().optional(), category: z.string().optional() })).parse(raw);
    return news.slice(0, 25).map((item) => ({
      id: String(item.id), occurredAt: new Date(item.datetime * 1000).toISOString(), title: item.headline,
      category: categorize(item.headline), direction: "neutral", severity: 2,
      authority: /reuters|bloomberg|associated press|wall street journal|cnbc/i.test(item.source) ? "major_news" : "unverified",
      provenance: { provider: this.name, mode: "delayed", asOf: new Date().toISOString(), sourceUrl: item.url },
    }));
  }

  private headers(): HeadersInit {
    return { "X-Finnhub-Token": this.apiKey, Accept: "application/json" };
  }
}

function categorize(headline: string): MarketEvent["category"] {
  if (/earnings|results|revenue|profit/i.test(headline)) return "earnings";
  if (/guidance|outlook/i.test(headline)) return "guidance";
  if (/offering|dilution|shares/i.test(headline)) return "offering";
  if (/merger|acquisition/i.test(headline)) return "merger";
  if (/lawsuit|court/i.test(headline)) return "lawsuit";
  if (/ceo|cfo|management/i.test(headline)) return "management";
  return "product";
}
