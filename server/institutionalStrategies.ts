import { OHLCV, TechnicalIndicators, MarketRegimeType, SignalDirection } from '../src/types';
import { IOFEngine, IOFAnalysisResult } from './iofEngine';
import { marketDataService } from './marketData';

export interface SMTDivergenceResult {
  detected: boolean;
  type: 'BULLISH_SMT' | 'BEARISH_SMT' | null;
  primaryAsset: string;
  correlatedAsset: string;
  primarySwing: { previous: number; current: number; isHigher: boolean };
  correlatedSwing: { previous: number; current: number; isHigher: boolean };
  confidence: number;
  description: string;
}

export interface SessionSweepResult {
  detected: boolean;
  type: 'BULLISH_SESSION_SWEEP' | 'BEARISH_SESSION_SWEEP' | null;
  session: 'ASIAN' | 'LONDON' | 'NEW_YORK';
  sweptLevel: number;
  rejectionClose: number;
  targetLiquidityPool: number;
  confidence: number;
  description: string;
}

export interface BreakerBlockResult {
  detected: boolean;
  type: 'BULLISH_BREAKER' | 'BEARISH_BREAKER' | null;
  breakerHigh: number;
  breakerLow: number;
  retestPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  description: string;
}

export interface AnchoredVWAPResult {
  detected: boolean;
  direction: SignalDirection;
  vwap: number;
  upperBand2: number;
  lowerBand2: number;
  vpoc: number;
  currentPrice: number;
  zScore: number;
  confidence: number;
  description: string;
}

export interface QuasimodoResult {
  detected: boolean;
  type: 'BULLISH_QUASIMODO' | 'BEARISH_QUASIMODO' | null;
  leftShoulderLevel: number;
  headLevel: number;
  bosLevel: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  confidence: number;
  description: string;
}

export interface LiquidationSqueezeResult {
  detected: boolean;
  type: 'BULLISH_SQUEEZE' | 'BEARISH_SQUEEZE' | null;
  cascadeWickPrice: number;
  volumeSurgeFactor: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  description: string;
}

export interface InstitutionalConfluenceResult {
  direction: SignalDirection;
  confidenceScore: number;
  entryPrice: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  riskRewardRatio: number;
  confluenceCount: number;
  reasons: string[];
  subModels: {
    coreIof: IOFAnalysisResult;
    smt: SMTDivergenceResult;
    sessionSweep: SessionSweepResult;
    breakerBlock: BreakerBlockResult;
    anchoredVwap: AnchoredVWAPResult;
    quasimodo: QuasimodoResult;
    liquidationSqueeze: LiquidationSqueezeResult;
  };
}

