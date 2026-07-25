# MarketLens Calculation Engine V1

ทุกคะแนนอยู่ระหว่าง 0–100 และต้องคืน `reasons`, `warnings`, `components`, และ `availableWeight` เพื่อ audit ได้ ค่า `null` หมายถึงไม่มีข้อมูล ไม่ใช่ศูนย์

## Q — Data Quality

- Traceable source/structure 20
- Candle completeness 60 (15 ต่อกรอบเวลาที่มีอย่างน้อย 50 แท่ง)
- Financial coverage 15 (ปรับตามสัดส่วน field ที่คำนวณได้จริง)
- Valid latest price 5

`Q < 60` หยุด full conclusion และ entry/exit scenario; `60–74` วิเคราะห์พร้อมเตือน; `75+` ใช้ปกติ ความต่างราคาระหว่างแหล่งเกิน 1% เตือน และเกิน 2% หยุด technical score จนตรวจ session/split ได้

Q วัดคุณภาพของข้อมูลที่มี ไม่ใช่ความครบของทุกโมดูล จึงต้องอ่านคู่กับ Coverage เสมอ ตัวอย่างข้อมูลราคาและแท่งเทียนครบ แต่ไม่มีงบ/ตลาด/ข่าว จะได้ Q=85 จาก 20+60+0+5 ขณะที่ Coverage ของ Fundamental, Market และ News เป็น 0% ห้ามตีความว่า Q=85 หมายถึงวิเคราะห์ครบ 85%

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

Short บังคับ Technical, Medium บังคับ Technical+Fundamental และ Long บังคับ Fundamental หาก F ไม่รองรับหรือ coverage ต่ำกว่า 50% ต้องไม่แอบแทนด้วยศูนย์หรือคะแนนกลาง

## Confidence

V1 แสดงข้อความว่าไม่มี Backtest/Paper Trade เพียงพอ ห้ามสร้างคะแนนสมมุติ
