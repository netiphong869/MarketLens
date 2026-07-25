import { AppError } from "@/lib/errors/app-error";
import type { Candle } from "@/types/market";

export class StooqProvider {
  readonly name = "Stooq backup";
  constructor(private readonly fetchFn: typeof fetch = fetch) {}
  async getDailyCandles(symbol: string): Promise<Candle[]> {
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&i=d`;
    const response = await this.fetchFn(url, {
      signal: AbortSignal.timeout(8000),
      redirect: "error",
      headers: { Accept: "text/csv" },
    });
    if (!response.ok) throw new AppError("PROVIDER_UNAVAILABLE", "แหล่งข้อมูลสำรองไม่พร้อมใช้งาน", 502, true);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("text/html")) throw unavailableSchemaError();
    const lines = (await response.text()).trim().split(/\r?\n/);
    if (lines[0]?.trim() !== "Date,Open,High,Low,Close,Volume") {
      throw unavailableSchemaError();
    }
    const candles = lines.slice(1).flatMap((row) => {
      const [date, ...raw] = row.split(",");
      const values = raw.map(Number);
      if (!date || values.length !== 5 || values.some((value) => !Number.isFinite(value))) return [];
      return [{ time: `${date}T00:00:00.000Z`, open: values[0], high: values[1], low: values[2], close: values[3], volume: values[4], closed: true }];
    });
    if (!candles.length) throw unavailableSchemaError();
    return candles;
  }
}

function unavailableSchemaError(): AppError {
  return new AppError(
    "PROVIDER_UNAVAILABLE",
    "แหล่งข้อมูลสำรองไม่ได้ส่งแท่งราคาตามรูปแบบที่รองรับ",
    502,
    false,
  );
}
