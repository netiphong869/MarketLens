import type {
  AnalysisCoverage,
  AnalysisResponse,
  AnalysisScenario,
  AnalysisSummary,
  HorizonAssessment,
  SummaryHorizonStatus,
  SummaryHorizonVerdict,
} from "@/types/analysis";

type HorizonKey = "short" | "medium" | "long";
type CoverageKey = keyof AnalysisCoverage;

const horizonLabels: Record<HorizonKey, string> = {
  short: "ระยะสั้น",
  medium: "ระยะกลาง",
  long: "ระยะยาว",
};

const coverageRequirements: Record<
  HorizonKey,
  Partial<Record<CoverageKey, number>>
> = {
  short: { technical: 85, fundamental: 25, market: 50, news: 50 },
  medium: { technical: 70, fundamental: 50, market: 50, news: 25 },
  long: { technical: 50, fundamental: 70, market: 25, news: 25 },
};

const coverageLabels: Record<CoverageKey, string> = {
  technical: "ข้อมูลเทคนิคไม่เพียงพอ",
  fundamental: "ข้อมูลพื้นฐานไม่เพียงพอ",
  market: "ข้อมูล Market/Sector ไม่เพียงพอ",
  news: "ข้อมูลข่าวและเหตุการณ์ไม่เพียงพอ",
};

