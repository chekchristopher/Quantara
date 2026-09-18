import { db } from './db';
import { marketDataService } from './marketData';
import { getStrategyById } from './strategies';
import { riskEngine } from './riskEngine';
import { executionEngine } from './executionEngine';
import { geminiService } from './geminiService';
import { TradingSignal, BotState, OfflineTradeRecord, OfflineSessionStats } from '../src/types';

export class TradingEngine {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessingTick = false;
  private sseClients: Set<(data: string) => void> = new Set();
  private tickCounter = 0;

  // 24/7 Offline Wealth Engine tracking
  private offlineTradeRecords: OfflineTradeRecord[] = [];
  private offlineStartTime: number = Date.now();
  private offlineStartBalance: number = 0;

  constructor() {
    // Connect execution engine closed trade listener to record wealth generated while offline
    executionEngine.onTradeClosed = (closedItem) => {
      if (this.isUserOffline()) {
        this.recordOfflineTrade({
          id: closedItem.id,
          symbol: closedItem.symbol,
          side: closedItem.side,
          entryPrice: closedItem.entryPrice,
          exitPrice: closedItem.exitPrice,
          quantity: closedItem.quantity,
          realizedPnl: closedItem.realizedPnl,
          realizedPnlPercent: closedItem.realizedPnlPercent,
          exitReason: closedItem.exitReason,
          exitTime: closedItem.exitTime,
          strategyName: closedItem.strategyName,
          accountName: closedItem.accountName,
        });
      }
    };
  }

  public isUserOffline(): boolean {
    return this.sseClients.size === 0;
  }

  public recordOfflineTrade(trade: OfflineTradeRecord) {
    this.offlineTradeRecords.unshift(trade);
    if (this.offlineTradeRecords.length > 50) this.offlineTradeRecords.pop();

    const now = Date.now();
    const durationSec = Math.max(1, Math.round((now - this.offlineStartTime) / 1000));
    const totalPnl = Number(this.offlineTradeRecords.reduce((acc, t) => acc + t.realizedPnl, 0).toFixed(2));
    const wins = this.offlineTradeRecords.filter((t) => t.realizedPnl > 0).length;
    const losses = this.offlineTradeRecords.filter((t) => t.realizedPnl <= 0).length;

    const activeServerNames = db.brokerAccounts
      .filter((a) => a.serverStatus === 'RUNNING' || a.isActiveForTakeover)
      .map((a) => `${a.name} (${a.server || 'MT5 Live'})`);

    db.offlineSessionStats = {
      hasUnseenReport: true,
      wentOfflineAt: this.offlineStartTime,
      returnedAt: now,
      offlineDurationSeconds: durationSec,
      tradesExecutedOffline: this.offlineTradeRecords.length,
      realizedPnlOffline: totalPnl,
      winningTradesOffline: wins,
      losingTradesOffline: losses,
      startingBalance: this.offlineStartBalance || (db.portfolio.cashBalance - totalPnl),
      endingBalance: db.portfolio.cashBalance,
      trades: [...this.offlineTradeRecords],
      activeServerAccounts: activeServerNames.length > 0 ? activeServerNames : ['Quantara Autonomous Server Node #1'],
    };

    db.persistEngineState();
    db.persistAccounts();
  }

  public dismissOfflineReport() {
    if (db.offlineSessionStats) {
      db.offlineSessionStats.hasUnseenReport = false;
      this.offlineTradeRecords = [];
      db.persistEngineState();
    }
  }

  public start() {
    if (this.intervalTimer) return;
    if (db.brokerAccounts && db.brokerAccounts.length > 0) {
      const active = db.brokerAccounts.find((a) => a.isActiveForTakeover) || db.brokerAccounts[0];
      const shouldRun = active ? active.serverStatus !== 'STOPPED' && active.serverStatus !== 'PAUSED' : true;
      db.botState.isRunning = shouldRun;
      db.botState.status = shouldRun ? 'ONLINE' : (active?.serverStatus === 'PAUSED' ? 'PAUSED' : 'STOPPED');
      db.botState.serverEngineStatus = active?.serverStatus || (shouldRun ? 'RUNNING' : 'STOPPED');
      db.botState.isNonStopLoop = true;
      db.addAuditLog('SYSTEM', 'SERVER_LOOP_ENGAGED', `Autonomous 24/7 Server Engine initialized tick loop (1,500ms interval). Running non-stop for ${db.brokerAccounts.length} connected account(s).`, 'INFO');
    } else {
      db.botState.isRunning = false;
      db.botState.status = 'AWAITING_BROKER_CONNECTION';
      db.botState.serverEngineStatus = 'STOPPED';
      db.botState.isNonStopLoop = false;
      db.addAuditLog('SYSTEM', 'BOT_STANDBY', 'Autonomous Trading Engine standing by. Awaiting MT5 broker account connection.', 'INFO');
    }

    this.intervalTimer = setInterval(() => {
      this.tickCycle();
    }, 1500);
  }

