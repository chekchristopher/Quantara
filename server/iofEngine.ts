import { OHLCV, TechnicalIndicators, MarketRegimeType, SignalDirection } from '../src/types';

export interface OrderBlock {
  id: string;
  type: 'BULLISH_OB' | 'BEARISH_OB';
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  candleIndex: number;
  timestamp: number;
  isMitigated: boolean;
  displacementFactor: number;
}

export interface FairValueGap {
  id: string;
  type: 'BULLISH_FVG_BISI' | 'BEARISH_FVG_SIBI';
  top: number;
  bottom: number;
  consequentEncroachment: number; // 50% midpoint
  gapSize: number;
  candleIndex: number;
  timestamp: number;
  isMitigated: boolean;
  isTestedCE: boolean;
}

export interface ImpulseBaseImpulse {
  type: 'RALLY_BASE_RALLY' | 'DROP_BASE_DROP' | 'RALLY_BASE_DROP' | 'DROP_BASE_RALLY';
  baseHigh: number;
  baseLow: number;
  baseCandleCount: number;
  displacementPercent: number;
  timestamp: number;
}

export interface LiquiditySweep {
  type: 'BSL_SWEEP' | 'SSL_SWEEP';
  levelSwept: number;
  sweepPrice: number;
  rejectionClose: number;
  timestamp: number;
  candleIndex: number;
}

export interface DealingRange {
  low: number;
  high: number;
  equilibrium: number; // 50% midpoint
  currentPrice: number;
  currentZone: 'DISCOUNT' | 'PREMIUM' | 'EQUILIBRIUM';
  zoneDepthPercent: number;
}

export interface IOFAnalysisResult {
  direction: SignalDirection;
  confidenceScore: number;
  entryPrice: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  riskRewardRatio: number;
  reasons: string[];
  activeOrderBlocks: OrderBlock[];
  activeFVGs: FairValueGap[];
  lastIBI?: ImpulseBaseImpulse;
  lastSweep?: LiquiditySweep;
  dealingRange: DealingRange;
  iofedTriggered: boolean;
}

/**
 * Institutional Order Flow (IOF) Engine
 * Implementing Tsiry M Trade & ICT algorithmic market structure principles:
 * - Impulse -> Base -> Impulse (IBI)
 * - Order Blocks (OB) & Fair Value Gaps (FVG)
 * - Consequent Encroachment (50% CE)
 * - Liquidity Sweeps (BSL/SSL)
 * - Premium vs Discount Pricing
 * - Institutional Order Flow Entry Drill (IOFED)
 */
export class IOFEngine {
  /**
   * Calculates the Dealing Range and classifies price into Premium (>50%) or Discount (<50%).
   */
  public static calculateDealingRange(candles: OHLCV[], lookback: number = 40): DealingRange {
    if (candles.length === 0) {
      return { low: 0, high: 0, equilibrium: 0, currentPrice: 0, currentZone: 'EQUILIBRIUM', zoneDepthPercent: 50 };
    }
    const slice = candles.slice(-lookback);
    let low = Infinity;
    let high = -Infinity;

    for (const c of slice) {
      if (c.low < low) low = c.low;
      if (c.high > high) high = c.high;
    }

    const currentPrice = candles[candles.length - 1].close;
    const range = high - low;
    const equilibrium = Number((low + range * 0.5).toFixed(4));

    let currentZone: 'DISCOUNT' | 'PREMIUM' | 'EQUILIBRIUM' = 'EQUILIBRIUM';
    let zoneDepthPercent = 50;

    if (range > 0) {
      zoneDepthPercent = Number((((currentPrice - low) / range) * 100).toFixed(1));
      if (currentPrice < equilibrium * 0.998) {
        currentZone = 'DISCOUNT';
      } else if (currentPrice > equilibrium * 1.002) {
        currentZone = 'PREMIUM';
      }
    }

    return {
      low,
      high,
      equilibrium,
      currentPrice,
      currentZone,
      zoneDepthPercent,
    };
  }

