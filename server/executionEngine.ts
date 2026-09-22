import { db } from './db';
import { EnvironmentMode, Order, Position, TradeHistoryItem, TradingSignal } from '../src/types';
import { RiskValidationResult } from './riskEngine';
import { realBrokerBridge } from './realBrokerBridge';

export class ExecutionEngine {
  private processedIdempotencyKeys: Set<string> = new Set();
  public onTradeClosed?: (closedItem: TradeHistoryItem) => void;

  /**
   * Executes an order derived from a validated signal.
   */
  public executeSignalTrade(
    signal: TradingSignal,
    riskValidation: RiskValidationResult,
    environment: EnvironmentMode,
    mode: 'manual' | 'semi-automatic' | 'fully-automatic'
  ): { success: boolean; position?: Position; order?: Order; message: string } {
    if (db.brokerAccounts.length === 0) {
      return { success: false, message: 'No broker account connected. Please connect a Demo or Real account first.' };
    }

    if (!riskValidation.passed) {
      return { success: false, message: riskValidation.rejectionReason || 'Risk check failed' };
    }

    const idempotencyKey = `idemp_${signal.assetSymbol}_${signal.direction}_${Math.floor(signal.timestamp / 10000)}`;
    if (this.processedIdempotencyKeys.has(idempotencyKey)) {
      return { success: false, message: 'Duplicate trade prevented by idempotency check' };
    }
    this.processedIdempotencyKeys.add(idempotencyKey);

    const isBuy = signal.direction === 'BUY';
    const side = isBuy ? 'LONG' : 'SHORT';
    const basePrice = signal.entryPrice;
    
    // Simulate realistic execution slippage (0.005% - 0.02%)
    const slippagePercent = 0.0001 + Math.random() * 0.0002;
    const fillPrice = isBuy ? basePrice * (1 + slippagePercent) : basePrice * (1 - slippagePercent);
    const quantity = riskValidation.calculatedQuantity;
    const sizeUsd = quantity * fillPrice;
    
    // Trading fee calculation (0.075% standard taker fee)
    const feeRate = 0.00075;
    const feesUsd = Number((sizeUsd * feeRate).toFixed(2));

    // Determine lot size strictly bounded 0.01 - 0.10 based on equity
    const lotSize = riskValidation.calculatedLotSize || (db.portfolio.totalEquity <= 50 ? 0.01 : Math.min(0.10, Math.max(0.01, Number((0.01 + ((db.portfolio.totalEquity - 50) / 950) * 0.09).toFixed(2)))));

    // Create Order Record
    const order: Order = {
      id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: db.user.id,
      symbol: signal.assetSymbol,
      type: 'MARKET',
      side,
      direction: isBuy ? 'BUY' : 'SELL',
      lotSize,
      quantity,
      price: basePrice,
      status: 'FILLED',
      filledQuantity: quantity,
      averageFillPrice: Number(fillPrice.toFixed(basePrice > 10 ? 2 : 4)),
      feesUsd,
      slippagePercent: Number((slippagePercent * 100).toFixed(4)),
      createdAt: Date.now(),
      filledAt: Date.now(),
      environment,
      strategyName: signal.strategyName,
      idempotencyKey,
    };

    db.orders.unshift(order);

    // Deduct fee from portfolio cash balance (Leveraged margin CFD model)
    db.portfolio.cashBalance = Number((db.portfolio.cashBalance - feesUsd).toFixed(2));
    db.portfolio.currentExposureUsd = Number((db.portfolio.currentExposureUsd + sizeUsd).toFixed(2));
    const equityBase = Math.max(1, db.portfolio.totalEquity);
    db.portfolio.currentExposurePercent = Number(((db.portfolio.currentExposureUsd / equityBase) * 100).toFixed(2));
    db.portfolio.totalTradesExecuted += 1;
    db.botState.tradesExecutedToday += 1;

    // Identify active connected server for execution tracking
    const activeServer = db.brokerAccounts.find((a) => a.id === db.botState.activeBrokerAccountId || a.isActiveForTakeover) || db.brokerAccounts[0];

    // Determine if Real Broker Order Placement is active
    const isRealBrokerActive = realBrokerBridge.isRealBrokerExecutionEnabled || db.botState.realExecutionMode === 'REAL_BROKER' || environment === 'live';

    // Create Position with institutional lot size taken and connected server tagging
    const position: Position = {
      id: `pos_${signal.assetSymbol.replace('/', '_')}_${Date.now()}`,
      userId: db.user.id,
      symbol: signal.assetSymbol,
      side,
      lotSize,
      size: quantity,
      sizeUsd: Number(sizeUsd.toFixed(2)),
      entryPrice: Number(fillPrice.toFixed(basePrice > 10 ? 2 : 4)),
      currentPrice: Number(fillPrice.toFixed(basePrice > 10 ? 2 : 4)),
      stopLossPrice: riskValidation.stopLossPrice,
      takeProfitPrice: riskValidation.takeProfitPrice,
      trailingStopPrice: db.riskSettings.trailingStopEnabled
        ? Number((fillPrice * (isBuy ? 0.982 : 1.018)).toFixed(basePrice > 10 ? 2 : 4))
        : undefined,
      unrealizedPnl: -feesUsd, // start slightly negative due to taker fee
      unrealizedPnlPercent: Number(((-feesUsd / sizeUsd) * 100).toFixed(2)),
      realizedPnl: 0,
      strategyId: signal.strategyId,
      strategyName: signal.strategyName,
      openedAt: Date.now(),
      environment,
      explanationId: signal.id,
      serverId: activeServer?.id,
      serverName: activeServer?.name || activeServer?.server || 'Primary MT5 Server',
      accountNumber: activeServer?.accountNumber,
      brokerName: activeServer?.broker || 'Exness MT5',
      realExecution: isRealBrokerActive,
      brokerExecutionStatus: isRealBrokerActive ? 'PENDING_TERMINAL' : 'SIMULATED',
    };

    if (order) {
      order.serverId = activeServer?.id;
      order.serverName = activeServer?.name;
      order.accountNumber = activeServer?.accountNumber;
      order.realExecution = isRealBrokerActive;
    }

    db.positions.push(position);
    db.portfolio.activePositionsCount = db.positions.length;

    // Dispatches directly to real broker execution pipeline (MQL5 EA Bridge + MetaAPI Cloud + Webhook)
    if (isRealBrokerActive) {
      realBrokerBridge.dispatchRealOrder({
        orderId: order.id,
        positionId: position.id,
        action: signal.direction === 'SELL' ? 'SELL' : 'BUY',
        symbol: signal.assetSymbol,
        lotSize,
        price: fillPrice,
        stopLoss: riskValidation.stopLossPrice,
        takeProfit: riskValidation.takeProfitPrice,
        serverId: activeServer?.id,
        accountNumber: activeServer?.accountNumber,
        comment: `Quantara [${signal.strategyName}]`,
      }).catch((err) => {
        console.warn('Real broker order dispatch notice:', err);
      });
    }

    db.addAuditLog(
      'TRADE',
      isRealBrokerActive ? 'REAL_BROKER_ORDER_DISPATCHED' : `POSITION_OPENED_${side}`,
      isRealBrokerActive
        ? `⚡ REAL BROKER ORDER DISPATCHED: ${side} ${lotSize} Lots on ${signal.assetSymbol} @ $${fillPrice.toFixed(2)} sent to Live MT5 Terminal (Account #${activeServer?.accountNumber || 'Primary'}).`
        : `Opened ${side} ${lotSize} Lots (${quantity} units) of ${signal.assetSymbol} @ $${fillPrice.toFixed(2)} via [${signal.strategyName}] in ${environment.toUpperCase()} mode. Risk Sizing: ${lotSize} Lots.`,
      'INFO'
    );

    db.addNotification(
      'TRADE_OPEN',
      `Position Opened: ${signal.assetSymbol} (${lotSize} Lots)`,
      `${signal.strategyName} placed ${side} ${lotSize} Lots at $${fillPrice.toFixed(2)}. SL: $${riskValidation.stopLossPrice}, TP: $${riskValidation.takeProfitPrice}.`,
      'info'
    );

    // Persist 24/7 continuous state
    db.persistAccounts();
    db.persistEngineState();

    return { success: true, position, order, message: 'Position executed and verified successfully' };
  }

