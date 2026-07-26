import { describe, expect, it } from "vitest";

import {
  createTemplateSummary,
  validateSummaryNumbers,
} from "@/engine/summary/template-summary";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("deterministic summary", () => {
  it("builds a complete Thai summary from structured evidence", () => {
    const input = createMockAnalysisResponse("FN");

    const summary = createTemplateSummary(input);

    expect(summary.overview).toContain("FN");
    expect(summary.overview).toContain("3.89%");
    expect(summary.horizons.short).toMatchObject({
      label: "ระยะสั้น",
      status: "neutral",
      score: 59,
      missing: [],
    });
    expect(summary.horizons.medium).toMatchObject({
      label: "ระยะกลาง",
      status: "neutral",
      score: 65,
      missing: [],
    });
    expect(summary.horizons.long).toMatchObject({
      label: "ระยะยาว",
      status: "positive",
      score: 70,
      missing: [],
    });
    expect(summary.strengths).toEqual(
      expect.arrayContaining([
        "รายได้เติบโต 14.2% เมื่อเทียบกับปีก่อน",
        "EPS เติบโต 18.6% เมื่อเทียบกับปีก่อน",
        "กระแสเงินสดอิสระเป็นบวก 8.6% ของรายได้",
      ]),
    );
    expect(summary.watchItems.length).toBeGreaterThanOrEqual(3);
    expect(summary.watchItems.length).toBeLessThanOrEqual(5);
    expect(summary.watchItems.join(" ")).toContain("455.00–460.00");
    expect(summary.watchItems.join(" ")).toContain("478.00–482.00");
    expect(summary.watchItems.join(" ")).toContain("EMA20");
    expect(summary.scenarios).toHaveLength(3);
    expect(summary.scenarios[0].description).toContain("482.00");
    expect(summary.scenarios[0].description).toContain("Volume");
    expect(summary.disclaimer).toContain("ไม่ใช่คำแนะนำ");
    expect(validateSummaryNumbers(summary, input)).toBe(true);
  });

  it("marks every horizon insufficient when Market/Sector coverage is missing", () => {
    const input = createMockAnalysisResponse("FN");
    input.scores.coverage.market = {
      percent: 0,
      status: "insufficient",
      missing: ["benchmark", "sector"],
    };

    const summary = createTemplateSummary(input);

    expect(summary.horizons.short.score).toBeNull();
    expect(summary.horizons.medium.score).toBeNull();
    expect(summary.horizons.long.score).toBeNull();
    expect(summary.horizons.short.status).toBe("insufficient");
    expect(summary.horizons.short.missing).toContain(
      "ข้อมูล Market/Sector ไม่เพียงพอ",
    );
    expect(summary.weaknesses).toContain(
      "Market Coverage 0% ไม่เพียงพอสำหรับสรุปตามระยะ",
    );
  });

  it("names missing valuation and debt data and suppresses medium/long scores", () => {
    const input = createMockAnalysisResponse("FN");
    input.scores.coverage.fundamental = {
      percent: 35,
      status: "insufficient",
      missing: ["valuation", "debt"],
    };
    input.fundamentals = {
      ...input.fundamentals!,
      pe: null,
      evToSales: null,
      evToEbitda: null,
      priceToFreeCashFlow: null,
      netDebtToEbitda: null,
      interestCoverage: null,
    };
    input.scores.horizons.medium = {
      score: 82,
      status: "available",
      missingModules: [],
    };
    input.scores.horizons.long = {
      score: 91,
      status: "available",
      missingModules: [],
    };

    const summary = createTemplateSummary(input);

    expect(summary.horizons.medium).toMatchObject({
      status: "insufficient",
      score: null,
    });
    expect(summary.horizons.long).toMatchObject({
      status: "insufficient",
      score: null,
    });
    expect(summary.horizons.long.missing).toContain("ข้อมูลพื้นฐานไม่เพียงพอ");
    expect(summary.weaknesses).toEqual(
      expect.arrayContaining([
        "Fundamental Coverage 35% ไม่เพียงพอสำหรับระยะกลางและยาว",
        "ไม่มีข้อมูล Valuation",
        "ข้อมูลหนี้ไม่ครบ",
      ]),
    );
  });

  it("does not invent price levels when support and resistance are absent", () => {
    const input = createMockAnalysisResponse("FN");
    input.supports = [];
    input.resistances = [];

    const summary = createTemplateSummary(input);
    const scenarioText = summary.scenarios
      .map((scenario) => scenario.description)
      .join(" ");

    expect(scenarioText).not.toContain("455");
    expect(scenarioText).not.toContain("478");
    expect(scenarioText).toContain("EMA20");
    expect(scenarioText).toContain("Volume");
  });

  it("rejects numbers that do not exist in structured data", () => {
    const input = createMockAnalysisResponse("FN");
    const valid = createTemplateSummary(input);

    expect(validateSummaryNumbers(valid, input)).toBe(true);
    expect(
      validateSummaryNumbers(
        {
          ...valid,
          overview: `${valid.overview} ราคาเป้าหมาย 9999.99`,
        },
        input,
      ),
    ).toBe(false);
  });

  it("reports normalized risk out of 100 instead of data coverage weight", () => {
    const input = createMockAnalysisResponse("FN");
    input.scores.risk.availableWeight = 70;

    const summary = createTemplateSummary(input);

    expect(summary.overview).toContain("Risk Score อยู่ที่ 44 จาก 100");
    expect(summary.risks).toContain("Risk Score 44 จาก 100 อยู่ในระดับปานกลาง");
    expect(summary.overview).not.toContain("44 จาก 70");
  });
});
