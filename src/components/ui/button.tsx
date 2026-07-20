import type { ButtonHTMLAttributes } from "react";

import styles from "./design-system.module.css";

const variantClass = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  ghost: styles.buttonGhost,
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClass;
}) {
  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
