"use client";

import {
  BarChart3,
  Building2,
  Compass,
  FileSearch,
  ShieldAlert,
} from "lucide-react";

import styles from "./bottom-navigation.module.css";

export type AnalysisTab =
  | "overview"
  | "chart"
  | "fundamentals"
  | "risk"
  | "summary";

export const ANALYSIS_TABS = [
  { id: "overview", label: "ภาพรวม", icon: Compass },
  { id: "chart", label: "กราฟ", icon: BarChart3 },
  { id: "fundamentals", label: "พื้นฐาน", icon: Building2 },
  { id: "risk", label: "ความเสี่ยง", icon: ShieldAlert },
  { id: "summary", label: "สรุป", icon: FileSearch },
] as const satisfies ReadonlyArray<{
  id: AnalysisTab;
  label: string;
  icon: typeof Compass;
}>;

interface BottomNavigationProps {
  activeTab: AnalysisTab;
  onChange: (tab: AnalysisTab) => void;
}

export function BottomNavigation({
  activeTab,
  onChange,
}: BottomNavigationProps) {
  return (
    <nav className={styles.navigation} aria-label="ส่วนวิเคราะห์">
      {ANALYSIS_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
          onClick={() => onChange(id)}
        >
          <Icon size={18} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
