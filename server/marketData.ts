import { MarketAsset, MarketRegimeType, OHLCV } from '../src/types';
import { calculateAllIndicators } from './indicators';

export class MarketDataService {
  private assets: Map<string, MarketAsset> = new Map();

  constructor() {
    this.initializeAssets();
  }

  private initializeAssets() {
    const baseAssets: {
      symbol: string;
      name: string;
      category: 'crypto' | 'stocks' | 'forex' | 'commodities';
      basePrice: number;
      volatility: number;
    }[] = [
      { symbol: 'BTC/USD', name: 'Bitcoin', category: 'crypto', basePrice: 87450.0, volatility: 0.0035 },
      { symbol: 'ETH/USD', name: 'Ethereum', category: 'crypto', basePrice: 3120.5, volatility: 0.0042 },
      { symbol: 'SOL/USD', name: 'Solana', category: 'crypto', basePrice: 194.8, volatility: 0.0055 },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', category: 'stocks', basePrice: 138.4, volatility: 0.0028 },
      { symbol: 'AAPL', name: 'Apple Inc.', category: 'stocks', basePrice: 228.6, volatility: 0.0018 },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'stocks', basePrice: 588.2, volatility: 0.0012 },
      { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', basePrice: 1.0845, volatility: 0.0008 },
    ];

    for (const a of baseAssets) {
      const history = this.generateInitialOHLCV(a.basePrice, a.volatility, 120);
      const lastCandle = history[history.length - 1];
      const indicators = calculateAllIndicators(history);
      const regime = this.detectMarketRegime(history, indicators);

      const high24h = Math.max(...history.slice(-24).map((c) => c.high));
      const low24h = Math.min(...history.slice(-24).map((c) => c.low));
      const open24h = history[Math.max(0, history.length - 24)].open;
      const change24h = ((lastCandle.close - open24h) / open24h) * 100;
      const volume24h = history.slice(-24).reduce((sum, c) => sum + c.volume, 0);

      this.assets.set(a.symbol, {
        symbol: a.symbol,
        name: a.name,
        category: a.category,
        currentPrice: lastCandle.close,
        change24h: Number(change24h.toFixed(2)),
        high24h: Number(high24h.toFixed(2)),
        low24h: Number(low24h.toFixed(2)),
        volume24h: Math.round(volume24h),
        volatilityAtrPercent: Number(((indicators.atr / lastCandle.close) * 100).toFixed(2)),
        currentRegime: regime,
        history,
        indicators,
      });
    }
  }

