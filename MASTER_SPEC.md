# MarketLens V1 Master Specification

MarketLens เป็น PWA สำหรับวิเคราะห์หุ้นบริษัททั่วไปในสหรัฐแบบ on-demand โดยรวบรวมราคา กราฟ งบ ตลาด/กลุ่ม ข่าว และความเสี่ยง แล้วคำนวณด้วยสูตรโปร่งใสก่อนเรียบเรียงภาษาไทย

## เป้าหมาย

- แยกคำถามว่า “บริษัทดีไหม”, “ราคาสมเหตุสมผลไหม” และ “จังหวะปัจจุบันเสี่ยงแค่ไหน”
- อธิบายเหตุผลของทุกคะแนน
- ใช้ได้ครบใน Mock Mode แม้ไม่มี API key
- ปลอดภัยสำหรับนำไปเชื่อม Vercel ภายหลัง โดย key อยู่ server เท่านั้น

## User flow

1. ผู้ใช้เห็น Market Pulse, สถานะ API/Mock และรอบคงเหลือ
2. กรอก ticker แล้วกดวิเคราะห์
3. server ตรวจ symbol, cache และ usage limit
4. provider adapters ดึงข้อมูลและ normalize
5. quality gate ตัดสินว่าข้อมูลพอหรือไม่
6. deterministic engine คำนวณ Q/T/M/F/E/R และคะแนนตามระยะถือ
7. Gemini หรือ template fallback สรุปภาษาไทยจากข้อมูลที่คำนวณแล้ว
8. UI แสดง 5 หน้า: ภาพรวม กราฟ พื้นฐาน ความเสี่ยง สรุป

## Data sources

- Twelve Data: quote และ OHLCV
- SEC EDGAR: company facts และ filings
- Finnhub: profile, news และ earnings events
- Stooq: ราคา backup ที่ต้องติดป้าย delayed/backup
- Gemini: เรียบเรียงภาษาไทยเท่านั้น
- Mock provider: ค่าเริ่มต้นสำหรับพัฒนาและทดสอบ

## Usage and storage

- 10 successful analyses ต่อวันตาม Asia/Bangkok
- หุ้นเดิมภายใน 5 นาทีใช้ cache และไม่หักรอบเพิ่ม
- validation/provider failure ไม่หักรอบ
- V1 ไม่มีฐานข้อมูลถาวรและไม่เก็บประวัติราคาตลาดทั้งหมด
- ตัวนับแบบไม่มีบัญชี/ฐานข้อมูลไม่รับประกันข้ามอุปกรณ์ ข้อจำกัดนี้ต้องแสดงตรงไปตรงมา

## Scope exclusions

ไม่มีสมาชิก พอร์ต ซื้อขายจริง Screener Backtest เต็มระบบ Supabase หรือการให้คะแนนพื้นฐานเต็มสำหรับธนาคาร ประกัน REIT ETF pre-revenue biotech และ commodity producer

## Acceptance

รายละเอียดสถาปัตยกรรม สูตร UI ความปลอดภัย และการทดสอบอยู่ในเอกสารเฉพาะทางของ repository และ design spec ที่ `docs/superpowers/specs/2026-07-18-marketlens-v1-design.md`
