# MarketLens Deployment Readiness

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
