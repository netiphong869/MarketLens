import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OverviewPanel } from "@/components/stock/overview-panel";
import { makeAnalysisResponse } from "@/test/fixtures";

describe("OverviewPanel coverage states", () => {
  it("shows Partial/Insufficient and no neutral score for unavailable modules", () => {
    const analysis = makeAnalysisResponse();
    analysis.scores.market = {
      score: null,
      availableWeight: 0,
      reasons: [],
      warnings: ["ไม่มีข้อมูลตลาด"],
      components: {},
    };
    analysis.scores.events = {
      score: null,
      availableWeight: 0,
      reasons: [],
      warnings: ["ไม่มีข้อมูลข่าว"],
      components: {},
    };
    analysis.scores.coverage.market = {
      percent: 0,
      status: "insufficient",
      missing: ["บริบทตลาด"],
    };
    analysis.scores.coverage.news = {
      percent: 0,
      status: "insufficient",
      missing: ["ข่าว"],
    };
    analysis.scores.horizons.short = {
      score: null,
      status: "partial",
      missingModules: ["market", "news"],
    };

    render(<OverviewPanel analysis={analysis} />);

    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getAllByText("ไม่มีข้อมูล")).toHaveLength(2);
    expect(screen.queryByText("50/100")).not.toBeInTheDocument();
    expect(screen.getAllByText("0%")).toHaveLength(2);
  });
});