  private generateInitialOHLCV(basePrice: number, volatility: number, count: number): OHLCV[] {
    const candles: OHLCV[] = [];
    const now = Date.now();
    const intervalMs = 60 * 1000; // 1-minute intervals
    let currentClose = basePrice * 0.96;

    for (let i = count; i >= 0; i--) {
      const time = now - i * intervalMs;
      // Simulated geometric brownian motion with slight mean reversion
      const drift = (Math.random() - 0.485) * volatility;
      const open = currentClose;
      const close = Math.max(0.0001, open * (1 + drift));
      const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.6));
      const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.6));
      const volume = Math.floor(1000 + Math.random() * 8000 * (1 + Math.abs(drift) * 100));

      candles.push({
        time,
        open: Number(open.toFixed(basePrice > 10 ? 2 : 4)),
        high: Number(high.toFixed(basePrice > 10 ? 2 : 4)),
        low: Number(low.toFixed(basePrice > 10 ? 2 : 4)),
        close: Number(close.toFixed(basePrice > 10 ? 2 : 4)),
        volume,
      });

      currentClose = close;
    }

    return candles;
  }

  public detectMarketRegime(history: OHLCV[], ind: ReturnType<typeof calculateAllIndicators>): MarketRegimeType {
    if (history.length < 20) return 'Neutral / Choppy';
    const last = history[history.length - 1];
    const atrPercent = (ind.atr / last.close) * 100;
    const adx = ind.adx;
    const emaFast = ind.ema20;
    const emaMedium = ind.ema50;
    const emaSlow = ind.ema200;

    // Extreme Volatility
    if (atrPercent > 2.8) {
      return 'High Volatility';
    }

    // Low Volatility / Consolidation
    if (atrPercent < 0.6 && adx < 18) {
      return 'Low Volatility';
    }

    // Strong Bullish Trend
    if (adx > 25 && emaFast > emaMedium && emaMedium > emaSlow && last.close > emaFast) {
      return 'Strong Bullish Trend';
    }

    // Strong Bearish Trend
    if (adx > 25 && emaFast < emaMedium && emaMedium < emaSlow && last.close < emaFast) {
      return 'Strong Bearish Trend';
    }

    // Weak Bullish
    if (emaFast > emaMedium && last.close > emaMedium) {
      return 'Weak Bullish Trend';
    }

    // Weak Bearish
    if (emaFast < emaMedium && last.close < emaMedium) {
      return 'Weak Bearish Trend';
    }

    // Ranging / Oscillating
    if (adx < 20 && Math.abs(ind.bollinger.upper - ind.bollinger.lower) / last.close < 0.04) {
      return 'Ranging / Consolidation';
    }

    return 'Neutral / Choppy';
  }

  public tick(): Map<string, MarketAsset> {
    for (const [symbol, asset] of this.assets.entries()) {
      const lastCandle = asset.history[asset.history.length - 1];
      const volatility = symbol.includes('BTC') ? 0.0018 : symbol.includes('SOL') ? 0.003 : 0.001;
      
      // Micro price move
      const priceDeltaPercent = (Math.random() - 0.498) * volatility;
      const newPrice = Number(Math.max(0.0001, asset.currentPrice * (1 + priceDeltaPercent)).toFixed(asset.currentPrice > 10 ? 2 : 4));

      // Update current active candle
      const now = Date.now();
      const candleInterval = 60 * 1000;
      
      if (now - lastCandle.time > candleInterval) {
        // Roll to new candle
        const newCandle: OHLCV = {
          time: now,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: Math.floor(100 + Math.random() * 500),
        };
        asset.history.push(newCandle);
        if (asset.history.length > 150) {
          asset.history.shift();
        }
      } else {
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
        lastCandle.volume += Math.floor(10 + Math.random() * 50);
      }

      asset.currentPrice = newPrice;
      asset.indicators = calculateAllIndicators(asset.history);
      asset.currentRegime = this.detectMarketRegime(asset.history, asset.indicators);
      asset.volatilityAtrPercent = Number(((asset.indicators.atr / newPrice) * 100).toFixed(2));

      // 24h change
      const open24h = asset.history[Math.max(0, asset.history.length - 24)].open;
      asset.change24h = Number((((newPrice - open24h) / open24h) * 100).toFixed(2));
      asset.high24h = Math.max(...asset.history.slice(-24).map((c) => c.high));
      asset.low24h = Math.min(...asset.history.slice(-24).map((c) => c.low));
    }

    return this.assets;
  }

  public getAsset(symbol: string): MarketAsset | undefined {
    return this.assets.get(symbol);
  }

  public getAllAssets(): MarketAsset[] {
    return Array.from(this.assets.values());
  }

  public simulateMarketShock(symbol: string, dropPercent: number = 4.5) {
    const asset = this.assets.get(symbol);
    if (!asset) return;
    asset.currentPrice = Number((asset.currentPrice * (1 - dropPercent / 100)).toFixed(2));
    const last = asset.history[asset.history.length - 1];
    last.close = asset.currentPrice;
    last.low = Math.min(last.low, asset.currentPrice);
    last.volume *= 4;
    asset.indicators = calculateAllIndicators(asset.history);
    asset.currentRegime = this.detectMarketRegime(asset.history, asset.indicators);
  }
}

export const marketDataService = new MarketDataService();
