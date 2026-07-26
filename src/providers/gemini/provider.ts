import { z } from "zod";

import { requestJson } from "@/lib/api/http";
import { AppError } from "@/lib/errors/app-error";
import { createTemplateSummary } from "@/engine/summary/template-summary";
import type { ProviderFetch } from "@/providers/contracts";
import type { AnalysisResponse, AnalysisSummary } from "@/types/analysis";

const summarySchema = z.object({
  overview: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()), watchItems: z.array(z.string()),
  scenarios: z.array(z.object({ kind: z.enum(["good", "neutral", "bad"]), title: z.string(), description: z.string() })),
  limitations: z.array(z.string()), disclaimer: z.string(),
});
const responseSchema = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) })).min(1) });
const modelsSchema = z.object({
  models: z.array(
    z.object({
      name: z.string().startsWith("models/"),
      supportedGenerationMethods: z.array(z.string()).default([]),
    }),
  ),
});

export class GeminiProvider {
  private discoveredModel: string | null | undefined;

  constructor(private readonly apiKey: string, private readonly fetchFn: ProviderFetch = fetch) {}

  async summarize(input: AnalysisResponse): Promise<{
    summary: AnalysisSummary;
    source: "gemini" | "template";
    model: string | null;
    failureCode?: "MODEL_DISCOVERY_FAILED" | "MODEL_GENERATION_FAILED" | "INVALID_OUTPUT" | "TIMEOUT";
    httpStatus: number | null;
  }> {
    const fallback = createTemplateSummary(input);
    let model: string | null;
    try {
      model = await this.discoverModel();
    } catch {
      return { summary: fallback, source: "template", model: null, failureCode: "MODEL_DISCOVERY_FAILED", httpStatus: null };
    }
    if (!model) {
      return { summary: fallback, source: "template", model: null, failureCode: "MODEL_DISCOVERY_FAILED", httpStatus: null };
    }
    let rawResponse: unknown;
    try {
      rawResponse = await requestJson<unknown>(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`,
        { method: "POST", fetchFn: this.fetchFn, retries: 0, timeoutMs: 25_000, headers: this.headers({ "content-type": "application/json" }), body: JSON.stringify({ contents: [{ parts: [{ text: prompt(input) }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) },
      );
    } catch (error) {
      return {
        summary: fallback,
        source: "template",
        model,
        failureCode:
          error instanceof AppError && error.code === "REQUEST_TIMEOUT"
            ? "TIMEOUT"
            : "MODEL_GENERATION_FAILED",
        httpStatus: providerHttpStatus(error),
      };
    }
    try {
      const response = responseSchema.parse(rawResponse);
      const parsed = summarySchema.parse(JSON.parse(response.candidates[0].content.parts[0].text));
      if (containsNumber(parsed)) return { summary: fallback, source: "template", model, failureCode: "INVALID_OUTPUT", httpStatus: 200 };
      return { summary: parsed, source: "gemini", model, httpStatus: 200 };
    } catch {
      return { summary: fallback, source: "template", model, failureCode: "INVALID_OUTPUT", httpStatus: 200 };
    }
  }

  private async discoverModel(): Promise<string | null> {
    if (this.discoveredModel !== undefined) return this.discoveredModel;
    const response = modelsSchema.parse(
      await requestJson<unknown>(
        "https://generativelanguage.googleapis.com/v1beta/models",
        {
          fetchFn: this.fetchFn,
          timeoutMs: 8_000,
          headers: this.headers(),
        },
      ),
    );
    const candidates = response.models
      .filter(
        (model) =>
          model.supportedGenerationMethods.includes("generateContent") &&
          /flash/i.test(model.name),
      )
      .sort(compareModels);
    this.discoveredModel = candidates[0]?.name ?? null;
    return this.discoveredModel;
  }

  private headers(extra: HeadersInit = {}): Headers {
    const headers = new Headers(extra);
    headers.set("x-goog-api-key", this.apiKey);
    headers.set("Accept", "application/json");
    return headers;
  }
}

function providerHttpStatus(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "providerStatus" in error.cause &&
    typeof error.cause.providerStatus === "number"
  ) {
    return error.cause.providerStatus;
  }
  if (error instanceof AppError) return error.status;
  return null;
}

function compareModels(left: { name: string }, right: { name: string }): number {
  const unstable = /preview|experimental|exp|latest/i;
  const leftRank = unstable.test(left.name) ? 1 : 0;
  const rightRank = unstable.test(right.name) ? 1 : 0;
  return leftRank - rightRank || right.name.localeCompare(left.name);
}

function prompt(input: AnalysisResponse): string {
  const reasons = [
    ...input.scores.technical.reasons,
    ...(input.scores.fundamental?.reasons ?? []),
    ...input.scores.market.reasons,
    ...input.scores.events.reasons,
  ];
  const safeInput = {
    symbol: withoutNumbers(input.symbol),
    horizonStatus: {
      short: input.scores.horizons.short.status,
      medium: input.scores.horizons.medium.status,
      long: input.scores.horizons.long.status,
    },
    coverageStatus: {
      technical: input.scores.coverage.technical.status,
      fundamental: input.scores.coverage.fundamental.status,
      market: input.scores.coverage.market.status,
      news: input.scores.coverage.news.status,
    },
    strengths: reasons
      .filter((reason) => reason.impact > 0)
      .map((reason) => withoutNumbers(reason.label))
      .filter(Boolean),
    weaknesses: [
      ...reasons
        .filter((reason) => reason.impact < 0)
        .map((reason) => withoutNumbers(reason.label)),
      ...input.scores.risk.reasons.map((reason) => withoutNumbers(reason.label)),
    ].filter(Boolean),
    limitations: [
      ...input.scores.quality.missing,
      ...input.scores.quality.warnings,
      ...input.providerIssues.map((issue) => `${issue.provider} ${issue.code}`),
    ].map(withoutNumbers).filter(Boolean),
  };
  return `คุณเป็นผู้เรียบเรียงรายงาน MarketLens ภาษาไทย ใช้ข้อเท็จจริงเชิงข้อความจาก JSON นี้เท่านั้น ห้ามคำนวณ ห้ามกล่าวถึงตัวเลข ราคา คะแนน เปอร์เซ็นต์ หรือระดับราคา และห้ามเปลี่ยนผลของระบบ ตอบ JSON ตามฟิลด์ overview,strengths,weaknesses,watchItems,scenarios,limitations,disclaimer เท่านั้น:\n${JSON.stringify(safeInput)}`;
}

function withoutNumbers(value: string): string {
  return value.replace(/\p{N}+(?:[.,]\p{N}+)?/gu, "").replace(/\s+/g, " ").trim();
}

function containsNumber(summary: AnalysisSummary): boolean {
  return /\p{N}/u.test(JSON.stringify(summary));
}
