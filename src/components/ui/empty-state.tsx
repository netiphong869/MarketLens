import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";

import styles from "./design-system.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Search,
}: EmptyStateProps) {
  return (
    <section className={styles.state} aria-label={title}>
      <Icon className={styles.stateIcon} size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
