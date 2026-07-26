# Technical Indicator Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** แสดงค่า Indicator จริงของ 15M, 1H, 4H และ 1D จาก OHLCV เดิมในหน้า Chart โดยไม่มี Provider call เพิ่ม

**Architecture:** สร้าง calculator ฝั่ง deterministic engine ให้คืน `TechnicalSnapshot` ที่มีค่า nullable และเหตุผลราย field จากนั้นส่ง contract นี้ผ่าน `AnalysisResponse` และเลือก Snapshot ตาม timeframe state เดียวกับกราฟ ฝั่ง Browser ตรวจ Snapshot payload ด้วย Zod ก่อนใช้งาน

**Tech Stack:** Next.js App Router, React 19, TypeScript strict, Zod, Vitest, React Testing Library, Playwright

## Global Constraints

- ห้ามเรียก Twelve Data เพิ่มเพื่อขอค่า Indicator
- Missing Data ใช้ `null` และเหตุผลเฉพาะเจาะจง ห้ามแทนด้วย `0`
- ห้ามใช้ Technical Score แทนค่าตัวชี้วัด
- ใช้ TDD: Test ต้องล้มเหลวด้วยเหตุผลที่ถูกต้องก่อนแก้ production code
- ห้ามลดหรือลบ Test
- Deploy ได้เฉพาะ Vercel Preview ห้าม Production

---

### Task 1: Indicator snapshot contract และ deterministic calculation

**Files:**
- Modify: `src/types/analysis.ts`
- Create: `src/engine/indicators/technical-snapshot.ts`
- Create: `src/engine/indicators/technical-snapshot.test.ts`
- Modify: `src/engine/indicators/indicators.test.ts`

**Interfaces:**
- Consumes: `Record<Timeframe, Candle[]>`, indicator functions ใน `indicators.ts`
- Produces: `calculateTechnicalSnapshots(candles, calculatedAt): Record<Timeframe, TechnicalSnapshot>`

- [ ] **Step 1: เขียน failing tests**

ทดสอบค่า hand-checked ของ EMA, RSI, MACD, ATR, ADX, OBV รวมถึง Snapshot ครบทุก field, `null` เมื่อแท่งไม่พอ และเหตุผลเมื่อไม่มี Volume

- [ ] **Step 2: รัน RED**

Run:

```text
npx vitest run src/engine/indicators/indicators.test.ts src/engine/indicators/technical-snapshot.test.ts
```

Expected: FAIL เพราะ `TechnicalSnapshot` และ calculator ยังไม่มี

- [ ] **Step 3: เพิ่ม contract และ calculator**

ใช้ `number | null` ทุกค่าที่อาจ unavailable, สร้าง `unavailable` ราย field และใช้ `calculatedAt` ที่รับจาก caller

- [ ] **Step 4: รัน GREEN**

Run คำสั่งเดิมและต้องผ่านทั้งหมดโดยไม่มี `NaN` หรือ `Infinity`

### Task 2: เชื่อม engine, response และ API contract

**Files:**
- Modify: `src/engine/scoring/analysis-engine.ts`
- Modify: `src/engine/scoring/analysis-engine.test.ts`
- Modify: `src/services/live-analysis-builder.ts`
- Modify: `src/services/live-analysis-builder.test.ts`
- Modify: `src/services/default-analysis-service.ts`
- Modify: `src/providers/mock/fixtures.ts`
- Modify: `src/test/fixtures.ts`
- Create: `src/lib/validation/analysis-response.ts`
- Create: `src/lib/validation/analysis-response.test.ts`
- Modify: `src/features/analysis/analysis-dashboard.tsx`
- Modify: `src/app/api/analyze/route.test.ts`

**Interfaces:**
- Consumes: `calculateTechnicalSnapshots`
- Produces: `AnalysisResponse.technicalSnapshot` และ runtime-validated API envelope

- [ ] **Step 1: เขียน failing integration/schema tests**

ยืนยัน Snapshot ครบ `15m`, `1h`, `4h`, `1d`, API ส่งค่าจริง และ `getCandles` ยังถูกเรียกเพียง 4 ครั้ง

