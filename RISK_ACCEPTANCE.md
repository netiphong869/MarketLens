# MarketLens Temporary Dependency Risk Acceptance

วันที่ประเมิน: 2026-07-25
ขอบเขต: Vercel Preview เท่านั้น

## Release decision

MarketLens **ยังไม่ผ่าน Production Readiness** เพราะ `npm audit --omit=dev`
ยังรายงาน Production High จำนวน 2 package nodes จาก advisory chain เดียว:

- `GHSA-f88m-g3jw-g9cj`
- `next@16.2.11` → optional dependency `sharp@0.34.5`
- Sharp รุ่นที่แก้ advisory ต้องเป็น `>=0.35.0`

Next.js stable ล่าสุด ณ วันที่ประเมินคือ `16.2.11` และประกาศ optional dependency
เป็น `sharp ^0.34.5` ซึ่งไม่ยอมรับ `0.35.x` ตาม Semantic Versioning
จึงไม่ทำ `npm override` ข้าม major/minor compatibility โดยไม่มีการรับรองจาก Next.js
และไม่ใช้ `npm audit fix --force`

## Attack surface

- MarketLens ไม่รับไฟล์รูปภาพอัปโหลดจากผู้ใช้
- Source code ไม่ได้เรียก `sharp` โดยตรง
- หน้าแอปใช้ไฟล์ SVG/PNG ภายในโปรเจกต์ และยังไม่มี workflow แปลงรูปภาพจากผู้ใช้
- ความเสี่ยงอยู่ใน optional image-processing dependency ที่ Next.js ติดตั้งไว้

## Exploit preconditions

ผู้โจมตีต้องทำให้ระบบประมวลผลไฟล์รูปภาพที่สร้างขึ้นเพื่อโจมตีผ่านเส้นทางที่ใช้
Sharp/libvips ได้ ปัจจุบัน MarketLens ไม่มี endpoint รับหรือแปลงรูปภาพจากผู้ใช้
จึงลดโอกาสเข้าถึง sink แต่ไม่ได้ทำให้ advisory หายไป

## Compensating controls

- ห้ามเพิ่ม image upload หรือ remote image transformation ก่อนปิด advisory
- จำกัด host และขนาด response ของ provider ทุกตัว
- ใช้ Content Security Policy และ response security headers
- Deploy เฉพาะ Preview ระหว่างที่ Production High ยังมากกว่า 0
- ตรวจ `npm audit --omit=dev` ใน release gate ทุกครั้ง

## Development-tooling risk

อีก 9 High package nodes มาจาก `eslint` / `eslint-config-next` /
`minimatch` / `brace-expansion` ใน dev dependency tree และไม่ถูกติดตั้งใน
production deployment (`npm audit --omit=dev` ไม่รวมกลุ่มนี้)

ทดลอง ESLint 10.8.0 แล้วพบว่า plugin ที่มากับ `eslint-config-next@16.2.11`
ยังไม่รองรับและทำให้ lint ล้ม จึงย้อนกลับ ESLint 9 และไม่ฝืน override

## Exit criteria

ยกเลิก Risk Acceptance นี้เมื่อ:

1. Next.js stable รองรับ Sharp รุ่นที่แก้ advisory หรือออก patch ที่แก้ dependency
2. อัปเกรดแล้ว `lint`, `typecheck`, tests, E2E และ build ผ่านครบ
3. `npm audit --omit=dev` รายงาน Production High = 0
