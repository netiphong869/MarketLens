import { describe, expect, it, vi } from "vitest";

import { GeminiProvider } from "@/providers/gemini/provider";
import { createMockAnalysisResponse } from "@/providers/mock/fixtures";

describe("GeminiProvider", () => {
  it("discovers and uses a returned stable Flash model that supports generateContent", async () => {
    const summary = {
      overview: "ภาพรวมจากข้อมูลที่ระบบคำนวณแล้ว",
      strengths: [],
      weaknesses: [],
      watchItems: [],
      scenarios: [],
      limitations: [],
      disclaimer: "ใช้เพื่อการศึกษา",
    };
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/v1beta/models")) {
        return new Response(
          JSON.stringify({
            models: [
              {
                name: "models/gemini-3.5-flash-preview",
                supportedGenerationMethods: ["generateContent"],
              },
              {
                name: "models/gemini-3.5-flash",
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
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(summary) }] } },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const result = await new GeminiProvider("secret", fetchFn).summarize(
      createMockAnalysisResponse("FN"),
    );

    expect(result.source).toBe("gemini");
    expect(result.model).toBe("models/gemini-3.5-flash");
    expect(String(fetchFn.mock.calls[1][0])).toContain(
      "/v1beta/models/gemini-3.5-flash:generateContent",
    );
  });

  it("falls back when a discovered model returns 404", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [
              {
                name: "models/gemini-stable-flash",
                supportedGenerationMethods: ["generateContent"],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 404 } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      );

    const result = await new GeminiProvider("secret", fetchFn).summarize(
      createMockAnalysisResponse("FN"),
    );

    expect(result.source).toBe("template");
    expect(result.model).toBe("models/gemini-stable-flash");
    expect(result.failureCode).toBe("MODEL_GENERATION_FAILED");
    expect(result.httpStatus).toBe(404);
  });

  it("falls back when Gemini invents a number", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [
              {
                name: "models/gemini-stable-flash",
                supportedGenerationMethods: ["generateContent"],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ overview: "ราคา 9999.99", strengths: [], weaknesses: [], watchItems: [], scenarios: [], limitations: [], disclaimer: "x" }) }] } }] }), { status: 200, headers: { "content-type": "application/json" } }));
    const result = await new GeminiProvider("secret", fetchFn).summarize(createMockAnalysisResponse("FN"));
    expect(result.source).toBe("template");
    expect(result.model).toBe("models/gemini-stable-flash");
    expect(result.failureCode).toBe("INVALID_OUTPUT");
    expect(result.httpStatus).toBe(200);
    expect(result.summary.overview).not.toContain("9999.99");
  });

  it("reports a generation timeout once and preserves the discovered model", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [
              {
                name: "models/gemini-stable-flash",
                supportedGenerationMethods: ["generateContent"],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
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
