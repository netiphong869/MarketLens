import { Badge, type Tone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  AnalysisResponse,
  AnalysisScenario,
  SummaryHorizonStatus,
  SummaryHorizonVerdict,
} from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

const statusPresentation: Record<
  SummaryHorizonStatus,
  { label: string; tone: Tone }
> = {
  caution: { label: "ระวัง", tone: "risk" },
  neutral: { label: "เป็นกลาง", tone: "warning" },
  positive: { label: "มีสัญญาณบวก", tone: "positive" },
  insufficient: { label: "ข้อมูลไม่เพียงพอ", tone: "muted" },
};

export function SummaryPanel({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <div className={styles.dashboard}>
      <Card as="article" className={styles.summaryVerdict}>
        <div className={styles.summaryHeader}>
          <Badge tone="primary">สรุปโดย MarketLens</Badge>
          <SourceDisclosure analysis={analysis} />
        </div>
        <h2 className={styles.sectionTitle}>บทสรุป</h2>
        <p className={styles.verdictCopy}>{analysis.summary.overview}</p>
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>สถานะตามระยะเวลา</h2>
        <div className={styles.horizonGrid}>
          <HorizonCard horizon={analysis.summary.horizons.short} />
          <HorizonCard horizon={analysis.summary.horizons.medium} />
          <HorizonCard horizon={analysis.summary.horizons.long} />
        </div>
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>เหตุผลสนับสนุน</h2>
        <div className={styles.summaryColumns}>
          <div>
            <h3 className={styles.summarySubheading}>จุดแข็ง</h3>
            <List
              items={analysis.summary.strengths}
              emptyLabel="ยังไม่พบจุดแข็งที่มีข้อมูลยืนยัน"
            />
          </div>
          <div>
            <h3 className={styles.summarySubheading}>จุดอ่อน</h3>
            <List
              items={analysis.summary.weaknesses}
              emptyLabel="ยังไม่พบจุดอ่อนที่มีข้อมูลยืนยัน"
            />
          </div>
        </div>
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>ความเสี่ยง</h2>
        <List
          items={analysis.summary.risks}
          emptyLabel="ยังไม่พบปัจจัยเสี่ยงที่มีข้อมูลยืนยัน"
        />
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>สิ่งที่ต้องติดตาม</h2>
        <List
          items={analysis.summary.watchItems}
          emptyLabel="ไม่มีรายการติดตามจากข้อมูลปัจจุบัน"
        />
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>สถานการณ์แบบมีเงื่อนไข</h2>
        <div className={styles.scenarioGrid}>
          {analysis.summary.scenarios.map((scenario) => (
            <Scenario key={scenario.kind} scenario={scenario} />
          ))}
        </div>
      </Card>

      <Card as="section" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>ข้อจำกัดของข้อมูล</h2>
        <List
          items={analysis.summary.limitations}
          emptyLabel="ไม่พบข้อจำกัดเพิ่มเติมจากข้อมูลที่ใช้วิเคราะห์"
        />
      </Card>

      <Card as="footer" className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>ข้อควรทราบ</h2>
        <p>{analysis.summary.disclaimer}</p>
        <p className={styles.meta}>{analysis.confidenceMessage}</p>
      </Card>
    </div>
  );
}

function SourceDisclosure({ analysis }: { analysis: AnalysisResponse }) {
  const model = analysis.summaryModel?.replace(/^models\//, "");

  return (
    <details className={styles.sourceDisclosure}>
      <summary>รายละเอียดที่มาของสรุป</summary>
      {analysis.summarySource === "gemini" ? (
        <>
          <p>Gemini ช่วยเรียบเรียงเฉพาะ Verdict</p>
          {model ? <p>โมเดล {model}</p> : null}
          <p>
            คะแนน เหตุผล ความเสี่ยง และ Scenario มาจากระบบคำนวณของ MarketLens
          </p>
        </>
      ) : (
        <p>ใช้ Deterministic Template</p>
      )}
    </details>
  );
}

function HorizonCard({ horizon }: { horizon: SummaryHorizonVerdict }) {
  const presentation = statusPresentation[horizon.status];

  return (
    <section
      aria-label={`สถานะ${horizon.label}`}
      className={styles.horizonCard}
    >
      <div className={styles.horizonTop}>
        <h3>{horizon.label}</h3>
        <Badge tone={presentation.tone}>{presentation.label}</Badge>
      </div>
      {horizon.score === null ? null : (
        <p className={styles.horizonScore}>{horizon.score}/100</p>
      )}
      <p>{horizon.explanation}</p>
      {horizon.missing.length > 0 ? <List items={horizon.missing} /> : null}
    </section>
  );
}

function List({ items, emptyLabel }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return emptyLabel ? <p className={styles.meta}>{emptyLabel}</p> : null;
  }

  return (
    <ul className={styles.plainList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Scenario({ scenario }: { scenario: AnalysisScenario }) {
  const className =
    scenario.kind === "good"
      ? styles.scenarioGood
      : scenario.kind === "bad"
        ? styles.scenarioBad
        : styles.scenarioNeutral;

  return (
    <article className={`${styles.scenario} ${className}`}>
      <h3>{scenario.title}</h3>
      <p>{scenario.description}</p>
    </article>
  );
}
