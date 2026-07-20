import { CircleCheck, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function CompanyProfileCard({ analysis }: { analysis: AnalysisResponse }) {
  const positive = analysis.quote.changePercent >= 0;
  return (
    <Card as="section" className={styles.profile}>
      <div className={styles.profileHeader}>
        <div>
          <span className={styles.symbol}>{analysis.profile.symbol} · {analysis.profile.exchange}</span>
          <h1>{analysis.profile.name}</h1>
          <p className={styles.meta}>{analysis.profile.sector} · {analysis.profile.industry}</p>
        </div>
        <div className={styles.quote}>
          <span className={styles.price}>${analysis.quote.price.toFixed(2)}</span>
          <span className={positive ? styles.positive : undefined}>
            {positive ? "+" : ""}{analysis.quote.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className={styles.statusStrip}>
        <Badge tone="primary"><CircleCheck size={14} />ข้อมูลจำลอง</Badge>
        <span className={styles.source}><Clock3 size={14} /> อัปเดต {new Date(analysis.generatedAt).toLocaleString("th-TH")}</span>
        <span className={styles.source}>แหล่งข้อมูล: {analysis.quote.provenance.provider}</span>
      </div>
    </Card>
  );
}
