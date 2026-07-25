import { Activity, Clock3, Database, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import styles from "@/features/analysis/analysis-dashboard.module.css";

type HealthMode = "checking" | "live" | "mock" | "unknown";

const statusByMode: Record<
  HealthMode,
  { market: string; source: string; tone: "positive" | "primary" | "muted" }
> = {
  checking: {
    market: "กำลังตรวจสถานะ",
    source: "กำลังตรวจสอบ",
    tone: "muted",
  },
  live: {
    market: "พร้อมข้อมูลจริง",
    source: "Live Mode",
    tone: "positive",
  },
  mock: {
    market: "ข้อมูลจำลอง",
    source: "Mock Mode",
    tone: "primary",
  },
  unknown: {
    market: "ตรวจสถานะไม่ได้",
    source: "ไม่ทราบสถานะ",
    tone: "muted",
  },
};

export function MarketPulse({
  remaining,
  mode,
}: {
  remaining: number;
  mode: HealthMode;
}) {
  const status = statusByMode[mode];

  return (
    <Card as="section" aria-label="Market Pulse">
      <div className={styles.statusStrip}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>
            <Activity size={14} aria-hidden="true" /> ตลาดสหรัฐ
          </span>
          <span className={styles.statusValue}>{status.market}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>
            <Gauge size={14} aria-hidden="true" /> รอบคงเหลือ
          </span>
          <span className={styles.statusValue}>
            เหลือ {remaining} จาก 10 รอบ
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>
            <Database size={14} aria-hidden="true" /> แหล่งข้อมูล
          </span>
          <Badge tone={status.tone}>{status.source}</Badge>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}>
            <Clock3 size={14} aria-hidden="true" /> รีเซ็ต
          </span>
          <span className={styles.statusValue}>00:00 เวลาไทย</span>
        </div>
      </div>
    </Card>
  );
}