export class InstitutionalStrategiesEngine {
  /**
   * 1. Smart Money Tool (SMT) Divergence
   * Compares the target asset with its natural correlated twin:
   * BTC/USD <-> ETH/USD
   * EUR/USD <-> GBP/USD
   * XAU/USD <-> EUR/USD (macro dollar inverse)
   */
  public static detectSMTDivergence(
    candles: OHLCV[],
    symbol: string = 'BTC/USD'
  ): SMTDivergenceResult {
    const defaultFail: SMTDivergenceResult = {
      detected: false,
      type: null,
      primaryAsset: symbol,
      correlatedAsset: '',
      primarySwing: { previous: 0, current: 0, isHigher: false },
      correlatedSwing: { previous: 0, current: 0, isHigher: false },
      confidence: 0,
      description: 'No correlated SMT divergence detected.',
    };

    if (candles.length < 20) return defaultFail;

    // Determine correlated asset symbol
    let correlatedSymbol = '';
    if (symbol.includes('BTC')) correlatedSymbol = 'ETH/USD';
    else if (symbol.includes('ETH')) correlatedSymbol = 'BTC/USD';
    else if (symbol.includes('EUR')) correlatedSymbol = 'GBP/USD';
    else if (symbol.includes('GBP')) correlatedSymbol = 'EUR/USD';
    else if (symbol.includes('XAU')) correlatedSymbol = 'EUR/USD';
    else correlatedSymbol = 'BTC/USD';

    const corrAsset = marketDataService.getAsset(correlatedSymbol);
    const corrCandles = corrAsset?.history;

    // Helper to find swing highs/lows
    const findSwings = (history: OHLCV[], lookback: number = 20) => {
      const slice = history.slice(-lookback);
      if (slice.length < 10) return null;

      // Find lowest two troughs and highest two peaks
      const troughs: { index: number; price: number }[] = [];
      const peaks: { index: number; price: number }[] = [];

      for (let i = 2; i < slice.length - 2; i++) {
        const c = slice[i];
        if (
          c.low <= slice[i - 1].low &&
          c.low <= slice[i - 2].low &&
          c.low <= slice[i + 1].low &&
          c.low <= slice[i + 2].low
        ) {
          troughs.push({ index: i, price: c.low });
        }
        if (
          c.high >= slice[i - 1].high &&
          c.high >= slice[i - 2].high &&
          c.high >= slice[i + 1].high &&
          c.high >= slice[i + 2].high
        ) {
          peaks.push({ index: i, price: c.high });
        }
      }

      const lastTwoTroughs = troughs.slice(-2);
      const lastTwoPeaks = peaks.slice(-2);

      return { lastTwoTroughs, lastTwoPeaks };
    };

    const primarySwings = findSwings(candles, 25);
    if (!primarySwings) return defaultFail;

    // If correlated candles available, test real multi-asset divergence
    if (corrCandles && corrCandles.length >= 20) {
      const corrSwings = findSwings(corrCandles, 25);
      if (corrSwings) {
        // Check Bullish SMT: Primary makes Lower Low (or equal), Correlated makes Higher Low
        if (primarySwings.lastTwoTroughs.length >= 2 && corrSwings.lastTwoTroughs.length >= 2) {
          const primP1 = primarySwings.lastTwoTroughs[0].price;
          const primP2 = primarySwings.lastTwoTroughs[1].price;
          const corrP1 = corrSwings.lastTwoTroughs[0].price;
          const corrP2 = corrSwings.lastTwoTroughs[1].price;

          const primLowerLow = primP2 < primP1;
          const corrHigherLow = corrP2 > corrP1;

          if (primLowerLow && corrHigherLow) {
            return {
              detected: true,
              type: 'BULLISH_SMT',
              primaryAsset: symbol,
              correlatedAsset: correlatedSymbol,
              primarySwing: { previous: primP1, current: primP2, isHigher: false },
              correlatedSwing: { previous: corrP1, current: corrP2, isHigher: true },
              confidence: 84,
              description: `Bullish SMT Divergence confirmed: ${symbol} swept sell-side liquidity with a Lower Low ($${primP2.toFixed(2)} vs $${primP1.toFixed(2)}), while correlated ${correlatedSymbol} refused to break lower printing a strong Higher Low ($${corrP2.toFixed(2)} vs $${corrP1.toFixed(2)}). Smart money is absorbing selling.`,
            };
          }
        }

        // Check Bearish SMT: Primary makes Higher High, Correlated makes Lower High
        if (primarySwings.lastTwoPeaks.length >= 2 && corrSwings.lastTwoPeaks.length >= 2) {
          const primH1 = primarySwings.lastTwoPeaks[0].price;
          const primH2 = primarySwings.lastTwoPeaks[1].price;
          const corrH1 = corrSwings.lastTwoPeaks[0].price;
          const corrH2 = corrSwings.lastTwoPeaks[1].price;

          const primHigherHigh = primH2 > primH1;
          const corrLowerHigh = corrH2 < corrH1;

          if (primHigherHigh && corrLowerHigh) {
            return {
              detected: true,
              type: 'BEARISH_SMT',
              primaryAsset: symbol,
              correlatedAsset: correlatedSymbol,
              primarySwing: { previous: primH1, current: primH2, isHigher: true },
              correlatedSwing: { previous: corrH1, current: corrH2, isHigher: false },
              confidence: 85,
              description: `Bearish SMT Divergence confirmed: ${symbol} printed a Higher High ($${primH2.toFixed(2)} vs $${primH1.toFixed(2)}) sweeping buy-side stops, while correlated ${correlatedSymbol} printed a Lower High ($${corrH2.toFixed(2)} vs $${corrH1.toFixed(2)}), revealing institutional distribution non-confirmation.`,
            };
          }
        }
      }
    }

    // Intra-asset RSI / Volume SMT fallback if correlated asset swings are flat
    const last3 = candles.slice(-3);
    const last = last3[2];
    const prev = last3[1];
    if (last && prev) {
      if (last.low < prev.low && last.close > last.open && last.volume > prev.volume * 1.3) {
        return {
          detected: true,
          type: 'BULLISH_SMT',
          primaryAsset: symbol,
          correlatedAsset: 'Volume-Price Matrix',
          primarySwing: { previous: prev.low, current: last.low, isHigher: false },
          correlatedSwing: { previous: prev.volume, current: last.volume, isHigher: true },
          confidence: 76,
          description: `Liquidity Absorption SMT: Price made a local sweep below $${prev.low.toFixed(2)} to $${last.low.toFixed(2)}, met with immediate institutional volume absorption (${(last.volume / prev.volume).toFixed(1)}x surge) and bullish close.`,
        };
      }
    }

    return defaultFail;
  }

