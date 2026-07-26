# MarketLens Summary Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างหน้า Summary ที่อธิบายผลด้วย Structured Data จริง แยกสถานะตามระยะ และจำกัด Gemini ให้เรียบเรียงเฉพาะ Verdict ที่ผ่าน Validation

**Architecture:** เพิ่ม deterministic summary contract และ builder ซึ่งสร้าง Horizon Verdicts, evidence, risks, watch items และ conditional scenarios จาก `AnalysisResponse` จากนั้น Gemini รับเฉพาะ deterministic verdict และ fact allowlist เพื่อเขียน verdict ใหม่ 2–3 ประโยค ส่วน UI แสดงโครงสร้าง deterministic เสมอและเปิดเผยแหล่งที่มาใน info disclosure

**Tech Stack:** TypeScript strict, React, Zod, Vitest, React Testing Library, Playwright, Next.js App Router

## Global Constraints

- ตัวเลข คะแนน สถานะ จุดแข็ง จุดอ่อน ความเสี่ยง Watch Items และ Scenario ต้องมาจาก Structured Data ด้วย deterministic code
- Gemini เปลี่ยนได้เฉพาะ Verdict 2–3 ประโยค
- Gemini Output ต้องผ่าน Schema, Number และ Meaning Validation
- Coverage ไม่ผ่านเกณฑ์ต้องซ่อน Horizon Score และห้ามแสดงสถานะเชิงบวก
- Missing Data ต้องระบุชื่อข้อมูลที่ขาด
- Scenario ตัดเงื่อนไขที่ไม่มีข้อมูลออก ห้ามสร้างค่า
- ห้ามลด Quality Gate หรือเปลี่ยนสูตรคะแนนหลัก
- ห้าม Deploy Production

---

### Task 1: Summary Contract and Deterministic Engine

**Files:**
- Modify: `src/types/analysis.ts`
- Modify: `src/engine/summary/template-summary.ts`
- Modify: `src/engine/summary/summary.test.ts`
- Modify: `src/test/fixtures.ts`
- Modify: `src/providers/mock/fixtures.ts`

**Interfaces:**
- Produces: `SummaryHorizonVerdict`, `SummaryHorizonStatus`, `AnalysisSummary.horizons`, `AnalysisSummary.risks`
- Produces: `createTemplateSummary(input: AnalysisResponse): AnalysisSummary`
- Consumes: `AnalysisResponse` quote, technical snapshot, fundamentals, coverage, horizons, risk, events, supports and resistances

- [ ] **Step 1: Write failing tests for complete structured data**

เพิ่ม assertions ว่า Summary มี Revenue/EPS/Margin จริง, สถานะครบสามระยะ, watch items 3–5 ข้อ และ Scenario มี Support/Resistance/EMA/Volume ตามข้อมูลที่มี

- [ ] **Step 2: Write failing tests for missing coverage**

สร้าง fixture ที่ `market.percent = 0`, fixture ที่ `fundamental.percent < 60` และ fixture ที่ Horizon มีคะแนนแต่ Coverage ไม่ผ่าน แล้ว assert ว่า `score = null`, สถานะเป็น `ข้อมูลไม่เพียงพอ` และระบุชื่อโมดูล/metric ที่ขาด

- [ ] **Step 3: Write failing test for missing Support/Resistance**

ตั้ง `supports = []` และ `resistances = []` แล้ว assert ว่า Scenario ไม่มีระดับราคาที่สร้างขึ้นเองและยังใช้ EMA/Volume เฉพาะค่าที่มี

- [ ] **Step 4: Run RED tests**

Run:

```text
npx vitest run src/engine/summary/summary.test.ts
```

Expected: FAIL เพราะ contract และ deterministic evidence ใหม่ยังไม่มี

- [ ] **Step 5: Implement minimal deterministic builder**

เพิ่ม types:

```ts
export type SummaryHorizonStatus =
  | "caution"
  | "neutral"
  | "positive"
  | "insufficient";

export interface SummaryHorizonVerdict {
  label: string;
  status: SummaryHorizonStatus;
  score: number | null;
  explanation: string;
  missing: string[];
}
```

สร้าง helper แยกหน้าที่:

```ts
buildHorizonVerdicts(input): AnalysisSummary["horizons"]
buildStrengths(input): string[]
buildWeaknesses(input): string[]
buildRisks(input): string[]
buildWatchItems(input): string[]
buildScenarios(input): AnalysisScenario[]
buildLimitations(input): string[]
```

ใช้ threshold ตาม design spec และใช้ `null` เมื่อ Coverage ไม่ผ่าน

- [ ] **Step 6: Run GREEN tests**

Run:

```text
npx vitest run src/engine/summary/summary.test.ts
```

Expected: PASS

### Task 2: Gemini Verdict-only Safety Boundary

**Files:**
- Modify: `src/providers/gemini/provider.ts`
- Modify: `src/providers/gemini/provider.test.ts`
- Modify: `src/engine/summary/template-summary.ts`

**Interfaces:**
- Consumes: deterministic `AnalysisSummary`
- Produces: Gemini response schema `{ verdict: string }`
- Produces: `validateVerdictNumbers(verdict, input)` และ `validateVerdictMeaning(verdict, deterministicSummary)`
- Returns: deterministic summary โดยเปลี่ยนเฉพาะ `overview` เมื่อทุก validation ผ่าน

- [ ] **Step 1: Write failing tests for verdict-only output**

ทดสอบว่า Gemini ส่ง `{ verdict }` ที่ถูกต้องแล้ว `strengths`, `weaknesses`, `risks`, `watchItems`, `horizons` และ `scenarios` ยังคงเท่ากับ deterministic summary

