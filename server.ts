import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db';
import { tradingEngine } from './server/tradingEngine';
import { marketDataService } from './server/marketData';
import { ALL_STRATEGIES, getStrategyById } from './server/strategies';
import { backtestingEngine } from './server/backtestingEngine';
import { executionEngine } from './server/executionEngine';
import { systemTestSuite } from './server/tests';
import { geminiService } from './server/geminiService';
import { RiskSettings, TradingMode, EnvironmentMode } from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize and start trading engine background loop
tradingEngine.start();

// -----------------------------------------------------------------------------
// 1. Health & Real-time SSE Stream
// -----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPTIMAL',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    tradingEngineRunning: db.botState.isRunning,
    activePositions: db.positions.length,
    geminiAiReady: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  tradingEngine.addSSEClient(sendEvent);

  req.on('close', () => {
    tradingEngine.removeSSEClient(sendEvent);
  });
});

// -----------------------------------------------------------------------------
// 2. Bot Control & State
// -----------------------------------------------------------------------------
app.get('/api/bot/state', (req, res) => {
  res.json(db.botState);
});

app.post('/api/bot/start', (req, res) => {
  tradingEngine.start();
  res.json({ success: true, botState: db.botState, message: 'Trading bot started successfully' });
});

app.post('/api/bot/pause', (req, res) => {
  tradingEngine.pause();
  res.json({ success: true, botState: db.botState, message: 'Trading bot paused' });
});

app.post('/api/bot/stop', (req, res) => {
  tradingEngine.stop();
  res.json({ success: true, botState: db.botState, message: 'Trading bot stopped' });
});

app.post('/api/bot/mode', (req, res) => {
  const { mode, environment } = req.body;
  if (mode && ['manual', 'semi-automatic', 'fully-automatic'].includes(mode)) {
    db.botState.mode = mode as TradingMode;
    db.addAuditLog('CONFIG', 'TRADING_MODE_CHANGED', `Trading mode updated to ${mode.toUpperCase()}`);
  }
  if (environment && ['paper', 'live'].includes(environment)) {
    db.botState.environment = environment as EnvironmentMode;
    db.addAuditLog('CONFIG', 'ENVIRONMENT_CHANGED', `Environment mode switched to ${environment.toUpperCase()}`);
    db.addNotification('SYSTEM', 'Environment Switched', `Switched active execution mode to ${environment.toUpperCase()}`);
  }
  tradingEngine.broadcastState();
  res.json({ success: true, botState: db.botState });
});

app.post('/api/bot/strategy', (req, res) => {
  const { strategyId } = req.body;
  const strat = getStrategyById(strategyId);
  db.botState.activeStrategyId = strat.config.id;
  db.botState.activeStrategyName = strat.config.name;
  db.addAuditLog('CONFIG', 'STRATEGY_CHANGED', `Active bot strategy set to: ${strat.config.name}`);
  tradingEngine.broadcastState();
  res.json({ success: true, botState: db.botState });
});

app.post('/api/bot/assets', (req, res) => {
  const { assets } = req.body;
  if (Array.isArray(assets)) {
    db.botState.selectedAssets = assets;
    db.addAuditLog('CONFIG', 'ASSET_WATCHLIST_UPDATED', `Watching assets: ${assets.join(', ')}`);
    tradingEngine.broadcastState();
  }
  res.json({ success: true, selectedAssets: db.botState.selectedAssets });
});

// -----------------------------------------------------------------------------
// 3. Emergency Kill Switch
// -----------------------------------------------------------------------------
app.post('/api/bot/kill-switch/engage', (req, res) => {
  const { reason, closePositions } = req.body;
  if (typeof closePositions === 'boolean') {
    db.riskSettings.closePositionsOnKillSwitch = closePositions;
  }
  tradingEngine.triggerKillSwitch(reason || 'Emergency Kill Switch manually triggered by user');
  res.json({ success: true, message: 'Kill switch engaged immediately', riskSettings: db.riskSettings, botState: db.botState });
});

app.post('/api/bot/kill-switch/reset', (req, res) => {
  tradingEngine.resetKillSwitch();
  res.json({ success: true, message: 'Kill switch reset successfully', riskSettings: db.riskSettings, botState: db.botState });
});

// -----------------------------------------------------------------------------
// 4. Portfolio, Positions, Orders & Manual Execution
// -----------------------------------------------------------------------------
app.get('/api/portfolio', (req, res) => {
  res.json(db.portfolio);
});

app.get('/api/positions', (req, res) => {
  res.json(db.positions);
});

