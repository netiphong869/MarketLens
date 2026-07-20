import type { CSSProperties } from "react";

import styles from "./design-system.module.css";

export function Skeleton({ height = 16 }: { height?: number }) {
  return (
    <span
      className={styles.skeleton}
      style={{ height } as CSSProperties}
      aria-hidden="true"
    />
  );
}
