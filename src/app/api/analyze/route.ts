import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, toSafeErrorResponse } from "@/lib/errors/app-error";
import { safeServerError } from "@/lib/errors/safe-server-log";
import { defaultAnalysisService } from "@/services/default-analysis-service";

const requestSchema = z.object({ symbol: z.string().min(1).max(20) });
const MAX_REQUEST_BYTES = 4_096;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = requestSchema.safeParse(await readBoundedJson(request));
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

async function readBoundedJson(request: Request): Promise<unknown> {
  const statedSize = Number(request.headers.get("content-length") ?? "0");
  if (statedSize > MAX_REQUEST_BYTES) throw requestTooLargeError();
  if (!request.body) {
    throw new AppError("VALIDATION_ERROR", "ข้อมูลคำขอไม่ถูกต้อง", 400, false);
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw requestTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError("VALIDATION_ERROR", "ข้อมูลคำขอไม่ถูกต้อง", 400, false);
  }
}

function requestTooLargeError(): AppError {
  return new AppError(
    "VALIDATION_ERROR",
    "ข้อมูลคำขอมีขนาดใหญ่เกินขีดจำกัด",
    413,
    false,
  );
}
