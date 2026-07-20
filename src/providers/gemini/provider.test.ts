import { describe, expect, it, vi } from "vitest";

import { GeminiProvider } from "@/providers/gemini/provider";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("GeminiProvider", () => {
  it("falls back when Gemini invents a number", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ overview: "ราคา 9999.99", strengths: [], weaknesses: [], watchItems: [], scenarios: [], limitations: [], disclaimer: "x" }) }] } }] }), { status: 200 }));
    const result = await new GeminiProvider("secret", fetchFn).summarize(createMockAnalysisResponse("FN"));
    expect(result.source).toBe("template");
    expect(result.summary.overview).not.toContain("9999.99");
  });
});
