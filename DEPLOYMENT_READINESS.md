# MarketLens Deployment Readiness

## Deterministic Summary 2026-07-27

- Local gates ผ่านครบสำหรับการ Deploy เฉพาะ Preview
- Summary เป็น deterministic ยกเว้น Verdict prose ที่ Gemini อาจเรียบเรียงได้หลังผ่าน Schema, number-set และ meaning validation
- Coverage Gate ตรงกับ `CALCULATION_ENGINE.md`; ไม่มีการลดเกณฑ์เพื่อให้คะแนนแสดง
- Frontend แสดง `สรุปโดย MarketLens` และเก็บข้อมูล Gemini/Template ไว้ใน Info Disclosure
- ต้องทดสอบ Preview จริงกับ AAPL, MSFT และ FN รวม Browser Console และ Runtime Logs ก่อนปิดงาน
- Production status: **ยังไม่อนุมัติและห้าม Deploy Production ในรอบนี้**

## Technical Indicator Snapshot 2026-07-26

- Local implementation พร้อมสำหรับ Preview หลังผ่าน lint, typecheck, 108 Vitest tests, 4 Playwright E2E tests, production build และ secret scan
- Snapshot มาจาก OHLCV เดิม ไม่มี API Key ใหม่และไม่มี Twelve Data indicator endpoint เพิ่ม
- Analysis API มี runtime validation สำหรับ Snapshot ทั้ง 4 timeframe
- Production status ไม่เปลี่ยน: ยังไม่อนุมัติ Production ตาม dependency/rate-limit/provider-license limitations เดิม
- Preview URL ใหม่และผล live AAPL จะบันทึกหลัง Preview deployment สำเร็จ

## Production Readiness phase 2026-07-25

- Market/Sector context: implemented locally with Twelve Data, SPY benchmark,
  sector ETF mapping, 1D/5D/20D/60D returns และ shared 15-minute cache
- Cold analysis credit budget: สูงสุด 7 Twelve Data credits
- S&P 500 ใช้ SPY เป็น investable proxy และต้องแสดงว่าเป็น proxy
- NASDAQ และ Dow สามารถใช้ QQQ/DIA สำหรับ Market Pulse ในอนาคต แต่ไม่รวมใน
  analysis cold path เพื่อไม่ให้เกิน free-tier burst
- VIX: ยังไม่มีข้อมูลที่ยืนยันได้ใน free tier จึงแสดง unavailable และไม่สร้าง proxy ปลอม
- Data Integrity แยกจาก Technical/Fundamental/Market/News Coverage
- Horizon score ใช้ minimum coverage ตาม `CALCULATION_ENGINE.md`
- Durable rate limit: เลือก Upstash Redis เป็นแบบเป้าหมาย แต่ Preview ปัจจุบัน
  ยังใช้ in-memory counter
- Dependency security: ดู `RISK_ACCEPTANCE.md`
- Production High: 2 package nodes (`next` → `sharp`) จึง **ห้ามประกาศ Production Ready**
- Dev-tooling High: 9 package nodes; ไม่อยู่ใน production tree

## Final Preview result

- Project: `marketlens`
- Framework: Next.js
- Root Directory: `.`
- Deployment: `dpl_2u3kSa3MHsrUPGH1nLy3xeTBRCGD`
- Preview URL: `https://marketlens-1f0lwziuy-netiphong869-s-projects.vercel.app`
- Status: `READY`
- Target: `preview`
- Health: `mode=live`
- Live symbols verified: AAPL, MSFT, LITE
- Finnhub: พร้อมใช้งาน ไม่ต้องเปลี่ยน Key
- SEC fundamentals: พร้อมใช้งานแบบ partial coverage
- Gemini: model เข้าถึงได้ แต่ยังใช้ Template Fallback เมื่อ safety validation ไม่ผ่านหรือ upstream 503
- Market/Sector Coverage: 0% จึงยังไม่สร้างคะแนนระยะกลาง/ยาว
- Stooq backup: unavailable
- Browser console / Runtime logs: ไม่พบ error สำคัญหรือ secret
- GitHub Auto Deployment: ไม่ได้เชื่อม
- Production Deployment: ไม่ได้ดำเนินการ
- Release decision: **Preview พร้อมใช้งานเพื่อทดสอบ; Production ยังไม่พร้อม**

สถานะ: **พร้อมสำหรับ Vercel Preview เท่านั้น — ยังไม่อนุมัติ Production**

## Local gates ที่ผ่าน

- Next.js 16.2.11 production build
- lint, typecheck, 68 Vitest, 4 scanner tests, 4 Playwright E2E
- Secret scan current tree และ reachable Git history
- Provider-specific security boundaries
- Coverage/Partial/Insufficient UI
- Template Fallback

## Preview Environment Variables

รายงานสถานะจาก Vercel เป็น SET ทั้งหมด โดยไม่อ่านหรือแสดงค่า:

```text
TWELVE_DATA_API_KEY
FINNHUB_API_KEY
GEMINI_API_KEY
SEC_USER_AGENT
USAGE_SIGNING_SECRET
MOCK_DATA_MODE
```

## Preview gates ที่ต้องตรวจ

1. `/api/health` ต้องเป็น `mode=live`
2. AAPL, MSFT, LITE ต้องตอบโดยไม่เกิด 5xx
3. SEC Fundamentals และ Fundamental Coverage ต้องมีค่าจากข้อมูลจริง
4. Finnhub ต้องรายงาน HTTP status แบบ sanitize
5. Gemini ต้องรายงาน model ที่ discovery และ generateContent ใช้งานได้ หรือใช้ Template Fallback อย่างปลอดภัย
6. Stooq ต้องไม่ถูกประกาศพร้อมใช้งานจาก HTML challenge
7. Browser console และ runtime logs ต้องไม่มี secret/error สำคัญ

## ข้อจำกัดก่อน Production

- `npm audit` ยังมี residual Sharp High ใน production tree
- Usage limit เป็น in-memory ไม่ใช่ distributed security boundary
- Market/Sector provider ยังไม่มี Coverage
- ต้องตรวจสิทธิ์ใช้และเผยแพร่ข้อมูลของทุก provider
- ต้องมี Backtest/Paper Trade ก่อนแสดง Confidence เชิงสถิติ
- ห้าม Deploy Production ในรอบนี้