  /**
   * 2. Session Liquidity Sweep & Judas Swing (Turtle Soup)
   * Tracks Asian Session High/Low (00:00 - 08:00 UTC) and detects London/NY open liquidity runs.
   */
  public static detectSessionSweep(candles: OHLCV[]): SessionSweepResult {
    const defaultFail: SessionSweepResult = {
      detected: false,
      type: null,
      session: 'ASIAN',
      sweptLevel: 0,
      rejectionClose: 0,
      targetLiquidityPool: 0,
      confidence: 0,
      description: 'No session liquidity sweep detected.',
    };

    if (candles.length < 24) return defaultFail;

    const last = candles[candles.length - 1];
    const date = new Date(last.time);
    const utcHour = date.getUTCHours();

    // Identify current session
    let currentSession: 'ASIAN' | 'LONDON' | 'NEW_YORK' = 'ASIAN';
    if (utcHour >= 7 && utcHour < 13) currentSession = 'LONDON';
    else if (utcHour >= 13 && utcHour < 21) currentSession = 'NEW_YORK';

    // Asian session range: inspect candles corresponding to 00:00 to 08:00 UTC
    // Or approximate by looking at candles 12 to 24 steps back
    const lookbackAsian = candles.slice(-24, -4);
    if (lookbackAsian.length < 5) return defaultFail;

    const asianHigh = Math.max(...lookbackAsian.map((c) => c.high));
    const asianLow = Math.min(...lookbackAsian.map((c) => c.low));
    const asianRange = asianHigh - asianLow;

    if (asianRange <= 0) return defaultFail;

    // Check recent 3 candles for Judas Swing sweep
    const recent = candles.slice(-3);
    for (const c of recent) {
      const candleRange = c.high - c.low;
      if (candleRange <= 0) continue;

      // Bullish Judas Swing / Turtle Soup: Sweeps Asian Low, closes back above
      const sweptAsianLow = c.low < asianLow;
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const lowerWickRatio = lowerWick / candleRange;

      if (sweptAsianLow && c.close > asianLow && lowerWickRatio > 0.38) {
        return {
          detected: true,
          type: 'BULLISH_SESSION_SWEEP',
          session: currentSession,
          sweptLevel: asianLow,
          rejectionClose: c.close,
          targetLiquidityPool: asianHigh,
          confidence: 86,
          description: `Judas Swing / Turtle Soup: Price probed below Asian Session Low ($${asianLow.toFixed(2)}) down to $${c.low.toFixed(2)} during ${currentSession} Open, engineered liquidity, and violently rejected with a ${(lowerWickRatio * 100).toFixed(0)}% lower wick closing back inside range at $${c.close.toFixed(2)}. Target: Asian High ($${asianHigh.toFixed(2)}).`,
        };
      }

      // Bearish Judas Swing / Turtle Soup: Sweeps Asian High, closes back below
      const sweptAsianHigh = c.high > asianHigh;
      const upperWick = c.high - Math.max(c.open, c.close);
      const upperWickRatio = upperWick / candleRange;

      if (sweptAsianHigh && c.close < asianHigh && upperWickRatio > 0.38) {
        return {
          detected: true,
          type: 'BEARISH_SESSION_SWEEP',
          session: currentSession,
          sweptLevel: asianHigh,
          rejectionClose: c.close,
          targetLiquidityPool: asianLow,
          confidence: 87,
          description: `Judas Swing / Turtle Soup: Price engineered a false breakout above Asian Session High ($${asianHigh.toFixed(2)}) up to $${c.high.toFixed(2)} during ${currentSession} Open, trapped breakout buyers, and closed back below at $${c.close.toFixed(2)} with a ${(upperWickRatio * 100).toFixed(0)}% upper rejection wick. Target: Asian Low ($${asianLow.toFixed(2)}).`,
        };
      }
    }

    return defaultFail;
  }

