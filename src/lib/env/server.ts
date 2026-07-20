import { z } from "zod";

const booleanFromString = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

const positiveIntegerFromString = (fallback: number) =>
  z
    .union([z.number(), z.string().regex(/^\d+$/)])
    .default(fallback)
    .transform((value) => Number(value))
    .pipe(z.number().int().positive());

const serverEnvSchema = z.object({
  TWELVE_DATA_API_KEY: z.string().min(1).optional(),
  FINNHUB_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  SEC_USER_AGENT: z.string().min(3).optional(),
  USAGE_SIGNING_SECRET: z.string().min(16).optional(),
  MOCK_DATA_MODE: booleanFromString.default(true),
  DAILY_ANALYSIS_LIMIT: positiveIntegerFromString(10),
  CACHE_TTL_SECONDS: positiveIntegerFromString(300),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  values: Record<string, string | number | boolean | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(values);
}

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv(process.env);
  return cachedEnv;
}
