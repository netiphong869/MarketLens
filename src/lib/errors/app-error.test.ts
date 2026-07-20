import { describe, expect, it } from "vitest";

import { AppError, toSafeErrorResponse } from "@/lib/errors/app-error";

describe("AppError", () => {
  it("returns a stable safe payload without exposing the internal cause", () => {
    const error = new AppError(
      "INTERNAL_ERROR",
      "ระบบขัดข้องชั่วคราว",
      500,
      false,
      new Error("secret path C:\\private\\key.txt"),
    );

    const response = toSafeErrorResponse(error);
    const serialized = JSON.stringify(response);

    expect(response).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "ระบบขัดข้องชั่วคราว",
        retryable: false,
      },
    });
    expect(serialized).not.toContain("private");
    expect(serialized).not.toContain("key.txt");
  });

  it("maps unknown errors to a generic retryable response", () => {
    expect(toSafeErrorResponse(new Error("database password"))).toEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง",
        retryable: true,
      },
    });
  });
});