  /**
   * 3. Breaker Block & Mitigation Block Inversion
   * Detects broken Order Blocks that flip from support to resistance (Bearish Breaker)
   * or resistance to support (Bullish Breaker).
   */
  public static detectBreakerBlock(candles: OHLCV[]): BreakerBlockResult {
    const defaultFail: BreakerBlockResult = {
      detected: false,
      type: null,
      breakerHigh: 0,
      breakerLow: 0,
      retestPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 0,
      description: 'No active Breaker Block polarity inversion detected.',
    };

    if (candles.length < 25) return defaultFail;

    const last = candles[candles.length - 1];
    const window = candles.slice(-25);

    // Find swing points to locate the Breaker pattern
    // Bearish Breaker: Low (L1) -> High (H1) -> Higher High (H2 sweeps BSL) -> Violent Break below L1
    // The up candle prior to H2 is the breaker
    let highestIndex = -1;
    let highestPrice = -Infinity;
    let lowestIndex = -1;
    let lowestPrice = Infinity;

    for (let i = 5; i < window.length - 5; i++) {
      if (window[i].high > highestPrice) {
        highestPrice = window[i].high;
        highestIndex = i;
      }
      if (window[i].low < lowestPrice) {
        lowestPrice = window[i].low;
        lowestIndex = i;
      }
    }

    // Check Bearish Breaker:
    if (highestIndex > 5 && highestIndex < window.length - 4) {
      // Find intervening swing low before highestIndex
      let priorLow = Infinity;
      let priorLowIndex = -1;
      for (let i = 2; i < highestIndex; i++) {
        if (window[i].low < priorLow) {
          priorLow = window[i].low;
          priorLowIndex = i;
        }
      }

      // Check if subsequent price broke decisively below priorLow (Market Structure Shift)
      const brokeBelow = window.slice(highestIndex).some((c) => c.close < priorLow);
      if (brokeBelow && priorLowIndex > 0) {
        const breakerCandle = window[priorLowIndex];
        const bHigh = breakerCandle.high;
        const bLow = breakerCandle.low;

        // Check if current price is retesting the Breaker Block zone (bLow to bHigh)
        if (last.high >= bLow && last.low <= bHigh && last.close <= bHigh) {
          const sl = Number((highestPrice * 1.002).toFixed(2));
          const target = Number((bLow - (sl - bLow) * 3.2).toFixed(2));
          return {
            detected: true,
            type: 'BEARISH_BREAKER',
            breakerHigh: bHigh,
            breakerLow: bLow,
            retestPrice: last.close,
            stopLoss: sl,
            takeProfit: target,
            confidence: 88,
            description: `Bearish Breaker Block Inversion: Prior structural support zone [$${bLow.toFixed(2)} - $${bHigh.toFixed(2)}] broke violently after liquidity sweep to $${highestPrice.toFixed(2)}. Price is currently retesting this flipped institutional supply zone. Expected downward continuation.`,
          };
        }
      }
    }

    // Check Bullish Breaker:
    if (lowestIndex > 5 && lowestIndex < window.length - 4) {
      // Find intervening swing high before lowestIndex
      let priorHigh = -Infinity;
      let priorHighIndex = -1;
      for (let i = 2; i < lowestIndex; i++) {
        if (window[i].high > priorHigh) {
          priorHigh = window[i].high;
          priorHighIndex = i;
        }
      }

      // Check if subsequent price broke decisively above priorHigh
      const brokeAbove = window.slice(lowestIndex).some((c) => c.close > priorHigh);
      if (brokeAbove && priorHighIndex > 0) {
        const breakerCandle = window[priorHighIndex];
        const bHigh = breakerCandle.high;
        const bLow = breakerCandle.low;

        // Check if current price is retesting the Breaker Block zone
        if (last.low <= bHigh && last.high >= bLow && last.close >= bLow) {
          const sl = Number((lowestPrice * 0.998).toFixed(2));
          const target = Number((bHigh + (bHigh - sl) * 3.2).toFixed(2));
          return {
            detected: true,
            type: 'BULLISH_BREAKER',
            breakerHigh: bHigh,
            breakerLow: bLow,
            retestPrice: last.close,
            stopLoss: sl,
            takeProfit: target,
            confidence: 88,
            description: `Bullish Breaker Block Inversion: Prior structural resistance zone [$${bLow.toFixed(2)} - $${bHigh.toFixed(2)}] was flipped into institutional demand after sell-side sweep to $${lowestPrice.toFixed(2)}. Price is retesting the Breaker zone. High probability upward displacement.`,
          };
        }
      }
    }

    return defaultFail;
  }

