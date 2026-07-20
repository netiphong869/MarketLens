import { render, screen } from "@testing-library/react";
import { AlertTriangle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { RiskMeter } from "@/components/ui/risk-meter";

describe("design system primitives", () => {
  it("renders semantic content instead of relying on color alone", () => {
    render(
      <>
        <Badge tone="warning">รอการยืนยัน</Badge>
        <RiskMeter score={72} label="ความเสี่ยง" />
        <Card as="section">
          <h2>ข้อมูลบริษัท</h2>
        </Card>
      </>,
    );

    expect(screen.getByText("รอการยืนยัน")).toBeVisible();
    expect(screen.getByRole("meter", { name: "ความเสี่ยง" })).toHaveAttribute(
      "aria-valuenow",
      "72",
    );
    expect(screen.getByRole("heading", { name: "ข้อมูลบริษัท" })).toBeVisible();
  });

  it("offers a useful retry action for errors", async () => {
    const retry = vi.fn();
    render(
      <ErrorState
        icon={AlertTriangle}
        title="ดึงข้อมูลไม่สำเร็จ"
        description="กรุณาลองใหม่"
        actionLabel="ลองอีกครั้ง"
        onAction={retry}
      />,
    );

    screen.getByRole("button", { name: "ลองอีกครั้ง" }).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it("supports disabled actions and informative empty states", () => {
    render(
      <>
        <Button disabled>วิเคราะห์</Button>
        <EmptyState
          title="ยังไม่มีผลวิเคราะห์"
          description="ค้นหาหุ้นเพื่อเริ่มต้น"
        />
      </>,
    );

    expect(screen.getByRole("button", { name: "วิเคราะห์" })).toBeDisabled();
    expect(screen.getByText("ค้นหาหุ้นเพื่อเริ่มต้น")).toBeVisible();
  });
});
