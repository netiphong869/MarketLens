# MarketLens Progress

Last updated: 2026-07-27 (Asia/Bangkok)

| Workstream                        | Status            | Evidence                                                                                                      |
| --------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Live provider baseline            | Completed         | Preview env 6 names SET; Twelve Data works; Finnhub 401; SEC ~3.75 MB; Gemini model 404; Stooq HTML challenge |
| Finnhub auth hardening            | Completed locally | `X-Finnhub-Token` regression test                                                                             |
| Gemini model discovery            | Completed locally | discovery, stable Flash selection, model 404 and hallucinated-number fallback tests                           |
| SEC Company Facts boundary        | Completed locally | >1 MB success, >6 MiB reject, JSON/content/redirect checks                                                    |
| Coverage and horizon truthfulness | Completed locally | Q=85 explanation, module coverage, nullable unavailable scores, Partial/Insufficient horizons                 |
| Stooq validation                  | Completed locally | real response identified as HTML challenge; parser rejects unusable backup                                    |
| Dependency triage                 | In progress       | Next.js 16.2.11 installed; 11 High package nodes remain from 2 root advisory chains                           |
| Local verification                | Completed         | lint, typecheck, 30 Vitest files/68 tests, scanner 4/4, E2E 4/4, build, secret scan                           |
| Live Preview verification         | Pending           | ต้อง Commit/Push และ Deploy Preview หลังเอกสารพร้อม                                                           |

## Deterministic Summary + Gemini Verdict 2026-07-27

- Deterministic engine เป็นเจ้าของตัวเลข คะแนน สถานะรายระยะ จุดแข็ง จุดอ่อน ความเสี่ยง Watch Items และ Scenario
- Gemini รับและส่งกลับเฉพาะ Verdict 2–3 ประโยค ระบบตรวจ Schema ชุดตัวเลข และ semantic anchors ก่อนแทนที่ `summary.overview`
- Horizon Summary ใช้เกณฑ์ Coverage เดียวกับ `CALCULATION_ENGINE.md`; เมื่อไม่ผ่านจะแสดง `ข้อมูลไม่เพียงพอ`, ซ่อนคะแนน และระบุโมดูลที่ขาด
- Summary UI เรียง Verdict, สถานะรายระยะ, เหตุผล, ความเสี่ยง, สิ่งที่ต้องติดตาม, Scenario, ข้อจำกัด และ Disclaimer
- หน้าหลักแสดง `สรุปโดย MarketLens`; ที่มาจาก Gemini หรือ Deterministic Template อยู่ใน Info Disclosure เท่านั้น
- Local verification: lint ผ่าน, typecheck ผ่าน, Vitest 38 files / 119 tests ผ่าน, secret-scanner regression 4/4 ผ่าน, Playwright mobile/desktop 4/4 ผ่าน, production build ผ่าน และ secret scan ผ่าน
- Preview verification: รอ Commit/Push และ Preview deployment รอบนี้

## Technical Indicator Snapshot 2026-07-26

- Root cause: indicator engine คำนวณค่าจาก OHLCV เพื่อสร้าง Technical Score แล้วทิ้งค่าราย indicator; `AnalysisResponse` ไม่มี Snapshot และ `ChartPanel` จึงใช้ Placeholder
- เพิ่ม `technicalSnapshot` ครบ 15M, 1H, 4H และ 1D จาก OHLCV เดิมโดยไม่มี Twelve Data call สำหรับ indicator เพิ่ม
- รองรับ EMA20/50/100/200, RSI14, MACD line/signal/histogram, ADX14, ATR14, Current/Average20/Ratio Volume และ OBV
- Missing Data เป็น `null` พร้อมเหตุผลราย field ไม่ใช้ศูนย์แทน
- UI ใช้ timeframe state เดียวกันเลือกทั้งกราฟและ Snapshot พร้อมคำอธิบายภาษาไทย
- Local verification รอบสุดท้าย: lint ผ่าน, typecheck ผ่าน, Vitest 38 files / 111 tests ผ่าน, Secret-scan regression 4/4 ผ่าน, Playwright mobile/desktop 4/4 ผ่าน, production build ผ่าน และ secret scan ผ่าน (155 current files, 8 commits, 1073 history blobs)
- รีวิวอิสระรอบสองไม่พบ Critical หรือ Important ที่เหลือใน ADX Wilder seed, Snapshot แยกตาม Timeframe, Missing reason และ Analysis Response Schema
- Commit/Push/Preview verification: รอดำเนินการหลัง final review

## Local verification 2026-07-25

- `npm run verify`: exit 0
- Vitest: 30 files / 68 tests
- Secret scanner regression: 4/4
- Playwright: 4/4 mobile + desktop
- Production build: Next.js 16.2.11 passed
- Secret scan: 136 current files, 3 commits, 382 history blobs
- Working branch: `main`
- Production deployment: not performed

## Final Preview verification 2026-07-25

- Final code commit: `2a6fb9b`
- Preview deployment: `dpl_2u3kSa3MHsrUPGH1nLy3xeTBRCGD`
- Preview URL: `https://marketlens-1f0lwziuy-netiphong869-s-projects.vercel.app`
- `/api/health`: `mode=live`
- Preview environment: ตัวแปรทั้ง 6 ชื่อเป็น SET โดยไม่ได้อ่านหรือแสดงค่า
- AAPL: Technical 100% / Fundamental 45% / Market 0% / News 100%, Q 91.75
- MSFT: Technical 100% / Fundamental 45% / Market 0% / News 100%, Q 91.75
- LITE: Technical 100% / Fundamental 38.75% / Market 0% / News 100%, Q 90.81
- Horizon: ระยะสั้นเป็น Partial; ระยะกลางและยาวเป็น Insufficient และไม่มีคะแนนปลายทาง
- Finnhub: ใช้งานได้จริงหลังเปลี่ยนเป็น `X-Finnhub-Token`; ไม่ต้องเปลี่ยน Key
- Gemini: ค้นพบ `models/gemini-3.6-flash`; Template Fallback ทำงานเมื่อ output ไม่ผ่าน validation หรือ upstream ตอบ 503
- SEC Company Facts: fundamentals ทำงานจริงสำหรับทั้งสามหุ้น
- Browser console: ไม่พบ warning/error
- Runtime logs: ไม่พบ server error หรือ secret
- Deployment ทั้งหมดของโครงการยังเป็น Preview และ GitHub Auto Deployment ยังไม่ได้เชื่อม
- Production deployment: ไม่ได้ดำเนินการ