app.post('/api/positions/:id/close', (req, res) => {
  const posId = req.params.id;
  const pos = db.positions.find((p) => p.id === posId);
  if (!pos) {
    return res.status(404).json({ success: false, message: 'Position not found' });
  }
  const asset = marketDataService.getAsset(pos.symbol);
  const currentPrice = asset ? asset.currentPrice : pos.currentPrice;
  const result = executionEngine.closePosition(posId, currentPrice, 'MANUAL', db.botState.environment);
  tradingEngine.broadcastState();
  res.json(result);
});

app.post('/api/positions/emergency-close-all', (req, res) => {
  const result = executionEngine.emergencyCloseAllPositions(db.botState.environment);
  tradingEngine.broadcastState();
  res.json(result);
});

app.get('/api/orders', (req, res) => {
  res.json(db.orders);
});

app.get('/api/trades/history', (req, res) => {
  res.json(db.tradesHistory);
});

app.post('/api/orders/manual', (req, res) => {
  const { symbol, side, quantity, stopLoss, takeProfit } = req.body;
  const asset = marketDataService.getAsset(symbol);
  if (!asset) return res.status(400).json({ success: false, message: 'Invalid asset symbol' });

  const signal = {
    id: `sig_manual_${Date.now()}`,
    timestamp: Date.now(),
    assetSymbol: symbol,
    direction: side === 'LONG' ? 'BUY' as const : 'SELL' as const,
    strategyId: 'manual-trader',
    strategyName: 'Manual Operator Execution',
    marketRegime: asset.currentRegime,
    confidenceScore: 100,
    entryPrice: asset.currentPrice,
    suggestedStopLoss: stopLoss || (side === 'LONG' ? asset.currentPrice * 0.98 : asset.currentPrice * 1.02),
    suggestedTakeProfit: takeProfit || (side === 'LONG' ? asset.currentPrice * 1.04 : asset.currentPrice * 0.96),
    riskRewardRatio: 2.0,
    recommendedPositionSizeUsd: (quantity || 1) * asset.currentPrice,
    reasons: ['Manual trade request submitted by authorized operator.'],
    passedRiskChecks: true,
  };

  const riskValidation = {
    passed: true,
    calculatedPositionSizeUsd: (quantity || 1) * asset.currentPrice,
    calculatedQuantity: quantity || 1,
    stopLossPrice: signal.suggestedStopLoss,
    takeProfitPrice: signal.suggestedTakeProfit,
    riskAmountUsd: (quantity || 1) * Math.abs(asset.currentPrice - signal.suggestedStopLoss),
    leverageUsed: 1.0,
  };

  const execRes = executionEngine.executeSignalTrade(signal, riskValidation, db.botState.environment, 'manual');
  tradingEngine.broadcastState();
  res.json(execRes);
});

// -----------------------------------------------------------------------------
// 5. Market Data & Simulation Controls
// -----------------------------------------------------------------------------
app.get('/api/market/assets', (req, res) => {
  res.json(marketDataService.getAllAssets());
});

app.post('/api/market/shock', (req, res) => {
  const { symbol, dropPercent } = req.body;
  marketDataService.simulateMarketShock(symbol || 'BTC/USD', dropPercent || 4.5);
  db.addAuditLog('SYSTEM', 'SIMULATED_MARKET_SHOCK', `Injected ${dropPercent || 4.5}% volatility shock into ${symbol || 'BTC/USD'} to test Risk Engine & Stop-Loss triggers.`, 'WARN');
  db.addNotification('RISK_ALERT', 'Simulated Market Shock Injected', `Triggered ${dropPercent || 4.5}% shock on ${symbol || 'BTC/USD'}. Risk Engine evaluating active stop-losses.`, 'warning');
  tradingEngine.broadcastState();
  res.json({ success: true, message: 'Market shock injected' });
});

// -----------------------------------------------------------------------------
// 6. Strategies & AI Signal Explanations
// -----------------------------------------------------------------------------
app.get('/api/strategies', (req, res) => {
  res.json(ALL_STRATEGIES.map((s) => s.config));
});

app.post('/api/strategies/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  const strat = getStrategyById(id);
  strat.config.enabled = Boolean(enabled);
  db.addAuditLog('CONFIG', 'STRATEGY_TOGGLED', `Strategy ${strat.config.name} enabled state: ${enabled}`);
  res.json({ success: true, strategy: strat.config });
});

app.post('/api/strategies/:id/parameters', (req, res) => {
  const { id } = req.params;
  const { parameters } = req.body;
  const strat = getStrategyById(id);
  strat.config.parameters = { ...strat.config.parameters, ...parameters };
  db.addAuditLog('CONFIG', 'STRATEGY_PARAMETERS_MODIFIED', `Updated parameters for ${strat.config.name}`);
  res.json({ success: true, strategy: strat.config });
});

app.get('/api/signals', (req, res) => {
  res.json(db.signals);
});

