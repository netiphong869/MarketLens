import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ChartPanel } from "@/components/chart/chart-panel";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

vi.mock("next/dynamic", () => ({
  default: () =>
    function ChartTestDouble({
      candles,
    }: {
      candles: Array<{ close: number }>;
    }) {
      return (
        <div
          aria-label={`กราฟทดสอบ close ${candles.at(-1)?.close ?? "none"}`}
        />
      );
    },
}));

describe("ChartPanel", () => {
  it("changes the indicator snapshot immediately with the selected timeframe", async () => {
    const analysis = createMockAnalysisResponse();
    const dailyClose = analysis.technicalSnapshot["1d"].latestClose!;
    const intradayClose = analysis.technicalSnapshot["15m"].latestClose!;
    const user = userEvent.setup();

    render(<ChartPanel analysis={analysis} />);

    expect(dailyClose).not.toBe(intradayClose);
    expect(screen.getByText(`$${dailyClose.toFixed(2)}`)).toBeVisible();
    expect(
      screen.getByLabelText(`กราฟทดสอบ close ${dailyClose}`),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "15M" }));

    expect(screen.getByText(`$${intradayClose.toFixed(2)}`)).toBeVisible();
    expect(
      screen.getByLabelText(`กราฟทดสอบ close ${intradayClose}`),
    ).toBeVisible();
    expect(
      screen.queryByText(`$${dailyClose.toFixed(2)}`),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("ดูจากคะแนนเทคนิค")).not.toBeInTheDocument();
  });
});
