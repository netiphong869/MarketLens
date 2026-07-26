# MarketLens Production Readiness Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่ม Market/Sector Context จริงและยกระดับ Coverage, Gemini, dependency risk และ durable-rate-limit readiness โดย Deploy เฉพาะ Preview

**Architecture:** Twelve Data daily series สร้าง SPY/Sector context ผ่าน shared TTL cache แล้วส่ง normalized `MarketContext` เข้า deterministic engine; optional failures ลด Coverage โดยไม่หยุด pipeline. Template summary เป็นหลักและ Gemini ปรับเฉพาะ prose ที่ไม่มีตัวเลข

**Tech Stack:** Next.js 16, TypeScript strict, Zod, Vitest, Playwright, Twelve Data, Vercel Preview

## Global Constraints

- ห้ามลด Quality Gate หรือสร้างข้อมูลปลอม
- ห้ามเพิ่ม API key ใหม่หรือเปิดเผยค่าลับ
- ห้าม `npm audit fix --force`
- ห้าม Deploy Production และห้ามเชื่อม GitHub Auto Deployment
- ทุก behavior ใหม่ใช้ TDD red-green-refactor

---

### Task 1: Market Context Model และ Pure Calculations

**Files:**
- Modify: `src/types/market.ts`
- Modify: `src/engine/scoring/analysis-engine.ts`
- Modify: `src/engine/scoring/analysis-engine.test.ts`
- Create: `src/engine/market/market-context.ts`
- Create: `src/engine/market/market-context.test.ts`

**Interfaces:**
- Produces: `buildMarketContext(input): MarketContext`
- Consumes: daily candles ของ stock, SPY และ sector ETF

- [ ] เขียน failing tests สำหรับ returns 1D/5D/20D/60D, bullish/bearish market, sector outperform/underperform และ missing volatility
- [ ] รัน test และยืนยัน failure เพราะยังไม่มี implementation
- [ ] เขียน pure functions และ Market Score ตามน้ำหนักเดิม
- [ ] รัน targeted tests ให้ผ่าน

### Task 2: Twelve Data Shared Market Cache และ Sector Mapping

**Files:**
- Create: `src/providers/twelve-data/market-context-provider.ts`
- Create: `src/providers/twelve-data/market-context-provider.test.ts`
- Create: `src/providers/twelve-data/sector-map.ts`
- Modify: `src/services/default-analysis-service.ts`
- Modify: `src/services/live-analysis-builder.ts`
- Modify: `src/services/live-analysis-builder.test.ts`

**Interfaces:**
- Produces: `getContext(symbol, sector, stockDaily): Promise<MarketContext | null>`
- Cache: `TtlCache<Candle[]>`, TTL 900 seconds

- [ ] เขียน failing tests สำหรับ sector mapping, cold calls สองครั้ง, shared SPY cache, sector cache และ 429 partial failure
- [ ] ยืนยัน RED
- [ ] Implement provider/cache และ wire ผ่าน builder ด้วย `Promise.allSettled`
- [ ] ยืนยัน GREEN และไม่มี fatal failure

### Task 3: Horizon Coverage และ Fundamental Honesty

**Files:**
- Modify: `src/engine/scoring/analysis-engine.ts`
- Modify: `src/engine/scoring/analysis-engine.test.ts`
- Modify: `CALCULATION_ENGINE.md`
- Modify: `src/components/analysis/overview-panel.tsx` หรือไฟล์ panel ที่ใช้งานจริง

**Interfaces:**
- Produces: HorizonAssessment ตาม threshold ใน design

- [ ] เขียน failing tests สำหรับ short/medium/long minimum coverage
- [ ] ยืนยัน RED
- [ ] Implement threshold table และ null score เมื่อไม่ถึงเกณฑ์
- [ ] เปลี่ยนป้าย Q เป็น “ความน่าเชื่อถือของข้อมูลที่ได้รับ”
- [ ] รัน tests และ component tests

### Task 4: Gemini Text-only Enhancement

**Files:**
- Modify: `src/providers/gemini/provider.ts`
- Modify: `src/providers/gemini/provider.test.ts`
- Modify: `src/engine/summary/template-summary.ts`

**Interfaces:**
- Gemini input เป็นข้อความ facts ไม่มี numeric values
- Gemini output ห้ามมี `0-9`

- [ ] เพิ่ม failing tests สำหรับ changed score, number, timeout, 503, invalid JSON, empty response และ fallback
- [ ] ยืนยัน RED
- [ ] Implement text-only prompt/schema validation โดยไม่ retry
- [ ] รัน targeted tests ให้ผ่าน

### Task 5: Dependency Risk และ Durable Rate Limit Documentation

**Files:**
- Modify: `SECURITY_REPORT.md`
- Modify: `ARCHITECTURE.md`
- Modify: `DEPLOYMENT_READINESS.md`
- Create: `RISK_ACCEPTANCE.md`

- [ ] รัน `npm audit --json`, `npm audit --omit=dev --json`, `npm audit fix --dry-run`
- [ ] ตรวจ Next/sharp dependency tree และ stable releases
- [ ] ใช้ non-breaking patch เฉพาะเมื่อ upstream compatibility ชัดเจน
- [ ] บันทึก attack surface, preconditions, controls และ update plan
- [ ] บันทึก Upstash Redis recommendation และ atomic counter design

### Task 6: Full Verification, Git และ Preview

**Files:**
- Modify: `PROGRESS.md`
- Modify: `FINAL_AUDIT.md`
- Modify: `TEST_REPORT.md`
- Modify: `SECURITY_REPORT.md`
- Modify: `DEPLOYMENT_READINESS.md`

- [ ] รัน lint, typecheck, unit/integration, scanner tests, E2E, build, secret scan, npm audit
- [ ] Commit และ Push `origin/main` เมื่อทุก test ผ่าน
- [ ] Deploy ด้วย Vercel CLI โดยไม่มี `--prod`
- [ ] ทดสอบ AAPL/MSFT/LITE, invalid symbol, provider failure, cache และ failed usage
- [ ] ตรวจ Browser Console, Runtime Logs และ client bundle
- [ ] ยืนยัน deployment target เป็น Preview และ Git integration ยังไม่เชื่อม
