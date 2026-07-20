import type { ReactNode } from "react";

import { MarketLensLogo } from "@/components/brand/marketlens-logo";

import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <MarketLensLogo />
          <div className={styles.brandText}>
            <strong>MarketLens</strong>
            <span>Analyze Smarter. Invest Wiser.</span>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
