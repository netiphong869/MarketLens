# MarketLens Production Readiness Phase Design

## เป้าหมาย

เพิ่ม Market/Sector Context ที่ใช้ข้อมูลจริง, ทำ Horizon/Coverage ให้โปร่งใส, ทำ Gemini เป็น optional prose enhancer ที่ปลอดภัย, ประเมิน dependency risk และออกแบบ durable rate limit โดยยัง Deploy เฉพาะ Vercel Preview

## แนวทางที่พิจารณา

1. **Twelve Data + shared daily cache (เลือกใช้)**
   ใช้ SPY เป็น market benchmark และ Sector ETF ตาม sector ของบริษัท โดยดึง daily time series 61–90 แท่งแล้วคำนวณ 1D/5D/20D/60D ในระบบเอง ข้อมูล benchmark ถูก cache ร่วมข้ามหุ้น ลดการเรียกซ้ำและไม่เพิ่ม API key ใหม่
2. Twelve Data ดึง S&P/NASDAQ/Dow/VIX และ Sector ทุกครั้ง
   ครบกว่าแต่ cold request เกิน 8 credits/minute ของ Basic เมื่อรวม quote และ 4 timeframes ของหุ้น
3. แหล่ง keyless ภายนอก
   ลดเครดิตแต่เพิ่มความไม่แน่นอนของ schema, licensing และความเสถียร จึงไม่ใช้ใน Production Readiness

## Market/Sector Architecture

- `MarketContextProvider` รับ stock symbol, sector และ daily stock candles
- benchmark หลักคือ `SPY`; sector map ใช้ ETF มาตรฐาน `XLC`, `XLY`, `XLP`, `XLE`, `XLF`, `XLV`, `XLI`, `XLB`, `XLRE`, `XLK`, `XLU`
- ดึง `SPY` และ sector ETF ผ่าน Twelve Data `time_series` daily อย่างละ 1 credit
- Cache key แยกตาม symbol/timeframe/output size และใช้ TTL 15 นาที
- Cold analysis cost: เดิม 5 credits + SPY 1 + sector ETF 1 = 7 credits
- เมื่อ SPY หรือ sector ถูก cache การวิเคราะห์ถัดไปใช้ 5–6 credits
- S&P 500 ใช้ SPY proxy โดยติดป้ายชัดเจน; NASDAQ/Dow ใช้ QQQ/DIA เฉพาะ Market Pulse ในอนาคต; VIX ไม่มี proxy ที่ถูกเรียกว่า VIX และจะแสดง unavailable หาก Free Tier ไม่รองรับ
- Provider failure/rate limit เป็น optional failure: Market score unavailable/partial, Coverage ลด และ pipeline หุ้นยังทำงานต่อ

## Scoring และ Coverage

คงน้ำหนัก Market Score เดิม:

- Relative strength vs market 30
- Relative strength vs sector 30
- Market trend 15
- Sector trend 15
- Volatility regime 10

Return windows: 1D 10%, 5D 20%, 20D 35%, 60D 35%. Missing window ไม่ถูกแทนด้วยศูนย์หรือคะแนนกลาง; `availableWeight` เท่ากับน้ำหนักที่คำนวณได้จริง

Horizon minimum coverage:

- Short: Technical ≥ 85%, Market ≥ 50%, News ≥ 50%, Fundamental ≥ 25%
- Medium: Technical ≥ 70%, Market ≥ 50%, Fundamental ≥ 50%, News ≥ 25%
- Long: Fundamental ≥ 70%, Technical ≥ 50%, Market ≥ 25%, News ≥ 25%

ถ้าหมวดบังคับไม่ถึงเกณฑ์ ให้ `score=null` และสถานะ `insufficient`; ถ้าผ่านหมวดบังคับแต่หมวดเสริมยังไม่ครบ ให้ `partial`; สร้างคะแนนเฉพาะเมื่อทุกหมวดตามสูตรผ่าน minimum ที่กำหนด

Q เปลี่ยนป้าย UI เป็น “ความน่าเชื่อถือของข้อมูลที่ได้รับ”; Coverage แสดงแยกและไม่เพิ่มเข้า Q

## Fundamental Truthfulness

- ใช้เฉพาะ SEC/Finnhub fields ที่มีค่าจริง
- WACC, ROIC, Forward P/E และ Guidance คงเป็น `null`/`unknown` เมื่อข้อมูลไม่พอ
- Fundamental score ต้องมาพร้อม `availableWeight`
- ถ้า Fundamental Coverage ต่ำกว่า 50% จะแสดงเป็น partial evidence และห้ามใช้สร้าง Medium/Long horizon

## Gemini Strategy

- Template เป็น deterministic primary summary
- Gemini รับเฉพาะ structured text facts ที่ไม่มีตัวเลข
- UI แสดงคะแนน ราคา และเปอร์เซ็นต์จาก structured response เดิมเท่านั้น
- Gemini ตอบเฉพาะข้อความใน schema; ห้ามมีอักขระ `0-9`
- ไม่มี retry generation
- Timeout, 503, invalid JSON, empty output, schema failure หรือตัวเลขใหม่ → Template Fallback ทันที

## Dependency Security

- ใช้ Next.js stable security release ที่ package upstream รองรับ
- ไม่ override `next > sharp` ข้ามช่วง `0.x` หาก Next ไม่ประกาศ compatibility
- ไม่ใช้ `npm audit fix --force`
- ถ้า Production High ยังมากกว่า 0 ให้บันทึก Risk Acceptance และสถานะต้องเป็น “Preview Ready / Production Not Ready”

## Durable Rate Limit Design

แนะนำ Upstash Redis ผ่าน Vercel Marketplace เมื่อเปิดหลายผู้ใช้:

- atomic transaction/Lua หรือ `INCR` + `EXPIRE`
- key: `usage:{clientHash}:{bangkokDate}`
- commit หลัง analysis สำเร็จเท่านั้น
- cache hit ภายใน 5 นาทีไม่เพิ่ม counter
- TTL ถึงหลังเที่ยงคืน Asia/Bangkok เล็กน้อย
- idempotency key ป้องกัน request ซ้ำ

Vercel KV เดิมถูก sunset และเปลี่ยนเป็น Marketplace Redis; Database counter เหมาะเมื่อมีบัญชี/ประวัติถาวร แต่หนักเกิน V1 ส่วนตัว

## Verification

- Unit/integration tests ครอบคลุม market regimes, sector strength, missing VIX, rate limit, shared cache, horizon thresholds, Gemini failures
- lint, typecheck, Vitest, secret-scan tests, Playwright mobile/desktop, build, secret scan, npm audit
- Preview: AAPL, MSFT, LITE, invalid symbol, cache, failed analysis, browser console, runtime logs, client bundle scan
- ห้าม Production และห้าม GitHub Auto Deployment
