import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { requestJson } from "@/lib/api/http";

describe("requestJson", () => {
  it("does not retry provider rate limits", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "limit" }), {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      requestJson("https://provider.test/quote", { fetchFn, retries: 2 }),
    ).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED" } satisfies Partial<AppError>);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("retries one eligible 5xx response and returns parsed JSON", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response("temporary", { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ price: 100 }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await expect(
      requestJson<{ price: number }>("https://provider.test/quote", {
        fetchFn,
        retries: 1,
      }),
    ).resolves.toEqual({ price: 100 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("rejects oversized responses without returning their content", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("x".repeat(100), {
        status: 200,
        headers: { "content-length": "100" },
      }),
    );

    await expect(
      requestJson("https://provider.test/quote", {
        fetchFn,
        maxResponseBytes: 50,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" } satisfies Partial<AppError>);
  });
});
