import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskMeter } from "@/components/ui/risk-meter";
import { ScoreRing } from "@/components/ui/score-ring";
import { AppShell } from "@/components/layout/app-shell";

import styles from "./design-system.module.css";

export default function DesignSystemPage() {
  return (
    <AppShell>
      <div className={styles.grid}>
        <Card as="section">
          <h1>MarketLens Design System</h1>
          <p>ชุดสถานะหลักสำหรับตรวจหน้าตาและการเข้าถึง</p>
        </Card>
        <Card as="section">
          <div className={styles.row}>
            <Badge tone="primary">ข้อมูลจำลอง</Badge>
            <Badge tone="positive">แข็งแรง</Badge>
            <Badge tone="warning">รอการยืนยัน</Badge>
            <Badge tone="risk">ความเสี่ยงสูง</Badge>
            <Badge tone="critical">ข้อมูลขัดแย้ง</Badge>
            <Badge tone="muted">ไม่มีข้อมูล</Badge>
          </div>
        </Card>
        <Card as="section">
          <div className={styles.scores}>
            <ScoreRing score={82} label="พื้นฐาน" level="แข็งแรง" tone="positive" />
            <ScoreRing score={58} label="เทคนิค" level="เป็นกลาง" tone="warning" />
            <ScoreRing score={31} label="ตลาด" level="อ่อนแอ" tone="risk" />
          </div>
        </Card>
        <Card as="section">
          <RiskMeter score={72} label="ความเสี่ยง" />
        </Card>
        <Card as="section">
          <div className={styles.row}>
            <Button>วิเคราะห์</Button>
            <Button variant="secondary">ดูรายละเอียด</Button>
            <Button variant="ghost">ยกเลิก</Button>
          </div>
        </Card>
        <EmptyState title="ยังไม่มีผลวิเคราะห์" description="ค้นหาหุ้นเพื่อเริ่มต้น" />
      </div>
    </AppShell>
  );
}
