import type { AnalysisResponse, AnalysisSummary, ScoreLevel } from "@/types/analysis";

export function createTemplateSummary(input: AnalysisResponse): AnalysisSummary {
  const horizons = input.scores.horizons;
  const fundamental = input.scores.fundamental;
  const overview =
    horizons.short.score !== null
      ? `${input.symbol} มีภาพรวมระยะสั้น${thaiLevel(level(horizons.short.score))} ขณะที่พื้นฐาน${fundamental?.score !== null && fundamental?.score !== undefined ? thaiLevel(level(fundamental.score)) : "ยังมีข้อมูลไม่เพียงพอ"} และต้องพิจารณาความเสี่ยงร่วมกัน`
      : `${input.symbol} มีข้อมูลสำหรับวิเคราะห์เพียงบางส่วน จึงแสดง Coverage และสถานะ ${horizons.short.status} แทนคะแนนปลายทาง`;
  const strengths = [...input.scores.technical.reasons, ...(fundamental?.reasons ?? []), ...input.scores.events.reasons]
    .filter((reason) => reason.impact > 0).slice(0, 4).map((reason) => reason.label);
  const weaknesses = [...input.scores.technical.reasons, ...(fundamental?.reasons ?? []), ...input.scores.risk.reasons]
    .filter((reason) => reason.impact < 0 || reason.code.includes("RISK")).slice(0, 4).map((reason) => reason.label);
  return {
    overview,
    strengths: strengths.length ? strengths : ["ยังไม่มีปัจจัยบวกที่ยืนยันได้จากข้อมูลชุดนี้"],
    weaknesses: weaknesses.length ? weaknesses : ["ควรติดตามความเสี่ยงและความสดใหม่ของข้อมูล"],
    watchItems: ["รอแท่งเทียนปิดเพื่อยืนยันสัญญาณ", "ตรวจวันประกาศงบและเหตุการณ์สำคัญก่อนตัดสินใจ"],
    scenarios: [
      { kind: "good", title: "กรณีดี", description: "ราคาผ่านแนวต้านพร้อมปริมาณซื้อขายสนับสนุน" },
      { kind: "neutral", title: "กรณีกลาง", description: "ราคาแกว่งตัวระหว่างแนวรับและแนวต้านโดยยังไม่เลือกทิศทาง" },
      { kind: "bad", title: "กรณีแย่", description: "ราคาหลุดแนวรับสำคัญและโครงสร้างทางเทคนิคอ่อนลง" },
    ],
    limitations: [...input.scores.quality.missing, ...input.scores.quality.warnings, input.confidenceMessage].filter(Boolean),
    disclaimer: "ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำหรือคำสั่งซื้อขายหลักทรัพย์",
  };
}

export function validateSummaryNumbers(summary: AnalysisSummary, input: AnalysisResponse): boolean {
  const allowed = new Set(collectNumbers(input).map(normalizeNumber));
  const text = JSON.stringify(summary);
  const reported = text.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return reported.every((value) => allowed.has(normalizeNumber(Number(value))));
}

function collectNumbers(value: unknown): number[] {
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(collectNumbers);
  return [];
}
function normalizeNumber(value: number): string { return Number(value.toFixed(6)).toString(); }
function level(score: number): ScoreLevel { return score >= 85 ? "very_strong" : score >= 70 ? "strong" : score >= 55 ? "moderately_positive" : score >= 45 ? "neutral" : score >= 30 ? "weak" : "very_weak"; }
function thaiLevel(value: ScoreLevel): string { return { very_strong: "แข็งแรงมาก", strong: "แข็งแรง", moderately_positive: "เป็นกลางค่อนไปทางบวก", neutral: "เป็นกลาง", weak: "อ่อนแอ", very_weak: "อ่อนแอมาก" }[value]; }
