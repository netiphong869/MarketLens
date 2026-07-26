# Technical Indicator Snapshot Design

## เป้าหมาย

ให้หน้า Chart ของ MarketLens แสดงค่า Indicator ล่าสุดจาก OHLCV ชุดเดียวกับที่ใช้คำนวณ Technical Score แยกตามกรอบเวลา 15M, 1H, 4H และ 1D โดยไม่เรียก Twelve Data เพิ่ม และไม่ใช้คะแนนเทคนิคแทนค่าจริง

## ต้นเหตุที่ยืนยันแล้ว

เส้นทางข้อมูลปัจจุบันเป็นดังนี้:

```text
Twelve Data OHLCV
→ buildLiveAnalysis เก็บ candles ครบ 4 timeframe
→ scoreTechnical คำนวณ EMA/RSI/MACD/ADX/ATR/OBV
→ เก็บไว้เฉพาะคะแนนรวมและทิ้งค่าตัวชี้วัด
→ AnalysisResponse ไม่มี technicalSnapshot
→ ChartPanel จึงแสดง Placeholder “ดูจากคะแนนเทคนิค”
```

สูตร Indicator หลักมีอยู่แล้วใน `src/engine/indicators/indicators.ts` ส่วน Average Volume และ Volume Ratio มีตรรกะบางส่วนอยู่ภายใน scoring engine แต่ยังไม่มี contract สำหรับส่งออกไปยัง API/UI

## แนวทางที่พิจารณา

1. คำนวณ Indicator ซ้ำใน Browser จาก `analysis.candles`
   - ข้อดี: แก้ UI เร็ว
   - ข้อเสีย: สูตรกระจายไปสองฝั่ง, ตรวจสอบย้อนหลังยาก และไม่เป็นไปตามเส้นทาง engine → schema → API
2. คำนวณใน service หลัง scoring
   - ข้อดี: ยังอยู่ฝั่ง server
   - ข้อเสีย: สูตรซ้ำกับ engine และมีโอกาสค่าคะแนนกับค่าที่แสดงไม่ตรงกัน
3. ให้ deterministic indicator engine สร้าง Snapshot แล้วส่งผ่าน response contract
   - ข้อดี: ใช้ OHLCV เดิม, ไม่มี provider call เพิ่ม, มีแหล่งคำนวณเดียว และทดสอบแต่ละชั้นได้
   - เลือกแนวทางนี้

## Data contract

เพิ่ม `technicalSnapshot` ที่ระดับบนของ `AnalysisResponse` เป็น
`Record<Timeframe, TechnicalSnapshot>` โดยแต่ละรายการมี:

```ts
interface TechnicalSnapshot {
  timeframe: Timeframe;
  latestClose: number | null;
  ema20: number | null;
  ema50: number | null;
  ema100: number | null;
  ema200: number | null;
  rsi14: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  adx14: number | null;
  atr14: number | null;
  currentVolume: number | null;
  averageVolume20: number | null;
  volumeRatio: number | null;
  obv: number | null;
  calculatedAt: string;
  unavailable: Partial<Record<TechnicalSnapshotMetric, string>>;
}
```

ค่าไม่พร้อมใช้ `null` เท่านั้น ไม่ใช้ `0` แทน Missing Data ส่วน `0` ที่เป็นผลคำนวณจริง เช่น MACD ของราคาคงที่ ยังคงแสดงเป็นค่าจริงได้

## Calculation flow

`analyzeSnapshot` จะคำนวณ Snapshot พร้อมกับ Technical Score จาก candles ที่ได้รับอยู่แล้ว ค่า `calculatedAt` ใช้เวลาเดียวกับ analysis response เพื่อให้ผล deterministic ใน Test และตรงกันทั้ง 4 กรอบเวลา

จำนวนแท่งขั้นต่ำ:

- latestClose: 1
- EMA20/50/100/200: 20/50/100/200
- RSI14: 15
- MACD line: 26
- MACD signal/histogram: 34
- ATR14: 14
- ADX14: 27
- Average Volume 20 และ Volume Ratio: 20 แท่งที่มี Volume ใช้ได้
- OBV: ต้องมี Volume ใช้ได้ตลอดชุดที่นำมาคำนวณ

หากข้อมูลไม่ครบ ให้ระบุเหตุผลราย field เช่น “ข้อมูลแท่งเทียนไม่เพียงพอสำหรับ EMA200 (ต้องมี 200 แท่ง; มี 50 แท่ง)” หรือ “ไม่มี Volume ที่ใช้คำนวณได้”

## API และ validation

Route `/api/analyze` ส่ง `technicalSnapshot` ภายใน `data` ตามปกติ โดยไม่เรียก Provider เพิ่ม ฝั่ง Browser ใช้ Zod ตรวจ contract ของ Snapshot ก่อนนำไปแสดง เพื่อไม่ให้ payload ที่ขาด field หรือมี `NaN`/ชนิดข้อมูลผิดไหลเข้า UI แบบเงียบ ๆ

## UI

`ChartPanel` ถือ state ของ timeframe เพียงจุดเดียวและส่ง Snapshot ของ timeframe ปัจจุบันไปยัง `IndicatorSnapshot` ดังนั้นเมื่อกด 15M/1H/4H/1D ทั้งกราฟและค่าตัวชี้วัดจะเปลี่ยนใน render เดียวกัน

หน้าจอแสดง:

- ค่าตัวเลขของ EMA 4 เส้น พร้อมบอกว่าราคาอยู่เหนือ/ต่ำกว่าแต่ละเส้น
- RSI14 พร้อมโซนขายมาก/เป็นกลาง/ซื้อมาก
- MACD line, signal และ histogram พร้อมทิศทาง momentum
- ADX14 พร้อมระดับความแข็งแรงของแนวโน้ม
- ATR14 พร้อมสัดส่วนต่อราคาปิด
- Current Volume, Average Volume 20, Volume Ratio และ OBV พร้อมคำแปล
- เวลา Snapshot และเหตุผลเฉพาะ field ที่คำนวณไม่ได้

## Testing

- Unit Test ค่า EMA, RSI, MACD, ADX, ATR, OBV และ Volume Metrics ด้วยผลคาดหวังที่คำนวณแยกจาก production code
- Unit Test Snapshot สำหรับข้อมูลไม่พอและไม่มี Volume
- Service/API Test ยืนยันว่ามี Snapshot ครบ 4 timeframe และไม่มี Twelve Data call เพิ่มจาก 4 candle calls เดิม
- Component Test ยืนยันตัวเลข คำอธิบาย และเหตุผลเมื่อข้อมูลหาย
- Interaction Test กดเปลี่ยน timeframe แล้วค่าบน Snapshot เปลี่ยนทันที
- Full verification: lint, typecheck, Vitest, Playwright mobile/desktop, build และ secret scan

## ขอบเขตการเผยแพร่

หลัง verification ผ่าน จึง Commit และ Push `main` แล้ว Deploy ด้วย Vercel CLI เฉพาะ Preview เท่านั้น ห้ามใช้ `--prod`, ห้ามเปลี่ยน Production Domain และห้ามเชื่อม GitHub Auto Deployment
