import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { safeServerError } from "@/lib/errors/safe-server-log";

describe("safeServerError", () => {
  it("keeps diagnostic frames while removing messages, URLs, and credentials", () => {
    const sensitive = ["alpha", "beta", "gamma"].join("-");
    const error = new Error(
      `request failed https://provider.test/data?apikey=${sensitive}`,
    );
    error.stack =
      `Error: request failed https://provider.test/data?apikey=${sensitive}\n` +
      "    at buildLiveAnalysis (/var/task/server/chunks/app.js:10:2)\n" +
      "    at async POST (/var/task/server/chunks/route.js:20:4)";

    const result = safeServerError(error);
    const serialized = JSON.stringify(result);

    expect(result).toEqual({
      name: "Error",
      code: "INTERNAL_ERROR",
      status: 500,
      frames: [
        "at buildLiveAnalysis (/var/task/server/chunks/app.js:10:2)",
        "at async POST (/var/task/server/chunks/route.js:20:4)",
      ],
    });
    expect(serialized).not.toContain(sensitive);
    expect(serialized).not.toContain("provider.test");
  });

  it("reports an AppError code without exposing its message or cause", () => {
    const sensitive = ["alpha", "beta", "gamma"].join("-");
    const error = new AppError(
      "PROVIDER_AUTH_ERROR",
      `credential ${sensitive} failed`,
      502,
      false,
      { providerStatus: 401, metadata: sensitive },
    );

    const result = safeServerError(error);

    expect(result).toMatchObject({
      name: "AppError",
      code: "PROVIDER_AUTH_ERROR",
      status: 502,
    });
    expect(JSON.stringify(result)).not.toContain(sensitive);
  });
});
