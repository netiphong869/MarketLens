# MarketLens Live Provider Stabilization and Security Readiness

วันที่: 2026-07-25

## เป้าหมาย

ทำให้ Vercel Preview ใช้ Provider จริงได้อย่างโปร่งใส ปลอดภัย และไม่สร้างคะแนนที่ทำให้เข้าใจผิดเมื่อข้อมูลบางหมวดขาด โดยไม่แตะ Production หรือ GitHub Auto Deployment

## หลักฐาน Baseline

- Twelve Data ใช้งานได้
- Finnhub ใช้ query `token` ซึ่งเอกสารรองรับ แต่ตอบ 401
- SEC Company Facts ตอบ JSON ประมาณ 3.75 MB และชนเพดาน HTTP ทั่วไป 1 MB
- Gemini hardcode `gemini-2.5-flash` และ endpoint ตอบ 404
- Stooq ตอบ HTTP 200 แต่เป็น HTML JavaScript challenge ไม่ใช่ CSV
- Quality 85 มาจาก traceability 20 + OHLCV สี่กรอบเวลา 60 + quote 5 แม้ fundamentals, market และ news ยังขาด
- `npm audit` พบ 11 High: Next.js/Sharp ใน runtime และ ESLint/Minimatch/brace-expansion ใน dev tooling

## การออกแบบ

### Finnhub

- ใช้ `X-Finnhub-Token` แทน query token เพื่อลดโอกาส secret ปรากฏใน URL หรือ access log
- ไม่ retry 401
- Preview diagnostic รายงานเฉพาะ SET/UNSET, auth transport และ HTTP status
- ถ้ายัง 401 หลังเปลี่ยน transport ให้สรุปว่า credential ฝั่ง Preview ต้องเปลี่ยน

### Gemini

- เรียก Models API ก่อน แล้วกรองเฉพาะโมเดลที่รองรับ `generateContent`
- เลือกโมเดล Flash แบบ stable จากรายการที่ API key เข้าถึงได้จริง
- ไม่ใช้ชื่อ hardcode ถ้าชื่อนั้นไม่ได้อยู่ในผล discovery
- cache เฉพาะชื่อโมเดลที่ค้นพบใน instance เพื่อลด request
- ถ้า discovery, generation, schema หรือ number validation ล้มเหลว ให้ใช้ Template Fallback

### SEC Company Facts

- สร้าง HTTP path เฉพาะ `https://data.sec.gov/api/xbrl/companyfacts/...`
- allowlist protocol และ hostname แบบ exact
- `redirect: "error"`, timeout, JSON content-type validation
- stream body ที่ถูก decompress แล้วและหยุดเมื่อเกินเพดาน 6 MiB
- เพดาน 1 MB ของ client ทั่วไปไม่เปลี่ยน
- หลัง parse ให้ project เฉพาะ XBRL concepts ที่ MarketLens ใช้ แล้วไม่ส่ง raw response ต่อไป

### Coverage และคะแนน

- เพิ่ม Coverage แยก Technical, Fundamental, Market และ News
- `availableWeight=0` ต้องแสดง unavailable ไม่แสดงคะแนนกลาง
- Fundamental คำนวณเฉพาะน้ำหนักที่มีข้อมูลจริงและรายงาน coverage ตามน้ำหนัก
- Horizon จะเป็น `available`, `partial` หรือ `insufficient`; ไม่มีคะแนนเมื่อองค์ประกอบบังคับไม่ครบ
- Quality ยังคงเป็นคุณภาพข้อมูล ไม่ใช่คะแนนหุ้น และแสดงองค์ประกอบ 85 อย่างโปร่งใส
- ไม่ลด Quality Gate 60

### Stooq

- ตรวจ Content-Type และ CSV header ก่อน parse
- HTML challenge หรือ schema ที่ไม่ตรงให้ตอบ provider unavailable
- ไม่ประกาศว่าสำรองพร้อมใช้จนกว่าจะมีแท่งจริง

### Dependency Security

- อัปเกรด Next.js และ `eslint-config-next` จาก 16.2.10 เป็น stable security release 16.2.11
- ไม่ใช้ `npm audit fix --force`
- รายการ dev-only ที่ยังต้อง major upgrade ให้บันทึก residual risk และ exploitability ตามเส้นทางใช้งานจริง

## Verification และการเผยแพร่

- รัน lint, typecheck, tests, E2E desktop/mobile, build, secret scan และ npm audit
- Commit/Push เฉพาะเมื่อ verification ผ่าน
- Deploy ด้วย Vercel CLI เฉพาะ Preview
- ทดสอบ AAPL, MSFT, LITE, health, console และ runtime logs
- ไม่ deploy Production และไม่เชื่อม GitHub Auto Deployment
