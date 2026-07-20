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
});
