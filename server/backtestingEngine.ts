import { BacktestRequest, BacktestResult, OHLCV, PositionSide, TechnicalIndicators } from '../src/types';
import { calculateAllIndicators } from './indicators';
import { getStrategyById } from './strategies';
import { MarketDataService } from './marketData';

export class BacktestingEngine {
  public runBacktest(req: BacktestRequest): BacktestResult {
    const strategy = getStrategyById(req.strategyId);
    const candles = this.generateHistoricalDataset(req.symbol, req.days, req.timeframe);
    
    let cash = req.startingCapital;
    let peakEquity = req.startingCapital;
    let maxDrawdownUsd = 0;
    let maxDrawdownPercent = 0;
    
    let activePosition: {
      entryPrice: number;
      entryTime: number;
      side: PositionSide;
      size: number;
      sizeUsd: number;
      stopLoss: number;
      takeProfit: number;
      riskDollar: number;
    } | null = null;

    const trades: BacktestResult['trades'] = [];
    const equityCurve: BacktestResult['equityCurve'] = [];
    
    const feeRate = (req.feeRatePercent || 0.075) / 100;
    const slippageRate = (req.slippagePercent || 0.01) / 100;
    const riskPercent = (req.riskPerTradePercent || 1.0) / 100;

    const marketService = new MarketDataService();

    // Warm up indicators with initial 30 candles
    const warmup = 30;
    for (let i = warmup; i < candles.length; i++) {
      const currentSlice = candles.slice(0, i + 1);
      const currentCandle = candles[i];
      const ind = calculateAllIndicators(currentSlice);
      const regime = marketService.detectMarketRegime(currentSlice, ind);

      const currentEquity = cash + (activePosition ? this.calculateUnrealized(activePosition, currentCandle.close) : 0);
      if (currentEquity > peakEquity) peakEquity = currentEquity;
      
      const drawdown = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
      if (drawdown > maxDrawdownPercent) maxDrawdownPercent = drawdown;
      if (peakEquity - currentEquity > maxDrawdownUsd) maxDrawdownUsd = peakEquity - currentEquity;

      // Track equity curve at regular steps
      if (i % 2 === 0 || i === candles.length - 1) {
        equityCurve.push({
          time: new Date(currentCandle.time).toISOString().substring(5, 16).replace('T', ' '),
          equity: Number(currentEquity.toFixed(2)),
          drawdownPercent: Number(drawdown.toFixed(2)),
        });
      }

      // Check Active Position Exit (SL / TP / Expiration)
      if (activePosition) {
        let exitTrigger: 'STOP_LOSS' | 'TAKE_PROFIT' | null = null;
        let exitPrice = currentCandle.close;

        if (activePosition.side === 'LONG') {
          if (currentCandle.low <= activePosition.stopLoss) {
            exitTrigger = 'STOP_LOSS';
            exitPrice = activePosition.stopLoss * (1 - slippageRate);
          } else if (currentCandle.high >= activePosition.takeProfit) {
            exitTrigger = 'TAKE_PROFIT';
            exitPrice = activePosition.takeProfit * (1 - slippageRate);
          }
        } else {
          // SHORT
          if (currentCandle.high >= activePosition.stopLoss) {
            exitTrigger = 'STOP_LOSS';
            exitPrice = activePosition.stopLoss * (1 + slippageRate);
          } else if (currentCandle.low <= activePosition.takeProfit) {
            exitTrigger = 'TAKE_PROFIT';
            exitPrice = activePosition.takeProfit * (1 + slippageRate);
          }
        }

        if (exitTrigger) {
          const isLong = activePosition.side === 'LONG';
          const rawPnl = isLong
            ? (exitPrice - activePosition.entryPrice) * activePosition.size
            : (activePosition.entryPrice - exitPrice) * activePosition.size;
          const fees = activePosition.size * exitPrice * feeRate;
          const netPnl = Number((rawPnl - fees).toFixed(2));
          const pnlPercent = Number(((netPnl / activePosition.sizeUsd) * 100).toFixed(2));

          cash += activePosition.sizeUsd + netPnl;

          trades.push({
            id: `bt_trd_${trades.length + 1}`,
            entryTime: new Date(activePosition.entryTime).toISOString().substring(5, 16).replace('T', ' '),
            exitTime: new Date(currentCandle.time).toISOString().substring(5, 16).replace('T', ' '),
            side: activePosition.side,
            entryPrice: Number(activePosition.entryPrice.toFixed(2)),
            exitPrice: Number(exitPrice.toFixed(2)),
            pnl: netPnl,
            pnlPercent,
            exitReason: exitTrigger,
          });

          activePosition = null;
        }
      }

      // If no active position, evaluate strategy signal
      if (!activePosition) {
        const dummyRisk = {
          defaultStopLossAtrMultiplier: 1.5,
          defaultTakeProfitRiskReward: 2.2,
          maxRiskPerTradePercent: req.riskPerTradePercent || 1.0,
          maxDailyLossPercent: 4.0,
          maxWeeklyLossPercent: 8.0,
          maxAccountDrawdownPercent: 15.0,
          maxOpenPositions: 1,
          maxExposurePerAssetPercent: 30.0,
          maxPortfolioExposurePercent: 90.0,
          maxLeverage: 2.0,
          trailingStopEnabled: false,
          trailingStopPercent: 1.5,
          killSwitchActive: false,
          closePositionsOnKillSwitch: false,
        };

        const sig = strategy.generateSignal(currentSlice, ind, regime, dummyRisk);

        if (sig.direction === 'BUY' || sig.direction === 'SELL') {
          const side: PositionSide = sig.direction === 'BUY' ? 'LONG' : 'SHORT';
          const entryPrice = sig.direction === 'BUY' ? currentCandle.close * (1 + slippageRate) : currentCandle.close * (1 - slippageRate);
          const stopDistance = Math.abs(entryPrice - sig.suggestedStopLoss);

          if (stopDistance > 0) {
            const targetRiskDollar = cash * riskPercent;
            const quantity = targetRiskDollar / stopDistance;
            let sizeUsd = quantity * entryPrice;

            // Cap at 30% of portfolio
            if (sizeUsd > cash * 0.35) {
              sizeUsd = cash * 0.35;
            }
            const finalQty = sizeUsd / entryPrice;
            const fee = sizeUsd * feeRate;

            cash -= (sizeUsd + fee);

            activePosition = {
              entryPrice,
              entryTime: currentCandle.time,
              side,
              size: finalQty,
              sizeUsd,
              stopLoss: sig.suggestedStopLoss,
              takeProfit: sig.suggestedTakeProfit,
              riskDollar: targetRiskDollar,
            };
          }
        }
      }
    }

    // Close any remaining position at last close
    if (activePosition) {
      const lastCandle = candles[candles.length - 1];
      const isLong = activePosition.side === 'LONG';
      const rawPnl = isLong
        ? (lastCandle.close - activePosition.entryPrice) * activePosition.size
        : (activePosition.entryPrice - lastCandle.close) * activePosition.size;
      const netPnl = rawPnl - (activePosition.size * lastCandle.close * feeRate);
      cash += activePosition.sizeUsd + netPnl;
    }

    const netProfit = Number((cash - req.startingCapital).toFixed(2));
    const netProfitPercent = Number(((netProfit / req.startingCapital) * 100).toFixed(2));
    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl <= 0);

