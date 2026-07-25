"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import type { Candle } from "@/types/market";

import styles from "@/features/analysis/analysis-dashboard.module.css";

export function StockChart({
  candles,
  dataLabel,
}: {
  candles: Candle[];
  dataLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 310,
      layout: { background: { type: ColorType.Solid, color: "#fbfcfe" }, textColor: "#667085" },
      grid: { vertLines: { color: "#eef2f6" }, horzLines: { color: "#eef2f6" } },
      rightPriceScale: { borderColor: "#dce3ec" },
      timeScale: { borderColor: "#dce3ec", timeVisible: true },
    });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#168f68", downColor: "#c53b42", wickUpColor: "#168f68", wickDownColor: "#c53b42", borderVisible: false });
    series.setData(candles.slice(-120).map((candle) => ({ time: Math.floor(new Date(candle.time).getTime() / 1000) as never, open: candle.open, high: candle.high, low: candle.low, close: candle.close })));
    chart.timeScale().fitContent();
    const observer = new ResizeObserver(([entry]) => chart.applyOptions({ width: entry.contentRect.width }));
    observer.observe(container);
    return () => { observer.disconnect(); chart.remove(); };
  }, [candles]);

  return <div className={styles.chartCanvas} ref={containerRef} role="img" aria-label={`กราฟแท่งเทียน${dataLabel}`} />;
}
