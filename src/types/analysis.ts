import type {
  Candle,
  CompanyProfile,
  FinancialMetrics,
  MarketEvent,
  Quote,
  Timeframe,
} from "@/types/market";

export type ScoreLevel =
  | "very_strong"
  | "strong"
  | "moderately_positive"
  | "neutral"
  | "weak"
  | "very_weak";

export interface ScoreReason {
  code: string;
  label: string;
  impact: number;
  evidence?: string;
}

export interface ScoreBreakdown {
  score: number;
  availableWeight: number;
  reasons: ScoreReason[];
  warnings: string[];
  components: Record<string, number | null>;
}

export interface QualityResult extends ScoreBreakdown {
  stopped: boolean;
  missing: string[];
  conflicts: string[];
}

export interface RiskResult extends ScoreBreakdown {
  penalty: 0 | 3 | 8 | 15 | 25;
}

export interface HorizonScores {
  short: number;
  medium: number;
  long: number;
}

export interface PriceZone {
  low: number;
  high: number;
  strength: number;
  timeframe: Timeframe;
  kind: "support" | "resistance";
}

export interface AnalysisScenario {
  kind: "good" | "neutral" | "bad";
  title: string;
  description: string;
  trigger?: PriceZone;
  target?: PriceZone;
}

export interface AnalysisSummary {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  watchItems: string[];
  scenarios: AnalysisScenario[];
  limitations: string[];
  disclaimer: string;
}

export interface AnalysisResponse {
  symbol: string;
  mode: "mock" | "live" | "partial";
  generatedAt: string;
  quote: Quote;
  profile: CompanyProfile;
  candles: Record<Timeframe, Candle[]>;
  fundamentals: FinancialMetrics | null;
  events: MarketEvent[];
  scores: {
    technical: ScoreBreakdown;
    market: ScoreBreakdown;
    fundamental: ScoreBreakdown | null;
    events: ScoreBreakdown;
    risk: RiskResult;
    quality: QualityResult;
    horizons: HorizonScores | null;
  };
  supports: PriceZone[];
  resistances: PriceZone[];
  summary: AnalysisSummary;
  summarySource: "gemini" | "template";
  confidenceMessage: string;
}