- [ ] **Step 2: รัน RED**

Run:

```text
npx vitest run src/engine/scoring/analysis-engine.test.ts src/services/live-analysis-builder.test.ts src/lib/validation/analysis-response.test.ts src/app/api/analyze/route.test.ts
```

Expected: FAIL เพราะ response ยังไม่มี `technicalSnapshot`

- [ ] **Step 3: เชื่อม calculator เข้ากับ response**

ใช้ `generatedAt` ค่าเดียวกับ `calculatedAt`, เพิ่ม Snapshot ให้ mock/live/test fixtures และ parse Snapshot envelope ที่ Browser boundary

- [ ] **Step 4: รัน GREEN**

Run คำสั่งเดิมและต้องผ่าน โดย `getCandles` คง 4 calls

### Task 3: Indicator Snapshot UI และ timeframe interaction

**Files:**
- Create: `src/components/chart/indicator-snapshot.tsx`
- Create: `src/components/chart/indicator-snapshot.test.tsx`
- Create: `src/components/chart/chart-panel.test.tsx`
- Modify: `src/components/chart/chart-panel.tsx`
- Modify: `src/features/analysis/analysis-dashboard.module.css`

**Interfaces:**
- Consumes: `TechnicalSnapshot`
- Produces: ตัวเลข คำแปล และ unavailable reasons ที่เข้าถึงได้ด้วย keyboard/screen reader

- [ ] **Step 1: เขียน failing component tests**

ทดสอบค่าจริงและคำแปลของ Snapshot, ตรวจว่าไม่มี “ดูจากคะแนนเทคนิค”, และกด 15M แล้วค่าจาก 15M แทน 1D

- [ ] **Step 2: รัน RED**

Run:

```text
npx vitest run src/components/chart/indicator-snapshot.test.tsx src/components/chart/chart-panel.test.tsx
```

Expected: FAIL เพราะ component ยังไม่มีและ ChartPanel ยังใช้ Placeholder

- [ ] **Step 3: สร้าง component และเชื่อม timeframe**

แสดง 14 metrics, เวลา calculation, คำอธิบาย และเหตุผล missing โดย state ของ `ChartPanel` เป็นแหล่งเลือก timeframe เพียงจุดเดียว

- [ ] **Step 4: รัน GREEN**

Run คำสั่งเดิมและต้องผ่าน

### Task 4: Documentation และ full verification

**Files:**
- Modify: `ARCHITECTURE.md`
- Modify: `CALCULATION_ENGINE.md`
- Modify: `PROGRESS.md`
- Modify: `TEST_REPORT.md`
- Modify: `DEPLOYMENT_READINESS.md`

- [ ] **Step 1: อัปเดต data flow และ snapshot thresholds**

บันทึกว่าค่ามาจาก OHLCV เดิม, ไม่มี API call เพิ่ม, ค่า missing เป็น null และ UI เปลี่ยนตาม timeframe

- [ ] **Step 2: รัน verification**

```text
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run secret:scan
```

- [ ] **Step 3: ตรวจ working tree และ secret**

ตรวจ `git diff --check`, `git status`, tracked env files และ secret scan ก่อน Commit

### Task 5: Commit, Push และ Preview verification

**Files:**
- ไม่มี source file ใหม่หลัง verification

- [ ] **Step 1: สร้าง Commit**

Commit เฉพาะ working tree ที่ผ่าน verification โดยระบุชัดว่ารวม pending Production Readiness changes เดิมที่ feature นี้พึ่งพาอยู่ หากไม่สามารถแยกอย่างปลอดภัยได้

- [ ] **Step 2: Push main**

ตรวจ `origin` ก่อน Push และยืนยัน `main` ติดตาม `origin/main`

- [ ] **Step 3: Deploy Preview**

ใช้ Vercel CLI จาก project link เดิมโดยไม่ใช้ `--prod`

- [ ] **Step 4: ทดสอบ Preview**

ตรวจ `/api/health`, วิเคราะห์หุ้นจริง, เปิด Chart, สลับ 15M/1H/4H/1D, ตรวจ browser console/runtime logs และยืนยันว่าไม่มี Secret
