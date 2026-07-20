import { z } from "zod";

import { requestJson } from "@/lib/api/http";
import { createTemplateSummary, validateSummaryNumbers } from "@/engine/summary/template-summary";
import type { ProviderFetch } from "@/providers/contracts";
import type { AnalysisResponse, AnalysisSummary } from "@/types/analysis";

const summarySchema = z.object({
  overview: z.string(), strengths: z.array(z.string()), weaknesses: z.array(z.string()), watchItems: z.array(z.string()),
  scenarios: z.array(z.object({ kind: z.enum(["good", "neutral", "bad"]), title: z.string(), description: z.string() })),
  limitations: z.array(z.string()), disclaimer: z.string(),
});
const responseSchema = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string() })) }) })).min(1) });

export class GeminiProvider {
  constructor(private readonly apiKey: string, private readonly fetchFn: ProviderFetch = fetch) {}

  async summarize(input: AnalysisResponse): Promise<{ summary: AnalysisSummary; source: "gemini" | "template" }> {
    const fallback = createTemplateSummary(input);
    try {
      const response = responseSchema.parse(await requestJson<unknown>(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        { method: "POST", fetchFn: this.fetchFn, timeoutMs: 12_000, headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt(input) }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) },
      ));
      const parsed = summarySchema.parse(JSON.parse(response.candidates[0].content.parts[0].text));
      if (!validateSummaryNumbers(parsed, input)) return { summary: fallback, source: "template" };
      return { summary: parsed, source: "gemini" };
    } catch { return { summary: fallback, source: "template" }; }
  }
}

function prompt(input: AnalysisResponse): string {
  const safeInput = { symbol: input.symbol, generatedAt: input.generatedAt, quote: input.quote, scores: input.scores, supports: input.supports, resistances: input.resistances, events: input.events.map(({ title, category, direction, severity, authority, occurredAt }) => ({ title, category, direction, severity, authority, occurredAt })) };
  return `คุณเป็นผู้เรียบเรียงรายงาน MarketLens ภาษาไทย ห้ามคำนวณหรือเพิ่มตัวเลขใหม่ ใช้เฉพาะ JSON นี้ และตอบ JSON ตามฟิลด์ overview,strengths,weaknesses,watchItems,scenarios,limitations,disclaimer เท่านั้น:\n${JSON.stringify(safeInput)}`;
}
