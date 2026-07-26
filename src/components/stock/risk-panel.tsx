import { Card } from "@/components/ui/card";
import { RiskMeter } from "@/components/ui/risk-meter";
import type { AnalysisResponse } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

const labels: Record<string, string> = {
  volatility: "ความผันผวน",
  liquidity: "สภาพคล่อง",
  event: "เหตุการณ์ใกล้เกิด",
  financial: "ฐานะการเงิน",
  valuation: "มูลค่า",
};

export function RiskPanel({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <div className={styles.dashboard}>
      <Card as="section"><h2 className={styles.sectionTitle}>ปัจจัยความเสี่ยงหลัก</h2><RiskMeter score={analysis.scores.risk.score} label="ความเสี่ยงรวม" /><div className={styles.metricGrid}>{Object.entries(analysis.scores.risk.components).map(([key, value]) => <div className={styles.metric} key={key}><span className={styles.metricLabel}>{labels[key] ?? key}</span><span className={styles.metricValue}>{value === null ? "ไม่มีข้อมูล" : `${value}/20`}</span></div>)}</div></Card>
      <Card as="section"><h2 className={styles.sectionTitle}>เหตุผลที่ต้องระวัง</h2><ul className={styles.reasonList}>{analysis.scores.risk.reasons.map((reason) => <li key={reason.code}>{reason.label}</li>)}</ul></Card>
      <Card as="section"><h2 className={styles.sectionTitle}>ความเสี่ยงจากข้อมูล</h2><p>Data Integrity {analysis.scores.quality.score}/100 · {analysis.scores.quality.warnings.join(" · ")}</p><span className={styles.source}>แหล่งข้อมูล: {analysis.quote.provenance.provider} · {new Date(analysis.generatedAt).toLocaleString("th-TH")}</span></Card>
    </div>
  );
}
