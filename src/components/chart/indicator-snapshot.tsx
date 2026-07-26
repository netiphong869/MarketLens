import type {
  TechnicalSnapshot,
  TechnicalSnapshotMetric,
} from "@/types/analysis";

import styles from "@/features/analysis/analysis-dashboard.module.css";

const timeframeLabels: Record<TechnicalSnapshot["timeframe"], string> = {
  "15m": "15M",
  "1h": "1H",
  "4h": "4H",
  "1d": "1D",
};

export function IndicatorSnapshot({
  snapshot,
}: {
  snapshot: TechnicalSnapshot;
}) {
  const timeframe = timeframeLabels[snapshot.timeframe];
  return (
    <div
      className={styles.indicatorSnapshot}
      role="region"
      aria-label={`Indicator Snapshot ${timeframe}`}
    >
      <div className={styles.indicatorHeader}>
        <div>
          <h2 className={styles.sectionTitle}>
            Indicator Snapshot · {timeframe}
          </h2>
          <p className={styles.indicatorMeta}>
            คำนวณจาก OHLCV ของกรอบเวลาที่เลือก ไม่ใช่คะแนน Technical
          </p>
        </div>
        <time className={styles.indicatorTime} dateTime={snapshot.calculatedAt}>
          {formatCalculatedAt(snapshot.calculatedAt)}
        </time>
      </div>

      <div className={styles.indicatorGrid}>
        <SnapshotMetric
          label="ราคาปิดล่าสุด"
          metric="latestClose"
          value={snapshot.latestClose}
          snapshot={snapshot}
          format={formatPrice}
          explanation="ราคาปิดของแท่งล่าสุดในกรอบเวลานี้"
        />
        <SnapshotMetric
          label="EMA20"
          metric="ema20"
          value={snapshot.ema20}
          snapshot={snapshot}
          format={formatPrice}
          explanation={emaExplanation(
            snapshot.latestClose,
            snapshot.ema20,
            "EMA20",
          )}
        />
        <SnapshotMetric
          label="EMA50"
          metric="ema50"
          value={snapshot.ema50}
          snapshot={snapshot}
          format={formatPrice}
          explanation={emaExplanation(
            snapshot.latestClose,
            snapshot.ema50,
            "EMA50",
          )}
        />
        <SnapshotMetric
          label="EMA100"
          metric="ema100"
          value={snapshot.ema100}
          snapshot={snapshot}
          format={formatPrice}
          explanation={emaExplanation(
            snapshot.latestClose,
            snapshot.ema100,
            "EMA100",
          )}
        />
        <SnapshotMetric
          label="EMA200"
          metric="ema200"
          value={snapshot.ema200}
          snapshot={snapshot}
          format={formatPrice}
          explanation={emaExplanation(
            snapshot.latestClose,
            snapshot.ema200,
            "EMA200",
          )}
        />
        <SnapshotMetric
          label="RSI14"
          metric="rsi14"
          value={snapshot.rsi14}
          snapshot={snapshot}
          explanation={rsiExplanation(snapshot.rsi14)}
        />
        <SnapshotMetric
          label="MACD Line"
          metric="macdLine"
          value={snapshot.macdLine}
          snapshot={snapshot}
          explanation="ค่าของเส้น MACD ล่าสุด"
        />
        <SnapshotMetric
          label="MACD Signal"
          metric="macdSignal"
          value={snapshot.macdSignal}
          snapshot={snapshot}
          explanation="เส้นสัญญาณที่ใช้เทียบกับ MACD"
        />
        <SnapshotMetric
          label="MACD Histogram"
          metric="macdHistogram"
          value={snapshot.macdHistogram}
          snapshot={snapshot}
          explanation={macdExplanation(snapshot.macdHistogram)}
        />
        <SnapshotMetric
          label="ADX14"
          metric="adx14"
          value={snapshot.adx14}
          snapshot={snapshot}
          explanation={adxExplanation(snapshot.adx14)}
        />
        <SnapshotMetric
          label="ATR14"
          metric="atr14"
          value={snapshot.atr14}
          snapshot={snapshot}
          format={formatPrice}
          explanation={atrExplanation(snapshot.atr14, snapshot.latestClose)}
        />
        <SnapshotMetric
          label="Volume ล่าสุด"
          metric="currentVolume"
          value={snapshot.currentVolume}
          snapshot={snapshot}
          format={formatVolume}
          explanation="ปริมาณซื้อขายของแท่งล่าสุด"
        />
        <SnapshotMetric
          label="Volume เฉลี่ย 20"
          metric="averageVolume20"
          value={snapshot.averageVolume20}
          snapshot={snapshot}
          format={formatVolume}
          explanation="ค่าเฉลี่ยปริมาณซื้อขาย 20 แท่งล่าสุด"
        />
        <SnapshotMetric
          label="Volume Ratio"
          metric="volumeRatio"
          value={snapshot.volumeRatio}
          snapshot={snapshot}
          format={(value) => `${value.toFixed(2)}x`}
          explanation={volumeExplanation(snapshot.volumeRatio)}
        />
        <SnapshotMetric
          label="OBV"
          metric="obv"
          value={snapshot.obv}
          snapshot={snapshot}
          format={formatVolume}
          explanation={obvExplanation(snapshot.obv)}
        />
      </div>
    </div>
  );
}

