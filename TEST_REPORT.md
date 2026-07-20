# MarketLens Test Report

วันที่: 2026-07-20

คำสั่งตรวจขั้นสุดท้ายคือ `npm run verify` ซึ่งรวม lint, typecheck, Vitest, Playwright, production build และ secret scan ผลล่าสุดบันทึกใน `PROGRESS.md`

ผลรอบสุดท้าย: 24 Test Files / 52 Tests ผ่าน, Secret Scanner regression 4/4 ผ่าน, Playwright 4/4 ผ่านทั้ง Mobile Chromium และ Desktop Chromium, Production Build ผ่าน และ Secret Scan หลัง commit ตรวจครบ 126 ไฟล์ปัจจุบัน, 1 reachable commit และ 126 history blobs

## Coverage by behavior

- Environment และ safe errors
- Symbol validation, cache TTL, Bangkok daily usage reset, HTTP retry/timeout/size policy
- Provider normalization: Twelve Data, Finnhub events, SEC Company Facts
- Indicator: EMA, RSI, MACD, ADX, ATR, Bollinger, OBV
- Scoring: bullish/neutral/missing/extreme debt/unsupported type/clamp/quality gate
- Gemini numeric hallucination fallback
- Manifest/cache policy/security headers
- Component navigation/loading/error states
- Mobile และ Desktop E2E critical flow
- Secret ที่ถูกลบจาก working tree แต่ยังอยู่ใน Git history ต้องถูกตรวจพบ
- `.env.*.local` ที่ force-track ต้องถูกปฏิเสธ และ `.env.example` แบบค่าว่างต้องผ่าน
- `package-lock.json` ต้องถูกสแกน ไม่ถูกข้ามเป็น generated file

Live provider contract testsใช้ mocked HTTP payload เท่านั้น จึงยังต้องทดสอบซ้ำด้วย API Key จริงใน Preview โดยไม่บันทึก key ลง repository