  /**
   * Detects 3-candle Fair Value Gaps (FVGs) and calculates Consequent Encroachment (50% CE).
   */
  public static detectFairValueGaps(candles: OHLCV[], lookback: number = 50): FairValueGap[] {
    const fvgs: FairValueGap[] = [];
    if (candles.length < 5) return fvgs;

    const startIndex = Math.max(2, candles.length - lookback);
    const lastIndex = candles.length - 1;

    for (let i = startIndex; i < lastIndex; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1]; // Displacement candle
      const c3 = candles[i];

      // 1. Bullish FVG (BISI - Buy-Side Imbalance Sell-Side Inefficiency)
      // Candle 1 High is strictly less than Candle 3 Low
      if (c3.low > c1.high) {
        const gapBottom = c1.high;
        const gapTop = c3.low;
        const gapSize = gapTop - gapBottom;
        const consequentEncroachment = Number(((gapTop + gapBottom) / 2).toFixed(4));

        // Check subsequent mitigation up to current candle
        let isMitigated = false;
        let isTestedCE = false;

        for (let j = i + 1; j <= lastIndex; j++) {
          const subsequent = candles[j];
          if (subsequent.low <= consequentEncroachment) {
            isTestedCE = true;
          }
          if (subsequent.low <= gapBottom) {
            isMitigated = true;
            break;
          }
        }

        fvgs.push({
          id: `fvg_bull_${c2.time}`,
          type: 'BULLISH_FVG_BISI',
          top: gapTop,
          bottom: gapBottom,
          consequentEncroachment,
          gapSize,
          candleIndex: i - 1,
          timestamp: c2.time,
          isMitigated,
          isTestedCE,
        });
      }

      // 2. Bearish FVG (SIBI - Sell-Side Imbalance Buy-Side Inefficiency)
      // Candle 1 Low is strictly greater than Candle 3 High
      if (c3.high < c1.low) {
        const gapTop = c1.low;
        const gapBottom = c3.high;
        const gapSize = gapTop - gapBottom;
        const consequentEncroachment = Number(((gapTop + gapBottom) / 2).toFixed(4));

        let isMitigated = false;
        let isTestedCE = false;

        for (let j = i + 1; j <= lastIndex; j++) {
          const subsequent = candles[j];
          if (subsequent.high >= consequentEncroachment) {
            isTestedCE = true;
          }
          if (subsequent.high >= gapTop) {
            isMitigated = true;
            break;
          }
        }

        fvgs.push({
          id: `fvg_bear_${c2.time}`,
          type: 'BEARISH_FVG_SIBI',
          top: gapTop,
          bottom: gapBottom,
          consequentEncroachment,
          gapSize,
          candleIndex: i - 1,
          timestamp: c2.time,
          isMitigated,
          isTestedCE,
        });
      }
    }

