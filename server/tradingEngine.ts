import { db } from './db';
import { marketDataService } from './marketData';
import { getStrategyById } from './strategies';
import { riskEngine } from './riskEngine';
import { executionEngine } from './executionEngine';
import { geminiService } from './geminiService';
import { TradingSignal, BotState } from '../src/types';

export class TradingEngine {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessingTick = false;
  private sseClients: Set<(data: string) => void> = new Set();

  public start() {
    if (this.intervalTimer) return;
    db.botState.isRunning = true;
    db.botState.status = 'ONLINE';
    db.addAuditLog('SYSTEM', 'BOT_STARTED', 'Autonomous Trading Engine initialized tick loop (1,500ms interval).', 'INFO');

    this.intervalTimer = setInterval(() => {
      this.tickCycle();
    }, 1500);
  }

  public pause() {
    db.botState.isRunning = false;
    db.botState.status = 'PAUSED';
    db.addAuditLog('SYSTEM', 'BOT_PAUSED', 'Autonomous Trading Engine paused. Existing positions monitored, new orders halted.', 'WARN');
    this.broadcastState();
  }

  public stop() {
    db.botState.isRunning = false;
    db.botState.status = 'STOPPED';
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    db.addAuditLog('SYSTEM', 'BOT_STOPPED', 'Autonomous Trading Engine stopped.', 'WARN');
    this.broadcastState();
  }

  public triggerKillSwitch(reason: string = 'User initiated emergency kill switch') {
    db.riskSettings.killSwitchActive = true;
    db.riskSettings.killSwitchTriggerReason = reason;
    db.botState.status = 'KILL_SWITCH_ENGAGED';
    db.botState.activeRiskLevel = 'CRITICAL';
    db.botState.isRunning = false;

    db.addNotification('KILL_SWITCH', 'EMERGENCY KILL SWITCH ENGAGED', reason, 'danger');
    db.addAuditLog('KILL_SWITCH', 'ENGAGED', reason, 'CRITICAL');

    if (db.riskSettings.closePositionsOnKillSwitch) {
      executionEngine.emergencyCloseAllPositions(db.botState.environment);
    }

    this.broadcastState();
  }

  public resetKillSwitch() {
    db.riskSettings.killSwitchActive = false;
    db.riskSettings.killSwitchTriggerReason = undefined;
    db.botState.status = 'PAUSED';
    db.botState.activeRiskLevel = 'SAFE';
    db.addAuditLog('KILL_SWITCH', 'RESET', 'Kill switch manually reset. Bot in paused state ready for restart.', 'INFO');
    db.addNotification('SYSTEM', 'Kill Switch Reset', 'Trading engine risk lock cleared. You may now resume trading.', 'info');
    this.broadcastState();
  }

  public addSSEClient(client: (data: string) => void) {
    this.sseClients.add(client);
    // Send immediate snapshot
    client(JSON.stringify(this.getSnapshot()));
  }

  public removeSSEClient(client: (data: string) => void) {
    this.sseClients.delete(client);
  }

  public broadcastState() {
    const payload = JSON.stringify(this.getSnapshot());
    for (const send of this.sseClients) {
      try {
        send(payload);
      } catch (err) {
        // remove stale client
      }
    }
  }

  public getSnapshot() {
    return {
      type: 'TICK_UPDATE',
      timestamp: Date.now(),
      botState: db.botState,
      portfolio: db.portfolio,
      positions: db.positions,
      orders: db.orders.slice(0, 30),
      tradesHistory: db.tradesHistory.slice(0, 30),
      signals: db.signals.slice(0, 15),
      notifications: db.notifications.slice(0, 20),
      assets: marketDataService.getAllAssets(),
      riskSettings: db.riskSettings,
      brokerAccounts: db.brokerAccounts,
    };
  }

