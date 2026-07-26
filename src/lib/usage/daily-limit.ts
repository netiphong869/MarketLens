import { AppError } from "@/lib/errors/app-error";

interface UsageEntry {
  day: string;
  used: number;
}

export interface UsageStatus {
  used: number;
  remaining: number;
  limit: number;
}

export class DailyUsageCounter {
  private readonly usage = new Map<string, UsageEntry>();

  constructor(
    private readonly limit = 10,
    private readonly now: () => Date = () => new Date(),
  ) {}

  status(clientId: string): UsageStatus {
    const entry = this.currentEntry(clientId);
    return {
      used: entry.used,
      remaining: Math.max(0, this.limit - entry.used),
      limit: this.limit,
    };
  }

  assertAvailable(clientId: string): void {
    if (this.currentEntry(clientId).used >= this.limit) {
      throw dailyLimitError(this.limit);
    }
  }

  commitSuccess(clientId: string): UsageStatus {
    const entry = this.currentEntry(clientId);
    if (entry.used >= this.limit) {
      throw dailyLimitError(this.limit);
    }
    entry.used += 1;
    return this.status(clientId);
  }

  private currentEntry(clientId: string): UsageEntry {
    const day = bangkokDateKey(this.now());
    const existing = this.usage.get(clientId);
    if (existing?.day === day) return existing;
    const fresh = { day, used: 0 };
    this.usage.set(clientId, fresh);
    return fresh;
  }
}

function dailyLimitError(limit: number): AppError {
  return new AppError(
    "DAILY_LIMIT_REACHED",
    `ครบจำนวนวิเคราะห์ ${limit} รอบของวันนี้แล้ว`,
    429,
    false,
  );
}

export function bangkokDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