    return fvgs;
  }

  /**
   * Detects Institutional Order Blocks (+OB / -OB) verified by displacement and subsequent structure breaks.
   */
  public static detectOrderBlocks(candles: OHLCV[], lookback: number = 40): OrderBlock[] {
    const obs: OrderBlock[] = [];
    if (candles.length < 10) return obs;

    const startIndex = Math.max(3, candles.length - lookback);
    const lastIndex = candles.length - 1;

    for (let i = startIndex; i < lastIndex - 1; i++) {
      const curr = candles[i];
      const next1 = candles[i + 1];
      const next2 = candles[i + 2] || next1;

      const bodySize = Math.abs(curr.close - curr.open);
      const totalRange = curr.high - curr.low;
      const nextBody = Math.abs(next1.close - next1.open);

      // Bullish Order Block (+OB):
      // Decisive down-close candle immediately before a violent bullish displacement candle
      if (curr.close < curr.open) {
        const isBullishDisplacement = next1.close > next1.open && next1.close > curr.high && (nextBody > bodySize * 1.3 || next1.close > next1.open * 1.002);
        if (isBullishDisplacement) {
          // Check if mitigated subsequently
          let isMitigated = false;
          for (let j = i + 2; j <= lastIndex; j++) {
            if (candles[j].low < curr.low) {
              isMitigated = true;
              break;
            }
          }

          obs.push({
            id: `ob_bull_${curr.time}`,
            type: 'BULLISH_OB',
            high: curr.high,
            low: curr.low,
            open: curr.open,
            close: curr.close,
            volume: curr.volume,
            candleIndex: i,
            timestamp: curr.time,
            isMitigated,
            displacementFactor: Number((nextBody / Math.max(0.0001, bodySize)).toFixed(2)),
          });
        }
      }

      // Bearish Order Block (-OB):
      // Decisive up-close candle immediately before a violent bearish displacement candle
      if (curr.close > curr.open) {
        const isBearishDisplacement = next1.close < next1.open && next1.close < curr.low && (nextBody > bodySize * 1.3 || next1.close < next1.open * 0.998);
        if (isBearishDisplacement) {
          let isMitigated = false;
          for (let j = i + 2; j <= lastIndex; j++) {
            if (candles[j].high > curr.high) {
              isMitigated = true;
              break;
            }
          }

          obs.push({
            id: `ob_bear_${curr.time}`,
            type: 'BEARISH_OB',
            high: curr.high,
            low: curr.low,
            open: curr.open,
            close: curr.close,
            volume: curr.volume,
            candleIndex: i,
            timestamp: curr.time,
            isMitigated,
            displacementFactor: Number((nextBody / Math.max(0.0001, bodySize)).toFixed(2)),
          });
        }
      }
    }

    return obs;
  }

  /**
   * Detects Impulse -> Base -> Impulse (IBI) institutional sequence.
   * RBR (Rally-Base-Rally), DBD (Drop-Base-Drop), RBD, DBR.
   */
  public static detectIBI(candles: OHLCV[], lookback: number = 35): ImpulseBaseImpulse | undefined {
    if (candles.length < 8) return undefined;
    const slice = candles.slice(-lookback);
    const n = slice.length;

    // Scan backwards for a 3-phase structural sequence:
    // Phase 1: Impulse 1 (strong move)
    // Phase 2: Base (consolidation of 1-4 small body candles)
    // Phase 3: Impulse 2 (continuation/expansion)
    for (let baseEnd = n - 2; baseEnd >= 4; baseEnd--) {
      for (let baseLen = 1; baseLen <= 4; baseLen++) {
        const baseStart = baseEnd - baseLen + 1;
        if (baseStart < 2) continue;

        const impulse1Candle = slice[baseStart - 1];
        const impulse1Prev = slice[baseStart - 2];
        const impulse1Move = impulse1Candle.close - impulse1Prev.close;

        // Base metrics
        const baseCandles = slice.slice(baseStart, baseEnd + 1);
        let baseHigh = -Infinity;
        let baseLow = Infinity;
        let baseVolSum = 0;

        for (const bc of baseCandles) {
          if (bc.high > baseHigh) baseHigh = bc.high;
          if (bc.low < baseLow) baseLow = bc.low;
          baseVolSum += bc.volume;
        }

        const baseRange = baseHigh - baseLow;
        const impulse2Candle = slice[baseEnd + 1];
        const impulse2Move = impulse2Candle.close - slice[baseEnd].close;

        // Rally -> Base -> Rally (RBR)
        if (impulse1Move > 0 && impulse2Move > 0 && impulse2Candle.close > baseHigh) {
          const displacementPercent = Number((((impulse2Candle.close - baseLow) / baseLow) * 100).toFixed(2));
          return {
            type: 'RALLY_BASE_RALLY',
            baseHigh,
            baseLow,
            baseCandleCount: baseLen,
            displacementPercent,
            timestamp: impulse2Candle.time,
          };
        }

        // Drop -> Base -> Drop (DBD)
        if (impulse1Move < 0 && impulse2Move < 0 && impulse2Candle.close < baseLow) {
          const displacementPercent = Number((((baseHigh - impulse2Candle.close) / baseHigh) * 100).toFixed(2));
          return {
            type: 'DROP_BASE_DROP',
            baseHigh,
            baseLow,
            baseCandleCount: baseLen,
            displacementPercent,
            timestamp: impulse2Candle.time,
          };
        }

        // Drop -> Base -> Rally (DBR) - Bullish Reversal at Demand
        if (impulse1Move < 0 && impulse2Move > 0 && impulse2Candle.close > baseHigh) {
          const displacementPercent = Number((((impulse2Candle.close - baseLow) / baseLow) * 100).toFixed(2));
          return {
            type: 'DROP_BASE_RALLY',
            baseHigh,
            baseLow,
            baseCandleCount: baseLen,
            displacementPercent,
            timestamp: impulse2Candle.time,
          };
        }

        // Rally -> Base -> Drop (RBD) - Bearish Reversal at Supply
        if (impulse1Move > 0 && impulse2Move < 0 && impulse2Candle.close < baseLow) {
          const displacementPercent = Number((((baseHigh - impulse2Candle.close) / baseHigh) * 100).toFixed(2));
          return {
            type: 'RALLY_BASE_DROP',
            baseHigh,
            baseLow,
            baseCandleCount: baseLen,
            displacementPercent,
            timestamp: impulse2Candle.time,
          };
        }
      }
    }

    return undefined;
  }

  /**
   * Detects Buy-Side Liquidity (BSL) and Sell-Side Liquidity (SSL) sweeps.
   */
  public static detectLiquiditySweeps(candles: OHLCV[], lookback: number = 30): LiquiditySweep | undefined {
    if (candles.length < 8) return undefined;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const slice = candles.slice(-lookback, -2);

    if (slice.length < 3) return undefined;

    let priorHigh = -Infinity;
    let priorLow = Infinity;

    for (const c of slice) {
      if (c.high > priorHigh) priorHigh = c.high;
      if (c.low < priorLow) priorLow = c.low;
    }

    // BSL Sweep: Price wicked above prior swing high (taking buy stops), but closed back below it
    if (prev.high > priorHigh && prev.close < priorHigh && last.close < prev.close) {
      return {
        type: 'BSL_SWEEP',
        levelSwept: priorHigh,
        sweepPrice: prev.high,
        rejectionClose: prev.close,
        timestamp: prev.time,
        candleIndex: candles.length - 2,
      };
    }

    // SSL Sweep: Price wicked below prior swing low (taking sell stops), but closed back above it
    if (prev.low < priorLow && prev.close > priorLow && last.close > prev.close) {
      return {
        type: 'SSL_SWEEP',
        levelSwept: priorLow,
        sweepPrice: prev.low,
        rejectionClose: prev.close,
        timestamp: prev.time,
        candleIndex: candles.length - 2,
      };
    }

    return undefined;
  }

  /**
   * Institutional Order Flow Entry Drill (IOFED) Evaluator:
   * Combines IBI, FVGs (50% CE), unmitigated OBs, Premium/Discount arrays, and Liquidity Sweeps
   * into a high-expectancy algorithmic execution signal.
   */
  public static evaluateSignal(
    candles: OHLCV[],
    ind: TechnicalIndicators,
    regime: MarketRegimeType,
    params: {
      minConfidence?: number;
      minRiskReward?: number;
      requireDiscountPremium?: boolean;
      consequentEncroachmentTolerancePercent?: number;
    } = {}
  ): IOFAnalysisResult {
    const last = candles[candles.length - 1];
    const defaultFail: IOFAnalysisResult = {
      direction: 'HOLD',
      confidenceScore: 0,
      entryPrice: last ? last.close : 0,
      suggestedStopLoss: 0,
      suggestedTakeProfit: 0,
      riskRewardRatio: 0,
      reasons: [],
      activeOrderBlocks: [],
      activeFVGs: [],
      dealingRange: { low: 0, high: 0, equilibrium: 0, currentPrice: 0, currentZone: 'EQUILIBRIUM', zoneDepthPercent: 50 },
      iofedTriggered: false,
    };

    if (!last || candles.length < 25) return defaultFail;

    const minRR = params.minRiskReward || 2.5;
    const requireDP = params.requireDiscountPremium !== false;

    // 1. Analyze Core Structural Arrays
    const dealingRange = this.calculateDealingRange(candles, 45);
    const fvgs = this.detectFairValueGaps(candles, 45);
    const obs = this.detectOrderBlocks(candles, 40);
    const ibi = this.detectIBI(candles, 35);
    const sweep = this.detectLiquiditySweeps(candles, 30);

    const unmitigatedBullFVGs = fvgs.filter((f) => f.type === 'BULLISH_FVG_BISI' && !f.isMitigated);
    const unmitigatedBearFVGs = fvgs.filter((f) => f.type === 'BEARISH_FVG_SIBI' && !f.isMitigated);
    const unmitigatedBullOBs = obs.filter((o) => o.type === 'BULLISH_OB' && !o.isMitigated);
    const unmitigatedBearOBs = obs.filter((o) => o.type === 'BEARISH_OB' && !o.isMitigated);

    const reasons: string[] = [];
    let direction: SignalDirection = 'HOLD';
    let confidence = 50;
    let stopLoss = 0;
    let takeProfit = 0;
    let iofedTriggered = false;

    const currentPrice = last.close;
    const atr = ind.atr || currentPrice * 0.005;

    // ==========================================
    // 2. BULLISH IOFED EVALUATION (BUY DRILL)
    // ==========================================
    // Conditions:
    // a. Price is in DISCOUNT (< 50% equilibrium)
    // b. Unmitigated Bullish FVG or Bullish Order Block (+OB) is being tested/mitigated
    // c. IBI bullish sequence (RBR or DBR) or SSL sweep has occurred
    const isDiscount = dealingRange.currentZone === 'DISCOUNT' || !requireDP;
    const activeBullFVG = unmitigatedBullFVGs.find((f) => currentPrice >= f.bottom * 0.999 && currentPrice <= f.top * 1.002);
    const activeBullOB = unmitigatedBullOBs.find((o) => currentPrice >= o.low * 0.999 && currentPrice <= o.high * 1.002);

    const hasBullishStructuralConfluence = (ibi?.type === 'RALLY_BASE_RALLY' || ibi?.type === 'DROP_BASE_RALLY') || (sweep?.type === 'SSL_SWEEP');
    const hasTrendAlignment = ind.ema20 >= ind.ema50 || currentPrice > ind.ema200 || regime.includes('Bullish');

    if (isDiscount && (activeBullFVG || activeBullOB) && (hasBullishStructuralConfluence || hasTrendAlignment)) {
      direction = 'BUY';
      iofedTriggered = true;
      confidence = 72;

      reasons.push(`[IOF Regime]: Operating in institutional DISCOUNT zone (${dealingRange.zoneDepthPercent}% depth below Equilibrium $${dealingRange.equilibrium.toFixed(2)})`);

      if (activeBullFVG) {
        confidence += 10;
        const testedCE = currentPrice <= activeBullFVG.consequentEncroachment * 1.001;
        reasons.push(
          `[FVG Imbalance]: Price retraced into active Bullish Fair Value Gap ($${activeBullFVG.bottom.toFixed(2)} - $${activeBullFVG.top.toFixed(2)})${
            testedCE ? ` testing Consequent Encroachment (50% CE: $${activeBullFVG.consequentEncroachment.toFixed(2)})` : ''
          }`
        );
      }

      if (activeBullOB) {
        confidence += 8;
        reasons.push(`[Order Block]: Mitigating fresh Bullish Order Block (+OB) at $${activeBullOB.low.toFixed(2)} - $${activeBullOB.high.toFixed(2)} with displacement factor ${activeBullOB.displacementFactor}x`);
      }

      if (ibi) {
        confidence += 6;
        reasons.push(`[IBI Structure]: Confirmed ${ibi.type.replace(/_/g, ' ')} institutional accumulation leg (${ibi.displacementPercent}% displacement)`);
      }

      if (sweep?.type === 'SSL_SWEEP') {
        confidence += 8;
        reasons.push(`[Liquidity Sweep]: Smart money swept retail Sell-Side Liquidity (SSL) at $${sweep.levelSwept.toFixed(2)} prior to upward re-accumulation`);
      }

      // Calculate precision Stop Loss and Take Profit
      // SL placed strictly below +OB low or FVG bottom with 0.3x ATR protection buffer
      const structuralLow = Math.min(activeBullOB ? activeBullOB.low : Infinity, activeBullFVG ? activeBullFVG.bottom : Infinity);
      const safeBuffer = Math.max(currentPrice * 0.0025, atr * 0.4);
      stopLoss = Number((structuralLow !== Infinity ? structuralLow - safeBuffer : currentPrice - atr * 1.5).toFixed(currentPrice > 10 ? 2 : 4));

      const riskDistance = Math.max(currentPrice * 0.002, currentPrice - stopLoss);
      
      // Target 1: Dealing Range High / Buy-Side Liquidity (BSL)
      // Target 2: Asymmetric 3.5 R:R institutional target
      const bslTarget = dealingRange.high;
      const rrTarget = currentPrice + riskDistance * minRR;
      takeProfit = Number((Math.max(bslTarget, rrTarget)).toFixed(currentPrice > 10 ? 2 : 4));
    }

    // ==========================================
    // 3. BEARISH IOFED EVALUATION (SELL DRILL)
    // ==========================================
    const isPremium = dealingRange.currentZone === 'PREMIUM' || !requireDP;
    const activeBearFVG = unmitigatedBearFVGs.find((f) => currentPrice <= f.top * 1.001 && currentPrice >= f.bottom * 0.998);
    const activeBearOB = unmitigatedBearOBs.find((o) => currentPrice <= o.high * 1.001 && currentPrice >= o.low * 0.998);

    const hasBearishStructuralConfluence = (ibi?.type === 'DROP_BASE_DROP' || ibi?.type === 'RALLY_BASE_DROP') || (sweep?.type === 'BSL_SWEEP');
    const hasBearishTrendAlignment = ind.ema20 <= ind.ema50 || currentPrice < ind.ema200 || regime.includes('Bearish');

    if (direction === 'HOLD' && isPremium && (activeBearFVG || activeBearOB) && (hasBearishStructuralConfluence || hasBearishTrendAlignment)) {
      direction = 'SELL';
      iofedTriggered = true;
      confidence = 72;

      reasons.push(`[IOF Regime]: Operating in institutional PREMIUM zone (${dealingRange.zoneDepthPercent}% depth above Equilibrium $${dealingRange.equilibrium.toFixed(2)})`);

      if (activeBearFVG) {
        confidence += 10;
        const testedCE = currentPrice >= activeBearFVG.consequentEncroachment * 0.999;
        reasons.push(
          `[FVG Imbalance]: Price retraced into active Bearish Fair Value Gap ($${activeBearFVG.bottom.toFixed(2)} - $${activeBearFVG.top.toFixed(2)})${
            testedCE ? ` testing Consequent Encroachment (50% CE: $${activeBearFVG.consequentEncroachment.toFixed(2)})` : ''
          }`
        );
      }

      if (activeBearOB) {
        confidence += 8;
        reasons.push(`[Order Block]: Mitigating fresh Bearish Order Block (-OB) at $${activeBearOB.low.toFixed(2)} - $${activeBearOB.high.toFixed(2)} with displacement factor ${activeBearOB.displacementFactor}x`);
      }

      if (ibi) {
        confidence += 6;
        reasons.push(`[IBI Structure]: Confirmed ${ibi.type.replace(/_/g, ' ')} institutional distribution leg (${ibi.displacementPercent}% displacement)`);
      }

      if (sweep?.type === 'BSL_SWEEP') {
        confidence += 8;
        reasons.push(`[Liquidity Sweep]: Smart money swept retail Buy-Side Liquidity (BSL) at $${sweep.levelSwept.toFixed(2)} before initiating downward distribution`);
      }

      // SL placed strictly above -OB high or FVG top with 0.3x ATR protection buffer
      const structuralHigh = Math.max(activeBearOB ? activeBearOB.high : -Infinity, activeBearFVG ? activeBearFVG.top : -Infinity);
      const safeBuffer = Math.max(currentPrice * 0.0025, atr * 0.4);
      stopLoss = Number((structuralHigh !== -Infinity ? structuralHigh + safeBuffer : currentPrice + atr * 1.5).toFixed(currentPrice > 10 ? 2 : 4));

      const riskDistance = Math.max(currentPrice * 0.002, stopLoss - currentPrice);

      // Target 1: Dealing Range Low / Sell-Side Liquidity (SSL)
      // Target 2: Asymmetric 3.5 R:R institutional target
      const sslTarget = dealingRange.low;
      const rrTarget = currentPrice - riskDistance * minRR;
      takeProfit = Number((Math.min(sslTarget, rrTarget)).toFixed(currentPrice > 10 ? 2 : 4));
    }

    // Risk-to-reward calculation
    const stopDistance = Math.abs(currentPrice - stopLoss);
    const tpDistance = Math.abs(takeProfit - currentPrice);
    const calculatedRR = stopDistance > 0 ? Number((tpDistance / stopDistance).toFixed(2)) : 0;

    if (direction !== 'HOLD') {
      reasons.push(`[IOFED Execution]: Asymmetric Risk-to-Reward ratio calculated at 1:${calculatedRR} (Targeting wholesale-to-retail liquidity transfer)`);
    }

    return {
      direction,
      confidenceScore: Math.min(96, confidence),
      entryPrice: currentPrice,
      suggestedStopLoss: stopLoss,
      suggestedTakeProfit: takeProfit,
      riskRewardRatio: calculatedRR,
      reasons,
      activeOrderBlocks: obs,
      activeFVGs: fvgs,
      lastIBI: ibi,
      lastSweep: sweep,
      dealingRange,
      iofedTriggered,
    };
  }
}
