import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnalysisResponse, AnalysisScenario } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function SummaryPanel({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <div className={styles.dashboard}>
      <Card as="article"><Badge tone="primary">สรุปจากกฎระบบ</Badge><h2 className={styles.sectionTitle}>MarketLens Insight</h2><p>{analysis.summary.overview}</p></Card>
      <div className={styles.twoColumn}><Card as="section"><h2 className={styles.sectionTitle}>จุดแข็ง</h2><List items={analysis.summary.strengths} /></Card><Card as="section"><h2 className={styles.sectionTitle}>จุดอ่อน</h2><List items={analysis.summary.weaknesses} /></Card></div>
      <Card as="section"><h2 className={styles.sectionTitle}>สิ่งที่ควรติดตาม</h2><List items={analysis.summary.watchItems} /></Card>
      <div className={styles.scenarioGrid}>{analysis.summary.scenarios.map((scenario) => <Scenario key={scenario.kind} scenario={scenario} />)}</div>
      <Card as="footer"><p>{analysis.summary.disclaimer}</p><p className={styles.meta}>{analysis.confidenceMessage}</p></Card>
    </div>
  );
}

function List({ items }: { items: string[] }) { return <ul className={styles.plainList}>{items.map((item) => <li key={item}>{item}</li>)}</ul>; }
function Scenario({ scenario }: { scenario: AnalysisScenario }) {
  const className = scenario.kind === "good" ? styles.scenarioGood : scenario.kind === "bad" ? styles.scenarioBad : styles.scenarioNeutral;
  return <article className={`${styles.scenario} ${className}`}><h3>{scenario.title}</h3><p>{scenario.description}</p></article>;
}
