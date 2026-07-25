# MarketLens Test Report

## Final verification

- `npm run lint`: ผ่าน
- `npm run typecheck`: ผ่าน
- Vitest: 32 files / 74 tests ผ่าน
- Secret scanner regression: 4/4 ผ่าน
- Playwright mobile + desktop: 4/4 ผ่าน
- Next.js 16.2.11 production build: ผ่าน
- Preview build: ผ่านและ Deployment `READY`
- AAPL: Fundamental 72.92, News 50, Q 91.75, Coverage 100/45/0/100
- MSFT: Fundamental 85.42, News 50, Q 91.75, Coverage 100/45/0/100
- LITE: Fundamental 48.06, News 50, Q 90.81, Coverage 100/38.75/0/100
- Gemini regression: discovery, 404, timeout, invalid numeric output และ Template Fallback ผ่าน
- UI regression: live/partial data label และ Template Fallback badge ผ่าน
- Browser console: 0 warning/error
- Runtime logs: มีเฉพาะ request info; ไม่พบ server error

วันที่: 2026-07-25

## Verification รอบ Live Provider Stabilization

- `npm run lint`: ผ่าน
- `npm run typecheck`: ผ่าน
- Vitest: 30 files / 68 tests ผ่าน
- Secret scanner regression: 4/4 ผ่าน
- Playwright: 4/4 ผ่านบน Mobile Chromium และ Desktop Chromium
- Next.js 16.2.11 production build: ผ่าน
- Secret scan: 136 current files, 3 reachable commits, 382 history blobs ผ่าน

## Regression coverage ที่เพิ่ม

- Gemini Models API discovery และ stable Flash selection
- Gemini generateContent 404 ต้องใช้ Template Fallback
- Gemini output เพิ่มตัวเลขใหม่ต้องใช้ Template Fallback
- Finnhub credential อยู่ใน `X-Finnhub-Token` และไม่อยู่ใน URL
- SEC Company Facts มากกว่า shared 1 MB ต้องอ่านได้
- SEC Company Facts เกิน 6 MiB, non-JSON หรือ redirect ต้องถูกปฏิเสธ
- Stooq CSV schema ที่ถูกต้องต้อง parse ได้
- Stooq HTML challenge HTTP 200 ต้องถูกระบุ unavailable
- Q=85 ต้องอธิบาย component ได้และไม่ปิดบัง Coverage ที่ขาด
- Fundamental coverage คำนวณจาก field ที่มีจริง
- Missing Market/News ไม่แสดงคะแนน 50
- Horizon แสดง Partial/Insufficient โดยไม่มีคะแนนเมื่อ input ไม่ครบ
- UI ไม่แสดง `50/100` ให้โมดูล unavailable

Live AAPL/MSFT/LITE และ browser/runtime logs จะบันทึกเพิ่มหลัง Deploy Preview เท่านั้น