  private async tickCycle() {
    if (this.isProcessingTick) return;
    this.isProcessingTick = true;

    try {
      // 1. Advance market prices
      const assetsMap = marketDataService.tick();
      db.botState.lastTickTimestamp = Date.now();

      // 2. Monitor and adjust open positions (P&L, SL, TP, Trailing Stops)
      this.monitorPositions(assetsMap);

      // 3. If bot is online and kill switch is NOT active, evaluate strategy signals
      if (db.botState.isRunning && !db.riskSettings.killSwitchActive) {
        await this.evaluateSignals(assetsMap);
      }

      // 4. Update portfolio summary
      this.updatePortfolioMetrics();

      // 5. Broadcast to real-time clients
      this.broadcastState();
    } catch (err) {
      console.error('Trading Engine Tick Error:', err);
    } finally {
      this.isProcessingTick = false;
    }
  }

  private monitorPositions(assetsMap: Map<string, any>) {
    const priceMap = new Map<string, number>();
    for (const [sym, asset] of assetsMap.entries()) {
      priceMap.set(sym, asset.currentPrice);
    }

    // Trailing stop updates
    if (db.riskSettings.trailingStopEnabled) {
      db.positions = riskEngine.updateTrailingStops(db.positions, priceMap, db.riskSettings.trailingStopPercent);
    }

    // Check SL / TP for each open position
    for (let i = db.positions.length - 1; i >= 0; i--) {
      const pos = db.positions[i];
      const asset = assetsMap.get(pos.symbol);
      if (!asset) continue;

      const currentPrice = asset.currentPrice;
      pos.currentPrice = currentPrice;

      // Update unrealized P&L
      const isLong = pos.side === 'LONG';
      const rawPnl = isLong ? (currentPrice - pos.entryPrice) * pos.size : (pos.entryPrice - currentPrice) * pos.size;
      pos.unrealizedPnl = Number(rawPnl.toFixed(2));
      pos.unrealizedPnlPercent = Number(((rawPnl / pos.sizeUsd) * 100).toFixed(2));

      // Stop Loss Trigger
      if (isLong && currentPrice <= pos.stopLossPrice) {
        executionEngine.closePosition(pos.id, currentPrice, 'STOP_LOSS', db.botState.environment);
        continue;
      } else if (!isLong && currentPrice >= pos.stopLossPrice) {
        executionEngine.closePosition(pos.id, currentPrice, 'STOP_LOSS', db.botState.environment);
        continue;
      }

      // Take Profit Trigger
      if (isLong && currentPrice >= pos.takeProfitPrice) {
        executionEngine.closePosition(pos.id, currentPrice, 'TAKE_PROFIT', db.botState.environment);
        continue;
      } else if (!isLong && currentPrice <= pos.takeProfitPrice) {
        executionEngine.closePosition(pos.id, currentPrice, 'TAKE_PROFIT', db.botState.environment);
        continue;
      }
    }
  }

