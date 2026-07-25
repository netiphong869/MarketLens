import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SummaryPanel } from "@/components/analysis/summary-panel";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("SummaryPanel source disclosure", () => {
  it("shows the discovered Gemini model only for a validated Gemini summary", () => {
    render(
      <SummaryPanel
        analysis={makeAnalysisResponse({
          summarySource: "gemini",
          summaryModel: "models/gemini-3.5-flash",
        })}
      />,
    );

    expect(
      screen.getByText("Gemini · gemini-3.5-flash"),
    ).toBeInTheDocument();
  });

  it("shows Template Fallback when Gemini was not used", () => {
    render(
      <SummaryPanel
        analysis={makeAnalysisResponse({
          summarySource: "template",
          summaryModel: null,
        })}
      />,
    );

    expect(screen.getByText("Template Fallback")).toBeInTheDocument();
  });
});
