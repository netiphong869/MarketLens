import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/analyze/route";

describe("POST /api/analyze", () => {
  it("rejects an invalid symbol with a safe error", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: "FN<script>" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("INVALID_SYMBOL");
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("rejects an oversized JSON body before attempting analysis", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol: "AAPL", padding: "x".repeat(5_000) }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns real technical snapshots for all four timeframes", async () => {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-marketlens-client": "snapshot-route-test",
        },
        body: JSON.stringify({ symbol: "AAPL" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Object.keys(body.data.technicalSnapshot)).toEqual([
      "15m",
      "1h",
      "4h",
      "1d",
    ]);
    expect(body.data.technicalSnapshot["1d"].ema200).toEqual(
      expect.any(Number),
    );
    expect(JSON.stringify(body)).not.toContain("ดูจากคะแนนเทคนิค");
  });
});
