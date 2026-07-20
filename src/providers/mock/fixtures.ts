import type { AnalysisResponse } from "@/types/analysis";
import type { Candle, Timeframe } from "@/types/market";

const asOf = "2026-07-18T10:00:00.000Z";
const provenance = {
  provider: "MarketLens Mock",
  mode: "mock" as const,
  asOf,
};

function generateCandles(timeframe: Timeframe): Candle[] {
  const intervalMilliseconds: Record<Timeframe, number> = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };
  const start = Date.UTC(2026, 0, 1);
  return Array.from({ length: 220 }, (_, index) => {
    const trend = 395 + index * 0.31;
    const wave = Math.sin(index / 7) * 8 + Math.cos(index / 17) * 4;
    const close = Number((trend + wave).toFixed(2));
    return {
      time: new Date(start + index * intervalMilliseconds[timeframe]).toISOString(),
      open: Number((close - Math.sin(index) * 2).toFixed(2)),
      high: Number((close + 4.2).toFixed(2)),
      low: Number((close - 4.8).toFixed(2)),
      close,
      volume: 620_000 + ((index * 47_000) % 980_000),
      closed: index < 219,
    };
  });
}

export function createMockAnalysisResponse(symbol = "FN"): AnalysisResponse {
  return {
    symbol,
    mode: "mock",
    generatedAt: asOf,
    quote: {
      symbol,
      price: 461.96,
      change: 17.3,
      changePercent: 3.89,
      currency: "USD",
      session: "closed",
      provenance,
    },
    profile: {
      symbol,
      name: symbol === "FN" ? "Fabrinet" : `${symbol} Mock Company`,
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
      "15m": generateCandles("15m"),
      "1h": generateCandles("1h"),
      "4h": generateCandles("4h"),
      "1d": generateCandles("1d"),
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
        components: { trend: 15, momentum: 12, volume: 9 },
      },
      market: {
        score: 62,
        availableWeight: 100,
        reasons: [{ code: "OUTPERFORM_20D", label: "แข็งกว่าตลาดในรอบ 20 วัน", impact: 8 }],
        warnings: [],
        components: { relativeStrength: 38, trend: 14 },
      },
      fundamental: {
        score: 78,
        availableWeight: 92,
        reasons: [
          { code: "REVENUE_GROWTH", label: "รายได้เติบโตมากกว่า 10%", impact: 8 },
          { code: "ROIC_SPREAD", label: "ROIC สูงกว่า WACC", impact: 10 },
        ],
        warnings: ["ควรเทียบ Gross margin กับผู้ผลิตฮาร์ดแวร์ในกลุ่มเดียวกัน"],
        components: { growth: 21, profitability: 15, debt: 14, valuation: 10 },
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
        reasons: [
          { code: "VOLATILITY_NORMAL", label: "ความผันผวนอยู่ในช่วงปกติ", impact: 6 },
          { code: "VALUATION_ELEVATED", label: "มูลค่าบางตัวสูงกว่าค่าเฉลี่ย", impact: 8 },
        ],
        warnings: ["คะแนนสูงหมายถึงเสี่ยงสูง"],
        components: { volatility: 6, liquidity: 2, event: 5, financial: 4, valuation: 8 },
      },
      quality: {
        score: 92,
        availableWeight: 100,
        stopped: false,
        missing: [],
        conflicts: [],
        reasons: [{ code: "MOCK_COMPLETE", label: "ชุดข้อมูลจำลองครบสำหรับทดสอบ", impact: 92 }],
        warnings: ["ข้อมูลนี้เป็นข้อมูลจำลอง ไม่ใช่ข้อมูลตลาดจริง"],
        components: { freshness: 20, candles: 20, fundamentals: 14, traceability: 5 },
      },
      horizons: { short: 59, medium: 65, long: 70 },
    },
    supports: [
      { low: 455, high: 460, strength: 76, timeframe: "1d", kind: "support" },
      { low: 438, high: 445, strength: 67, timeframe: "1d", kind: "support" },
    ],
    resistances: [
      { low: 478, high: 482, strength: 73, timeframe: "1d", kind: "resistance" },
      { low: 515, high: 522, strength: 64, timeframe: "1d", kind: "resistance" },
    ],
    summary: {
      overview: "พื้นฐานค่อนข้างดี แต่กราฟยังต้องรอการยืนยันเหนือแนวต้านใกล้",
      strengths: ["รายได้และ EPS เติบโต", "ROIC สูงกว่าต้นทุนเงินทุน", "มีเงินสดสุทธิ"],
      weaknesses: ["ราคายังไม่ผ่านแนวต้านสำคัญ", "มูลค่าบางตัวอยู่ระดับสูง"],
      watchItems: ["ติดตามแรงซื้อบริเวณ 455–460", "รอแท่งปิดเหนือ 482 พร้อม Volume"],
      scenarios: [
        { kind: "good", title: "กรณีดี", description: "ผ่าน 478–482 พร้อมปริมาณซื้อขายสนับสนุน" },
        { kind: "neutral", title: "กรณีกลาง", description: "แกว่งตัวระหว่าง 455–482 และยังไม่เลือกทิศทาง" },
        { kind: "bad", title: "กรณีแย่", description: "ปิดต่ำกว่า 455 และเพิ่มความเสี่ยงไปยังแนวรับถัดไป" },
      ],
      limitations: ["ชุดข้อมูลนี้เป็นข้อมูลจำลอง", "ยังไม่มีผล Backtest เพียงพอ"],
      disclaimer: "ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำหรือคำสั่งซื้อขายหลักทรัพย์",
    },
    summarySource: "template",
    confidenceMessage: "ยังไม่มีข้อมูล Backtest และ Paper Trade เพียงพอ",
  };
}
