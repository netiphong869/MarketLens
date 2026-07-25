# Live Company Profile Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้การวิเคราะห์หุ้นสหรัฐดำเนินต่อได้เมื่อ Finnhub Company Profile ตอบ 401 โดยใช้ SEC ticker mapping เป็นแหล่ง Company Identity สำรองที่ตรวจสอบได้

**Architecture:** คง Quote และ OHLCV จาก Twelve Data เป็นข้อมูลหลัก เพิ่ม `getProfile` ให้ SEC adapter และวาง fallback adapter ระหว่าง Finnhub กับ SEC ก่อนส่งเข้า `buildLiveAnalysis` โดยไม่ลด Quality Gate และไม่เปลี่ยนสูตรคะแนน News, SEC Company Facts, Gemini และ Stooq ยังใช้สถานะ/ข้อจำกัดเดิมในงานรอบนี้

**Tech Stack:** Next.js App Router, TypeScript strict, Zod, Vitest

## Global Constraints

- ห้ามอ่าน แสดง หรือบันทึก API key และ Environment Variable จริง
- ใช้ TDD: ต้องเห็น regression test ล้มเหลวก่อนแก้ production code
- Finnhub News, SEC Company Facts และ Gemini ยังคงเป็น optional provider
- ห้ามลด Quality Gate หรือแทน missing data ด้วยศูนย์
- ห้าม Deploy Production และห้ามเชื่อม GitHub Auto Deployment
- Commit/Push/Preview Deploy ทำได้ต่อเมื่อ verification ทั้งหมดผ่านและ AAPL สำเร็จบน Preview

---

### Task 1: SEC Company Identity Adapter

**Files:**

- Modify: `src/providers/sec-edgar/provider.ts`
- Create: `src/providers/sec-edgar/provider-profile.test.ts`

**Interfaces:**

- Consumes: SEC `company_tickers.json`
- Produces: `SecEdgarProvider.getProfile(symbol: string): Promise<CompanyProfile>`

- [x] **Step 1: Write the failing test**

เพิ่ม test ที่ส่ง ticker mapping ของ AAPL และคาดว่าได้ชื่อบริษัท, symbol, ประเทศ, security type และ provenance จาก SEC โดยไม่เรียก Company Facts

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/providers/sec-edgar/provider-profile.test.ts`

Expected: FAIL เพราะ `SecEdgarProvider.getProfile` ยังไม่มี

- [x] **Step 3: Write minimal implementation**

แยกการโหลด ticker mapping เป็น method ภายใน adapter และสร้าง Company Profile จาก `ticker`, `title`, `cik_str` โดยค่าไม่มีข้อมูลใช้ `null`

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/providers/sec-edgar/provider-profile.test.ts`

Expected: PASS

### Task 2: Finnhub-to-SEC Profile Fallback

**Files:**

- Create: `src/providers/fallback/company-profile-provider.ts`
- Create: `src/providers/fallback/company-profile-provider.test.ts`
- Modify: `src/services/default-analysis-service.ts`

**Interfaces:**

- Consumes: provider สองตัวที่มี `getProfile(symbol)`
- Produces: `FallbackCompanyProfileProvider.getProfile(symbol)`

- [x] **Step 1: Write the failing regression test**

สร้าง primary provider ที่คืน `PROVIDER_AUTH_ERROR` และ fallback provider ที่คืน SEC profile จากนั้นคาดว่าผลลัพธ์เป็น SEC profile

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/providers/fallback/company-profile-provider.test.ts`

Expected: FAIL เพราะ fallback provider ยังไม่มี

- [x] **Step 3: Write minimal implementation**

เรียก primary ก่อน หากล้มเหลวจึงเรียก fallback เพียงครั้งเดียว แล้วเชื่อม adapter นี้ใน `default-analysis-service.ts`

- [x] **Step 4: Run focused tests**

Run: `npm test -- src/providers/sec-edgar/provider-profile.test.ts src/providers/fallback/company-profile-provider.test.ts src/services/live-analysis-builder.test.ts`

Expected: PASS

### Task 3: Verification and Preview Release

**Files:**

- No additional production files

**Interfaces:**

- Consumes: verified local commit
- Produces: Preview Deployment only

- [x] **Step 1: Run full local verification**

Run:

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run secret:scan
npm audit
```

- [ ] **Step 2: Commit and push**

Commit only the fallback implementation, tests, and this plan after all checks pass.

- [ ] **Step 3: Deploy Preview**

Deploy without `--prod`, verify `mode=live`, then test AAPL, MSFT, and LITE one symbol per Twelve Data quota window.

- [ ] **Step 4: Verify failure paths**

Test invalid symbol, Gemini template fallback, five-minute cache, failed-analysis usage count, browser console, runtime logs, and client bundle secret scan.

## Self-Review

- Spec coverage: Root Cause แรกและจุดหยุดของ pipeline มี test/fix โดยตรง; optional provider อื่นคงพฤติกรรมเดิมและถูกรายงานเป็นข้อจำกัด
- Placeholder scan: ไม่มี TBD/TODO หรือ implementation ที่ไม่ระบุ
- Type consistency: ทั้ง SEC, Finnhub และ fallback ใช้ `Promise<CompanyProfile>` เหมือนกัน