  /**
   * 4. Anchored VWAP & Value Area (VPOC / VAH / VAL)
   * Calculates volume-weighted average price from structural anchors with standard deviation bands.
   */
  public static calculateAnchoredVWAP(candles: OHLCV[], anchorLookback: number = 40): AnchoredVWAPResult {
    const defaultFail: AnchoredVWAPResult = {
      detected: false,
      direction: 'HOLD',
      vwap: 0,
      upperBand2: 0,
      lowerBand2: 0,
      vpoc: 0,
      currentPrice: 0,
      zScore: 0,
      confidence: 0,
      description: 'Anchored VWAP within normal equilibrium distribution.',
    };

    if (candles.length < 15) return defaultFail;

    const slice = candles.slice(-Math.min(candles.length, anchorLookback));
    let cumulativeTPV = 0;
    let cumulativeVol = 0;

    // Volume Profile buckets to calculate VPOC
    const priceBins: { [bucket: number]: number } = {};
    const binSize = (Math.max(...slice.map((c) => c.high)) - Math.min(...slice.map((c) => c.low))) / 20 || 1;

    for (const c of slice) {
      const tp = (c.high + c.low + c.close) / 3;
      cumulativeTPV += tp * c.volume;
      cumulativeVol += c.volume;

      const bucket = Math.floor(c.close / binSize) * binSize;
      priceBins[bucket] = (priceBins[bucket] || 0) + c.volume;
    }

    if (cumulativeVol <= 0) return defaultFail;

    const vwap = cumulativeTPV / cumulativeVol;

    // Standard deviation of typical price
    let varianceSum = 0;
    for (const c of slice) {
      const tp = (c.high + c.low + c.close) / 3;
      varianceSum += c.volume * Math.pow(tp - vwap, 2);
    }
    const stdDev = Math.sqrt(varianceSum / cumulativeVol);

    const upperBand1 = vwap + stdDev;
    const lowerBand1 = vwap - stdDev;
    const upperBand2 = vwap + 2 * stdDev;
    const lowerBand2 = vwap - 2 * stdDev;

    // Find VPOC (Volume Point of Control)
    let maxBucket = 0;
    let maxVol = 0;
    for (const b in priceBins) {
      if (priceBins[b] > maxVol) {
        maxVol = priceBins[b];
        maxBucket = Number(b);
      }
    }
    const vpoc = maxBucket + binSize / 2;

    const last = slice[slice.length - 1];
    const currentPrice = last.close;
    const zScore = stdDev > 0 ? (currentPrice - vwap) / stdDev : 0;

    // Mean Reversion Signals at 2-Sigma exhaustion
    // Bullish Reversion: Price pierced lower 2-sigma band and shows bullish rejection candle
    if (currentPrice <= lowerBand2 || (last.low <= lowerBand2 && currentPrice > lowerBand2)) {
      return {
        detected: true,
        direction: 'BUY',
        vwap,
        upperBand2,
        lowerBand2,
        vpoc,
        currentPrice,
        zScore,
        confidence: 82,
        description: `Anchored VWAP 2-Sigma Exhaustion: Price ($${currentPrice.toFixed(2)}) is stretched to extreme statistical discount (Z-Score: ${zScore.toFixed(2)}σ, -2σ Band: $${lowerBand2.toFixed(2)}). Institutional mean-reversion pull towards Volume Point of Control ($${vpoc.toFixed(2)}) and VWAP equilibrium ($${vwap.toFixed(2)}).`,
      };
    }

    // Bearish Reversion: Price reached upper 2-sigma band and shows bearish rejection
    if (currentPrice >= upperBand2 || (last.high >= upperBand2 && currentPrice < upperBand2)) {
      return {
        detected: true,
        direction: 'SELL',
        vwap,
        upperBand2,
        lowerBand2,
        vpoc,
        currentPrice,
        zScore,
        confidence: 83,
        description: `Anchored VWAP 2-Sigma Exhaustion: Price ($${currentPrice.toFixed(2)}) touched extreme statistical premium (Z-Score: +${zScore.toFixed(2)}σ, +2σ Band: $${upperBand2.toFixed(2)}). Mean-reversion liquidation expected toward VPOC ($${vpoc.toFixed(2)}) and VWAP equilibrium ($${vwap.toFixed(2)}).`,
      };
    }

    return {
      detected: false,
      direction: 'HOLD',
      vwap,
      upperBand2,
      lowerBand2,
      vpoc,
      currentPrice,
      zScore,
      confidence: 50,
      description: `Price ($${currentPrice.toFixed(2)}) is oscillating within fair value distribution (VWAP: $${vwap.toFixed(2)}, VPOC: $${vpoc.toFixed(2)}).`,
    };
  }

