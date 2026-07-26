import { z } from "zod";

import type { UsageStatus } from "@/lib/usage/daily-limit";
import type {
  AnalysisResponse,
  TechnicalSnapshotMetric,
} from "@/types/analysis";

const timeframeSchema = z.enum(["15m", "1h", "4h", "1d"]);
const finiteNullable = z.number().finite().nullable();
const metricSchema = z.enum([
  "latestClose",
  "ema20",
  "ema50",
  "ema100",
  "ema200",
  "rsi14",
  "macdLine",
  "macdSignal",
  "macdHistogram",
  "adx14",
  "atr14",
  "currentVolume",
  "averageVolume20",
  "volumeRatio",
  "obv",
] satisfies TechnicalSnapshotMetric[]);

export const technicalSnapshotSchema = z
  .object({
    timeframe: timeframeSchema,
    latestClose: finiteNullable,
    ema20: finiteNullable,
    ema50: finiteNullable,
    ema100: finiteNullable,
    ema200: finiteNullable,
    rsi14: finiteNullable,
    macdLine: finiteNullable,
    macdSignal: finiteNullable,
    macdHistogram: finiteNullable,
    adx14: finiteNullable,
    atr14: finiteNullable,
    currentVolume: finiteNullable,
    averageVolume20: finiteNullable,
    volumeRatio: finiteNullable,
    obv: finiteNullable,
    calculatedAt: z.iso.datetime(),
    unavailable: z.partialRecord(metricSchema, z.string().min(1)),
  })
  .superRefine((snapshot, context) => {
    for (const metric of metricSchema.options) {
      if (snapshot[metric] === null && !snapshot.unavailable[metric]?.trim()) {
        context.addIssue({
          code: "custom",
          path: ["unavailable", metric],
          message: `Missing indicator ${metric} requires a specific reason`,
        });
      }
    }
  });

const snapshotsSchema = z
  .object({
    "15m": technicalSnapshotSchema,
    "1h": technicalSnapshotSchema,
    "4h": technicalSnapshotSchema,
    "1d": technicalSnapshotSchema,
  })
  .superRefine((value, context) => {
    for (const timeframe of timeframeSchema.options) {
      if (value[timeframe].timeframe !== timeframe) {
        context.addIssue({
          code: "custom",
          path: [timeframe, "timeframe"],
          message: `Snapshot timeframe must match ${timeframe}`,
        });
      }
    }
  });

const horizonStatusSchema = z.enum([
  "caution",
  "neutral",
  "positive",
  "insufficient",
]);

const horizonVerdictSchema = z
  .object({
    label: z.string().min(1),
    status: horizonStatusSchema,
    score: z.number().finite().min(0).max(100).nullable(),
    explanation: z.string().min(1),
    missing: z.array(z.string().min(1)),
  })
  .superRefine((horizon, context) => {
    if (horizon.status === "insufficient") {
      if (horizon.score !== null) {
        context.addIssue({
          code: "custom",
          path: ["score"],
          message: "Insufficient horizon must not expose a score",
        });
      }
      if (horizon.missing.length === 0) {
        context.addIssue({
          code: "custom",
          path: ["missing"],
          message: "Insufficient horizon must name missing data",
        });
      }
      return;
    }

    if (horizon.score === null) {
      context.addIssue({
        code: "custom",
        path: ["score"],
        message: "Scored horizon requires a finite score",
      });
    }
  });

const priceZoneSchema = z.object({
  low: z.number().finite(),
  high: z.number().finite(),
  strength: z.number().finite().min(0),
  timeframe: timeframeSchema,
  kind: z.enum(["support", "resistance"]),
});

const analysisScenarioSchema = z.object({
  kind: z.enum(["good", "neutral", "bad"]),
  title: z.string().min(1),
  description: z.string().min(1),
  trigger: priceZoneSchema.optional(),
  target: priceZoneSchema.optional(),
});

const analysisSummarySchema = z.object({
  overview: z.string().min(1),
  horizons: z.object({
    short: horizonVerdictSchema,
    medium: horizonVerdictSchema,
    long: horizonVerdictSchema,
  }),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  watchItems: z.array(z.string().min(1)),
  scenarios: z.array(analysisScenarioSchema).length(3),
  limitations: z.array(z.string().min(1)),
  disclaimer: z.string().min(1),
});

const analysisApiResultSchema = z
  .object({
    data: z
      .object({
        technicalSnapshot: snapshotsSchema,
        summary: analysisSummarySchema,
      })
      .passthrough(),
    cached: z.boolean(),
    usage: z.object({
      used: z.number().int().nonnegative(),
      remaining: z.number().int().nonnegative(),
      limit: z.number().int().positive(),
    }),
  })
  .passthrough();

export interface AnalysisApiResult {
  data: AnalysisResponse;
  cached: boolean;
  usage: UsageStatus;
}

export function parseAnalysisApiResult(value: unknown): AnalysisApiResult {
  return analysisApiResultSchema.parse(value) as unknown as AnalysisApiResult;
}
