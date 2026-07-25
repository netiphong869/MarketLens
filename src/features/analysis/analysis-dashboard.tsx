"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { ChartPanel } from "@/components/chart/chart-panel";
import {
  BottomNavigation,
  type AnalysisTab,
} from "@/components/layout/bottom-navigation";
import { MarketPulse } from "@/components/market/market-pulse";
import { SummaryPanel } from "@/components/analysis/summary-panel";
import { CompanyProfileCard } from "@/components/stock/company-profile-card";
import { FundamentalsPanel } from "@/components/stock/fundamentals-panel";
import { OverviewPanel } from "@/components/stock/overview-panel";
import { RiskPanel } from "@/components/stock/risk-panel";
import { StockSearch } from "@/components/stock/stock-search";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import type { AnalysisResponse } from "@/types/analysis";
import type { UsageStatus } from "@/lib/usage/daily-limit";

import styles from "./analysis-dashboard.module.css";

type DashboardState = "idle" | "loading" | "success" | "error";
type HealthMode = "checking" | "live" | "mock" | "unknown";
interface ApiAnalysisResult {
  data: AnalysisResponse;
  cached: boolean;
  usage: UsageStatus;
}
type AnalyzeFunction = (
  symbol: string,
) => Promise<AnalysisResponse | ApiAnalysisResult>;
type HealthCheckFunction = () => Promise<"live" | "mock">;

const healthResponseSchema = z.object({
  ok: z.literal(true),
  mode: z.enum(["live", "mock"]),
  time: z.string(),
});

const defaultAnalyze: AnalyzeFunction = async (symbol) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-marketlens-client": localClientId(),
    },
    body: JSON.stringify({ symbol }),
  });
  if (!response.ok) throw new Error("Analysis request failed");
  return response.json() as Promise<ApiAnalysisResult>;
};

const defaultHealthCheck: HealthCheckFunction = async () => {
  const response = await fetch("/api/health", { cache: "no-store" });
  if (!response.ok) throw new Error("Health request failed");
  return healthResponseSchema.parse(await response.json()).mode;
};

export function AnalysisDashboard({
  analyze = defaultAnalyze,
  checkHealth = defaultHealthCheck,
  initialSymbol,
}: {
  analyze?: AnalyzeFunction;
  checkHealth?: HealthCheckFunction;
  initialSymbol?: string;
}) {
  const [state, setState] = useState<DashboardState>("idle");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("overview");
  const [healthMode, setHealthMode] = useState<HealthMode>("checking");
  const [remaining, setRemaining] = useState(10);
  const [lastSymbol, setLastSymbol] = useState<string | null>(null);
  const initialized = useRef(false);

  const runAnalysis = useCallback(
    async (symbol: string) => {
      setState("loading");
      setActiveTab("overview");
      try {
        const result = await analyze(symbol);
        const apiResult: ApiAnalysisResult | null =
          "data" in result ? result : null;
        setAnalysis(apiResult ? apiResult.data : (result as AnalysisResponse));
        setLastSymbol(symbol);
        setRemaining(
          apiResult
            ? apiResult.usage.remaining
            : (value) => Math.max(0, value - 1),
        );
        setState("success");
      } catch {
        setState("error");
      }
    },
    [analyze],
  );

  useEffect(() => {
    let active = true;
    void checkHealth()
      .then((mode) => {
        if (active) setHealthMode(mode);
      })
      .catch(() => {
        if (active) setHealthMode("unknown");
      });
    return () => {
      active = false;
    };
  }, [checkHealth]);

  useEffect(() => {
    if (initialSymbol && !initialized.current) {
      initialized.current = true;
      void runAnalysis(initialSymbol.toUpperCase());
    }
  }, [initialSymbol, runAnalysis]);

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>MarketLens Research Workspace</p>
        <h1>มองหุ้นให้ครบทุกมุม ก่อนตัดสินใจด้วยตัวเอง</h1>
        <p className={styles.heroCopy}>
          รวมกราฟ พื้นฐาน ตลาด ข่าว และความเสี่ยงไว้ในรายงานเดียว
          พร้อมบอกข้อจำกัดของข้อมูลอย่างตรงไปตรงมา
        </p>
        <StockSearch
          onAnalyze={runAnalysis}
          disabled={state === "loading" || remaining === 0}
        />
      </section>
      <MarketPulse remaining={remaining} mode={healthMode} />
      {state === "loading" ? <LoadingState /> : null}
      {state === "error" ? (
        <ErrorState
          title="วิเคราะห์ไม่สำเร็จ"
          description="ระบบไม่สามารถเตรียมข้อมูลได้ในขณะนี้ และยังไม่ได้หักรอบการใช้งาน"
          actionLabel="ลองอีกครั้ง"
          onAction={() =>
            lastSymbol ? void runAnalysis(lastSymbol) : setState("idle")
          }
        />
      ) : null}
      {state === "success" && analysis ? (
        <>
          <CompanyProfileCard analysis={analysis} />
          {activeTab === "overview" ? (
            <OverviewPanel analysis={analysis} />
          ) : null}
          {activeTab === "chart" ? <ChartPanel analysis={analysis} /> : null}
          {activeTab === "fundamentals" ? (
            <FundamentalsPanel analysis={analysis} />
          ) : null}
          {activeTab === "risk" ? <RiskPanel analysis={analysis} /> : null}
          {activeTab === "summary" ? (
            <SummaryPanel analysis={analysis} />
          ) : null}
          <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
        </>
      ) : null}
    </div>
  );
}

function localClientId(): string {
  const key = "marketlens-client-id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const created = globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}`;
  window.localStorage.setItem(key, created);
  return created;
}

function LoadingState() {
  const steps = [
    "ตรวจสอบชื่อหุ้น",
    "เตรียมราคาและกราฟ",
    "ตรวจพื้นฐานและเหตุการณ์",
    "คำนวณคะแนน",
    "สร้างสรุปภาษาไทย",
  ];
  return (
    <Card as="section" aria-live="polite">
      <ul className={styles.loadingSteps}>
        {steps.map((step, index) => (
          <li className={styles.loadingStep} key={step}>
            {index === 0 ? (
              <LoaderCircle size={18} aria-hidden="true" />
            ) : (
              <CheckCircle2 size={18} aria-hidden="true" />
            )}
            {step}
          </li>
        ))}
      </ul>
    </Card>
  );
}
