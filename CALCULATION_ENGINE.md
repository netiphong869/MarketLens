# MarketLens Calculation Engine V1

ทุกคะแนนอยู่ระหว่าง 0–100 และต้องคืน `reasons`, `warnings`, `components`, และ `availableWeight` เพื่อ audit ได้ ค่า `null` หมายถึงไม่มีข้อมูล ไม่ใช่ศูนย์

## Q — Data Integrity

- Traceable source/structure 20
- Candle completeness 60 (15 ต่อกรอบเวลาที่มีอย่างน้อย 50 แท่ง)
- Financial coverage 15 (ปรับตามสัดส่วน field ที่คำนวณได้จริง)
- Valid latest price 5

`Q < 60` หยุด full conclusion และ entry/exit scenario; `60–74` วิเคราะห์พร้อมเตือน; `75+` ใช้ปกติ ความต่างราคาระหว่างแหล่งเกิน 1% เตือน และเกิน 2% หยุด technical score จนตรวจ session/split ได้

Q วัดความถูกต้อง ความสด และความตรวจสอบย้อนกลับได้ของข้อมูลที่ได้รับ ไม่ใช่ความครบของทุกโมดูล จึงต้องแสดงชื่อว่า **Data Integrity** และอ่านคู่กับ Coverage เสมอ ตัวอย่างข้อมูลราคาและแท่งเทียนครบ แต่ไม่มีงบ/ตลาด/ข่าว อาจมี Integrity สูงได้ ขณะที่ Coverage ของ Fundamental, Market และ News ต่ำ ห้ามตีความว่า Integrity หมายถึงวิเคราะห์ครบ

## Coverage

- Technical: สัดส่วน timeframe ที่คำนวณได้ตามน้ำหนัก 1D/4H/1H/15M
- Fundamental: สัดส่วนน้ำหนัก field พื้นฐานที่มีค่าจริง
- Market: ต้องมี market/sector context จริง
- News: ต้องมีผลตอบกลับข่าวที่นำมาประเมินได้

`complete` ตั้งแต่ 85%, `partial` มากกว่า 0% แต่น้อยกว่า 85%, และ `insufficient` เท่ากับ 0% ค่า unavailable ต้องเป็น `null` ไม่ใช้ 0 หรือ 50 แทน

## T — Technical

- Trend/EMA 30
- RSI/MACD 20
- ADX/+DI/-DI 10
- Volume/VWAP/OBV 15
- Support/resistance/reward-risk 15
- ATR/Bollinger 10

Timeframe: 1D 40%, 4H 30%, 1H 20%, 15M 10%. คะแนนยืนยันใช้แท่งปิดแล้ว แท่งกำลังก่อตัวเป็น provisional เท่านั้น

### Technical Snapshot

ระบบส่งค่าตัวชี้วัดล่าสุดแยกตาม 15M, 1H, 4H และ 1D จาก OHLCV ชุดเดียวกับ Technical Score โดยไม่ใช้คะแนนเป็นค่าทดแทนและไม่เรียก Provider เพิ่ม:

- EMA20 / EMA50 / EMA100 / EMA200
- RSI14
- MACD line / signal / histogram
- ADX14
- ATR14
- Current Volume / Average Volume 20 / Volume Ratio
- OBV

จำนวนแท่งขั้นต่ำคือ EMA ตาม period, RSI14 15 แท่ง, MACD line 26 แท่ง, MACD signal/histogram 34 แท่ง, ATR14 14 แท่ง, ADX14 27 แท่ง และ Average Volume/Volume Ratio 20 แท่ง โดย ADX14 ใช้ค่า DX ที่พร้อมคำนวณจริง 14 ค่าแรกเป็น seed แล้วทำ Wilder smoothing ต่อ ค่าไม่พร้อมใช้ต้องเป็น `null` พร้อมเหตุผลราย field เช่นข้อมูลแท่งเทียนไม่พอหรือไม่มี Volume ค่า `0` ใช้ได้เฉพาะเมื่อเป็นผลคำนวณจริงเท่านั้น

## M — Market and sector

- Relative strength vs market 30
- Relative strength vs sector 30
- Market trend 15
- Sector trend 15
- Volatility regime 10

ช่วงเปรียบเทียบ 1D 10%, 5D 20%, 20D 35%, 60D 35%

## F — Fundamental

- Growth/earnings delivery 25
- Profitability/cash conversion 20
- Debt/financial health 15
- ROIC vs estimated WACC 15
- Valuation 15
- Product/business direction 10

Revenue growth >10%, EPS growth >15%, และ net debt/EBITDA <=2.5x เป็น reference ไม่ใช่กฎสากล ต้องเทียบประวัติบริษัทและอุตสาหกรรม Margin 40% ไม่ใช่เกณฑ์บังคับ WACC ที่ input ไม่ครบต้องเป็น unavailable

## E — News and events

เริ่มที่ 50 แล้วปรับตาม source authority, recency, relevance, duplicate และ severity เอกสาร SEC/ประกาศบริษัทมีน้ำหนักสูงสุด Social ที่ไม่ยืนยันไม่ให้คะแนน

## R — Risk

- Volatility 20
- Liquidity 15
- Event proximity 15
- Financial risk 20
- Technical damage 10
- Dilution/accounting 10
- Business concentration 10

Risk penalty: 0–30 หัก 0, 31–50 หัก 3, 51–70 หัก 8, 71–85 หัก 15, 86–100 หัก 25

เพื่อไม่ให้ค่าเฉลี่ยถ่วงน้ำหนักกลบสัญญาณอันตราย ใช้ risk floor 65 เมื่อพบ leverage รุนแรง (net debt/EBITDA ตั้งแต่ 8x), interest coverage ติดลบ หรือ net margin ต่ำกว่า -30% กฎนี้เป็นเพดานเตือน ไม่ได้ทำให้คะแนนเกิน 100

## Horizon scores

```text
Short  = T*0.50 + M*0.20 + E*0.20 + F*0.10 - penalty
Medium = T*0.35 + M*0.20 + F*0.30 + E*0.15 - penalty
Long   = F*0.60 + T*0.15 + M*0.10 + E*0.15 - penalty
```

Clamp 0–100. Q และ Confidence ห้ามเป็นโบนัส

- `available`: โมดูลที่สูตรใช้มี score และ coverage อย่างน้อย 50% ครบ
- `partial`: โมดูลบังคับพร้อม แต่โมดูลประกอบบางส่วนขาด แสดงสถานะโดยไม่แสดงคะแนน
- `insufficient`: โมดูลบังคับขาด แสดงสถานะโดยไม่แสดงคะแนน

เกณฑ์ Coverage ขั้นต่ำ:

- Short: Technical 85%, Market 50%, News 50%, Fundamental 25%
- Medium: Technical 70%, Market 50%, Fundamental 50%, News 25%
- Long: Fundamental 70%, Technical 50%, Market 25%, News 25%

Short บังคับ Technical, Medium บังคับ Technical+Fundamental และ Long บังคับ Fundamental หากหมวดบังคับต่ำกว่าเกณฑ์ให้แสดง `Insufficient` หากหมวดบังคับผ่านแต่หมวดเสริมต่ำกว่าเกณฑ์ให้แสดง `Partial` ทั้งสองกรณีห้ามสร้างคะแนน ห้ามแทนข้อมูลที่ขาดด้วยศูนย์หรือคะแนนกลาง

## Confidence

V1 แสดงข้อความว่าไม่มี Backtest/Paper Trade เพียงพอ ห้ามสร้างคะแนนสมมุติ
