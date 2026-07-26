import { buildMarketContext } from "@/engine/market/market-context";
import { TtlCache } from "@/lib/cache/ttl-cache";
import type { Candle, MarketContext, Timeframe } from "@/types/market";

const MARKET_CACHE_SECONDS = 15 * 60;
const MARKET_OUTPUT_SIZE = 260;
const SECTOR_ETFS: Record<string, string> = {
  "communication services": "XLC",
  "consumer discretionary": "XLY",
  "consumer cyclical": "XLY",
  "consumer staples": "XLP",
  "consumer defensive": "XLP",
  energy: "XLE",
  financials: "XLF",
  "financial services": "XLF",
  healthcare: "XLV",
  "health care": "XLV",
  industrials: "XLI",
  "basic materials": "XLB",
  materials: "XLB",
  "real estate": "XLRE",
  technology: "XLK",
  utilities: "XLU",
};

interface DailyMarketProvider {
  getCandles(
    symbol: string,
    timeframe?: Timeframe,
    outputSize?: number,
  ): Promise<Candle[]>;
}

export class MarketContextProvider {
  constructor(
    private readonly market: DailyMarketProvider,
    private readonly cache: TtlCache<Candle[]>,
  ) {}

  async getContext(
    symbol: string,
    sector: string | null,
    stockDaily: Candle[],
  ): Promise<MarketContext> {
    const sectorSymbol = mapSectorEtf(sector);
    const benchmarkPromise = this.getDaily("SPY");
    const sectorPromise = sectorSymbol
      ? this.getDaily(sectorSymbol)
      : Promise.resolve<Candle[]>([]);
    const [benchmarkDaily, sectorDaily] = await Promise.all([
      benchmarkPromise,
      sectorPromise,
    ]);

    return buildMarketContext({
      benchmarkSymbol: "SPY",
      sectorSymbol,
      stockDaily,
      benchmarkDaily,
      sectorDaily,
      source: "Twelve Data",
    });
  }

  private async getDaily(symbol: string): Promise<Candle[]> {
    const key = `twelve-data:market-context:${symbol}:1d:${MARKET_OUTPUT_SIZE}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const candles = await this.market.getCandles(
      symbol,
      "1d",
      MARKET_OUTPUT_SIZE,
    );
    this.cache.set(key, candles, MARKET_CACHE_SECONDS);
    return candles;
  }
}

export function mapSectorEtf(sector: string | null): string | null {
  if (!sector) return null;
  return SECTOR_ETFS[sector.trim().toLowerCase()] ?? null;
}
