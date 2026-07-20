import { Card } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function FundamentalsPanel({ analysis }: { analysis: AnalysisResponse }) {
  const data = analysis.fundamentals;
  if (!data) return <Card>ไม่มีข้อมูลพื้นฐานเพียงพอ</Card>;
  return (
    <div className={styles.dashboard}>
      <Card as="section">
        <h2 className={styles.sectionTitle}>การเติบโตและผลประกอบการ</h2>
        <div className={styles.metricGrid}>
          <Metric label="Revenue Growth YoY" value={data.revenueGrowthYoY} unit="%" />
          <Metric label="EPS Growth YoY" value={data.epsGrowthYoY} unit="%" />
          <Metric label="ชนะคาดการณ์" value={data.earningsBeatsLastFour} unit="/4 ไตรมาส" />
          <Metric label="Guidance" text={data.guidance === "maintained" ? "คงเดิม" : data.guidance} />
        </div>
      </Card>
      <div className={styles.twoColumn}>
        <Card as="section"><h2 className={styles.sectionTitle}>กำไรและกระแสเงินสด</h2><div className={styles.metricGrid}><Metric label="Gross Margin" value={data.grossMargin} unit="%" /><Metric label="Operating Margin" value={data.operatingMargin} unit="%" /><Metric label="Net Margin" value={data.netMargin} unit="%" /><Metric label="FCF Margin" value={data.freeCashFlowMargin} unit="%" /></div></Card>
        <Card as="section"><h2 className={styles.sectionTitle}>หนี้และประสิทธิภาพเงินทุน</h2><div className={styles.metricGrid}><Metric label="Net Debt/EBITDA" value={data.netDebtToEbitda} unit="x" /><Metric label="Interest Coverage" value={data.interestCoverage} unit="x" /><Metric label="ROIC" value={data.roic} unit="%" /><Metric label="WACC โดยประมาณ" value={data.estimatedWacc} unit="%" /></div></Card>
      </div>
      <Card as="section"><h2 className={styles.sectionTitle}>มูลค่าปัจจุบัน</h2><div className={styles.metricGrid}><Metric label="P/E" value={data.pe} unit="x" /><Metric label="EV/Sales" value={data.evToSales} unit="x" /><Metric label="EV/EBITDA" value={data.evToEbitda} unit="x" /><Metric label="Price/FCF" value={data.priceToFreeCashFlow} unit="x" /></div><p className={styles.notice}>ต้องเทียบกับประวัติบริษัทและกลุ่มเดียวกัน ไม่ใช้ค่าเดียวตัดสินว่าถูกหรือแพง</p></Card>
    </div>
  );
}

function Metric({ label, value, unit = "", text }: { label: string; value?: number | null; unit?: string; text?: string }) {
  return <div className={styles.metric}><span className={styles.metricLabel}>{label}</span><span className={styles.metricValue}>{text ?? (value === null || value === undefined ? "ไม่มีข้อมูล" : `${value.toFixed(1)}${unit}`)}</span></div>;
}
