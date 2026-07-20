import type { FinancialMetrics } from "@/types/market";

interface FactPoint { fy?: number; fp?: string; form?: string; filed?: string; end?: string; val?: number }
interface Concept { units?: Record<string, FactPoint[]> }
interface CompanyFacts { facts?: { "us-gaap"?: Record<string, Concept> } }

export function normalizeCompanyFacts(raw: unknown, asOf = new Date().toISOString()): FinancialMetrics | null {
  const facts = (raw as CompanyFacts)?.facts?.["us-gaap"];
  if (!facts) return null;
  const revenue = annualSeries(facts.RevenueFromContractWithCustomerExcludingAssessedTax ?? facts.Revenues, "USD");
  if (!revenue.length) return null;
  const eps = annualSeries(facts.EarningsPerShareDiluted, "USD/shares");
  const latestRevenue = last(revenue); const priorRevenue = previous(revenue);
  const gross = last(annualSeries(facts.GrossProfit, "USD"));
  const operating = last(annualSeries(facts.OperatingIncomeLoss, "USD"));
  const net = last(annualSeries(facts.NetIncomeLoss, "USD"));
  const operatingCash = last(annualSeries(facts.NetCashProvidedByUsedInOperatingActivities, "USD"));
  const capex = last(annualSeries(facts.PaymentsToAcquirePropertyPlantAndEquipment, "USD"));
  const shares = annualSeries(facts.EntityCommonStockSharesOutstanding, "shares");
  return {
    revenueGrowthYoY: growth(latestRevenue?.value, priorRevenue?.value), revenueGrowthThreeYear: cagr(revenue),
    epsGrowthYoY: growth(last(eps)?.value, previous(eps)?.value),
    grossMargin: margin(gross?.value, latestRevenue?.value), operatingMargin: margin(operating?.value, latestRevenue?.value), netMargin: margin(net?.value, latestRevenue?.value),
    freeCashFlowMargin: operatingCash && latestRevenue ? margin(operatingCash.value - (capex?.value ?? 0), latestRevenue.value) : null,
    netDebtToEbitda: null, interestCoverage: null, roic: null, estimatedWacc: null, pe: null, evToSales: null, evToEbitda: null, priceToFreeCashFlow: null,
    sharesGrowthYoY: growth(last(shares)?.value, previous(shares)?.value), earningsBeatsLastFour: null, guidance: "unknown",
    provenance: { provider: "SEC EDGAR", mode: "delayed", asOf },
  };
}

interface AnnualValue { year: number; value: number; filed: string }
function annualSeries(concept: Concept | undefined, preferredUnit: string): AnnualValue[] {
  if (!concept?.units) return [];
  const points = concept.units[preferredUnit] ?? Object.values(concept.units)[0] ?? [];
  const byYear = new Map<number, AnnualValue>();
  for (const point of points) {
    if (!point.fy || !Number.isFinite(point.val) || !["10-K", "10-K/A", "20-F", "20-F/A"].includes(point.form ?? "")) continue;
    const candidate = { year: point.fy, value: point.val!, filed: point.filed ?? point.end ?? "" };
    if (!byYear.has(point.fy) || candidate.filed > byYear.get(point.fy)!.filed) byYear.set(point.fy, candidate);
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}
function last(values: AnnualValue[]): AnnualValue | undefined { return values.at(-1); }
function previous(values: AnnualValue[]): AnnualValue | undefined { return values.at(-2); }
function growth(current?: number, prior?: number): number | null { if (current === undefined || prior === undefined || prior === 0) return null; return round((current / Math.abs(prior) - Math.sign(prior)) * 100); }
function margin(value?: number, revenue?: number): number | null { return value === undefined || !revenue ? null : round(value / revenue * 100); }
function cagr(values: AnnualValue[]): number | null { if (values.length < 4) return null; const end = values.at(-1)!.value; const start = values.at(-4)!.value; return start > 0 && end > 0 ? round((Math.pow(end / start, 1 / 3) - 1) * 100) : null; }
function round(value: number): number { return Math.round(value * 100) / 100; }