app.post('/api/signals/:id/ai-explain', async (req, res) => {
  const signal = db.signals.find((s) => s.id === req.params.id);
  if (!signal) return res.status(404).json({ success: false, message: 'Signal not found' });
  const asset = marketDataService.getAsset(signal.assetSymbol);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

  const aiAnalysis = await geminiService.analyzeTradeSignal(signal, asset, asset.indicators);
  signal.aiAnalysis = aiAnalysis;
  res.json({ success: true, aiAnalysis });
});

// -----------------------------------------------------------------------------
// 7. Backtesting Laboratory
// -----------------------------------------------------------------------------
app.post('/api/backtest/run', (req, res) => {
  try {
    const result = backtestingEngine.runBacktest(req.body);
    db.backtestHistory.unshift(result);
    if (db.backtestHistory.length > 20) db.backtestHistory.pop();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Backtest failed' });
  }
});

app.get('/api/backtest/history', (req, res) => {
  res.json(db.backtestHistory);
});

// -----------------------------------------------------------------------------
// 8. Risk Settings & Configuration
// -----------------------------------------------------------------------------
app.get('/api/risk/settings', (req, res) => {
  res.json(db.riskSettings);
});

app.post('/api/risk/settings', (req, res) => {
  const newSettings = req.body as Partial<RiskSettings>;
  db.riskSettings = { ...db.riskSettings, ...newSettings };
  db.addAuditLog('RISK', 'RISK_PARAMETERS_UPDATED', 'Updated risk limits (Risk/trade, max daily loss, max drawdown).');
  tradingEngine.broadcastState();
  res.json({ success: true, riskSettings: db.riskSettings });
});

// -----------------------------------------------------------------------------
// 9. Broker Accounts & Exchange Connections
// -----------------------------------------------------------------------------
app.get('/api/brokers', (req, res) => {
  res.json(db.brokerAccounts);
});

app.post('/api/brokers/connect', (req, res) => {
  const { broker, apiKey, isPaper, simulatedBalance } = req.body;
  const masked = apiKey ? `${apiKey.slice(0, 4)}••••••••••••${apiKey.slice(-4)}` : 'demo_••••••••••••99A1';
  const newAccount = {
    id: `acc_${broker.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    name: `${broker} Account`,
    broker,
    apiKeyMasked: masked,
    status: isPaper ? ('TESTNET_ACTIVE' as const) : ('CONNECTED' as const),
    permissions: ['Read Market Data', 'Execute Spot Orders'],
    accountNumber: `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
    simulatedBalance: Number(simulatedBalance) || 25000,
    isPaper: Boolean(isPaper),
    lastConnected: Date.now(),
  };

  db.brokerAccounts.push(newAccount);
  db.addAuditLog('BROKER', 'BROKER_ACCOUNT_LINKED', `Linked ${broker} (${newAccount.accountNumber}) in ${isPaper ? 'PAPER' : 'LIVE'} mode.`);
  db.addNotification('SYSTEM', 'Broker Account Linked', `Successfully connected ${broker} with trading permissions.`, 'success');
  tradingEngine.broadcastState();
  res.json({ success: true, account: newAccount });
});

app.delete('/api/brokers/:id', (req, res) => {
  const idx = db.brokerAccounts.findIndex((b) => b.id === req.params.id);
  if (idx !== -1) {
    const removed = db.brokerAccounts.splice(idx, 1)[0];
    db.addAuditLog('BROKER', 'BROKER_ACCOUNT_DISCONNECTED', `Disconnected ${removed.broker} (${removed.accountNumber})`);
  }
  tradingEngine.broadcastState();
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// 10. Automated Tests Runner & Admin Audit Logs
// -----------------------------------------------------------------------------
app.post('/api/tests/run', (req, res) => {
  const testResults = systemTestSuite.runAllTests();
  db.addAuditLog('SYSTEM', 'AUTOMATED_TEST_SUITE_RUN', `Executed ${testResults.total} validation suites. Passed: ${testResults.passed}/${testResults.total}.`);
  res.json(testResults);
});

app.get('/api/admin/audit-logs', (req, res) => {
  res.json(db.auditLogs);
});

app.get('/api/notifications', (req, res) => {
  res.json(db.notifications);
});

app.post('/api/notifications/mark-read', (req, res) => {
  db.notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
});

app.get('/api/auth/profile', (req, res) => {
  res.json(db.user);
});

app.post('/api/auth/settings', (req, res) => {
  const { name, preferences } = req.body;
  if (name) db.user.name = name;
  if (preferences) db.user.preferences = { ...db.user.preferences, ...preferences };
  res.json({ success: true, user: db.user });
});

// -----------------------------------------------------------------------------
// 11. Vite Middleware & Static Serving
// -----------------------------------------------------------------------------
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AegisTrade AI] Trading Server running on http://0.0.0.0:${PORT}`);
  });
}

initServer();
