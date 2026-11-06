import { Position, RiskSettings, TradingSignal, PortfolioSummary, AuditLog } from '../src/types';
import { calculateEquityLotSize } from '../src/utils/lotSize';
import { economicCalendarService } from './economicCalendar';

export interface RiskValidationResult {
  passed: boolean;
  rejectionReason?: string;
  calculatedLotSize: number; // Institutional MT5 lot size (strictly 0.01 - 0.10 based on equity)
  calculatedPositionSizeUsd: number;
  calculatedQuantity: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskAmountUsd: number;
  leverageUsed: number;
  consecutiveWinsStreak?: number;
  isCompoundingBoosted?: boolean;
}

export class RiskManagementEngine {
  /**
   * Validates a proposed signal against strict institutional risk rules and computes dynamic position size.
   */
  public validateAndSizeTrade(
    signal: TradingSignal,
    portfolio: PortfolioSummary,
    openPositions: Position[],
    settings: RiskSettings,
    asset?: any,
    tradesHistory: any[] = []
  ): RiskValidationResult {
    // 1. Kill Switch Check
    if (settings.killSwitchActive) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Emergency Kill Switch is ACTIVE (${settings.killSwitchTriggerReason || 'Manual engagement'}).`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 2. Maximum Open Positions Check
    if (openPositions.length >= settings.maxOpenPositions) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Maximum open positions limit reached (${openPositions.length}/${settings.maxOpenPositions}).`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 3. Existing Asset Position Check (prevent duplicate exposure on the same symbol)
    const existingPosition = openPositions.find((p) => p.symbol === signal.assetSymbol);
    if (existingPosition) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Active position already exists for ${signal.assetSymbol}.`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 4. Maximum Daily Loss Circuit Breaker
    const maxDailyLossAllowed = (portfolio.totalEquity * settings.maxDailyLossPercent) / 100;
    if (portfolio.realizedPnlToday < 0 && Math.abs(portfolio.realizedPnlToday) >= maxDailyLossAllowed) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Daily loss limit breached ($${Math.abs(portfolio.realizedPnlToday).toFixed(2)} / limit $${maxDailyLossAllowed.toFixed(2)}). Bot is paused for capital preservation.`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 5. Maximum Account Drawdown Check
    if (portfolio.currentDrawdownPercent >= settings.maxAccountDrawdownPercent) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Portfolio drawdown (${portfolio.currentDrawdownPercent.toFixed(1)}%) reached maximum threshold (${settings.maxAccountDrawdownPercent}%). New executions frozen.`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 5b. Hard Capital Floor Protection Check
    if (settings.hardCapitalFloorPercent && portfolio.peakEquity > 0) {
      const minEquityFloor = (portfolio.peakEquity * settings.hardCapitalFloorPercent) / 100;
      if (portfolio.totalEquity < minEquityFloor) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Hard Capital Floor Guarantee triggered (Equity $${portfolio.totalEquity.toFixed(2)} < floor $${minEquityFloor.toFixed(2)}). Capital preserved.`,
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
    }

