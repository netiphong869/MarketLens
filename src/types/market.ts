export type Timeframe = "15m" | "1h" | "4h" | "1d";

export type DataMode = "mock" | "realtime" | "delayed" | "backup";

export type SecurityType =
  | "common_stock"
  | "bank"
  | "insurance"
  | "reit"
  | "etf"
  | "biotech_pre_revenue"
  | "commodity"
  | "unknown";

export interface DataProvenance {
  provider: string;
  mode: DataMode;
  asOf: string;
  sourceUrl?: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closed: boolean;
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  session: "pre" | "regular" | "post" | "closed";
  provenance: DataProvenance;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string | null;
  industry: string | null;
  securityType: SecurityType;
  marketCap: number | null;
  description: string | null;
  provenance: DataProvenance;
}

export interface FinancialMetrics {
  revenueGrowthYoY: number | null;
  revenueGrowthThreeYear: number | null;
  epsGrowthYoY: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  freeCashFlowMargin: number | null;
  netDebtToEbitda: number | null;
  interestCoverage: number | null;
  roic: number | null;
  estimatedWacc: number | null;
  pe: number | null;
  evToSales: number | null;
  evToEbitda: number | null;
  priceToFreeCashFlow: number | null;
  sharesGrowthYoY: number | null;
  earningsBeatsLastFour: number | null;
  guidance: "raised" | "maintained" | "lowered" | "unknown";
  provenance: DataProvenance;
}

export interface MarketEvent {
  id: string;
  occurredAt: string;
  title: string;
  category:
    | "earnings"
    | "guidance"
    | "filing"
    | "offering"
    | "merger"
    | "lawsuit"
    | "regulation"
    | "product"
    | "customer"
    | "management";
  direction: "positive" | "neutral" | "negative";
  severity: 1 | 2 | 3 | 4 | 5;
  authority: "official" | "major_news" | "analyst" | "unverified";
  provenance: DataProvenance;
}

export interface MarketContext {
  benchmarkSymbol: string;
  sectorSymbol: string | null;
  stockReturns: Record<"1d" | "5d" | "20d" | "60d", number | null>;
  benchmarkReturns: Record<"1d" | "5d" | "20d" | "60d", number | null>;
  sectorReturns: Record<"1d" | "5d" | "20d" | "60d", number | null>;
  benchmarkTrend: "up" | "sideways" | "down" | "unknown";
  sectorTrend: "up" | "sideways" | "down" | "unknown";
  volatilityPercentile: number | null;
  provenance: DataProvenance;
}
