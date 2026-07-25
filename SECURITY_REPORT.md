# MarketLens Security Report

วันที่: 2026-07-25

## Provider controls

- Third-party credentials อยู่ใน server environment เท่านั้น
- Finnhub ใช้ `X-Finnhub-Token`; URL ไม่มี token
- Gemini ใช้ `x-goog-api-key`; URL ไม่มี key
- Shared JSON client คงเพดาน 1 MB
- SEC Company Facts มี exact host/protocol/path allowlist, timeout 12 วินาที, `redirect: error`, JSON content-type validation และ decompressed-size cap 6 MiB
- SEC เลือกเฉพาะ XBRL fields ที่ระบบใช้ก่อน normalization
- Stooq HTML challenge ไม่ถูกยอมรับเป็น backup data
- Provider issues ถูก sanitize และไม่มี header/credential
- Template Fallback ทำงานเมื่อ Gemini discovery/generation/output validation ล้มเหลว

## Dependency triage

Baseline `npm audit --json`: 11 High package nodes, 0 Critical

### Next.js security release

อัปเกรด `next` และ `eslint-config-next` จาก 16.2.10 เป็น 16.2.11 แล้ว Advisory ต่อไปนี้ไม่ปรากฏใน audit หลังอัปเกรด:

- GHSA-6gpp-xcg3-4w24
- GHSA-m99w-x7hq-7vfj
- GHSA-89xv-2m56-2m9x
- GHSA-68g3-v927-f742
- GHSA-4633-3j49-mh5q
- GHSA-4c39-4ccg-62r3
- GHSA-p9j2-gv94-2wf4
- GHSA-q8wf-6r8g-63ch
- GHSA-955p-x3mx-jcvp

### Residual advisory chains

1. `GHSA-f88m-g3jw-g9cj` — Sharp/libvips, High
   - Path: `next@16.2.11 > sharp@0.34.5`
   - Type: optional production dependency
   - Direct project `sharp@0.35.3` ปลอดจากช่วง advisory แต่ Next ยังติดตั้ง nested 0.34.5
   - Exploitability: ลดลงเพราะ MarketLens ไม่ import `next/image`, `ImageResponse` หรือเรียก image optimization แต่ package ยังอยู่ใน production tree จึงถือเป็น residual High
   - ไม่ force override ข้าม sharp 0.x major เพราะยังไม่มีหลักฐาน compatibility จาก Next.js

2. `GHSA-mh99-v99m-4gvg` — brace-expansion DoS, High
   - Paths: ESLint/config/plugins > minimatch > brace-expansion
   - Type: dev dependency เท่านั้น
   - Exploitability: ไม่ถูก bundle/deploy เป็น application runtime; มีผลต่อ local/CI lint หากป้อน glob ที่ไม่ไว้วางใจ
   - `npm audit fix --dry-run` เสนอ ESLint major และ downgrade `eslint-config-next` ที่ไม่เหมาะกับ Next 16 จึงไม่ใช้ `--force`

หลังอัปเกรดยังรายงาน 11 High package nodes แต่เกิดจาก 2 advisory chains ข้างต้น; `npm audit --omit=dev` เหลือ 2 High package nodes (`next`, `sharp`) และ 0 Critical

## Secret verification

- Secret scan ผ่าน 136 current files, 3 commits และ 382 history blobs
- ไม่พบ API key, token, password หรือ environment value จริง
- ไม่มี credential แสดงใน URL, response หรือรายงานนี้

## Release position

พร้อมสำหรับ Vercel Preview เพื่อทดสอบ live providers เท่านั้น ยังไม่อนุมัติ Production เพราะมี residual Sharp High และ durable rate limit ยังไม่มี
