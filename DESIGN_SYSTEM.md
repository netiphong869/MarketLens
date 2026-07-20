# MarketLens Design System

## Primitives

- `Button`: primary, secondary, ghost, danger; loading/disabled/focus states
- `Card`: editorial, metric, inset; ไม่บังคับรูปแบบเดียวทั้งหน้า
- `Badge`: status พร้อม icon/text
- `ScoreRing`: 0–100, meter semantics, score label และคำอธิบาย
- `ScoreBar`: score comparison ที่ไม่พึ่งสีอย่างเดียว
- `RiskMeter`: คะแนนสูง = เสี่ยงสูง พร้อมระดับข้อความ
- `Skeleton`: รูปร่างใกล้ content จริงและไม่ fake progress
- `EmptyState`, `ErrorState`: สาเหตุและ next action

## Domain components

- SearchBox, CompanyProfileCard, MarketPulse, ApiStatus, DataFreshness
- StockChart, IndicatorPanel, MetricCard, NewsCard
- ScenarioCard, Disclaimer, MockModeBadge, BottomNavigation

## State rules

ทุก component ที่ใช้ข้อมูลภายนอกต้องรองรับ loading, success, partial, unavailable, stale, mock และ error ตามความเหมาะสม Component ต้องรับ typed props และไม่ดึง third-party API เอง
