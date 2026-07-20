import styles from "./design-system.module.css";

interface RiskMeterProps {
  score: number;
  label: string;
}

export function RiskMeter({ score, label }: RiskMeterProps) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const level =
    safeScore <= 30
      ? "ต่ำ"
      : safeScore <= 50
        ? "ปานกลาง"
        : safeScore <= 70
          ? "ค่อนข้างสูง"
          : safeScore <= 85
            ? "สูง"
            : "สูงมาก";

  return (
    <div
      className={styles.meter}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeScore}
      aria-valuetext={`${safeScore} จาก 100 — ${level}`}
    >
      <div className={styles.meterHeader}>
        <span>{label}</span>
        <span>{safeScore}/100 — {level}</span>
      </div>
      <div className={styles.meterTrack} aria-hidden="true">
        <div className={styles.meterFill} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  );
}
