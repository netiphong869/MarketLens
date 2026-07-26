import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IndicatorSnapshot } from "@/components/chart/indicator-snapshot";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("IndicatorSnapshot", () => {
  it("shows real indicator values with plain-language interpretations", () => {
    const snapshot = {
      ...makeAnalysisResponse().technicalSnapshot["1d"],
      timeframe: "1d" as const,
      latestClose: 120,
      ema20: 115,
      ema50: 110,
      ema100: 105,
      ema200: 100,
      rsi14: 72,
      macdLine: 2.4,
      macdSignal: 1.8,
      macdHistogram: 0.6,
      adx14: 31,
      atr14: 3,
      currentVolume: 1_500_000,
      averageVolume20: 1_000_000,
      volumeRatio: 1.5,
      obv: 25_000_000,
      unavailable: {},
    };

    render(<IndicatorSnapshot snapshot={snapshot} />);

    expect(
      screen.getByRole("region", { name: "Indicator Snapshot 1D" }),
    ).toBeVisible();
    expect(screen.getByText("$120.00")).toBeVisible();
    expect(screen.getByText("$115.00")).toBeVisible();
    expect(screen.getByText("72.00")).toBeVisible();
    expect(screen.getByText("1.50x")).toBeVisible();
    expect(screen.getByText("ราคาอยู่เหนือ EMA20")).toBeVisible();
    expect(screen.getByText("RSI อยู่ในเขตซื้อมากเกินไป")).toBeVisible();
    expect(screen.getByText("โมเมนตัมเป็นบวก")).toBeVisible();
    expect(screen.getByText("แนวโน้มมีความแข็งแรง")).toBeVisible();
    expect(screen.getByText("Volume สูงกว่าค่าเฉลี่ย")).toBeVisible();
    expect(screen.queryByText("ดูจากคะแนนเทคนิค")).not.toBeInTheDocument();
  });

  it("shows the exact unavailable reason instead of zero", () => {
    const snapshot = {
      ...makeAnalysisResponse().technicalSnapshot["15m"],
      timeframe: "15m" as const,
      ema200: null,
      currentVolume: null,
      unavailable: {
        ema200:
          "ข้อมูลแท่งเทียนไม่เพียงพอสำหรับ EMA200 (ต้องมี 200 แท่ง; มี 50 แท่ง)",
        currentVolume: "ไม่มี Volume ที่ใช้คำนวณได้",
      },
    };

    render(<IndicatorSnapshot snapshot={snapshot} />);

    expect(screen.getAllByText("ไม่มีข้อมูล").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(
        "ข้อมูลแท่งเทียนไม่เพียงพอสำหรับ EMA200 (ต้องมี 200 แท่ง; มี 50 แท่ง)",
      ),
    ).toBeVisible();
    expect(screen.getByText("ไม่มี Volume ที่ใช้คำนวณได้")).toBeVisible();
  });
});