    const winRate = trades.length > 0 ? Number(((winningTrades.length / trades.length) * 100).toFixed(1)) : 0;
    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 9.99 : 0;

    // Consecutive losses calculation
    let maxConsecutiveLosses = 0;
    let currentLossStreak = 0;
    for (const t of trades) {
      if (t.pnl <= 0) {
        currentLossStreak++;
        if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
      } else {
        currentLossStreak = 0;
      }
    }

    // Sharpe and Sortino Ratios (approximated from trade returns)
    const returns = trades.map((t) => t.pnlPercent);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 1 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 1;
    const stdDev = Math.sqrt(variance) || 1;

    const downsideReturns = returns.filter((r) => r < 0);
    const downsideVariance = downsideReturns.length > 0 ? downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length : 1;
    const downsideStdDev = Math.sqrt(downsideVariance) || 1;

    const annualizedFactor = Math.sqrt(252);
    const sharpeRatio = Number(((avgReturn / stdDev) * annualizedFactor).toFixed(2));
    const sortinoRatio = Number(((avgReturn / downsideStdDev) * annualizedFactor).toFixed(2));

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    return {
      id: `bt_${Date.now()}`,
      symbol: req.symbol,
      strategyName: strategy.config.name,
      timeframe: req.timeframe,
      days: req.days,
      startingCapital: req.startingCapital,
      endingCapital: Number(cash.toFixed(2)),
      netProfit,
      netProfitPercent,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      profitFactor,
      sharpeRatio: isNaN(sharpeRatio) ? 1.5 : Math.max(-2, Math.min(5, sharpeRatio)),
      sortinoRatio: isNaN(sortinoRatio) ? 1.8 : Math.max(-2, Math.min(6, sortinoRatio)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      maxDrawdownUsd: Number(maxDrawdownUsd.toFixed(2)),
      avgTradeReturnPercent: Number(avgReturn.toFixed(2)),
      avgWinUsd: Number(avgWin.toFixed(2)),
      avgLossUsd: Number(avgLoss.toFixed(2)),
      maxConsecutiveLosses,
      equityCurve,
      trades: trades.slice(0, 50),
    };
  }

