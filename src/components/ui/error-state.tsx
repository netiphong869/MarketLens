import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

import styles from "./design-system.module.css";

interface ErrorStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = AlertTriangle,
}: ErrorStateProps) {
  return (
    <section className={styles.state} role="alert" aria-label={title}>
      <Icon className={styles.stateIcon} size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
