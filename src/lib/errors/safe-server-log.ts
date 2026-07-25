import { AppError } from "@/lib/errors/app-error";

interface SafeServerError {
  name: string;
  code: string;
  status: number;
  frames: string[];
}

export function safeServerError(error: unknown): SafeServerError {
  const appError = error instanceof AppError ? error : null;
  const stack = error instanceof Error ? error.stack : undefined;
  return {
    name: error instanceof Error ? error.name : "UnknownError",
    code: appError?.code ?? "INTERNAL_ERROR",
    status: appError?.status ?? 500,
    frames: (stack?.split(/\r?\n/).slice(1) ?? [])
      .map((line) => line.trim())
      .filter((line) => line.startsWith("at ") && !line.includes("http"))
      .slice(0, 4),
  };
}
