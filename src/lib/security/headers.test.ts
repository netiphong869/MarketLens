import { describe, expect, it } from "vitest";

import { securityHeaders } from "@/lib/security/headers";

describe("security headers", () => {
  it("defines CSP and browser hardening without unsafe-eval", () => {
    const headers = Object.fromEntries(securityHeaders.map((item) => [item.key, item.value]));
    expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(headers["Content-Security-Policy"]).not.toContain("'unsafe-eval'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});
