import { TtlCache } from "@/lib/cache/ttl-cache";
import { getServerEnv } from "@/lib/env/server";
import { DailyUsageCounter } from "@/lib/usage/daily-limit";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";
import { analyzeSnapshot } from "@/engine/scoring/analysis-engine";
import { AnalysisService } from "@/services/analysis-service";
import { buildLiveAnalysis } from "@/services/live-analysis-builder";
import type { AnalysisResponse } from "@/types/analysis";
import { TwelveDataProvider } from "@/providers/twelve-data/provider";
import { FinnhubProvider } from "@/providers/finnhub/provider";
import { SecEdgarProvider } from "@/providers/sec-edgar/provider";
import { GeminiProvider } from "@/providers/gemini/provider";
import { FallbackCompanyProfileProvider } from "@/providers/fallback/company-profile-provider";
import { AppError } from "@/lib/errors/app-error";

const env = getServerEnv();
export const defaultAnalysisService = new AnalysisService({
  build: async (symbol) => {
    if (env.MOCK_DATA_MODE) {
      const response = createMockAnalysisResponse(symbol);
      response.scores = analyzeSnapshot({
        symbol,
        quote: response.quote,
        profile: response.profile,
        candles: response.candles,
        fundamentals: response.fundamentals,
        events: response.events,
      });
      return response;
    }
    if (
      !env.TWELVE_DATA_API_KEY ||
      !env.FINNHUB_API_KEY ||
      !env.SEC_USER_AGENT
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        "ยังตั้งค่าแหล่งข้อมูลจริงไม่ครบ กรุณาเปิด Mock Mode หรือเพิ่มตัวแปรฝั่งเซิร์ฟเวอร์",
        503,
        false,
      );
    }
    const market = new TwelveDataProvider(env.TWELVE_DATA_API_KEY);
    const finnhub = new FinnhubProvider(env.FINNHUB_API_KEY);
    const sec = new SecEdgarProvider(env.SEC_USER_AGENT);
    const companyProfile = new FallbackCompanyProfileProvider(finnhub, sec);
    const response = await buildLiveAnalysis(symbol, {
      market,
      company: {
        getProfile: (value) => companyProfile.getProfile(value),
        getFundamentals: (value) => sec.getFundamentals(value),
      },
      news: finnhub,
    });
    if (env.GEMINI_API_KEY) {
      const generated = await new GeminiProvider(env.GEMINI_API_KEY).summarize(
        response,
      );
      response.summary = generated.summary;
      response.summarySource = generated.source;
    }
    return response;
  },
  cache: new TtlCache<AnalysisResponse>(),
  usage: new DailyUsageCounter(env.DAILY_ANALYSIS_LIMIT),
  ttlSeconds: env.CACHE_TTL_SECONDS,
});
