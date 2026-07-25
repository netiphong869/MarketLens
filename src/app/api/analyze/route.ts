import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, toSafeErrorResponse } from "@/lib/errors/app-error";
import { safeServerError } from "@/lib/errors/safe-server-log";
import { defaultAnalysisService } from "@/services/default-analysis-service";

const requestSchema = z.object({ symbol: z.string().min(1).max(20) });
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "ข้อมูลคำขอไม่ถูกต้อง", 400, false);
    const clientId = request.headers.get("x-marketlens-client")?.slice(0, 100) || "local-device";
    return NextResponse.json(await defaultAnalysisService.analyze(parsed.data.symbol, clientId), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[MarketLens] analyze_failed", safeServerError(error));
    const safe = toSafeErrorResponse(error);
    return NextResponse.json(safe, {
      status: error instanceof AppError ? error.status : 500,
    });
  }
}
