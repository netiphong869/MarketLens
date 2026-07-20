import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ScoreRing } from "@/components/ui/score-ring";

describe("ScoreRing", () => {
  it("exposes the numeric value and a text level to assistive technology", () => {
    render(
      <ScoreRing
        score={72}
        label="เทคนิค"
        level="แข็งแรง"
        tone="positive"
      />,
    );

    const meter = screen.getByRole("meter", { name: "เทคนิค" });
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuenow", "72");
    expect(screen.getByText("แข็งแรง")).toBeVisible();
  });

  it("clamps visual and accessible values to the supported range", () => {
    render(
      <ScoreRing
        score={140}
        label="คุณภาพข้อมูล"
        level="ดี"
        tone="primary"
      />,
    );

    expect(
      screen.getByRole("meter", { name: "คุณภาพข้อมูล" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("100")).toBeVisible();
  });
});
