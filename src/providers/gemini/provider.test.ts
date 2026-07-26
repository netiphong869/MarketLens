import { describe, expect, it, vi } from "vitest";

import { createTemplateSummary } from "@/engine/summary/template-summary";
import { GeminiProvider } from "@/providers/gemini/provider";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("GeminiProvider verdict boundary", () => {
  it("uses a discovered stable Flash model and replaces only the validated verdict", async () => {
    const input = createMockAnalysisResponse("FN");
    const deterministic = createTemplateSummary(input);
    const rewrittenVerdict = deterministic.overview;
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockResolvedValueOnce(verdictResponse(rewrittenVerdict));

    const result = await new GeminiProvider("secret", fetchFn).summarize(input);

    expect(result).toMatchObject({
      source: "gemini",
      model: "models/gemini-stable-flash",
      httpStatus: 200,
    });
    expect(result.summary.overview).toBe(rewrittenVerdict);
    expect(result.summary.horizons).toEqual(deterministic.horizons);
    expect(result.summary.strengths).toEqual(deterministic.strengths);
    expect(result.summary.weaknesses).toEqual(deterministic.weaknesses);
    expect(result.summary.risks).toEqual(deterministic.risks);
    expect(result.summary.watchItems).toEqual(deterministic.watchItems);
    expect(result.summary.scenarios).toEqual(deterministic.scenarios);
    expect(String(fetchFn.mock.calls[1][0])).toContain(
      "/v1beta/models/gemini-stable-flash:generateContent",
    );
    const request = JSON.parse(
      String((fetchFn.mock.calls[1][1] as RequestInit).body),
    );
    expect(request.contents[0].parts[0].text).toContain(deterministic.overview);
    expect(request.contents[0].parts[0].text).toContain(
      "ตอบ JSON ที่มี field verdict เท่านั้น",
    );
  });

  it("falls back when Gemini returns the old full-summary schema", async () => {
    const input = createMockAnalysisResponse("FN");
    const deterministic = createTemplateSummary(input);
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockResolvedValueOnce(
        generationResponse({
          overview: deterministic.overview,
          strengths: [],
          weaknesses: [],
        }),
      );

    const result = await new GeminiProvider("secret", fetchFn).summarize(input);

    expect(result.source).toBe("template");
    expect(result.failureCode).toBe("INVALID_OUTPUT");
    expect(result.summary).toEqual(deterministic);
  });

  it.each(["9999.99", "๙๙๙", "９９９"])(
    "falls back when Gemini invents a number: %s",
    async (inventedNumber) => {
      const input = createMockAnalysisResponse("FN");
      const deterministic = createTemplateSummary(input);
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(modelsResponse())
        .mockResolvedValueOnce(
          verdictResponse(
            `${deterministic.overview} ราคาเป้าหมาย ${inventedNumber}.`,
          ),
        );

      const result = await new GeminiProvider("secret", fetchFn).summarize(
        input,
      );

      expect(result.source).toBe("template");
      expect(result.failureCode).toBe("INVALID_OUTPUT");
      expect(result.summary.overview).not.toContain(inventedNumber);
    },
  );

  it("falls back when Gemini changes an existing number", async () => {
    const input = createMockAnalysisResponse("FN");
    const deterministic = createTemplateSummary(input);
    const changed = deterministic.overview.replace("3.89%", "3.8%");
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockResolvedValueOnce(verdictResponse(changed));

    const result = await new GeminiProvider("secret", fetchFn).summarize(input);

    expect(result.source).toBe("template");
    expect(result.failureCode).toBe("INVALID_OUTPUT");
    expect(result.summary.overview).toBe(deterministic.overview);
  });

  it("falls back when Gemini reverses the price direction", async () => {
    const input = createMockAnalysisResponse("FN");
    const deterministic = createTemplateSummary(input);
    const reversed = deterministic.overview.replace("ปรับขึ้น", "ปรับลง");
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockResolvedValueOnce(verdictResponse(reversed));

    const result = await new GeminiProvider("secret", fetchFn).summarize(input);

    expect(result.source).toBe("template");
    expect(result.failureCode).toBe("INVALID_OUTPUT");
  });

  it("falls back when a discovered model returns 404", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 404 } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await new GeminiProvider("secret", fetchFn).summarize(
      createMockAnalysisResponse("FN"),
    );

    expect(result).toMatchObject({
      source: "template",
      model: "models/gemini-stable-flash",
      failureCode: "MODEL_GENERATION_FAILED",
      httpStatus: 404,
    });
  });

  it.each([
    [
      "invalid JSON",
      new Response("{", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      "MODEL_GENERATION_FAILED",
    ],
    [
      "an empty candidate list",
      new Response(JSON.stringify({ candidates: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
      "INVALID_OUTPUT",
    ],
  ] as const)(
    "falls back for %s",
    async (_case, generation, expectedFailureCode) => {
      const fetchFn = vi
        .fn()
        .mockResolvedValueOnce(modelsResponse())
        .mockResolvedValueOnce(generation);

      const result = await new GeminiProvider("secret", fetchFn).summarize(
        createMockAnalysisResponse("FN"),
      );

      expect(result.source).toBe("template");
      expect(result.failureCode).toBe(expectedFailureCode);
    },
  );

  it("reports a generation timeout once and preserves the discovered model", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(modelsResponse())
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));

    const result = await new GeminiProvider("secret", fetchFn).summarize(
      createMockAnalysisResponse("FN"),
    );

    expect(result).toMatchObject({
      source: "template",
      model: "models/gemini-stable-flash",
      failureCode: "TIMEOUT",
      httpStatus: 504,
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

function modelsResponse(): Response {
  return new Response(
    JSON.stringify({
      models: [
        {
          name: "models/gemini-stable-flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/gemini-preview-flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/text-embedding",
          supportedGenerationMethods: ["embedContent"],
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function verdictResponse(verdict: string): Response {
  return generationResponse({ verdict });
}

function generationResponse(payload: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify(payload) }],
          },
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}
