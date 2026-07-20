import type { AnalysisResponse } from "@/types/analysis";
import type { Candle, Timeframe } from "@/types/market";

const provenance = {
  provider: "MarketLens Mock",
  mode: "mock" as const,
  asOf: "2026-07-18T10:00:00.000Z",
};

function candles(timeframe: Timeframe): Candle[] {
  return Array.from({ length: 40 }, (_, index) => {
    const close = 440 + index * 0.55 + Math.sin(index / 3) * 2;
    return {
      time: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
      open: close - 1,
      high: close + 2,
      low: close - 2.5,
      close,
      volume: 700_000 + index * 12_000,
      closed: timeframe === "1d" || index < 39,
    };
  });
}

export function makeAnalysisResponse(
  overrides: Partial<AnalysisResponse> = {},
): AnalysisResponse {
  const response: AnalysisResponse = {
    symbol: "FN",
    mode: "mock",
    generatedAt: "2026-07-18T10:00:00.000Z",
    quote: {
      symbol: "FN",
      price: 461.96,
      change: 17.3,
      changePercent: 3.89,
      currency: "USD",
      session: "closed",
      provenance,
    },
    profile: {
      symbol: "FN",
      name: "Fabrinet",
      exchange: "NYSE",
      country: "US",
      sector: "Technology",
      industry: "Electronic Components",
      securityType: "common_stock",
      marketCap: 16_500_000_000,
      description: "ผู้ให้บริการด้านการผลิตอุปกรณ์อิเล็กทรอนิกส์และโฟโตนิกส์",
      provenance,
    },
    candles: {
      "15m": candles("15m"),
      "1h": candles("1h"),
      "4h": candles("4h"),
      "1d": candles("1d"),
    },
    fundamentals: {
      revenueGrowthYoY: 14.2,
      revenueGrowthThreeYear: 11.8,
      epsGrowthYoY: 18.6,
      grossMargin: 12.5,
      operatingMargin: 10.4,
      netMargin: 9.1,
      freeCashFlowMargin: 8.6,
      netDebtToEbitda: -0.4,
      interestCoverage: 18.2,
      roic: 17.5,
      estimatedWacc: 9.2,
      pe: 28.4,
      evToSales: 3.1,
      evToEbitda: 22.8,
      priceToFreeCashFlow: 31.2,
      sharesGrowthYoY: -0.3,
      earningsBeatsLastFour: 3,
      guidance: "maintained",
      provenance,
    },
    events: [
      {
        id: "mock-earnings",
        occurredAt: "2026-07-16T12:00:00.000Z",
        title: "ผลประกอบการล่าสุดสูงกว่าคาดการณ์",
        category: "earnings",
        direction: "positive",
        severity: 3,
        authority: "official",
        provenance,
      },
    ],
    scores: {
      technical: {
        score: 58,
        availableWeight: 100,
        reasons: [{ code: "TREND_RECOVERY", label: "โมเมนตัมเริ่มฟื้น", impact: 8 }],
        warnings: ["แนวโน้มหลักยังไม่ยืนยัน"],
        components: { trend: 15, momentum: 12 },
      },
      market: {
        score: 62,
        availableWeight: 100,
        reasons: [{ code: "OUTPERFORM_20D", label: "แข็งกว่าตลาดในรอบ 20 วัน", impact: 8 }],
        warnings: [],
        components: { relativeStrength: 38 },
      },
      fundamental: {
        score: 78,
        availableWeight: 92,
        reasons: [{ code: "REVENUE_GROWTH", label: "รายได้เติบโตมากกว่า 10%", impact: 8 }],
        warnings: ["Gross margin ต่ำกว่ากลุ่มซอฟต์แวร์และต้องเทียบกับผู้ผลิตฮาร์ดแวร์"],
        components: { growth: 21, profitability: 15 },
      },
      events: {
        score: 56,
        availableWeight: 100,
        reasons: [{ code: "EARNINGS_BEAT", label: "ผลประกอบการดีกว่าคาด", impact: 6 }],
        warnings: [],
        components: { officialEvents: 56 },
      },
      risk: {
        score: 44,
        availableWeight: 100,
        penalty: 3,
        reasons: [{ code: "VOLATILITY_NORMAL", label: "ความผันผวนอยู่ในช่วงปกติ", impact: 6 }],
        warnings: ["คะแนนสูงหมายถึงเสี่ยงสูง"],
        components: { volatility: 6, event: 5 },
      },
      quality: {
        score: 92,
        availableWeight: 100,
        stopped: false,
        missing: [],
        conflicts: [],
        reasons: [{ code: "MOCK_COMPLETE", label: "ชุดข้อมูลจำลองครบสำหรับทดสอบ", impact: 92 }],
        warnings: ["ข้อมูลนี้เป็นข้อมูลจำลอง ไม่ใช่ข้อมูลตลาดจริง"],
        components: { freshness: 20, candles: 20 },
      },
      horizons: { short: 59, medium: 65, long: 70 },
    },
    supports: [
      { low: 455, high: 460, strength: 76, timeframe: "1d", kind: "support" },
    ],
    resistances: [
      { low: 478, high: 482, strength: 73, timeframe: "1d", kind: "resistance" },
    ],
    summary: {
      overview: "พื้นฐานค่อนข้างดี แต่กราฟยังต้องรอการยืนยัน",
      strengths: ["รายได้และ EPS เติบโต", "ROIC สูงกว่าต้นทุนเงินทุน"],
      weaknesses: ["ราคายังไม่ผ่านแนวต้านสำคัญ"],
      watchItems: ["ติดตามแรงซื้อบริเวณ 455–460"],
      scenarios: [
        { kind: "good", title: "กรณีดี", description: "ผ่านแนวต้านพร้อมปริมาณซื้อขาย" },
        { kind: "neutral", title: "กรณีกลาง", description: "แกว่งตัวในกรอบเดิม" },
        { kind: "bad", title: "กรณีแย่", description: "หลุดแนวรับหลัก" },
      ],
      limitations: ["ชุดข้อมูลนี้เป็นข้อมูลจำลอง"],
      disclaimer: "ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน",
    },
    summarySource: "template",
    confidenceMessage: "ยังไม่มีข้อมูล Backtest และ Paper Trade เพียงพอ",
  };

  return { ...response, ...overrides };
}
