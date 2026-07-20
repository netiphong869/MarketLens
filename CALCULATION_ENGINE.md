# MarketLens Calculation Engine V1

ทุกคะแนนอยู่ระหว่าง 0–100 และต้องคืน `reasons`, `warnings`, `components`, และ `availableWeight` เพื่อ audit ได้ ค่า `null` หมายถึงไม่มีข้อมูล ไม่ใช่ศูนย์

## Q — Data Quality

- Freshness 20
- Candle completeness 20
- Corporate-action adjustment status 15
- Cross-source consistency 15
- Financial completeness/recency 15
- Symbol/exchange/timezone/type 10
- Traceable source/timestamp 5

`Q < 60` หยุด full conclusion และ entry/exit scenario; `60–74` วิเคราะห์พร้อมเตือน; `75+` ใช้ปกติ ความต่างราคาระหว่างแหล่งเกิน 1% เตือน และเกิน 2% หยุด technical score จนตรวจ session/split ได้

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

Clamp 0–100. Q และ Confidence ห้ามเป็นโบนัส หาก F ไม่รองรับ ต้องไม่แอบแทนเป็นศูนย์และต้องงด horizon ที่พึ่ง F จนกว่าสูตร degradation จะมี test/เอกสารรองรับ

## Confidence

V1 แสดงข้อความว่าไม่มี Backtest/Paper Trade เพียงพอ ห้ามสร้างคะแนนสมมุติ
