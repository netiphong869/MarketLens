import { AppShell } from "@/components/layout/app-shell";
import { AnalysisDashboard } from "@/features/analysis/analysis-dashboard";

export default function Home() {
  return <AppShell><AnalysisDashboard /></AppShell>;
}
