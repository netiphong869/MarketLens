import { describe, expect, it } from "vitest";

import { normalizeSymbol } from "@/lib/validation/symbol";

describe("normalizeSymbol", () => {
  it("normalizes a supported ticker", () => {
    expect(normalizeSymbol(" brk.b ")).toBe("BRK.B");
  });

  it.each(["", "../FN", "FN USD", "<FN>", "ABCDEFGHIJK"])(
    "rejects unsafe symbol %s",
    (value) => {
      expect(() => normalizeSymbol(value)).toThrowError(/ชื่อย่อหุ้น/);
    },
  );
});
