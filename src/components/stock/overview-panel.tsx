import { Card } from "@/components/ui/card";
import { RiskMeter } from "@/components/ui/risk-meter";
import { ScoreRing } from "@/components/ui/score-ring";
import type { AnalysisResponse } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function OverviewPanel({ analysis }: { analysis: AnalysisResponse }) {
  const horizons = analysis.scores.horizons;
  if (!horizons) return <Card>ข้อมูลไม่เพียงพอสำหรับคะแนนตามระยะถือ</Card>;
  return (
    <div className={styles.dashboard}>
      <Card as="section">
        <h2 className={styles.sectionTitle}>คะแนนตามระยะถือ</h2>
        <div className={styles.scoreGrid}>
          <ScoreRing score={horizons.short} label="1–3 วัน" level="รอการยืนยัน" tone="warning" size={122} />
          <ScoreRing score={horizons.medium} label="1–4 สัปดาห์" level="ค่อนข้างดี" tone="positive" size={122} />
          <ScoreRing score={horizons.long} label="6 เดือนขึ้นไป" level="แข็งแรง" tone="positive" size={122} />
        </div>
      </Card>
      <div className={styles.twoColumn}>
        <Card as="section">
          <h2 className={styles.sectionTitle}>คะแนนองค์ประกอบ</h2>
          <div className={styles.metricGrid}>
            <Metric label="เทคนิค" value={analysis.scores.technical.score} />
            <Metric label="พื้นฐาน" value={analysis.scores.fundamental?.score ?? null} />
            <Metric label="ตลาดและกลุ่ม" value={analysis.scores.market.score} />
            <Metric label="ข่าวและเหตุการณ์" value={analysis.scores.events.score} />
          </div>
        </Card>
        <Card as="section">
          <h2 className={styles.sectionTitle}>ความเสี่ยงและคุณภาพข้อมูล</h2>
          <RiskMeter score={analysis.scores.risk.score} label="ความเสี่ยง" />
          <div className={styles.metricGrid}>
            <Metric label="คุณภาพข้อมูล" value={analysis.scores.quality.score} suffix="/100" />
            <Metric label="ความมั่นใจสูตร" value={null} text="ยังไม่มีข้อมูล" />
          </div>
        </Card>
      </div>
      <Card as="section">
        <h2 className={styles.sectionTitle}>สิ่งที่ระบบเห็นตอนนี้</h2>
        <p>{analysis.summary.overview}</p>
      </Card>
    </div>
  );
}

function Metric({ label, value, suffix = "/100", text }: { label: string; value: number | null; suffix?: string; text?: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value === null ? (text ?? "ไม่มีข้อมูล") : `${Math.round(value)}${suffix}`}</span>
    </div>
  );
}
