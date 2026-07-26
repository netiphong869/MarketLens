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

  it("stops reading a streamed response as soon as the decompressed limit is exceeded", async () => {
    let cancelled = false;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"data":"'));
        controller.enqueue(encoder.encode("x".repeat(64)));
        controller.enqueue(encoder.encode('"}'));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      requestJson("https://provider.test/quote", {
        fetchFn,
        maxResponseBytes: 32,
      }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" } satisfies Partial<AppError>);
    expect(cancelled).toBe(true);
  });

  it("disables redirects for provider requests by default", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await requestJson("https://provider.test/quote", { fetchFn });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://provider.test/quote",
      expect.objectContaining({ redirect: "error" }),
    );
  });
});
