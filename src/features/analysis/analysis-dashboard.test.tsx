import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AnalysisDashboard } from "@/features/analysis/analysis-dashboard";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("AnalysisDashboard", () => {
  it("uses the server analysis route by default", async () => {
    const response = makeAnalysisResponse();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: response, cached: false, usage: { used: 1, remaining: 9, limit: 10 } }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(<AnalysisDashboard />);
    await user.type(screen.getByLabelText("ชื่อย่อหุ้น"), "FN");
    await user.click(screen.getByRole("button", { name: "วิเคราะห์" }));
    expect(await screen.findByRole("heading", { name: "Fabrinet" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", expect.objectContaining({ method: "POST" }));
    fetchMock.mockRestore();
  });

  it("moves from search to a clearly labeled mock analysis", async () => {
    const analyze = vi.fn().mockResolvedValue(makeAnalysisResponse());
    const user = userEvent.setup();
    render(<AnalysisDashboard analyze={analyze} />);

    expect(screen.getByRole("heading", { name: /มองหุ้นให้ครบทุกมุม/ })).toBeVisible();
    await user.type(screen.getByLabelText("ชื่อย่อหุ้น"), "fn");
    await user.click(screen.getByRole("button", { name: "วิเคราะห์" }));

    await waitFor(() => expect(analyze).toHaveBeenCalledWith("FN"));
    expect(await screen.findByText("ข้อมูลจำลอง")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Fabrinet" })).toBeVisible();
    expect(screen.getByText("เหลือ 9 จาก 10 รอบ")).toBeVisible();
  });

  it("navigates the five result sections without running analysis again", async () => {
    const analyze = vi.fn().mockResolvedValue(makeAnalysisResponse());
    const user = userEvent.setup();
    render(<AnalysisDashboard analyze={analyze} initialSymbol="FN" />);

    expect(await screen.findByRole("heading", { name: "Fabrinet" })).toBeVisible();

    const destinations = [
      ["กราฟ", "แผนราคาจำลอง"],
      ["พื้นฐาน", "การเติบโตและผลประกอบการ"],
      ["ความเสี่ยง", "ปัจจัยความเสี่ยงหลัก"],
      ["สรุป", "MarketLens Insight"],
      ["ภาพรวม", "คะแนนตามระยะถือ"],
    ] as const;

    for (const [tab, content] of destinations) {
      await user.click(screen.getByRole("tab", { name: tab }));
      expect(screen.getByText(content)).toBeVisible();
    }

    expect(analyze).toHaveBeenCalledTimes(1);
  });

  it("shows a safe retry state when analysis fails", async () => {
    const analyze = vi.fn().mockRejectedValue(new Error("provider secret"));
    const user = userEvent.setup();
    render(<AnalysisDashboard analyze={analyze} />);

    await user.type(screen.getByLabelText("ชื่อย่อหุ้น"), "FN");
    await user.click(screen.getByRole("button", { name: "วิเคราะห์" }));

    expect(await screen.findByText("วิเคราะห์ไม่สำเร็จ")).toBeVisible();
    expect(screen.queryByText("provider secret")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ลองอีกครั้ง" })).toBeVisible();
  });
});