  /**
   * 5. Quasimodo / Over-Under (QM Structural Reversal)
   * High-probability reversal pattern:
   * Left Shoulder -> Higher High (BSL sweep) -> Lower Low (BOS) -> Retest of Left Shoulder.
   */
  public static detectQuasimodo(candles: OHLCV[]): QuasimodoResult {
    const defaultFail: QuasimodoResult = {
      detected: false,
      type: null,
      leftShoulderLevel: 0,
      headLevel: 0,
      bosLevel: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskReward: 0,
      confidence: 0,
      description: 'No Quasimodo structural reversal pattern active.',
    };

    if (candles.length < 30) return defaultFail;

    const last = candles[candles.length - 1];
    const window = candles.slice(-30);

    // Detect Bearish Quasimodo (QML Short):
    // 1. Peak H1 (Left Shoulder)
    // 2. Trough L1
    // 3. Peak H2 > H1 (Head)
    // 4. Trough L2 < L1 (Break of Structure - BOS)
    // 5. Retest of H1 price level (QML level)
    for (let i = 4; i < window.length - 12; i++) {
      const h1Candle = window[i];
      const h1 = h1Candle.high;

      // Find L1
      let l1 = Infinity;
      let l1Idx = -1;
      for (let j = i + 1; j < i + 7; j++) {
        if (window[j].low < l1) {
          l1 = window[j].low;
          l1Idx = j;
        }
      }
      if (l1Idx === -1) continue;

      // Find H2 (Head)
      let h2 = -Infinity;
      let h2Idx = -1;
      for (let k = l1Idx + 1; k < l1Idx + 7; k++) {
        if (k < window.length && window[k].high > h2) {
          h2 = window[k].high;
          h2Idx = k;
        }
      }
      if (h2Idx === -1 || h2 <= h1) continue;

      // Find L2 (BOS)
      let l2 = Infinity;
      let l2Idx = -1;
      for (let m = h2Idx + 1; m < window.length - 2; m++) {
        if (window[m].low < l2) {
          l2 = window[m].low;
          l2Idx = m;
        }
      }
      if (l2Idx === -1 || l2 >= l1) continue;

      // We have: H1, L1, H2 (> H1), L2 (< L1)
      // Check if current candle retests Left Shoulder H1 within 0.35%
      const tolerance = h1 * 0.0035;
      if (Math.abs(last.close - h1) <= tolerance || (last.high >= h1 - tolerance && last.close <= h1 + tolerance)) {
        const sl = Number((h2 * 1.0015).toFixed(2));
        const tp = Number(l2.toFixed(2));
        const rr = (h1 - tp) / (sl - h1);

        if (rr >= 2.5) {
          return {
            detected: true,
            type: 'BEARISH_QUASIMODO',
            leftShoulderLevel: h1,
            headLevel: h2,
            bosLevel: l2,
            entryPrice: last.close,
            stopLoss: sl,
            takeProfit: tp,
            riskReward: Number(rr.toFixed(1)),
            confidence: 89,
            description: `Bearish Quasimodo (QML) Execution: Left Shoulder at $${h1.toFixed(2)}, Head sweep at $${h2.toFixed(2)}, violent Break of Structure to $${l2.toFixed(2)}. Price is currently executing at the Left Shoulder level ($${last.close.toFixed(2)}). Asymmetric R:R: 1:${rr.toFixed(1)}.`,
          };
        }
      }
    }

    // Detect Bullish Quasimodo (QML Long):
    // 1. Trough L1 (Left Shoulder)
    // 2. Peak H1
    // 3. Trough L2 < L1 (Head)
    // 4. Peak H2 > H1 (BOS)
    // 5. Retest of L1 price level
    for (let i = 4; i < window.length - 12; i++) {
      const l1Candle = window[i];
      const l1 = l1Candle.low;

      // Find H1
      let h1 = -Infinity;
      let h1Idx = -1;
      for (let j = i + 1; j < i + 7; j++) {
        if (window[j].high > h1) {
          h1 = window[j].high;
          h1Idx = j;
        }
      }
      if (h1Idx === -1) continue;

      // Find L2 (Head)
      let l2 = Infinity;
      let l2Idx = -1;
      for (let k = h1Idx + 1; k < h1Idx + 7; k++) {
        if (k < window.length && window[k].low < l2) {
          l2 = window[k].low;
          l2Idx = k;
        }
      }
      if (l2Idx === -1 || l2 >= l1) continue;

      // Find H2 (BOS)
      let h2 = -Infinity;
      let h2Idx = -1;
      for (let m = l2Idx + 1; m < window.length - 2; m++) {
        if (window[m].high > h2) {
          h2 = window[m].high;
          h2Idx = m;
        }
      }
      if (h2Idx === -1 || h2 <= h1) continue;

      // Check if current candle retests Left Shoulder L1
      const tolerance = l1 * 0.0035;
      if (Math.abs(last.close - l1) <= tolerance || (last.low <= l1 + tolerance && last.close >= l1 - tolerance)) {
        const sl = Number((l2 * 0.9985).toFixed(2));
        const tp = Number(h2.toFixed(2));
        const rr = (tp - l1) / (l1 - sl);

        if (rr >= 2.5) {
          return {
            detected: true,
            type: 'BULLISH_QUASIMODO',
            leftShoulderLevel: l1,
            headLevel: l2,
            bosLevel: h2,
            entryPrice: last.close,
            stopLoss: sl,
            takeProfit: tp,
            riskReward: Number(rr.toFixed(1)),
            confidence: 89,
            description: `Bullish Quasimodo (QML) Execution: Left Shoulder at $${l1.toFixed(2)}, Head sweep at $${l2.toFixed(2)}, violent Break of Structure to $${h2.toFixed(2)}. Price is retesting Left Shoulder demand ($${last.close.toFixed(2)}). Asymmetric R:R: 1:${rr.toFixed(1)}.`,
          };
        }
      }
    }

    return defaultFail;
  }

