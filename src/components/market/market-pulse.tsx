import { Activity, Clock3, Database, Gauge } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function MarketPulse({ remaining }: { remaining: number }) {
  return (
    <Card as="section" aria-label="Market Pulse">
      <div className={styles.statusStrip}>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}><Activity size={14} aria-hidden="true" /> ตลาดสหรัฐ</span>
          <span className={styles.statusValue}>รอข้อมูลจริง</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}><Gauge size={14} aria-hidden="true" /> รอบคงเหลือ</span>
          <span className={styles.statusValue}>เหลือ {remaining} จาก 10 รอบ</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}><Database size={14} aria-hidden="true" /> แหล่งข้อมูล</span>
          <Badge tone="primary">Mock Mode</Badge>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.statusLabel}><Clock3 size={14} aria-hidden="true" /> รีเซ็ต</span>
          <span className={styles.statusValue}>00:00 เวลาไทย</span>
        </div>
      </div>
    </Card>
  );
}
