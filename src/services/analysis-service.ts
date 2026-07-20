import { TtlCache } from "@/lib/cache/ttl-cache";
import { DailyUsageCounter, type UsageStatus } from "@/lib/usage/daily-limit";
import { normalizeSymbol } from "@/lib/validation/symbol";
import type { AnalysisResponse } from "@/types/analysis";

export interface AnalysisResult { data: AnalysisResponse; cached: boolean; usage: UsageStatus }
interface Dependencies { build: (symbol: string) => Promise<AnalysisResponse>; cache: TtlCache<AnalysisResponse>; usage: DailyUsageCounter; ttlSeconds: number }
export class AnalysisService {
  constructor(private readonly dependencies: Dependencies) {}
  async analyze(rawSymbol: string, clientId: string): Promise<AnalysisResult> {
    const symbol = normalizeSymbol(rawSymbol); const key = `analysis:${symbol}`; const cached = this.dependencies.cache.get(key);
    if (cached) return { data: cached, cached: true, usage: this.dependencies.usage.status(clientId) };
    const data = await this.dependencies.build(symbol);
    this.dependencies.cache.set(key, data, this.dependencies.ttlSeconds);
    return { data, cached: false, usage: this.dependencies.usage.commitSuccess(clientId) };
  }
}
