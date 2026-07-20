"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import type { AnalysisResponse } from "@/types/analysis";
import type { Timeframe } from "@/types/market";

import styles from "@/features/analysis/analysis-dashboard.module.css";

const StockChart = dynamic(() => import("@/components/chart/stock-chart").then((module) => module.StockChart), { ssr: false, loading: () => <div className={styles.chartCanvas}>กำลังเตรียมกราฟ…</div> });
const frames: Array<{ id: Timeframe; label: string }> = [{ id: "15m", label: "15M" }, { id: "1h", label: "1H" }, { id: "4h", label: "4H" }, { id: "1d", label: "1D" }];

export function ChartPanel({ analysis }: { analysis: AnalysisResponse }) {
  const [frame, setFrame] = useState<Timeframe>("1d");
  const support = analysis.supports[0];
  const resistance = analysis.resistances[0];
  return <div className={styles.dashboard}><Card as="section"><div className={styles.timeframes} role="group" aria-label="กรอบเวลา">{frames.map((item) => <button key={item.id} className={`${styles.timeframeButton} ${frame === item.id ? styles.timeframeActive : ""}`} onClick={() => setFrame(item.id)} type="button">{item.label}</button>)}</div><div className={styles.chartShell}><StockChart candles={analysis.candles[frame]} /></div></Card><Card as="section"><h2 className={styles.sectionTitle}>แผนราคาจำลอง</h2><div className={styles.metricGrid}><Metric label="แนวรับใกล้" value={support ? `$${support.low}–${support.high}` : "ไม่มีข้อมูล"} /><Metric label="แนวต้านใกล้" value={resistance ? `$${resistance.low}–${resistance.high}` : "ไม่มีข้อมูล"} /><Metric label="สถานะ" value="รอการยืนยัน" /><Metric label="แท่งล่าสุด" value="สัญญาณชั่วคราว" /></div><p className={styles.notice}>โซนราคาเป็น Scenario จากข้อมูลจำลอง ไม่ใช่คำสั่งซื้อขาย</p></Card><Card as="section"><h2 className={styles.sectionTitle}>Indicator Snapshot</h2><div className={styles.metricGrid}><Metric label="EMA" value="เริ่มฟื้นตัว" /><Metric label="RSI14" value="เป็นกลาง" /><Metric label="MACD" value="โมเมนตัมดีขึ้น" /><Metric label="Volume" value="ยังไม่ยืนยัน" /></div></Card></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className={styles.metric}><span className={styles.metricLabel}>{label}</span><span className={styles.metricValue}>{value}</span></div>; }