  public pause() {
    db.botState.isRunning = false;
    db.botState.status = 'PAUSED';
    db.botState.serverEngineStatus = 'PAUSED';
    const active = db.brokerAccounts.find((a) => a.isActiveForTakeover);
    if (active) active.serverStatus = 'PAUSED';
    db.persistAccounts();
    db.addAuditLog('SYSTEM', 'BOT_PAUSED', 'Autonomous Trading Engine paused. Existing positions monitored, new orders halted.', 'WARN');
    this.broadcastState();
  }

  public resume() {
    db.botState.isRunning = true;
    db.botState.status = 'ONLINE';
    db.botState.serverEngineStatus = 'RUNNING';
    db.botState.isNonStopLoop = true;
    const active = db.brokerAccounts.find((a) => a.isActiveForTakeover);
    if (active) active.serverStatus = 'RUNNING';
    db.persistAccounts();
    db.addAuditLog('SYSTEM', 'BOT_RESUMED', 'Autonomous Trading Engine resumed non-stop 24/7 execution.', 'INFO');
    this.broadcastState();
  }

  public stop() {
    db.botState.isRunning = false;
    db.botState.status = 'STOPPED';
    db.botState.serverEngineStatus = 'STOPPED';
    const active = db.brokerAccounts.find((a) => a.isActiveForTakeover);
    if (active) active.serverStatus = 'STOPPED';
    db.persistAccounts();
    db.addAuditLog('SYSTEM', 'BOT_STOPPED', 'Autonomous Trading Engine stopped by operator command.', 'WARN');
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
    const wasOffline = this.sseClients.size === 0;
    this.sseClients.add(client);

    // If user was offline and trades happened during offline period, finalize offline session stats
    if (wasOffline && this.offlineTradeRecords.length > 0) {
      const now = Date.now();
      const durationSec = Math.max(1, Math.round((now - this.offlineStartTime) / 1000));
      const totalPnl = Number(this.offlineTradeRecords.reduce((acc, t) => acc + t.realizedPnl, 0).toFixed(2));
      const wins = this.offlineTradeRecords.filter((t) => t.realizedPnl > 0).length;
      const losses = this.offlineTradeRecords.filter((t) => t.realizedPnl <= 0).length;

      const activeServerNames = db.brokerAccounts
        .filter((a) => a.serverStatus === 'RUNNING' || a.isActiveForTakeover)
        .map((a) => `${a.name} (${a.server || 'MT5 Live'})`);

      db.offlineSessionStats = {
        hasUnseenReport: true,
        wentOfflineAt: this.offlineStartTime,
        returnedAt: now,
        offlineDurationSeconds: durationSec,
        tradesExecutedOffline: this.offlineTradeRecords.length,
        realizedPnlOffline: totalPnl,
        winningTradesOffline: wins,
        losingTradesOffline: losses,
        startingBalance: this.offlineStartBalance || (db.portfolio.cashBalance - totalPnl),
        endingBalance: db.portfolio.cashBalance,
        trades: [...this.offlineTradeRecords],
        activeServerAccounts: activeServerNames.length > 0 ? activeServerNames : ['Quantara Autonomous Server Node #1'],
      };

      db.addNotification(
        'TRADE_CLOSE',
        '24/7 Autonomous Wealth Generated',
        `While you were away, the engine executed ${this.offlineTradeRecords.length} trades generating ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} net profit on your connected broker.`,
        'success'
      );

      db.addAuditLog(
        'TRADE',
        'USER_RECONNECTED_WITH_OFFLINE_PROFITS',
        `User reconnected after ${Math.round(durationSec / 60)}m offline. Engine generated ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)} across ${this.offlineTradeRecords.length} automated executions.`,
        'INFO'
      );

      db.persistEngineState();
    }

    // Send immediate snapshot
    client(JSON.stringify(this.getSnapshot()));
  }

