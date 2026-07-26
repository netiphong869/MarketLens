import { AppError } from "@/lib/errors/app-error";

type FetchFunction = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

interface RequestJsonOptions extends RequestInit {
  fetchFn?: FetchFunction;
  retries?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
}

export async function requestJson<T>(
  url: string,
  {
    fetchFn = fetch,
    retries = 1,
    timeoutMs = 8_000,
    maxResponseBytes = 1_000_000,
    ...init
  }: RequestJsonOptions = {},
): Promise<T> {
  const maxAttempts = Math.min(2, Math.max(1, retries + 1));
  let finalError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchFn(url, {
        ...init,
        redirect: init.redirect ?? "error",
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      });

      if (response.status === 429) {
        throw new AppError(
          "PROVIDER_RATE_LIMITED",
          "ผู้ให้บริการจำกัดจำนวนการเรียกชั่วคราว",
          429,
          false,
          { providerStatus: response.status },
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          "PROVIDER_AUTH_ERROR",
          "ผู้ให้บริการปฏิเสธการยืนยันตัวตน",
          502,
          false,
          { providerStatus: response.status },
        );
      }
      if (!response.ok) {
        const error = new AppError(
          "PROVIDER_UNAVAILABLE",
          "ผู้ให้บริการข้อมูลไม่พร้อมใช้งาน",
          502,
          response.status >= 500,
          { providerStatus: response.status },
        );
        if (response.status < 500 || attempt === maxAttempts) throw error;
        finalError = error;
        continue;
      }

      const statedSize = Number(response.headers.get("content-length") ?? "0");
      if (statedSize > maxResponseBytes) {
        await response.body?.cancel();
        throw oversizedResponseError();
      }
      const body = await readBoundedText(response, maxResponseBytes);
      try {
        return JSON.parse(body) as T;
      } catch {
        throw new AppError(
          "PROVIDER_UNAVAILABLE",
          "รูปแบบข้อมูลจากผู้ให้บริการไม่ถูกต้อง",
          502,
          false,
        );
      }
    } catch (error) {
      if (error instanceof AppError && !error.retryable) throw error;
      if (error instanceof DOMException && error.name === "TimeoutError") {
        finalError = new AppError(
          "REQUEST_TIMEOUT",
          "ผู้ให้บริการใช้เวลาตอบกลับนานเกินไป",
          504,
          attempt < maxAttempts,
        );
      } else {
        finalError = error;
      }
      if (attempt === maxAttempts) break;
    }
  }

  if (finalError instanceof AppError) throw finalError;
  throw new AppError(
    "PROVIDER_UNAVAILABLE",
    "ไม่สามารถเชื่อมต่อผู้ให้บริการข้อมูลได้",
    502,
    true,
  );
}

async function readBoundedText(
  response: Response,
  maxResponseBytes: number,
): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxResponseBytes) {
        await reader.cancel();
        throw oversizedResponseError();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

function oversizedResponseError(): AppError {
  return new AppError(
    "PROVIDER_UNAVAILABLE",
    "ข้อมูลจากผู้ให้บริการมีขนาดเกินขีดจำกัด",
    502,
    false,
  );
}