    // 5c. High-Impact Economic News Blackout Window
    const blackout = economicCalendarService.checkBlackoutStatus(signal.assetSymbol);
    if (blackout.isBlackout || settings.newsBlackoutActive) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: ${blackout.reason || 'High-Impact Economic News Blackout active. Orders halted for slippage & spread defense.'}`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 5d. Interbank Rollover Liquidity Gap Defense (21:00 - 23:00 UTC / 5PM - 7PM EST)
    const currentUtcHour = new Date().getUTCHours();
    if (currentUtcHour === 21 || currentUtcHour === 22) {
      return {
        passed: false,
        rejectionReason: 'Trade rejected: Interbank Rollover Liquidity Gap (21:00-23:00 UTC). Engine enforces Cash Preservation Mode during bank daily settlement rollover.',
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 5e. Broker Max Spread & Execution Slippage Gate
    if (asset && asset.spreadPips !== undefined) {
      const isGold = signal.assetSymbol.toUpperCase().includes('XAU') || signal.assetSymbol.toUpperCase().includes('GOLD');
      const maxAllowedSpread = isGold ? 2.5 : 1.5;
      if (asset.spreadPips > maxAllowedSpread) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Broker spread spike (${asset.spreadPips.toFixed(1)} pips > max ${maxAllowedSpread} pips). Protected from predatory broker slippage.`,
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
    }

    // 5f. ADX Market Regime "Don't Trade" Chop Filter
    if (asset?.indicators?.adx !== undefined) {
      const adxVal = asset.indicators.adx;
      // ADX below 20 indicates low momentum chop / compression
      if (adxVal < 20) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Market in Low-Momentum Chop (ADX ${adxVal.toFixed(1)} < 20). Engine protects capital by waiting for institutional directional expansion.`,
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
    }

    // 5g. Multi-Timeframe (MTF) Macro Structure Confluence Gate
    if (asset?.indicators?.ema200 && asset?.indicators?.ema50) {
      const isLong = signal.direction === 'BUY';
      const isShort = signal.direction === 'SELL';
      const isMacroBearish = asset.currentPrice < asset.indicators.ema200 * 0.985 && asset.indicators.ema20 < asset.indicators.ema50;
      const isMacroBullish = asset.currentPrice > asset.indicators.ema200 * 1.015 && asset.indicators.ema20 > asset.indicators.ema50;

      if (isLong && isMacroBearish) {
        return {
          passed: false,
          rejectionReason: 'Trade rejected: Multi-Timeframe Structure Mismatch. Macro structure is strongly bearish below 200 EMA. Counter-trend LONG blocked.',
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
      if (isShort && isMacroBullish) {
        return {
          passed: false,
          rejectionReason: 'Trade rejected: Multi-Timeframe Structure Mismatch. Macro structure is strongly bullish above 200 EMA. Counter-trend SHORT blocked.',
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
    }

    // 5h. Mathematical Positive Expectancy & Asymmetric R:R Gate
    const minRequiredRR = settings.minRiskRewardRatio || 2.5;
    if (signal.riskRewardRatio < minRequiredRR) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Asymmetric Expectancy Gate. Setup provides 1:${signal.riskRewardRatio} R:R (minimum 1:${minRequiredRR} required for guaranteed positive statistical expectancy).`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 5i. Currency / Asset Correlation Filter
    const isUsdPair = (s: string) => s.toUpperCase().includes('USD');
    if (isUsdPair(signal.assetSymbol)) {
      const openUsdPairs = openPositions.filter((p) => isUsdPair(p.symbol));
      if (openUsdPairs.length >= (settings.maxOpenPositions <= 2 ? 1 : 2)) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Correlation shield active (${openUsdPairs.length} USD pair(s) already open). Prevents dangerous multi-pair USD exposure.`,
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
    }

    // 6. Dynamic Position Sizing with Anti-Martingale / Asymmetric Compounding
    const entry = signal.entryPrice;
    const stopLoss = signal.suggestedStopLoss;
    const takeProfit = signal.suggestedTakeProfit;

    if (entry <= 0 || stopLoss <= 0) {
      return {
        passed: false,
        rejectionReason: 'Trade rejected: Invalid entry or stop loss price provided.',
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    const stopDistance = Math.abs(entry - stopLoss);
    const stopDistancePercent = stopDistance / entry;

    // Minimum stop distance filter (avoid unrealistic tight stops that get clipped by spread)
    if (stopDistancePercent < 0.003) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Stop loss distance (${(stopDistancePercent * 100).toFixed(2)}%) is too tight (<0.3%) for normal spread and slippage.`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // Base lot size strictly determined by equity
    let targetLotSize = calculateEquityLotSize(portfolio.totalEquity);

    // Anti-Martingale Position Sizing:
    // Count consecutive winning trades in recent history
    let consecutiveWins = 0;
    if (Array.isArray(tradesHistory) && tradesHistory.length > 0) {
      for (const t of tradesHistory) {
        if (t.pnl > 0) {
          consecutiveWins++;
        } else {
          break; // Streak ends on first loss
        }
      }
    }

    let isCompoundingBoosted = false;
    // When on a winning streak (2+ wins) and portfolio drawdown is minimal (<1.0%),
    // step up lot sizing safely (+15% for 2 wins, +25% for 3+ wins), bounded by institutional max (0.10)
    if (consecutiveWins >= 2 && portfolio.currentDrawdownPercent < 1.0) {
      const multiplier = consecutiveWins >= 3 ? 1.25 : 1.15;
      const boosted = Number((targetLotSize * multiplier).toFixed(2));
      targetLotSize = Math.min(0.10, Math.max(targetLotSize, boosted));
      isCompoundingBoosted = true;
    } else if (portfolio.currentDrawdownPercent >= 1.5) {
      // In any drawdown, immediately lock lot size to lowest baseline (0.01) to protect accumulated capital
      targetLotSize = 0.01;
    }

    // Map institutional lot size to asset contract units:
    // - Gold (XAU/USD): 1 standard lot = 100 oz. 0.01 lot = 1.0 oz.
    // - Major Forex (EUR/USD, GBP/USD, USD/JPY): 1 standard lot = 100,000 units. 0.01 lot = 1,000 units.
    // - Crypto (BTC/USD): 1 lot = 1 BTC. 0.01 lot = 0.01 BTC.
    let calculatedQuantity = 0;
    const sym = signal.assetSymbol.toUpperCase();
    if (sym.includes('XAU') || sym.includes('GOLD')) {
      calculatedQuantity = Number((targetLotSize * 100).toFixed(2));
    } else if (sym.includes('BTC')) {
      calculatedQuantity = Number(targetLotSize.toFixed(4));
    } else if (sym.includes('EUR') || sym.includes('GBP') || sym.includes('JPY') || sym.includes('AUD') || sym.includes('CAD')) {
      calculatedQuantity = Number((targetLotSize * 100000).toFixed(0));
    } else {
      calculatedQuantity = entry > 1000 ? Number(targetLotSize.toFixed(4)) : entry > 20 ? Number((targetLotSize * 100).toFixed(2)) : Number((targetLotSize * 100000).toFixed(0));
    }

    let calculatedSizeUsd = calculatedQuantity * entry;

    // 7. Max Single Asset Exposure Constraint (scaled for micro accounts)
    const isMicroAccount = portfolio.totalEquity < 250;
    const maxExposurePercent = isMicroAccount ? 75.0 : settings.maxExposurePerAssetPercent;
    const maxAssetExposureUsd = (portfolio.totalEquity * maxExposurePercent) / 100;
    if (calculatedSizeUsd > maxAssetExposureUsd) {
      calculatedSizeUsd = Math.max(portfolio.totalEquity <= 50 ? 5.0 : 10.0, maxAssetExposureUsd);
      calculatedQuantity = calculatedSizeUsd / entry;
    }

    // 8. Total Portfolio Exposure & Leverage Constraint
    const currentTotalExposureUsd = openPositions.reduce((sum, p) => sum + p.sizeUsd, 0);
    const effectiveLeverage = isMicroAccount ? Math.max(settings.maxLeverage, 3.0) : settings.maxLeverage;
    const maxTotalExposureAllowed = portfolio.totalEquity * effectiveLeverage * (settings.maxPortfolioExposurePercent / 100);

    if (currentTotalExposureUsd + calculatedSizeUsd > maxTotalExposureAllowed) {
      const remainingAllowed = Math.max(0, maxTotalExposureAllowed - currentTotalExposureUsd);
      const minAllowedFloor = portfolio.totalEquity < 100 ? 1.0 : 50.0;
      if (remainingAllowed < minAllowedFloor) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Total portfolio exposure ceiling ($${maxTotalExposureAllowed.toFixed(2)}) reached.`,
          calculatedLotSize: 0,
          calculatedPositionSizeUsd: 0,
          calculatedQuantity: 0,
          stopLossPrice: 0,
          takeProfitPrice: 0,
          riskAmountUsd: 0,
          leverageUsed: 0,
        };
      }
      calculatedSizeUsd = remainingAllowed;
      calculatedQuantity = calculatedSizeUsd / entry;
    }

    // 9. Available Cash Constraint (assuming no naked margin beyond max leverage)
    const cashMultiplier = isMicroAccount ? Math.max(settings.maxLeverage, 3.0) : settings.maxLeverage;
    if (calculatedSizeUsd > portfolio.cashBalance * cashMultiplier) {
      calculatedSizeUsd = Math.max(0, portfolio.cashBalance * cashMultiplier);
      calculatedQuantity = calculatedSizeUsd / entry;
    }

    if (calculatedSizeUsd < 0.50 || calculatedQuantity <= 0) {
      return {
        passed: false,
        rejectionReason: `Trade rejected: Calculated position size ($${calculatedSizeUsd.toFixed(2)}) is below execution minimum ($0.50).`,
        calculatedLotSize: 0,
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    const finalRiskAmount = calculatedQuantity * stopDistance;
    const finalLeverageUsed = Number(((currentTotalExposureUsd + calculatedSizeUsd) / Math.max(1, portfolio.totalEquity)).toFixed(2));

    return {
      passed: true,
      calculatedLotSize: targetLotSize,
      calculatedPositionSizeUsd: Number(calculatedSizeUsd.toFixed(2)),
      calculatedQuantity: Number(calculatedQuantity.toFixed(entry > 1000 ? 6 : entry > 100 ? 4 : 2)),
      stopLossPrice: Number(stopLoss.toFixed(entry > 10 ? 2 : 4)),
      takeProfitPrice: Number(takeProfit.toFixed(entry > 10 ? 2 : 4)),
      riskAmountUsd: Number(finalRiskAmount.toFixed(2)),
      leverageUsed: finalLeverageUsed,
      consecutiveWinsStreak: consecutiveWins,
      isCompoundingBoosted,
    };
  }

  /**
   * Evaluates positions for trailing stop adjustments
   */
  public updateTrailingStops(positions: Position[], currentPrices: Map<string, number>, trailingPercent: number): Position[] {
    return positions.map((p) => {
      const currentPrice = currentPrices.get(p.symbol);
      if (!currentPrice) return p;

      if (p.side === 'LONG') {
        const potentialTrailingStop = currentPrice * (1 - trailingPercent / 100);
        if (potentialTrailingStop > p.stopLossPrice) {
          return {
            ...p,
            trailingStopPrice: Number(potentialTrailingStop.toFixed(2)),
            stopLossPrice: Number(potentialTrailingStop.toFixed(2)),
          };
        }
      } else if (p.side === 'SHORT') {
        const potentialTrailingStop = currentPrice * (1 + trailingPercent / 100);
        if (potentialTrailingStop < p.stopLossPrice) {
          return {
            ...p,
            trailingStopPrice: Number(potentialTrailingStop.toFixed(2)),
            stopLossPrice: Number(potentialTrailingStop.toFixed(2)),
          };
        }
      }
      return p;
    });
  }
}

export const riskEngine = new RiskManagementEngine();