export function createTemplateSummary(
  input: AnalysisResponse,
): AnalysisSummary {
  return {
    overview: buildVerdict(input),
    horizons: buildHorizonVerdicts(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    risks: buildRisks(input),
    watchItems: buildWatchItems(input),
    scenarios: buildScenarios(input),
    limitations: buildLimitations(input),
    disclaimer:
      "ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำหรือคำสั่งซื้อขายหลักทรัพย์ ผู้ใช้ต้องประเมินความเหมาะสมและความเสี่ยงด้วยตนเอง",
  };
}

export function createEmptyAnalysisSummary(): AnalysisSummary {
  const unavailable = (label: string): SummaryHorizonVerdict => ({
    label,
    status: "insufficient",
    score: null,
    explanation: "กำลังเตรียมข้อมูลสรุป",
    missing: [],
  });
  return {
    overview: "",
    horizons: {
      short: unavailable("ระยะสั้น"),
      medium: unavailable("ระยะกลาง"),
      long: unavailable("ระยะยาว"),
    },
    strengths: [],
    weaknesses: [],
    risks: [],
    watchItems: [],
    scenarios: [],
    limitations: [],
    disclaimer: "",
  };
}

export function validateSummaryNumbers(
  summary: AnalysisSummary,
  input: AnalysisResponse,
): boolean {
  const allowed = new Set(
    collectNumericTokens(input).flatMap((value) => [
      normalizeToken(value),
      normalizeToken(Number(value.toFixed(0))),
      normalizeToken(Number(value.toFixed(1))),
      normalizeToken(Number(value.toFixed(2))),
    ]),
  );
  const reported = collectNumericTokens(summary);
  return reported.every((value) => allowed.has(normalizeToken(value)));
}

function buildVerdict(input: AnalysisResponse): string {
  const change = input.quote.changePercent;
  const direction = change > 0 ? "ปรับขึ้น" : change < 0 ? "ปรับลง" : "ทรงตัว";
  const technical = technicalTrend(input);
  const fundamental = input.fundamentals;
  const fundamentalSentence =
    fundamental?.revenueGrowthYoY !== null &&
    fundamental?.revenueGrowthYoY !== undefined &&
    fundamental?.epsGrowthYoY !== null &&
    fundamental?.epsGrowthYoY !== undefined
      ? `รายได้เปลี่ยนแปลง ${formatPercent(fundamental.revenueGrowthYoY)} และ EPS เปลี่ยนแปลง ${formatPercent(fundamental.epsGrowthYoY)} เมื่อเทียบกับปีก่อน`
      : `Fundamental Coverage อยู่ที่ ${formatPercent(input.scores.coverage.fundamental.percent)} และ ${fundamentalMissingSummary(input)}`;
  const coverageSentence = coverageShortfall(input);

  return `${[
    `${input.symbol} ราคาล่าสุด${direction} ${formatPercent(Math.abs(change))} โดยภาพเทคนิค ${technical}`,
    `${fundamentalSentence} ขณะที่ Risk Score อยู่ที่ ${formatNumber(input.scores.risk.score, 0)} จาก 100`,
    coverageSentence,
  ].join(". ")}.`;
}

function buildHorizonVerdicts(
  input: AnalysisResponse,
): AnalysisSummary["horizons"] {
  return {
    short: buildHorizonVerdict(input, "short"),
    medium: buildHorizonVerdict(input, "medium"),
    long: buildHorizonVerdict(input, "long"),
  };
}

function buildHorizonVerdict(
  input: AnalysisResponse,
  horizon: HorizonKey,
): SummaryHorizonVerdict {
  const assessment = input.scores.horizons[horizon];
  const missing = horizonMissing(input, horizon, assessment);
  if (
    assessment.status === "insufficient" ||
    assessment.score === null ||
    missing.length > 0
  ) {
    return {
      label: horizonLabels[horizon],
      status: "insufficient",
      score: null,
      explanation: missing.length
        ? `ยังสรุปไม่ได้ เพราะ ${missing.join(", ")}`
        : "ยังไม่มีคะแนนที่ผ่านเกณฑ์ข้อมูลสำหรับช่วงเวลานี้",
      missing,
    };
  }

  const status = horizonStatus(assessment.score, input.scores.risk.score);
  return {
    label: horizonLabels[horizon],
    status,
    score: assessment.score,
    explanation: horizonExplanation(
      assessment.score,
      status,
      input.scores.risk.score,
    ),
    missing: [],
  };
}

function horizonMissing(
  input: AnalysisResponse,
  horizon: HorizonKey,
  assessment: HorizonAssessment,
): string[] {
  const missing = new Set<string>();
  for (const [module, threshold] of Object.entries(
    coverageRequirements[horizon],
  ) as Array<[CoverageKey, number]>) {
    if (input.scores.coverage[module].percent < threshold) {
      missing.add(coverageLabels[module]);
    }
  }
  for (const moduleKey of assessment.missingModules) {
    missing.add(coverageLabels[moduleKey]);
  }
  return [...missing];
}

function horizonStatus(score: number, risk: number): SummaryHorizonStatus {
  if (risk >= 61 || score < 45) return "caution";
  if (score >= 70) return "positive";
  return "neutral";
}

function horizonExplanation(
  score: number,
  status: SummaryHorizonStatus,
  risk: number,
): string {
  if (status === "positive") {
    return `คะแนน ${formatNumber(score, 0)} ผ่านเกณฑ์ข้อมูลและมีสัญญาณบวก โดย Risk Score อยู่ที่ ${formatNumber(risk, 0)}`;
  }
  if (status === "caution") {
    return `คะแนน ${formatNumber(score, 0)} ต้องระวังเมื่อพิจารณาร่วมกับ Risk Score ${formatNumber(risk, 0)}`;
  }
  return `คะแนน ${formatNumber(score, 0)} อยู่ในช่วงเป็นกลาง และ Risk Score อยู่ที่ ${formatNumber(risk, 0)}`;
}

function buildStrengths(input: AnalysisResponse): string[] {
  const strengths: string[] = [];
  const fundamentals = input.fundamentals;
  const daily = input.technicalSnapshot["1d"];

  if (input.quote.changePercent > 0) {
    strengths.push(
      `ราคาปรับขึ้น ${formatPercent(input.quote.changePercent)} ในรอบล่าสุด`,
    );
  }
  if (
    fundamentals?.revenueGrowthYoY !== null &&
    fundamentals?.revenueGrowthYoY !== undefined &&
    fundamentals.revenueGrowthYoY > 0
  ) {
    strengths.push(
      `รายได้เติบโต ${formatPercent(fundamentals.revenueGrowthYoY)} เมื่อเทียบกับปีก่อน`,
    );
  }
  if (
    fundamentals?.epsGrowthYoY !== null &&
    fundamentals?.epsGrowthYoY !== undefined &&
    fundamentals.epsGrowthYoY > 0
  ) {
    strengths.push(
      `EPS เติบโต ${formatPercent(fundamentals.epsGrowthYoY)} เมื่อเทียบกับปีก่อน`,
    );
  }
  if (
    fundamentals?.freeCashFlowMargin !== null &&
    fundamentals?.freeCashFlowMargin !== undefined &&
    fundamentals.freeCashFlowMargin > 0
  ) {
    strengths.push(
      `กระแสเงินสดอิสระเป็นบวก ${formatPercent(fundamentals.freeCashFlowMargin)} ของรายได้`,
    );
  }
  if (
    daily.latestClose !== null &&
    daily.ema20 !== null &&
    daily.latestClose > daily.ema20
  ) {
    strengths.push(
      `ราคาปิด ${formatPrice(daily.latestClose)} อยู่เหนือ EMA20 ที่ ${formatPrice(daily.ema20)}`,
    );
  }

  return strengths.slice(0, 5);
}

function buildWeaknesses(input: AnalysisResponse): string[] {
  const weaknesses: string[] = [];
  const fundamentals = input.fundamentals;
  const coverage = input.scores.coverage;
  const daily = input.technicalSnapshot["1d"];

  if (input.quote.changePercent < 0) {
    weaknesses.push(
      `ราคาปรับลง ${formatPercent(Math.abs(input.quote.changePercent))} ในรอบล่าสุด`,
    );
  }
  if (
    daily.latestClose !== null &&
    daily.ema20 !== null &&
    daily.latestClose < daily.ema20
  ) {
    weaknesses.push(
      `ราคาปิด ${formatPrice(daily.latestClose)} อยู่ต่ำกว่า EMA20 ที่ ${formatPrice(daily.ema20)}`,
    );
  }
  if (coverage.market.percent < 50) {
    weaknesses.push(
      `Market Coverage ${formatPercent(coverage.market.percent)} ไม่เพียงพอสำหรับสรุปตามระยะ`,
    );
  }
  if (coverage.fundamental.percent < 60) {
    weaknesses.push(
      `Fundamental Coverage ${formatPercent(coverage.fundamental.percent)} ไม่เพียงพอสำหรับระยะกลางและยาว`,
    );
  }
  if (
    !fundamentals ||
    [
      fundamentals.pe,
      fundamentals.evToSales,
      fundamentals.evToEbitda,
      fundamentals.priceToFreeCashFlow,
    ].every((value) => value === null)
  ) {
    weaknesses.push("ไม่มีข้อมูล Valuation");
  }
  if (
    !fundamentals ||
    [fundamentals.netDebtToEbitda, fundamentals.interestCoverage].some(
      (value) => value === null,
    )
  ) {
    weaknesses.push("ข้อมูลหนี้ไม่ครบ");
  }
  if (
    !fundamentals ||
    [fundamentals.revenueGrowthYoY, fundamentals.epsGrowthYoY].some(
      (value) => value === null,
    )
  ) {
    weaknesses.push("ข้อมูลรายได้หรือ EPS ไม่ครบ");
  }

  return unique(weaknesses).slice(0, 6);
}

function buildRisks(input: AnalysisResponse): string[] {
  const risks = [
    `Risk Score ${formatNumber(input.scores.risk.score, 0)} จาก 100 อยู่ในระดับ${riskLabel(input.scores.risk.score)}`,
    ...input.scores.risk.reasons.map((reason) =>
      reason.evidence ? `${reason.label}: ${reason.evidence}` : reason.label,
    ),
    ...input.scores.risk.warnings,
  ];
  return unique(risks.filter(Boolean)).slice(0, 5);
}

function buildWatchItems(input: AnalysisResponse): string[] {
  const items: string[] = [];
  const daily = input.technicalSnapshot["1d"];
  const support = nearestZone(input.supports, input.quote.price);
  const resistance = nearestZone(input.resistances, input.quote.price);
  const earnings = input.events.find((event) => event.category === "earnings");

  if (support) {
    items.push(
      `ติดตามแนวรับ ${formatRange(support.low, support.high)} หากราคาปิดต่ำกว่าโซนนี้ ความเสี่ยงทางเทคนิคจะเพิ่มขึ้น`,
    );
  }
  if (resistance) {
    items.push(
      `ติดตามแนวต้าน ${formatRange(resistance.low, resistance.high)} การผ่านโซนนี้ต้องดู Volume ประกอบ`,
    );
  }
  if (daily.ema20 !== null && daily.latestClose !== null) {
    items.push(
      `ติดตาม EMA20 ที่ ${formatPrice(daily.ema20)} ปัจจุบันราคาปิด${daily.latestClose >= daily.ema20 ? "อยู่เหนือ" : "อยู่ต่ำกว่า"}เส้นนี้`,
    );
  }
  if (daily.volumeRatio !== null) {
    items.push(
      `ติดตาม Volume Ratio ปัจจุบัน ${formatNumber(daily.volumeRatio, 2)} เท่าของค่าเฉลี่ย 20 แท่ง`,
    );
  }
  if (earnings) {
    items.push(`ติดตามเหตุการณ์งบล่าสุด: ${earnings.title}`);
  }

  for (const item of specificMissingData(input)) {
    if (items.length >= 5) break;
    items.push(`ติดตามการเติมข้อมูล: ${item}`);
  }

  return unique(items).slice(0, 5);
}

function buildScenarios(input: AnalysisResponse): AnalysisScenario[] {
  const daily = input.technicalSnapshot["1d"];
  const support = nearestZone(input.supports, input.quote.price);
  const resistance = nearestZone(input.resistances, input.quote.price);
  const good: string[] = [];
  const neutral: string[] = [];
  const bad: string[] = [];

  if (resistance) {
    good.push(`ราคาปิดเหนือ ${formatPrice(resistance.high)}`);
  }
  if (daily.ema20 !== null) {
    good.push(`ราคายืนเหนือ EMA20 ที่ ${formatPrice(daily.ema20)}`);
  }
  if (daily.volumeRatio !== null) {
    good.push(
      `Volume มากกว่าค่าเฉลี่ย 20 แท่ง โดยค่าปัจจุบันอยู่ที่ ${formatNumber(daily.volumeRatio, 2)} เท่า`,
    );
  }

  if (support && resistance) {
    neutral.push(
      `ราคายังเคลื่อนไหวระหว่าง ${formatPrice(support.low)} และ ${formatPrice(resistance.high)}`,
    );
  } else if (daily.ema20 !== null) {
    neutral.push(`ราคายังเคลื่อนไหวใกล้ EMA20 ที่ ${formatPrice(daily.ema20)}`);
  }
  if (daily.volumeRatio !== null) {
    neutral.push(`Volume ยังไม่ยืนยันทิศทางเมื่อเทียบกับค่าเฉลี่ย 20 แท่ง`);
  }

  if (support) {
    bad.push(`ราคาปิดต่ำกว่า ${formatPrice(support.low)}`);
  }
  if (daily.ema20 !== null) {
    bad.push(`ราคาอยู่ต่ำกว่า EMA20 ที่ ${formatPrice(daily.ema20)}`);
  }
  if (daily.ema50 !== null) {
    bad.push(`ราคาอยู่ต่ำกว่า EMA50 ที่ ${formatPrice(daily.ema50)}`);
  }

  return [
    {
      kind: "good",
      title: "กรณีดี",
      description: conditionalScenario(
        good,
        "ยังไม่มีแนวต้าน EMA หรือ Volume เพียงพอสำหรับกำหนดกรณีดี",
      ),
      trigger: resistance,
    },
    {
      kind: "neutral",
      title: "กรณีกลาง",
      description: conditionalScenario(
        neutral,
        "ยังไม่มีกรอบราคา EMA หรือ Volume เพียงพอสำหรับกำหนดกรณีกลาง",
      ),
      trigger: support,
      target: resistance,
    },
    {
      kind: "bad",
      title: "กรณีแย่",
      description: conditionalScenario(
        bad,
        "ยังไม่มีแนวรับหรือ EMA เพียงพอสำหรับกำหนดเงื่อนไขความเสี่ยงด้านราคา",
      ),
      trigger: support,
    },
  ];
}

function buildLimitations(input: AnalysisResponse): string[] {
  return unique([
    ...specificMissingData(input),
    ...input.scores.quality.missing,
    ...input.scores.quality.warnings,
    ...input.providerIssues.map(
      (issue) =>
        `${issue.provider} ไม่พร้อมใช้งาน (${issue.code}${issue.httpStatus === null ? "" : `, HTTP ${issue.httpStatus}`})`,
    ),
    input.confidenceMessage,
  ]).filter(Boolean);
}

function specificMissingData(input: AnalysisResponse): string[] {
  const missing: string[] = [];
  if (input.scores.coverage.market.percent < 50) {
    missing.push("ข้อมูล Market/Sector ไม่เพียงพอ");
  }
  if (input.scores.coverage.fundamental.percent < 60) {
    missing.push("ข้อมูลพื้นฐานไม่เพียงพอ");
  }
  if (input.scores.coverage.news.percent < 40) {
    missing.push("ข้อมูลข่าวและเหตุการณ์ไม่เพียงพอ");
  }
  for (const weakness of buildWeaknesses(input)) {
    if (weakness.startsWith("ไม่มีข้อมูล") || weakness.endsWith("ไม่ครบ")) {
      missing.push(weakness);
    }
  }
  return unique(missing);
}

function technicalTrend(input: AnalysisResponse): string {
  const daily = input.technicalSnapshot["1d"];
  if (
    daily.latestClose === null ||
    daily.ema20 === null ||
    daily.ema50 === null
  ) {
    return "ยังสรุปแนวโน้มไม่ได้ เพราะข้อมูล EMA20 หรือ EMA50 ไม่พร้อม";
  }
  if (daily.latestClose > daily.ema20 && daily.ema20 > daily.ema50) {
    return "ราคาอยู่เหนือ EMA20 และ EMA20 อยู่เหนือ EMA50";
  }
  if (daily.latestClose < daily.ema20 && daily.ema20 < daily.ema50) {
    return "ราคาอยู่ต่ำกว่า EMA20 และ EMA20 อยู่ต่ำกว่า EMA50";
  }
  return "ราคาและ EMA20/EMA50 ยังให้สัญญาณผสม";
}

function fundamentalMissingSummary(input: AnalysisResponse): string {
  const missing = specificMissingData(input).filter((item) =>
    /พื้นฐาน|Valuation|หนี้|รายได้|EPS/.test(item),
  );
  return missing.length
    ? missing.join(", ")
    : "ยังไม่มีข้อมูลรายได้และ EPS สำหรับอธิบายการเติบโต";
}

function coverageShortfall(input: AnalysisResponse): string {
  const missing = specificMissingData(input);
  return missing.length
    ? `ข้อจำกัดสำคัญคือ ${missing.join(", ")}`
    : "ข้อมูล Technical, Fundamental, Market และ News ผ่านเกณฑ์ Coverage ที่ใช้สรุป";
}

function conditionalScenario(conditions: string[], fallback: string): string {
  return conditions.length ? `หาก${conditions.join(" และ ")}` : fallback;
}

function nearestZone<T extends { low: number; high: number }>(
  zones: T[],
  price: number,
): T | undefined {
  return [...zones].sort(
    (left, right) => distanceToZone(left, price) - distanceToZone(right, price),
  )[0];
}

function distanceToZone(
  zone: { low: number; high: number },
  price: number,
): number {
  if (price < zone.low) return zone.low - price;
  if (price > zone.high) return price - zone.high;
  return 0;
}

function riskLabel(score: number): string {
  if (score >= 81) return "สูงมาก";
  if (score >= 61) return "สูง";
  if (score >= 31) return "ปานกลาง";
  return "ต่ำ";
}

function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function formatRange(low: number, high: number): string {
  return `${formatPrice(low)}–${formatPrice(high)}`;
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    useGrouping: false,
  }).format(value);
}

function collectNumericTokens(value: unknown): number[] {
  const matches = JSON.stringify(value).match(/-?\d+(?:[.,]\d+)?/g) ?? [];
  return matches
    .map((token) => Number(token.replace(",", ".")))
    .filter(Number.isFinite);
}

function normalizeToken(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