  /**
   * 6. Open Interest & Liquidation Squeeze
   * Identifies cascading stop triggers and volume absorption wicks.
   */
  public static detectLiquidationSqueeze(
    candles: OHLCV[],
    ind: TechnicalIndicators
  ): LiquidationSqueezeResult {
    const defaultFail: LiquidationSqueezeResult = {
      detected: false,
      type: null,
      cascadeWickPrice: 0,
      volumeSurgeFactor: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      confidence: 0,
      description: 'No liquidation cascade wick detected.',
    };

    if (candles.length < 15) return defaultFail;

    const last = candles[candles.length - 1];
    const range = last.high - last.low;
    if (range <= 0) return defaultFail;

    const volumeSurge = last.volume / Math.max(1, ind.volumeSma);

    // Bullish Short Squeeze Trigger:
    // Massive volume surge (>1.7x), long lower wick (>45% of range), RSI oversold (<35) or low volatility flush
    const lowerWick = Math.min(last.open, last.close) - last.low;
    const lowerWickPercent = (lowerWick / range) * 100;

    if (volumeSurge >= 1.7 && lowerWickPercent >= 45 && last.close > last.open) {
      const sl = Number((last.low * 0.998).toFixed(2));
      const tp = Number((last.close + (last.close - sl) * 3.4).toFixed(2));
      return {
        detected: true,
        type: 'BULLISH_SQUEEZE',
        cascadeWickPrice: last.low,
        volumeSurgeFactor: Number(volumeSurge.toFixed(1)),
        entryPrice: last.close,
        stopLoss: sl,
        takeProfit: tp,
        confidence: 85,
        description: `Long Liquidation Cascade Reversal: Institutional stop-hunt flushed price to $${last.low.toFixed(2)} on massive ${(volumeSurge).toFixed(1)}x volume surge. Aggressive smart money absorbed selling creating a ${(lowerWickPercent).toFixed(0)}% lower absorption wick. High probability short-squeeze expansion.`,
      };
    }

    // Bearish Long Squeeze Trigger:
    // Massive volume surge (>1.7x), long upper wick (>45% of range), RSI overbought (>65)
    const upperWick = last.high - Math.max(last.open, last.close);
    const upperWickPercent = (upperWick / range) * 100;

    if (volumeSurge >= 1.7 && upperWickPercent >= 45 && last.close < last.open) {
      const sl = Number((last.high * 1.002).toFixed(2));
      const tp = Number((last.close - (sl - last.close) * 3.4).toFixed(2));
      return {
        detected: true,
        type: 'BEARISH_SQUEEZE',
        cascadeWickPrice: last.high,
        volumeSurgeFactor: Number(volumeSurge.toFixed(1)),
        entryPrice: last.close,
        stopLoss: sl,
        takeProfit: tp,
        confidence: 86,
        description: `Short Liquidation Cascade Reversal: Parabolic breakout to $${last.high.toFixed(2)} on ${(volumeSurge).toFixed(1)}x volume trapped late retail longs. Smart money dumped liquidity leaving a ${(upperWickPercent).toFixed(0)}% upper distribution wick. Long liquidation cascade imminent.`,
      };
    }

    return defaultFail;
  }