  private async evaluateSignals(assetsMap: Map<string, any>) {
    const activeStrategy = getStrategyById(db.botState.activeStrategyId);
    db.botState.activeStrategyName = activeStrategy.config.name;

    for (const symbol of db.botState.selectedAssets) {
      const asset = assetsMap.get(symbol);
      if (!asset) continue;

      // Check if position already exists
      const existingPos = db.positions.find((p) => p.symbol === symbol);
      if (existingPos) continue;

      // Generate raw strategy signal
      const signalResult = activeStrategy.generateSignal(
        asset.history,
        asset.indicators,
        asset.currentRegime,
        db.riskSettings
      );

      if (signalResult.direction === 'HOLD' || signalResult.confidenceScore < 65) {
        continue;
      }

      // Construct Signal object
      const signalId = `sig_${symbol.replace('/', '_')}_${Date.now()}`;
      const proposedSignal: TradingSignal = {
        id: signalId,
        timestamp: Date.now(),
        assetSymbol: symbol,
        direction: signalResult.direction,
        strategyId: activeStrategy.config.id,
        strategyName: activeStrategy.config.name,
        marketRegime: asset.currentRegime,
        confidenceScore: signalResult.confidenceScore,
        entryPrice: signalResult.entryPrice,
        suggestedStopLoss: signalResult.suggestedStopLoss,
        suggestedTakeProfit: signalResult.suggestedTakeProfit,
        riskRewardRatio: Number((Math.abs(signalResult.suggestedTakeProfit - signalResult.entryPrice) / Math.max(0.01, Math.abs(signalResult.entryPrice - signalResult.suggestedStopLoss))).toFixed(2)),
        recommendedPositionSizeUsd: 0,
        reasons: signalResult.reasons,
        passedRiskChecks: false,
      };

      // Run AI/ML Signal Analysis
      try {
        const aiAnalysis = await geminiService.analyzeTradeSignal(proposedSignal, asset, asset.indicators);
        proposedSignal.aiAnalysis = {
          summary: aiAnalysis.summary,
          anomalyDetected: aiAnalysis.anomalyDetected,
          anomalyNote: aiAnalysis.anomalyNote,
          macroContext: aiAnalysis.macroContext,
          tradeQualityGrade: aiAnalysis.tradeQualityGrade,
        };
      } catch (err) {
        console.warn('AI analysis skipped for tick:', err);
      }

      // Risk Engine Validation & Dynamic Sizing
      const riskValidation = riskEngine.validateAndSizeTrade(
        proposedSignal,
        db.portfolio,
        db.positions,
        db.riskSettings
      );

      proposedSignal.passedRiskChecks = riskValidation.passed;
      proposedSignal.recommendedPositionSizeUsd = riskValidation.calculatedPositionSizeUsd;
      proposedSignal.riskRejectionReason = riskValidation.rejectionReason;

      db.signals.unshift(proposedSignal);
      if (db.signals.length > 50) db.signals.pop();

      // Execution routing
      if (riskValidation.passed) {
        if (db.botState.mode === 'fully-automatic' || (db.botState.mode === 'semi-automatic' && proposedSignal.confidenceScore >= 78)) {
          executionEngine.executeSignalTrade(
            proposedSignal,
            riskValidation,
            db.botState.environment,
            db.botState.mode
          );
        } else {
          db.addNotification(
            'TRADE_OPEN',
            `Signal Pending Approval: ${symbol}`,
            `${proposedSignal.direction} signal generated by ${activeStrategy.config.name} (${proposedSignal.confidenceScore}% confidence). Click to confirm.`,
            'info'
          );
        }
      } else {
        db.addAuditLog('RISK', 'SIGNAL_REJECTED_BY_RISK_ENGINE', `${symbol} ${proposedSignal.direction}: ${riskValidation.rejectionReason}`, 'WARN');
      }
    }
  }

  private updatePortfolioMetrics() {
    let totalUnrealized = 0;
    let totalExposure = 0;

    for (const pos of db.positions) {
      totalUnrealized += pos.unrealizedPnl;
      totalExposure += pos.sizeUsd;
    }

    db.portfolio.unrealizedPnl = Number(totalUnrealized.toFixed(2));
    db.portfolio.currentExposureUsd = Number(totalExposure.toFixed(2));
    db.portfolio.totalEquity = Number((db.portfolio.cashBalance + totalExposure + totalUnrealized).toFixed(2));
    db.portfolio.currentExposurePercent = db.portfolio.totalEquity > 0 ? Number(((totalExposure / db.portfolio.totalEquity) * 100).toFixed(2)) : 0;

    // Peak equity check
    if (db.portfolio.totalEquity > db.portfolio.peakEquity) {
      db.portfolio.peakEquity = db.portfolio.totalEquity;
    }
    const drawdown = db.portfolio.peakEquity > 0 ? ((db.portfolio.peakEquity - db.portfolio.totalEquity) / db.portfolio.peakEquity) * 100 : 0;
    db.portfolio.currentDrawdownPercent = Number(Math.max(0, drawdown).toFixed(2));
    db.portfolio.maxDrawdownPercent = Number(Math.max(db.portfolio.maxDrawdownPercent, db.portfolio.currentDrawdownPercent).toFixed(2));

    // Dynamic risk level indicator
    if (db.riskSettings.killSwitchActive || db.portfolio.currentDrawdownPercent > 10) {
      db.botState.activeRiskLevel = 'CRITICAL';
    } else if (db.portfolio.currentDrawdownPercent > 6 || db.portfolio.currentExposurePercent > 70) {
      db.botState.activeRiskLevel = 'ELEVATED';
    } else if (db.portfolio.currentExposurePercent > 35) {
      db.botState.activeRiskLevel = 'MODERATE';
    } else {
      db.botState.activeRiskLevel = 'SAFE';
    }
  }
}

export const tradingEngine = new TradingEngine();