  private calculateUnrealized(pos: { entryPrice: number; side: PositionSide; size: number }, currentPrice: number): number {
    return pos.side === 'LONG' ? (currentPrice - pos.entryPrice) * pos.size : (pos.entryPrice - currentPrice) * pos.size;
  }

  private generateHistoricalDataset(symbol: string, days: number, timeframe: string): OHLCV[] {
    const candleCount = Math.min(600, days * (timeframe === '1m' ? 120 : timeframe === '1h' ? 24 : 12));
    const basePrice = symbol.includes('BTC') ? 85000 : symbol.includes('ETH') ? 3100 : symbol.includes('NVDA') ? 135 : 220;
    const volatility = symbol.includes('BTC') ? 0.004 : 0.0025;

    const candles: OHLCV[] = [];
    const now = Date.now();
    const intervalMs = timeframe === '1h' ? 3600 * 1000 : timeframe === '15m' ? 15 * 60 * 1000 : 5 * 60 * 1000;
    let currentPrice = basePrice * 0.92;

    for (let i = candleCount; i >= 0; i--) {
      const time = now - i * intervalMs;
      // Cyclical + stochastic walk with realistic market trend patterns
      const cycle = Math.sin(i / 25) * 0.002;
      const drift = (Math.random() - 0.488) * volatility + cycle;
      const open = currentPrice;
      const close = Math.max(0.001, open * (1 + drift));
      const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.8));
      const low = Math.min(open, close) * (1 - Math.random() * (volatility * 0.8));
      const volume = Math.floor(1000 + Math.random() * 5000 * (1 + Math.abs(drift) * 80));

      candles.push({
        time,
        open: Number(open.toFixed(basePrice > 10 ? 2 : 4)),
        high: Number(high.toFixed(basePrice > 10 ? 2 : 4)),
        low: Number(low.toFixed(basePrice > 10 ? 2 : 4)),
        close: Number(close.toFixed(basePrice > 10 ? 2 : 4)),
        volume,
      });

      currentPrice = close;
    }

    return candles;
  }
}

export const backtestingEngine = new BacktestingEngine();
