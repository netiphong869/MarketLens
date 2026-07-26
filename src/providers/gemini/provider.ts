import { z } from "zod";

import { createTemplateSummary } from "@/engine/summary/template-summary";
import { requestJson } from "@/lib/api/http";
import { AppError } from "@/lib/errors/app-error";
import type { ProviderFetch } from "@/providers/contracts";
import type { AnalysisResponse, AnalysisSummary } from "@/types/analysis";

const verdictSchema = z
  .object({
    verdict: z.string().min(1),
  })
  .strict();

const responseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string() })),
        }),
      }),
    )
    .min(1),
});

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

  constructor(
    private readonly apiKey: string,
    private readonly fetchFn: ProviderFetch = fetch,
  ) {}

  async summarize(input: AnalysisResponse): Promise<{
    summary: AnalysisSummary;
    source: "gemini" | "template";
    model: string | null;
    failureCode?:
      | "MODEL_DISCOVERY_FAILED"
      | "MODEL_GENERATION_FAILED"
      | "INVALID_OUTPUT"
      | "TIMEOUT";
    httpStatus: number | null;
  }> {
    const fallback = createTemplateSummary(input);
    let model: string | null;
    try {
      model = await this.discoverModel();
    } catch {
      return {
        summary: fallback,
        source: "template",
        model: null,
        failureCode: "MODEL_DISCOVERY_FAILED",
        httpStatus: null,
      };
    }
    if (!model) {
      return {
        summary: fallback,
        source: "template",
        model: null,
        failureCode: "MODEL_DISCOVERY_FAILED",
        httpStatus: null,
      };
    }

    let rawResponse: unknown;
    try {
      rawResponse = await requestJson<unknown>(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent`,
        {
          method: "POST",
          fetchFn: this.fetchFn,
          retries: 0,
          timeoutMs: 25_000,
          headers: this.headers({ "content-type": "application/json" }),
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt(input, fallback) }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        },
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
      const parsed = verdictSchema.parse(
        JSON.parse(response.candidates[0].content.parts[0].text),
      );
      if (
        !hasTwoOrThreeSentences(parsed.verdict) ||
        !validateVerdictNumbers(parsed.verdict, fallback.overview) ||
        !validateVerdictMeaning(parsed.verdict, input)
      ) {
        return invalidOutput(fallback, model);
      }
      return {
        summary: { ...fallback, overview: parsed.verdict },
        source: "gemini",
        model,
        httpStatus: 200,
      };
    } catch {
      return invalidOutput(fallback, model);
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

function prompt(input: AnalysisResponse, fallback: AnalysisSummary): string {
  const daily = input.technicalSnapshot["1d"];
  const safeInput = {
    deterministicVerdict: fallback.overview,
    facts: {
      symbol: input.symbol,
      priceChangePercent: input.quote.changePercent,
      latestClose: daily.latestClose,
      ema20: daily.ema20,
      ema50: daily.ema50,
      revenueGrowthYoY: input.fundamentals?.revenueGrowthYoY ?? null,
      epsGrowthYoY: input.fundamentals?.epsGrowthYoY ?? null,
      riskScore: input.scores.risk.score,
      coverage: input.scores.coverage,
    },
  };
  return [
    "คุณเป็นผู้เรียบเรียง Verdict ภาษาไทยของ MarketLens",
    "เรียบเรียง deterministicVerdict ใหม่ให้มี 2–3 ประโยคโดยคงความหมายเดิมทุกประการ",
    "ห้ามเพิ่ม ลบ เปลี่ยน หรือปัดตัวเลข ห้ามเปลี่ยนทิศทางราคา สถานะ ความเสี่ยง หรือข้อจำกัด",
    "ห้ามสร้างคะแนน แนวรับ แนวต้าน หรือข้อเท็จจริงที่ไม่มีใน JSON",
    "ตอบ JSON ที่มี field verdict เท่านั้น",
    JSON.stringify(safeInput),
  ].join("\n");
}

function hasTwoOrThreeSentences(verdict: string): boolean {
  const sentences = verdict
    .split(/(?<!\p{N})[.!?。！？]+|[.!?。！？]+(?!\p{N})/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  return sentences.length >= 2 && sentences.length <= 3;
}

function validateVerdictNumbers(
  verdict: string,
  deterministicVerdict: string,
): boolean {
  const expected = extractNumericTokens(deterministicVerdict);
  const reported = extractNumericTokens(verdict);
  if (
    [...reported, ...expected].some(
      (token) => !/^-?\d+(?:[.,]\d+)?$/u.test(token),
    )
  ) {
    return false;
  }
  const expectedSet = new Set(expected.map(normalizeNumericText));
  const reportedSet = new Set(reported.map(normalizeNumericText));
  return (
    expectedSet.size === reportedSet.size &&
    [...expectedSet].every((token) => reportedSet.has(token))
  );
}

function validateVerdictMeaning(
  verdict: string,
  input: AnalysisResponse,
): boolean {
  const anchors = [
    input.symbol,
    input.quote.changePercent >= 0 ? "ปรับขึ้น" : "ปรับลง",
  ];
  const daily = input.technicalSnapshot["1d"];
  if (
    daily.latestClose !== null &&
    daily.ema20 !== null &&
    daily.ema50 !== null
  ) {
    if (daily.latestClose > daily.ema20 && daily.ema20 > daily.ema50) {
      anchors.push("เหนือ EMA20");
    } else if (daily.latestClose < daily.ema20 && daily.ema20 < daily.ema50) {
      anchors.push("ต่ำกว่า EMA20");
    } else {
      anchors.push("สัญญาณผสม");
    }
  }
  if (
    input.fundamentals?.revenueGrowthYoY !== null &&
    input.fundamentals?.revenueGrowthYoY !== undefined
  ) {
    anchors.push("รายได้");
  }
  if (
    input.fundamentals?.epsGrowthYoY !== null &&
    input.fundamentals?.epsGrowthYoY !== undefined
  ) {
    anchors.push("EPS");
  }
  if (input.scores.coverage.market.percent < 50) anchors.push("Market/Sector");
  if (input.scores.coverage.fundamental.percent < 60)
    anchors.push("Fundamental Coverage");
  if (input.scores.coverage.news.percent < 40) anchors.push("ข่าว");

  return anchors.every((anchor) => verdict.includes(anchor));
}

function extractNumericTokens(value: string): string[] {
  return value.match(/-?[\p{N}]+(?:[.,][\p{N}]+)?/gu) ?? [];
}

function normalizeNumericText(value: string): string {
  return value.replace(",", ".");
}

function invalidOutput(
  fallback: AnalysisSummary,
  model: string,
): {
  summary: AnalysisSummary;
  source: "template";
  model: string;
  failureCode: "INVALID_OUTPUT";
  httpStatus: 200;
} {
  return {
    summary: fallback,
    source: "template",
    model,
    failureCode: "INVALID_OUTPUT",
    httpStatus: 200,
  };
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

function compareModels(
  left: { name: string },
  right: { name: string },
): number {
  const unstable = /preview|experimental|exp|latest/i;
  const leftRank = unstable.test(left.name) ? 1 : 0;
  const rightRank = unstable.test(right.name) ? 1 : 0;
  return leftRank - rightRank || right.name.localeCompare(left.name);
}
