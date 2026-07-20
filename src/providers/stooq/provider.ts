import { AppError } from "@/lib/errors/app-error";
import type { Candle } from "@/types/market";

export class StooqProvider {
  readonly name = "Stooq backup";
  constructor(private readonly fetchFn: typeof fetch = fetch) {}
  async getDailyCandles(symbol: string): Promise<Candle[]> {
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&i=d`;
    const response = await this.fetchFn(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new AppError("PROVIDER_UNAVAILABLE", "แหล่งข้อมูลสำรองไม่พร้อมใช้งาน", 502, true);
    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);
    return rows.flatMap((row) => { const [date, ...raw] = row.split(","); const values = raw.map(Number); if (!date || values.length < 5 || values.some((value) => !Number.isFinite(value))) return []; return [{ time: `${date}T00:00:00.000Z`, open: values[0], high: values[1], low: values[2], close: values[3], volume: values[4], closed: true }]; });
  }
}
