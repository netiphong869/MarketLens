import { Card } from "@/components/ui/card";
import { RiskMeter } from "@/components/ui/risk-meter";
import { ScoreRing } from "@/components/ui/score-ring";
import type { AnalysisResponse } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function OverviewPanel({ analysis }: { analysis: AnalysisResponse }) {
  const horizons = analysis.scores.horizons;
  return (
    <div className={styles.dashboard}>
      <Card as="section">
        <h2 className={styles.sectionTitle}>คะแนนตามระยะถือ</h2>
        <div className={styles.scoreGrid}>
          <HorizonScore label="1–3 วัน" assessment={horizons.short} />
          <HorizonScore label="1–4 สัปดาห์" assessment={horizons.medium} />
          <HorizonScore label="6 เดือนขึ้นไป" assessment={horizons.long} />
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
            <Metric label="ความถูกต้องของข้อมูล (Data Integrity)" value={analysis.scores.quality.score} suffix="/100" />
            <Metric label="ความมั่นใจสูตร" value={null} text="ยังไม่มีข้อมูล" />
          </div>
        </Card>
      </div>
      <Card as="section">
        <h2 className={styles.sectionTitle}>ความครอบคลุมของข้อมูล</h2>
        <div className={styles.metricGrid}>
          <CoverageMetric label="เทคนิค" value={analysis.scores.coverage.technical} />
          <CoverageMetric label="พื้นฐาน" value={analysis.scores.coverage.fundamental} />
          <CoverageMetric label="ตลาด" value={analysis.scores.coverage.market} />
          <CoverageMetric label="ข่าว" value={analysis.scores.coverage.news} />
        </div>
      </Card>
      <Card as="section">
        <h2 className={styles.sectionTitle}>สิ่งที่ระบบเห็นตอนนี้</h2>
        <p>{analysis.summary.overview}</p>
      </Card>
    </div>
  );
}

function HorizonScore({
  label,
  assessment,
}: {
  label: string;
  assessment: AnalysisResponse["scores"]["horizons"]["short"];
}) {
  if (assessment.score === null) {
    return (
      <div className={styles.metric}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>
          {assessment.status === "partial" ? "Partial" : "Insufficient"}
        </span>
        <small>
          ขาด: {assessment.missingModules.map(thaiModule).join(", ")}
        </small>
      </div>
    );
  }
  return (
    <ScoreRing
      score={assessment.score}
      label={label}
      level="ข้อมูลครบตามเกณฑ์"
      tone="positive"
      size={122}
    />
  );
}

function CoverageMetric({
  label,
  value,
}: {
  label: string;
  value: AnalysisResponse["scores"]["coverage"]["technical"];
}) {
  const status =
    value.status === "complete"
      ? "ครบ"
      : value.status === "partial"
        ? "บางส่วน"
        : "ไม่เพียงพอ";
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{Math.round(value.percent)}%</span>
      <small>{status}</small>
    </div>
  );
}

function thaiModule(module: string): string {
  return {
    technical: "เทคนิค",
    fundamental: "พื้นฐาน",
    market: "ตลาด",
    news: "ข่าว",
  }[module] ?? module;
}

function Metric({ label, value, suffix = "/100", text }: { label: string; value: number | null; suffix?: string; text?: string }) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value === null ? (text ?? "ไม่มีข้อมูล") : `${Math.round(value)}${suffix}`}</span>
    </div>
  );
}
