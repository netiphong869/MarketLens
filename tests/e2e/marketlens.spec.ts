import { expect, test } from "@playwright/test";

test("analyzes a mock ticker and navigates every result section", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("ชื่อย่อหุ้น").fill("FN");
  await page.getByRole("button", { name: "วิเคราะห์" }).click();

  const companyProfile = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Fabrinet" }),
  });
  await expect(
    companyProfile.getByRole("heading", { name: "Fabrinet" }),
  ).toBeVisible();
  await expect(companyProfile.getByText("ข้อมูลจำลอง")).toBeVisible();

  await page.getByRole("tab", { name: "กราฟ" }).click();
  await expect(
    page.getByRole("region", { name: "Indicator Snapshot 1D" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "15M" }).click();
  await expect(
    page.getByRole("region", { name: "Indicator Snapshot 15M" }),
  ).toBeVisible();
  await expect(page.getByText("ดูจากคะแนนเทคนิค")).toHaveCount(0);

  for (const tab of ["กราฟ", "พื้นฐาน", "ความเสี่ยง", "สรุป", "ภาพรวม"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
});

test("keeps the mobile layout inside the viewport", async ({ page }) => {
  await page.goto("/");
  const documentWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  const viewportWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );

  expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
});
