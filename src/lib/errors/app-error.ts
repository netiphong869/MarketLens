export type AppErrorCode =
  | "INVALID_SYMBOL"
  | "SYMBOL_NOT_FOUND"
  | "UNSUPPORTED_SECURITY_TYPE"
  | "INSUFFICIENT_DATA"
  | "LOW_DATA_QUALITY"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_AUTH_ERROR"
  | "MARKET_DATA_STALE"
  | "SEC_DATA_UNAVAILABLE"
  | "NEWS_UNAVAILABLE"
  | "GEMINI_UNAVAILABLE"
  | "DAILY_LIMIT_REACHED"
  | "REQUEST_TIMEOUT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "MOCK_MODE_ACTIVE";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export interface SafeErrorResponse {
  error: {
    code: AppErrorCode;
    message: string;
    retryable: boolean;
  };
}

export function toSafeErrorResponse(error: unknown): SafeErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    };
  }

  return {
    error: {
      code: "INTERNAL_ERROR",
      message: "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง",
      retryable: true,
    },
  };
}
