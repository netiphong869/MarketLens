import { describe, expect, it } from "vitest";

import { createTemplateSummary, validateSummaryNumbers } from "@/engine/summary/template-summary";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("safe summary", () => {
  it("creates a Thai fallback from calculated data", () => {
    const input = createMockAnalysisResponse("FN");
    const summary = createTemplateSummary(input);
    expect(summary.overview).toContain("FN");
    expect(summary.scenarios).toHaveLength(3);
    expect(summary.disclaimer).toContain("ไม่ใช่คำแนะนำ");
  });

  it("rejects numbers invented by an AI response", () => {
    const input = createMockAnalysisResponse("FN");
    const valid = createTemplateSummary(input);
    expect(validateSummaryNumbers(valid, input)).toBe(true);
    expect(validateSummaryNumbers({ ...valid, overview: `${valid.overview} ราคาเป้าหมาย 9999.99` }, input)).toBe(false);
  });
});