- [ ] **Step 2: Write failing tests for invalid output**

ครอบคลุม Schema ผิด, มาก/น้อยกว่า 2–3 ประโยค, เพิ่ม `9999.99`, เปลี่ยนตัวเลขที่มีอยู่ และข้อความที่กลับ polarity ของ deterministic verdict

- [ ] **Step 3: Run RED tests**

Run:

```text
npx vitest run src/providers/gemini/provider.test.ts
```

Expected: FAIL เพราะ provider ยังรับ summary ทั้ง object และห้ามตัวเลขทั้งหมด

- [ ] **Step 4: Implement verdict-only prompt and validation**

ใช้ Zod:

```ts
const verdictSchema = z.object({
  verdict: z.string().min(1),
}).strict();
```

Validation ต้อง:

- ตรวจ 2–3 ประโยค
- ตรวจ numeric tokens เทียบ allowlist จาก Structured Data
- ปฏิเสธ score/status/support/resistance ที่ไม่อยู่ใน deterministic verdict
- merge ด้วย `{ ...fallback, overview: parsed.verdict }`

- [ ] **Step 5: Run GREEN tests**

Run:

```text
npx vitest run src/providers/gemini/provider.test.ts src/engine/summary/summary.test.ts
```

Expected: PASS

### Task 3: Summary UI and Source Disclosure

**Files:**
- Modify: `src/components/analysis/summary-panel.tsx`
- Modify: `src/components/analysis/summary-panel.test.tsx`
- Modify: `src/features/analysis/analysis-dashboard.module.css`
- Modify: `src/features/analysis/analysis-dashboard.test.tsx`

**Interfaces:**
- Consumes: enriched `AnalysisSummary`
- Renders order: Verdict → Horizons → Evidence → Risks → Watch → Scenarios → Limitations → Disclaimer
- Main label: `สรุปโดย MarketLens`
- Info disclosure: Gemini model หรือ deterministic template details

- [ ] **Step 1: Write failing component tests**

Assert heading order, three horizon cards, hidden score for insufficient coverage, specific missing data, risk section, 3–5 watch items, scenarios and absence of visible `Template Fallback`.

- [ ] **Step 2: Write failing disclosure tests**

Assert main badge is `สรุปโดย MarketLens` for both sources and internal source appears only after opening `รายละเอียดที่มาของสรุป`.

- [ ] **Step 3: Run RED tests**

Run:

```text
npx vitest run src/components/analysis/summary-panel.test.tsx src/features/analysis/analysis-dashboard.test.tsx
```

Expected: FAIL เพราะ UI เดิมยังใช้ layout และ source label เก่า

- [ ] **Step 4: Implement accessible Summary layout**

ใช้ semantic headings, `<details>` สำหรับ source disclosure, status text ที่ไม่พึ่งสีอย่างเดียว และ responsive grid สำหรับ Horizon/Scenario cards

- [ ] **Step 5: Run GREEN tests**

Run:

```text
npx vitest run src/components/analysis/summary-panel.test.tsx src/features/analysis/analysis-dashboard.test.tsx
```

Expected: PASS

### Task 4: API Contract, Fixtures and End-to-End Verification

**Files:**
- Modify: `src/lib/validation/analysis-response.ts`
- Modify: `src/lib/validation/analysis-response.test.ts`
- Modify: `src/services/live-analysis-builder.test.ts`
- Modify: `tests/e2e/marketlens.spec.ts`
- Modify: `PROGRESS.md`
- Modify: `TEST_REPORT.md`
- Modify: `DEPLOYMENT_READINESS.md`

**Interfaces:**
- API must serialize enriched deterministic summary
- Browser Zod validation must reject malformed horizon/risk summary data

- [ ] **Step 1: Write failing API schema tests**

ลบ `summary.horizons` หรือส่ง `positive` พร้อม `score = null` แล้ว assert ว่า parser ปฏิเสธ response

- [ ] **Step 2: Write E2E assertions**

หลังวิเคราะห์ Mock ticker ให้เปิด Summary และตรวจ Verdict, Horizon statuses, structured reasons, scenarios, source disclosure และ absence ของ `Template Fallback`

- [ ] **Step 3: Run focused tests**

Run:

```text
npx vitest run src/lib/validation/analysis-response.test.ts src/services/live-analysis-builder.test.ts
npx playwright test tests/e2e/marketlens.spec.ts
```

- [ ] **Step 4: Update project documentation**

บันทึก root cause, deterministic/Gemini boundary, test counts และ Preview-only constraint

- [ ] **Step 5: Run full verification**

Run:

```text
npm run lint
npm run typecheck
npm test
npm run test:secret-scan
npm run test:e2e
npm run build
npm run secret:scan
```

Expected: ทุกคำสั่ง exit 0

### Task 5: Git Push and Vercel Preview Validation

**Files:**
- No source changes unless Preview reveals a verified defect with a failing regression test

- [ ] **Step 1: Inspect repository**

ตรวจ `git status`, `git diff --check`, `.env.local` tracking และ secret scan

- [ ] **Step 2: Commit and push**

Commit verified implementation แล้ว push แบบปกติไป `origin/main`

- [ ] **Step 3: Deploy Preview only**

ใช้ Vercel CLI โดยไม่มี `--prod`

- [ ] **Step 4: Test AAPL, MSFT and FN**

ตรวจ Summary UI, deterministic evidence, horizon statuses, scenario conditions, `/api/health`, Browser Console และ Runtime Logs

- [ ] **Step 5: Confirm final state**

ยืนยัน Vercel target เป็น `preview`, Git working tree สะอาด และ local `main` ตรงกับ `origin/main`
