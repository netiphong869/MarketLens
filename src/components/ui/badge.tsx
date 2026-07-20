import type { HTMLAttributes } from "react";

import styles from "./design-system.module.css";

export type Tone =
  | "primary"
  | "positive"
  | "warning"
  | "risk"
  | "critical"
  | "muted";

const toneClass: Record<Tone, string> = {
  primary: styles.tonePrimary,
  positive: styles.tonePositive,
  warning: styles.toneWarning,
  risk: styles.toneRisk,
  critical: styles.toneCritical,
  muted: styles.toneMuted,
};

export function Badge({
  tone = "muted",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`${styles.badge} ${toneClass[tone]} ${className}`}
      {...props}
    />
  );
}
