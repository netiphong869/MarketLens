import type { Candle, CompanyProfile, FinancialMetrics, MarketEvent, Quote, Timeframe } from "@/types/market";

export type ProviderFetch = typeof fetch;
export interface MarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<Quote>;
  getCandles(symbol: string, timeframe: Timeframe, outputSize?: number): Promise<Candle[]>;
}
export interface CompanyDataProvider {
  readonly name: string;
  getProfile(symbol: string): Promise<CompanyProfile>;
  getFundamentals(symbol: string): Promise<FinancialMetrics | null>;
}
export interface NewsDataProvider {
  readonly name: string;
  getEvents(symbol: string, from: string, to: string): Promise<MarketEvent[]>;
}