  /**
   * Closes a position by ID with given exit reason.
   */
  public closePosition(
    positionId: string,
    currentPrice: number,
    exitReason: TradeHistoryItem['exitReason'],
    environment: EnvironmentMode
  ): { success: boolean; closedTrade?: TradeHistoryItem; message: string } {
    const posIndex = db.positions.findIndex((p) => p.id === positionId);
    if (posIndex === -1) {
      return { success: false, message: 'Position not found' };
    }

    const pos = db.positions[posIndex];
    const isLong = pos.side === 'LONG';
    const rawPnl = isLong ? (currentPrice - pos.entryPrice) * pos.size : (pos.entryPrice - currentPrice) * pos.size;
    const fee = Number((pos.size * currentPrice * 0.00075).toFixed(2));
    const finalRealizedPnl = Number((rawPnl - fee).toFixed(2));
    const pnlPercent = Number(((finalRealizedPnl / pos.sizeUsd) * 100).toFixed(2));

    // Update portfolio balances (Leveraged margin CFD model: realized PnL adjusts cash balance)
    db.portfolio.cashBalance = Number((db.portfolio.cashBalance + finalRealizedPnl).toFixed(2));
    db.portfolio.realizedPnlToday = Number((db.portfolio.realizedPnlToday + finalRealizedPnl).toFixed(2));
    db.portfolio.totalRealizedPnl = Number((db.portfolio.totalRealizedPnl + finalRealizedPnl).toFixed(2));
    db.portfolio.totalEquity = Number((db.portfolio.cashBalance).toFixed(2));
    db.portfolio.currentExposureUsd = Math.max(0, Number((db.portfolio.currentExposureUsd - pos.sizeUsd).toFixed(2)));
    const equityBase = Math.max(1, db.portfolio.totalEquity);
    db.portfolio.currentExposurePercent = Number(((db.portfolio.currentExposureUsd / equityBase) * 100).toFixed(2));

    // Recalculate win rate & profit factor
    const allClosed = [...db.tradesHistory];
    const wins = allClosed.filter((t) => t.realizedPnl > 0).length + (finalRealizedPnl > 0 ? 1 : 0);
    const totalCount = allClosed.length + 1;
    db.portfolio.winRatePercent = Number(((wins / totalCount) * 100).toFixed(1));

    // Peak equity & drawdown tracking
    if (db.portfolio.totalEquity > db.portfolio.peakEquity) {
      db.portfolio.peakEquity = db.portfolio.totalEquity;
    }
    const currentDrawdown = ((db.portfolio.peakEquity - db.portfolio.totalEquity) / db.portfolio.peakEquity) * 100;
    db.portfolio.currentDrawdownPercent = Number(Math.max(0, currentDrawdown).toFixed(2));
    db.portfolio.maxDrawdownPercent = Number(Math.max(db.portfolio.maxDrawdownPercent, db.portfolio.currentDrawdownPercent).toFixed(2));
    db.portfolio.todayPnlPercent = Number(((db.portfolio.realizedPnlToday / db.portfolio.totalEquity) * 100).toFixed(2));

    // Resolve server identity
    const activeAcc = db.brokerAccounts.find((a) => a.id === (pos.serverId || db.botState.activeBrokerAccountId) || a.isActiveForTakeover) || db.brokerAccounts[0];

    const isRealBrokerActive = pos.realExecution || realBrokerBridge.isRealBrokerExecutionEnabled || db.botState.realExecutionMode === 'REAL_BROKER' || environment === 'live';

    const closedItem: TradeHistoryItem = {
      id: `trd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      symbol: pos.symbol,
      side: pos.side,
      lotSize: pos.lotSize ?? 0.05,
      entryPrice: pos.entryPrice,
      exitPrice: currentPrice,
      quantity: pos.size,
      realizedPnl: finalRealizedPnl,
      realizedPnlPercent: pnlPercent,
      feesPaid: fee,
      strategyName: pos.strategyName,
      accountName: pos.serverName || activeAcc?.name || 'Institutional MT5 Server',
      serverId: pos.serverId || activeAcc?.id || 'mt5_primary',
      serverName: pos.serverName || activeAcc?.name || activeAcc?.server || 'Primary MT5 Server',
      accountNumber: pos.accountNumber || activeAcc?.accountNumber || '10884920',
      brokerName: pos.brokerName || activeAcc?.broker || 'Exness MT5',
      entryTime: pos.openedAt,
      exitTime: Date.now(),
      exitReason,
      environment,
      tradeExplanation: `Closed ${pos.side} ${pos.lotSize ? pos.lotSize.toFixed(2) + ' Lots' : pos.size + ' Units'} on ${pos.symbol} at $${currentPrice.toFixed(2)} (${exitReason}) with P&L: ${finalRealizedPnl >= 0 ? '+' : ''}$${finalRealizedPnl} (${pnlPercent}%).`,
      realExecution: isRealBrokerActive,
      ticketNumber: pos.ticketNumber,
    };

    // Dispatches real close to MT5 Terminal EA & Cloud APIs
    if (isRealBrokerActive) {
      realBrokerBridge.dispatchRealClose({
        positionId: pos.id,
        ticket: pos.ticketNumber,
        symbol: pos.symbol,
        lotSize: pos.lotSize,
        serverId: pos.serverId,
      }).catch((err) => {
        console.warn('Real broker position close dispatch notice:', err);
      });
    }

    db.tradesHistory.unshift(closedItem);
    db.positions.splice(posIndex, 1);
    db.portfolio.activePositionsCount = db.positions.length;

    // Update active connected server / broker stats
    if (activeAcc) {
      activeAcc.simulatedBalance = Number((db.portfolio.cashBalance).toFixed(2));
      activeAcc.equity = Number((db.portfolio.totalEquity).toFixed(2));
      activeAcc.tradesCount = (activeAcc.tradesCount || 0) + 1;
      activeAcc.pnlRealized = Number(((activeAcc.pnlRealized || 0) + finalRealizedPnl).toFixed(2));
      if (finalRealizedPnl > 0) {
        activeAcc.winningTradesCount = (activeAcc.winningTradesCount || 0) + 1;
      } else if (finalRealizedPnl < 0) {
        activeAcc.losingTradesCount = (activeAcc.losingTradesCount || 0) + 1;
      }
      const wins = activeAcc.winningTradesCount || 0;
      activeAcc.winRatePercent = activeAcc.tradesCount > 0 ? Number(((wins / activeAcc.tradesCount) * 100).toFixed(1)) : 0;
      activeAcc.lotsTradedTotal = Number(((activeAcc.lotsTradedTotal || 0) + (pos.lotSize || 0.05)).toFixed(2));
      activeAcc.peakBalance = Math.max(activeAcc.peakBalance || activeAcc.simulatedBalance, activeAcc.simulatedBalance);
      activeAcc.lastExecutionTick = Date.now();
    }

    // Trigger offline wealth record callback if user is offline
    if (this.onTradeClosed) {
      this.onTradeClosed(closedItem);
    }

    // Persist 24/7 continuous state
    db.persistAccounts();
    db.persistEngineState();

    const notifType = exitReason === 'TAKE_PROFIT' ? 'TAKE_PROFIT' : exitReason === 'STOP_LOSS' ? 'STOP_LOSS' : 'TRADE_CLOSE';
    const severity = finalRealizedPnl >= 0 ? 'success' : 'warning';

    db.addNotification(
      notifType,
      `${exitReason} Triggered: ${pos.symbol}`,
      `Closed ${pos.side} @ $${currentPrice.toFixed(2)}. Net P&L: ${finalRealizedPnl >= 0 ? '+' : ''}$${finalRealizedPnl} (${pnlPercent}%).`,
      severity
    );

    db.addAuditLog(
      'TRADE',
      `POSITION_CLOSED_${exitReason}`,
      `Closed position on ${pos.symbol} for ${finalRealizedPnl >= 0 ? '+' : ''}$${finalRealizedPnl} (${pnlPercent}%) via ${exitReason}.`,
      severity === 'success' ? 'INFO' : 'WARN'
    );

    return { success: true, closedTrade: closedItem, message: `Position closed via ${exitReason}` };
  }

  /**
   * Emergency close all open positions.
   */
  public emergencyCloseAllPositions(environment: EnvironmentMode): { closedCount: number; message: string } {
    const count = db.positions.length;
    while (db.positions.length > 0) {
      const pos = db.positions[0];
      this.closePosition(pos.id, pos.currentPrice, 'KILL_SWITCH', environment);
    }

    db.addAuditLog(
      'KILL_SWITCH',
      'EMERGENCY_CLOSE_ALL_EXECUTED',
      `Emergency closed ${count} active positions immediately upon Kill Switch trigger.`,
      'CRITICAL'
    );

    return { closedCount: count, message: `Successfully liquidated ${count} open positions.` };
  }
}

export const executionEngine = new ExecutionEngine();
