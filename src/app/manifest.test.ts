import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("is installable with required icon sizes", () => {
    const value = manifest();
    expect(value.display).toBe("standalone");
    expect(value.icons?.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(value.icons?.some((icon) => icon.sizes === "512x512")).toBe(true);
  });
});
