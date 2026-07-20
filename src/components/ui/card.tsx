import type { ElementType, HTMLAttributes, ReactNode } from "react";

import styles from "./design-system.module.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: "editorial" | "metric";
  children: ReactNode;
}

export function Card({
  as: Component = "div",
  variant = "editorial",
  className = "",
  ...props
}: CardProps) {
  const variantClass =
    variant === "metric" ? styles.cardMetric : styles.cardEditorial;
  return (
    <Component
      className={`${styles.card} ${variantClass} ${className}`}
      {...props}
    />
  );
}
