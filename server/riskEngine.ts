import { Position, RiskSettings, TradingSignal, PortfolioSummary, AuditLog } from '../src/types';

export interface RiskValidationResult {
  passed: boolean;
  rejectionReason?: string;
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
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // 6. Dynamic Position Sizing (Fixed Fractional Volatility Risk Sizing)
    const entry = signal.entryPrice;
    const stopLoss = signal.suggestedStopLoss;
    const takeProfit = signal.suggestedTakeProfit;

    if (entry <= 0 || stopLoss <= 0) {
      return {
        passed: false,
        rejectionReason: 'Trade rejected: Invalid entry or stop loss price provided.',
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
        calculatedPositionSizeUsd: 0,
        calculatedQuantity: 0,
        stopLossPrice: 0,
        takeProfitPrice: 0,
        riskAmountUsd: 0,
        leverageUsed: 0,
      };
    }

    // Target risk amount in dollars
    const targetRiskDollar = (portfolio.totalEquity * settings.maxRiskPerTradePercent) / 100;
    
    // Position quantity = Risk Amount / Stop Loss Distance Per Unit
    let calculatedQuantity = targetRiskDollar / stopDistance;
    let calculatedSizeUsd = calculatedQuantity * entry;

    // 7. Max Single Asset Exposure Constraint
    const maxAssetExposureUsd = (portfolio.totalEquity * settings.maxExposurePerAssetPercent) / 100;
    if (calculatedSizeUsd > maxAssetExposureUsd) {
      calculatedSizeUsd = maxAssetExposureUsd;
      calculatedQuantity = calculatedSizeUsd / entry;
    }

    // 8. Total Portfolio Exposure & Leverage Constraint
    const currentTotalExposureUsd = openPositions.reduce((sum, p) => sum + p.sizeUsd, 0);
    const maxTotalExposureAllowed = portfolio.totalEquity * settings.maxLeverage * (settings.maxPortfolioExposurePercent / 100);

    if (currentTotalExposureUsd + calculatedSizeUsd > maxTotalExposureAllowed) {
      const remainingAllowed = Math.max(0, maxTotalExposureAllowed - currentTotalExposureUsd);
      if (remainingAllowed < 100) {
        return {
          passed: false,
          rejectionReason: `Trade rejected: Total portfolio exposure ceiling ($${maxTotalExposureAllowed.toFixed(0)}) reached.`,
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
    if (calculatedSizeUsd > portfolio.cashBalance * settings.maxLeverage) {
      calculatedSizeUsd = portfolio.cashBalance * settings.maxLeverage;
      calculatedQuantity = calculatedSizeUsd / entry;
    }

    const finalRiskAmount = calculatedQuantity * stopDistance;
    const finalLeverageUsed = Number(((currentTotalExposureUsd + calculatedSizeUsd) / portfolio.totalEquity).toFixed(2));

    return {
      passed: true,
      calculatedPositionSizeUsd: Number(calculatedSizeUsd.toFixed(2)),
      calculatedQuantity: Number(calculatedQuantity.toFixed(entry > 100 ? 4 : 2)),
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
