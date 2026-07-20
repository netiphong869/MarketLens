import type { CSSProperties } from "react";

import type { Tone } from "@/components/ui/badge";

import styles from "./design-system.module.css";

const ringColor: Record<Tone, string> = {
  primary: "var(--primary)",
  positive: "var(--positive)",
  warning: "var(--warning)",
  risk: "var(--risk)",
  critical: "var(--critical)",
  muted: "var(--missing)",
};

interface ScoreRingProps {
  score: number;
  label: string;
  level: string;
  tone?: Tone;
  size?: number;
}

export function ScoreRing({
  score,
  label,
  level,
  tone = "primary",
  size = 136,
}: ScoreRingProps) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const style = {
    "--score": safeScore,
    "--ring-color": ringColor[tone],
    "--ring-size": `${size}px`,
  } as CSSProperties;

  return (
    <div
      className={styles.ring}
      style={style}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeScore}
      aria-valuetext={`${safeScore} จาก 100 — ${level}`}
    >
      <div className={styles.ringContent}>
        <span className={styles.ringScore}>{safeScore}</span>
        <span className={styles.ringLabel}>{label}</span>
        <span className={styles.ringLevel}>{level}</span>
      </div>
    </div>
  );
}