function SnapshotMetric({
  label,
  metric,
  value,
  snapshot,
  explanation,
  format = formatNumber,
}: {
  label: string;
  metric: TechnicalSnapshotMetric;
  value: number | null;
  snapshot: TechnicalSnapshot;
  explanation: string;
  format?: (value: number) => string;
}) {
  const unavailable =
    snapshot.unavailable[metric] ?? "Indicator ไม่รองรับในกรอบเวลานี้";
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>
        {value === null ? "ไม่มีข้อมูล" : format(value)}
      </span>
      <span className={styles.metricNote}>
        {value === null ? unavailable : explanation}
      </span>
    </div>
  );
}

function emaExplanation(
  close: number | null,
  ema: number | null,
  label: string,
): string {
  if (close === null || ema === null) return "";
  if (close === ema) return `ราคาอยู่ใกล้ ${label}`;
  return `ราคาอยู่${close > ema ? "เหนือ" : "ต่ำกว่า"} ${label}`;
}

function rsiExplanation(value: number | null): string {
  if (value === null) return "";
  if (value >= 70) return "RSI อยู่ในเขตซื้อมากเกินไป";
  if (value <= 30) return "RSI อยู่ในเขตขายมากเกินไป";
  return "RSI อยู่ในโซนเป็นกลาง";
}

function macdExplanation(histogram: number | null): string {
  if (histogram === null) return "";
  if (histogram > 0) return "โมเมนตัมเป็นบวก";
  if (histogram < 0) return "โมเมนตัมเป็นลบ";
  return "โมเมนตัมยังไม่เลือกทิศทาง";
}

function adxExplanation(value: number | null): string {
  if (value === null) return "";
  return value >= 25 ? "แนวโน้มมีความแข็งแรง" : "แนวโน้มยังไม่แข็งแรง";
}

function atrExplanation(atr: number | null, close: number | null): string {
  if (atr === null || close === null || close <= 0) return "";
  return `ช่วงแกว่งเฉลี่ยประมาณ ${((atr / close) * 100).toFixed(2)}% ของราคา`;
}

function volumeExplanation(value: number | null): string {
  if (value === null) return "";
  if (value >= 1.2) return "Volume สูงกว่าค่าเฉลี่ย";
  if (value <= 0.8) return "Volume ต่ำกว่าค่าเฉลี่ย";
  return "Volume ใกล้เคียงค่าเฉลี่ย";
}

function obvExplanation(value: number | null): string {
  if (value === null) return "";
  if (value > 0) return "ปริมาณสะสมสุทธิเป็นบวก";
  if (value < 0) return "ปริมาณสะสมสุทธิเป็นลบ";
  return "ปริมาณสะสมสุทธิยังเป็นกลาง";
}

function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatVolume(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCalculatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "เวลาไม่พร้อมใช้";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}
