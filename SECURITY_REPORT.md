# MarketLens Security Report

วันที่: 2026-07-20

## Controls ที่มีแล้ว

- Third-party credentials อ่านจาก server environment เท่านั้น
- Browser เรียกเฉพาะ `/api/analyze`
- Zod validation และ allowlist สำหรับ symbol
- Safe error response ไม่ส่ง stack trace, path หรือ provider secret
- Timeout, response size limit และ retry สูงสุด 1 ครั้ง; ไม่ retry 401/403/429
- Production CSP, HSTS, nosniff, frame denial, referrer และ permissions policy
- Secret scan ตรวจทุก current file (รวม binary และ `package-lock.json`) และทุก blob ใน reachable Git history
- Scanner ไม่พิมพ์ค่าลับที่ตรวจพบออก log แสดงเฉพาะตำแหน่งและประเภท
- Gemini output schema และตรวจตัวเลขย้อนกับ structured input
- PWA ไม่ cache API market data

## Dependency audit

ใช้ `overrides.postcss` ที่รุ่นแก้ไขแล้ว หลังติดตั้ง `npm audit --audit-level=moderate` รายงาน 0 vulnerabilities โดยไม่ได้ใช้ `--force`

## Git และข้อมูลส่วนตัว

- ก่อนสร้าง release commit repository ไม่มี commit เดิม จึงไม่มี historical secret ให้ล้าง; หลังสร้าง commit ได้สแกน 1 reachable commit และ 126 history blobs ผ่าน
- ไม่พบ API key, token, password, secret assignment หรือ environment value จริง
- ไม่พบชื่อบัญชี Windows, home path, เบอร์โทร หรืออีเมลจริงในไฟล์ที่จะเผยแพร่
- `test@local.invalid` เป็น identity จำลองของ temporary repository ใน regression test
- ไม่มี Git remote และไม่พบการ Push/Deploy ในรอบนี้

## Residual risks

- In-memory usage limit ไม่ใช่ security boundary บน Serverless
- CSP ต้องมี `unsafe-inline` สำหรับ Next.js static script/style; production ไม่มี `unsafe-eval`
- API provider entitlement และ redistribution rights ต้องตรวจตามแพ็กเกจจริง
- ต้องทดสอบ log/observability บน Preview เพื่อยืนยันว่า provider response ไม่ถูกบันทึกเกินจำเป็น

ไม่มี Critical security issue ที่ค้างอยู่สำหรับการเผยแพร่ source code ปัจจุบัน
