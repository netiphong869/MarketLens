# MarketLens Deployment Readiness

สถานะ: **พร้อมเผยแพร่ source code ขึ้น GitHub หลัง Local Commit — พร้อม Local QA และ Vercel Preview หลังใส่ Environment Variables แต่ยังไม่อนุมัติ Production**

## ผ่านแล้ว

- Mock Mode เปิดและวิเคราะห์ผ่าน Server Route
- Production build, automated tests, PWA manifest/offline shell และ secret scan
- ไม่มี Git remote และไม่มี deployment ในรอบนี้
- `.gitignore`, current-file secret scan, reachable-history scan และ personal-data audit ผ่าน
- Critical issue ก่อนเผยแพร่ GitHub: ไม่มี
- Local release-preparation commit ถูกสร้างแล้วบน branch `marketlens-v1`; ไม่มี remote, Push หรือ Deploy

## Environment Variables

```text
TWELVE_DATA_API_KEY
FINNHUB_API_KEY
GEMINI_API_KEY
SEC_USER_AGENT
USAGE_SIGNING_SECRET
MOCK_DATA_MODE=false
DAILY_ANALYSIS_LIMIT=10
CACHE_TTL_SECONDS=300
```

Gemini เป็น optional; หากไม่กำหนดจะใช้ Template ภาษาไทย ส่วนสามค่าแรกสำหรับข้อมูลตลาดจริงต้องกำหนด Twelve Data, Finnhub และ SEC User-Agent

## ก่อน Preview

1. ตรวจ Local release-preparation commit และสร้าง GitHub repository ในรอบที่ได้รับอนุญาต
2. เพิ่ม remote และ Push เฉพาะเมื่อผู้ใช้สั่งอย่างชัดเจน
3. Import repository เข้า Vercel Preview
4. ใส่ Environment Variables แบบ Sensitive ฝั่ง Vercel (ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_`)
5. ทดสอบ FN/NVDA และหุ้นอีกหลายอุตสาหกรรม พร้อมเทียบราคา/งบกับต้นทาง
6. ตรวจ Provider quota, timezone, split-adjustment, earnings/news และ logs

## ก่อน Production

- เพิ่ม durable rate limit หากมีผู้ใช้หลายคน
- เติม Market/Sector comparison และทดสอบ SEC concept mapping ให้ครอบคลุม
- ทำ Manual PWA install/offline test บน iPhone และ Android จริง
- ตรวจสิทธิ์ใช้/แสดง/กระจายข้อมูลของแต่ละ provider
- ทำ Backtest/Paper Trade ก่อนแสดง Confidence เชิงสถิติ
