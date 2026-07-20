import { AppError } from "@/lib/errors/app-error";

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

export function normalizeSymbol(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!SYMBOL_PATTERN.test(normalized)) {
    throw new AppError(
      "INVALID_SYMBOL",
      "ชื่อย่อหุ้นไม่ถูกต้อง กรุณาใช้ตัวอักษร ตัวเลข จุด หรือขีดกลางเท่านั้น",
      400,
      false,
    );
  }
  return normalized;
}