  public removeSSEClient(client: (data: string) => void) {
    this.sseClients.delete(client);
    if (this.sseClients.size === 0) {
      // User is now offline! Mark start of offline wealth tracking
      this.offlineStartTime = Date.now();
      this.offlineStartBalance = db.portfolio.cashBalance;
      this.offlineTradeRecords = [];
      db.addAuditLog(
        'SYSTEM',
        'CLIENT_OFFLINE_247_PERSISTENCE',
        'All client browser sessions disconnected. Autonomous trading engine continuing 24/7 non-stop execution on connected server accounts.',
        'INFO'
      );
    }
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
      botState: {
        ...db.botState,
        offlineSessionStats: db.offlineSessionStats,
      },
      portfolio: db.portfolio,
      positions: db.positions,
      orders: db.orders.slice(0, 30),
      tradesHistory: db.tradesHistory.slice(0, 30),
      signals: db.signals.slice(0, 15),
      notifications: db.notifications.slice(0, 20),
      assets: marketDataService.getAllAssets(),
      riskSettings: db.riskSettings,
      brokerAccounts: db.brokerAccounts,
      offlineSessionStats: db.offlineSessionStats,
    };
  }

  private async tickCycle() {
    if (this.isProcessingTick) return;
    this.isProcessingTick = true;
    this.tickCounter++;

    try {
      // 1. Advance market prices
      const assetsMap = marketDataService.tick();
      db.botState.lastTickTimestamp = Date.now();

      // Periodic state persistence every ~30 seconds (20 ticks)
      if (this.tickCounter % 20 === 0) {
        db.persistEngineState();
        db.persistAccounts();
      }

      // Advance server uptime and active accounts uptime (24/7 non-stop loop)
      if (db.botState.isRunning) {
        db.botState.serverUptimeSeconds = (db.botState.serverUptimeSeconds || 0) + 1.5;
        for (const acc of db.brokerAccounts) {
          if (acc.serverStatus === 'RUNNING' || !acc.serverStatus) {
            acc.uptimeSeconds = (acc.uptimeSeconds || 0) + 1.5;
            acc.lastExecutionTick = Date.now();
          }
        }
      }

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

    // Check SL / TP & Dynamic Breakeven for each open position
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

      // Breakeven Lock-in: When position moves +1.2R into profit, lock stop-loss to entry price
      const initialRiskDistance = Math.abs(pos.entryPrice - (pos.stopLossPrice || pos.entryPrice * 0.98));
      if (initialRiskDistance > 0 && rawPnl > initialRiskDistance * pos.size * 1.2) {
        const breakEvenPrice = isLong ? pos.entryPrice * 1.001 : pos.entryPrice * 0.999;
        const needsUpdate = isLong ? pos.stopLossPrice < breakEvenPrice : pos.stopLossPrice > breakEvenPrice;
        if (needsUpdate) {
          pos.stopLossPrice = Number(breakEvenPrice.toFixed(pos.entryPrice > 10 ? 2 : 4));
          db.addNotification(
            'SYSTEM',
            `Break-Even Protection Locked: ${pos.symbol}`,
            `Position reached +1.2R profit target. Stop-loss dynamically moved to entry ($${pos.stopLossPrice.toFixed(2)}) to guarantee 0 risk of capital loss.`,
            'info'
          );
        }
      }

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
      } catch (err: any) {
        // Fallback already handled inside geminiService; keep execution uninterrupted
      }

      // Asymmetric risk-reward filter (only trade high expectancy setups for small capital growth)
      if (db.botState.asymmetricFilterEnabled && (proposedSignal.riskRewardRatio < 2.0 || proposedSignal.confidenceScore < 70)) {
        continue;
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

      // Execution routing: autonomous software takeover or automatic mode executes immediately
      if (riskValidation.passed) {
        const canExecuteAutonomously = db.botState.autonomousTakeover || db.botState.mode === 'fully-automatic' || (db.botState.mode === 'semi-automatic' && proposedSignal.confidenceScore >= 76);
        if (canExecuteAutonomously) {
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
    if (db.brokerAccounts.length === 0) {
      db.portfolio.totalEquity = 0;
      db.portfolio.cashBalance = 0;
      db.portfolio.unrealizedPnl = 0;
      db.portfolio.currentExposureUsd = 0;
      db.portfolio.currentExposurePercent = 0;
      db.portfolio.currentDrawdownPercent = 0;
      return;
    }

    let totalUnrealized = 0;
    let totalExposure = 0;

    for (const pos of db.positions) {
      totalUnrealized += pos.unrealizedPnl;
      totalExposure += pos.sizeUsd;
    }

    db.portfolio.unrealizedPnl = Number(totalUnrealized.toFixed(2));
    db.portfolio.currentExposureUsd = Number(totalExposure.toFixed(2));
    db.portfolio.totalEquity = Number((db.portfolio.cashBalance + totalUnrealized).toFixed(2));
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
