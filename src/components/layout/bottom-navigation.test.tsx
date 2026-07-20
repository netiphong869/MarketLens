import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ANALYSIS_TABS,
  BottomNavigation,
} from "@/components/layout/bottom-navigation";

describe("BottomNavigation", () => {
  it("renders the five approved tabs with one active tab", () => {
    render(<BottomNavigation activeTab="overview" onChange={vi.fn()} />);

    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.getByRole("tab", { name: "ภาพรวม" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(ANALYSIS_TABS.map((tab) => tab.label)).toEqual([
      "ภาพรวม",
      "กราฟ",
      "พื้นฐาน",
      "ความเสี่ยง",
      "สรุป",
    ]);
  });

  it("reports the selected tab without owning feature state", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<BottomNavigation activeTab="overview" onChange={onChange} />);

    await user.click(screen.getByRole("tab", { name: "ความเสี่ยง" }));

    expect(onChange).toHaveBeenCalledWith("risk");
  });
});
