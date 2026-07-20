import { z } from "zod";
import { requestJson } from "@/lib/api/http";
import type { MarketDataProvider, ProviderFetch } from "@/providers/contracts";
import type { Candle, Quote, Timeframe } from "@/types/market";

const quoteSchema = z.object({ symbol: z.string(), close: z.string(), change: z.string(), percent_change: z.string(), currency: z.string().default("USD"), is_market_open: z.boolean().optional() });
const seriesSchema = z.object({ values: z.array(z.object({ datetime: z.string(), open: z.string(), high: z.string(), low: z.string(), close: z.string(), volume: z.string().optional().default("0") })) });
const intervals: Record<Timeframe, string> = { "15m": "15min", "1h": "1h", "4h": "4h", "1d": "1day" };

export class TwelveDataProvider implements MarketDataProvider {
  readonly name = "Twelve Data";
  constructor(private readonly apiKey: string, private readonly fetchFn: ProviderFetch = fetch) {}

  async getQuote(symbol: string): Promise<Quote> {
    const value = quoteSchema.parse(await requestJson<unknown>(this.url("quote", { symbol }), { fetchFn: this.fetchFn }));
    const asOf = new Date().toISOString();
    return { symbol: value.symbol, price: finite(value.close), change: finite(value.change), changePercent: finite(value.percent_change), currency: value.currency, session: value.is_market_open ? "regular" : "closed", provenance: { provider: this.name, mode: "realtime", asOf } };
  }

  async getCandles(symbol: string, timeframe: Timeframe, outputSize = 220): Promise<Candle[]> {
    const raw = await requestJson<unknown>(this.url("time_series", { symbol, interval: intervals[timeframe], outputsize: String(Math.min(5000, Math.max(1, outputSize))), adjust: "all", format: "JSON" }), { fetchFn: this.fetchFn });
    return seriesSchema.parse(raw).values.map((item, index) => ({ time: normalizeTime(item.datetime), open: finite(item.open), high: finite(item.high), low: finite(item.low), close: finite(item.close), volume: finite(item.volume), closed: index > 0 })).reverse();
  }

  private url(path: string, params: Record<string, string>): string {
    return `https://api.twelvedata.com/${path}?${new URLSearchParams({ ...params, apikey: this.apiKey })}`;
  }
}

function finite(value: string): number { const parsed = Number(value); if (!Number.isFinite(parsed)) throw new Error("Provider returned a non-finite number"); return parsed; }
function normalizeTime(value: string): string { const iso = value.includes("T") ? value : value.length === 10 ? `${value}T00:00:00Z` : `${value.replace(" ", "T")}Z`; return new Date(iso).toISOString(); }
