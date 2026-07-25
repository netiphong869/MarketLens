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
  score: number | null;
  availableWeight: number;
  reasons: ScoreReason[];
  warnings: string[];
  components: Record<string, number | null>;
}

export interface QualityResult extends ScoreBreakdown {
  score: number;
  stopped: boolean;
  missing: string[];
  conflicts: string[];
}

export interface RiskResult extends ScoreBreakdown {
  score: number;
  penalty: 0 | 3 | 8 | 15 | 25;
}

export type CoverageStatus = "complete" | "partial" | "insufficient";
export type HorizonStatus = "available" | "partial" | "insufficient";

export interface ModuleCoverage {
  percent: number;
  status: CoverageStatus;
  missing: string[];
}

export interface AnalysisCoverage {
  technical: ModuleCoverage;
  fundamental: ModuleCoverage;
  market: ModuleCoverage;
  news: ModuleCoverage;
}

export interface HorizonAssessment {
  score: number | null;
  status: HorizonStatus;
  missingModules: Array<keyof AnalysisCoverage>;
}

export interface HorizonScores {
  short: HorizonAssessment;
  medium: HorizonAssessment;
  long: HorizonAssessment;
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

export interface ProviderIssue {
  provider: "SEC EDGAR" | "Finnhub" | "Gemini" | "Stooq";
  code:
    | "AUTH_ERROR"
    | "RATE_LIMITED"
    | "TIMEOUT"
    | "UNAVAILABLE"
    | "MODEL_DISCOVERY_FAILED"
    | "MODEL_GENERATION_FAILED"
    | "INVALID_OUTPUT";
  httpStatus: number | null;
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
    coverage: AnalysisCoverage;
    horizons: HorizonScores;
  };
  supports: PriceZone[];
  resistances: PriceZone[];
  summary: AnalysisSummary;
  summarySource: "gemini" | "template";
  summaryModel?: string | null;
  providerIssues: ProviderIssue[];
  confidenceMessage: string;
}
