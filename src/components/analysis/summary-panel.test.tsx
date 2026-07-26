import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SummaryPanel } from "@/components/analysis/summary-panel";
import { createTemplateSummary } from "@/engine/summary/template-summary";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("SummaryPanel", () => {
  it("renders deterministic evidence in the required reading order", () => {
    const analysis = makeAnalysisResponse();

    const { container } = render(<SummaryPanel analysis={analysis} />);

    expect(screen.getByText("สรุปโดย MarketLens")).toBeVisible();
    expect(screen.queryByText("Template Fallback")).not.toBeInTheDocument();
    expect(screen.getByText(analysis.summary.overview)).toBeVisible();

    const headings = [...container.querySelectorAll("h2")].map(
      (heading) => heading.textContent,
    );
    expect(headings).toEqual([
      "บทสรุป",
      "สถานะตามระยะเวลา",
      "เหตุผลสนับสนุน",
      "ความเสี่ยง",
      "สิ่งที่ต้องติดตาม",
      "สถานการณ์แบบมีเงื่อนไข",
      "ข้อจำกัดของข้อมูล",
      "ข้อควรทราบ",
    ]);

    expect(
      screen.getByRole("region", { name: "สถานะระยะสั้น" }),
    ).toHaveTextContent("เป็นกลาง");
    expect(
      screen.getByRole("region", { name: "สถานะระยะกลาง" }),
    ).toHaveTextContent("เป็นกลาง");
    expect(
      screen.getByRole("region", { name: "สถานะระยะยาว" }),
    ).toHaveTextContent("มีสัญญาณบวก");
    expect(
      screen.getByText("รายได้เติบโต 14.2% เมื่อเทียบกับปีก่อน"),
    ).toBeVisible();
    expect(
      screen.getByText("Risk Score 44 จาก 100 อยู่ในระดับปานกลาง"),
    ).toBeVisible();
    expect(screen.getByText("กรณีดี")).toBeVisible();
    expect(screen.getByText("กรณีกลาง")).toBeVisible();
    expect(screen.getByText("กรณีแย่")).toBeVisible();
  });

  it("hides a horizon score and names missing market coverage", () => {
    const analysis = makeAnalysisResponse();
    analysis.scores.coverage.market = {
      percent: 0,
      status: "insufficient",
      missing: ["benchmark", "sector"],
    };
    analysis.summary = createTemplateSummary(analysis);

    render(<SummaryPanel analysis={analysis} />);

    const short = screen.getByRole("region", { name: "สถานะระยะสั้น" });
    expect(short).toHaveTextContent("ข้อมูลไม่เพียงพอ");
    expect(short).toHaveTextContent("ข้อมูล Market/Sector ไม่เพียงพอ");
    expect(within(short).queryByText("59/100")).not.toBeInTheDocument();
  });

  it("keeps Gemini or template details inside the source disclosure", async () => {
    const user = userEvent.setup();
    const templateAnalysis = makeAnalysisResponse({
      summarySource: "template",
      summaryModel: null,
    });
    const { rerender } = render(<SummaryPanel analysis={templateAnalysis} />);

    const disclosure = screen.getByText("รายละเอียดที่มาของสรุป");
    expect(screen.getByText("ใช้ Deterministic Template")).not.toBeVisible();
    await user.click(disclosure);
    expect(screen.getByText("ใช้ Deterministic Template")).toBeVisible();

    rerender(
      <SummaryPanel
        analysis={makeAnalysisResponse({
          summarySource: "gemini",
          summaryModel: "models/gemini-stable-flash",
        })}
      />,
    );

    expect(screen.getByText("สรุปโดย MarketLens")).toBeVisible();
    expect(
      screen.getByText("Gemini ช่วยเรียบเรียงเฉพาะ Verdict"),
    ).toBeVisible();
    expect(screen.getByText("โมเดล gemini-stable-flash")).toBeVisible();
  });
});