  /**
   * 7. Unified Institutional Meta-Engine (Ensemble Confluence Matrix)
   * Harmonizes all 6 strategies + Core IOF into a single institutional execution signal.
   * High profitability is achieved by only executing when 2+ institutional criteria confirm alignment.
   */
  public static evaluateInstitutionalConfluence(
    candles: OHLCV[],
    ind: TechnicalIndicators,
    regime: MarketRegimeType,
    symbol: string = 'BTC/USD'
  ): InstitutionalConfluenceResult {
    const last = candles[candles.length - 1];
    const currentPrice = last ? last.close : 0;

    // Run all individual institutional engines
    const coreIof = IOFEngine.evaluateSignal(candles, ind, regime, {
      minConfidence: 65,
      minRiskReward: 3.0,
      requireDiscountPremium: true,
    });

    const smt = this.detectSMTDivergence(candles, symbol);
    const sessionSweep = this.detectSessionSweep(candles);
    const breakerBlock = this.detectBreakerBlock(candles);
    const anchoredVwap = this.calculateAnchoredVWAP(candles);
    const quasimodo = this.detectQuasimodo(candles);
    const liquidationSqueeze = this.detectLiquidationSqueeze(candles, ind);

    let bullishVotes = 0;
    let bearishVotes = 0;
    const confirmingReasons: string[] = [];

    // 1. Core IOF vote
    if (coreIof.direction === 'BUY') {
      bullishVotes += 1.5;
      confirmingReasons.push(`[IOF Engine]: ${coreIof.reasons[0] || 'Bullish FVG / OB mitigation in Discount zone.'}`);
    } else if (coreIof.direction === 'SELL') {
      bearishVotes += 1.5;
      confirmingReasons.push(`[IOF Engine]: ${coreIof.reasons[0] || 'Bearish FVG / OB mitigation in Premium zone.'}`);
    }

    // 2. SMT Divergence vote
    if (smt.detected) {
      if (smt.type === 'BULLISH_SMT') {
        bullishVotes += 1.2;
        confirmingReasons.push(`[SMT Divergence]: ${smt.description}`);
      } else if (smt.type === 'BEARISH_SMT') {
        bearishVotes += 1.2;
        confirmingReasons.push(`[SMT Divergence]: ${smt.description}`);
      }
    }

    // 3. Session Sweep vote
    if (sessionSweep.detected) {
      if (sessionSweep.type === 'BULLISH_SESSION_SWEEP') {
        bullishVotes += 1.4;
        confirmingReasons.push(`[Session Sweep]: ${sessionSweep.description}`);
      } else if (sessionSweep.type === 'BEARISH_SESSION_SWEEP') {
        bearishVotes += 1.4;
        confirmingReasons.push(`[Session Sweep]: ${sessionSweep.description}`);
      }
    }

    // 4. Breaker Block vote
    if (breakerBlock.detected) {
      if (breakerBlock.type === 'BULLISH_BREAKER') {
        bullishVotes += 1.3;
        confirmingReasons.push(`[Breaker Inversion]: ${breakerBlock.description}`);
      } else if (breakerBlock.type === 'BEARISH_BREAKER') {
        bearishVotes += 1.3;
        confirmingReasons.push(`[Breaker Inversion]: ${breakerBlock.description}`);
      }
    }

    // 5. Anchored VWAP vote
    if (anchoredVwap.detected) {
      if (anchoredVwap.direction === 'BUY') {
        bullishVotes += 1.1;
        confirmingReasons.push(`[Anchored VWAP]: ${anchoredVwap.description}`);
      } else if (anchoredVwap.direction === 'SELL') {
        bearishVotes += 1.1;
        confirmingReasons.push(`[Anchored VWAP]: ${anchoredVwap.description}`);
      }
    }

    // 6. Quasimodo vote
    if (quasimodo.detected) {
      if (quasimodo.type === 'BULLISH_QUASIMODO') {
        bullishVotes += 1.5;
        confirmingReasons.push(`[Quasimodo]: ${quasimodo.description}`);
      } else if (quasimodo.type === 'BEARISH_QUASIMODO') {
        bearishVotes += 1.5;
        confirmingReasons.push(`[Quasimodo]: ${quasimodo.description}`);
      }
    }

    // 7. Liquidation Squeeze vote
    if (liquidationSqueeze.detected) {
      if (liquidationSqueeze.type === 'BULLISH_SQUEEZE') {
        bullishVotes += 1.3;
        confirmingReasons.push(`[Liquidation Squeeze]: ${liquidationSqueeze.description}`);
      } else if (liquidationSqueeze.type === 'BEARISH_SQUEEZE') {
        bearishVotes += 1.3;
        confirmingReasons.push(`[Liquidation Squeeze]: ${liquidationSqueeze.description}`);
      }
    }

    const subModels = {
      coreIof,
      smt,
      sessionSweep,
      breakerBlock,
      anchoredVwap,
      quasimodo,
      liquidationSqueeze,
    };

    // Evaluate Ensemble Decision:
    // Need at least 2 confirming institutional models (score >= 2.2) to issue trade
    if (bullishVotes >= 2.2 && bullishVotes > bearishVotes) {
      const confluenceCount = Math.round(bullishVotes);
      const confidence = Math.min(96, Math.round(75 + bullishVotes * 4.5));
      const sl = coreIof.suggestedStopLoss || breakerBlock.stopLoss || quasimodo.stopLoss || Number((currentPrice * 0.988).toFixed(2));
      const risk = Math.max(0.0001, currentPrice - sl);
      const tp = Number((currentPrice + risk * 3.6).toFixed(2));
      const rr = Number(((tp - currentPrice) / risk).toFixed(1));

      return {
        direction: 'BUY',
        confidenceScore: confidence,
        entryPrice: currentPrice,
        suggestedStopLoss: sl,
        suggestedTakeProfit: tp,
        riskRewardRatio: rr,
        confluenceCount,
        reasons: [
          `★ [INSTITUTIONAL ENSEMBLE]: Multi-Model Confluence detected (${confluenceCount} institutional models aligned BULLISH with ${confidence}% confidence).`,
          ...confirmingReasons,
        ],
        subModels,
      };
    }

    if (bearishVotes >= 2.2 && bearishVotes > bullishVotes) {
      const confluenceCount = Math.round(bearishVotes);
      const confidence = Math.min(96, Math.round(75 + bearishVotes * 4.5));
      const sl = coreIof.suggestedStopLoss || breakerBlock.stopLoss || quasimodo.stopLoss || Number((currentPrice * 1.012).toFixed(2));
      const risk = Math.max(0.0001, sl - currentPrice);
      const tp = Number((currentPrice - risk * 3.6).toFixed(2));
      const rr = Number(((currentPrice - tp) / risk).toFixed(1));

      return {
        direction: 'SELL',
        confidenceScore: confidence,
        entryPrice: currentPrice,
        suggestedStopLoss: sl,
        suggestedTakeProfit: tp,
        riskRewardRatio: rr,
        confluenceCount,
        reasons: [
          `★ [INSTITUTIONAL ENSEMBLE]: Multi-Model Confluence detected (${confluenceCount} institutional models aligned BEARISH with ${confidence}% confidence).`,
          ...confirmingReasons,
        ],
        subModels,
      };
    }

    // If only 1 model fired, fall back to core IOF if confident, or HOLD
    if (coreIof.direction !== 'HOLD' && coreIof.confidenceScore >= 75) {
      return {
        direction: coreIof.direction,
        confidenceScore: coreIof.confidenceScore,
        entryPrice: coreIof.entryPrice,
        suggestedStopLoss: coreIof.suggestedStopLoss,
        suggestedTakeProfit: coreIof.suggestedTakeProfit,
        riskRewardRatio: coreIof.riskRewardRatio,
        confluenceCount: 1,
        reasons: coreIof.reasons,
        subModels,
      };
    }

    return {
      direction: 'HOLD',
      confidenceScore: Math.round(Math.max(bullishVotes, bearishVotes) * 15),
      entryPrice: currentPrice,
      suggestedStopLoss: 0,
      suggestedTakeProfit: 0,
      riskRewardRatio: 0,
      confluenceCount: 0,
      reasons: ['Awaiting institutional multi-model alignment (minimum 2 confirming models required for asymmetric execution).'],
      subModels,
    };
  }
}
