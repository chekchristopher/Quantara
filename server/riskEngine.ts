import { Position, RiskSettings, TradingSignal, PortfolioSummary, AuditLog } from '../src/types';
import { calculateEquityLotSize } from '../src/utils/lotSize';

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
}

export class RiskManagementEngine {
  /**
   * Validates a proposed signal against strict risk rules and computes dynamic position size.
   */
  public validateAndSizeTrade(
    signal: TradingSignal,
    portfolio: PortfolioSummary,
    openPositions: Position[],
    settings: RiskSettings
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

    // 6. Dynamic Position Sizing (Strict Institutional Lot Sizing strictly bounded 0.01 to 0.10 based on equity)
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

    // Target lot size strictly determined by equity between 0.01 and 0.10 lots
    const targetLotSize = calculateEquityLotSize(portfolio.totalEquity);

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
