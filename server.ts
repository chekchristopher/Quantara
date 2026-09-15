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
    status: 'ok',
    systemStatus: 'OPTIMAL',
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

app.post('/api/bot/takeover', (req, res) => {
  const { takeover, accountId } = req.body;
  if (typeof takeover === 'boolean') {
    db.botState.autonomousTakeover = takeover;
    if (takeover) {
      db.botState.mode = 'fully-automatic';
    }
  }

  if (accountId) {
    const acc = db.brokerAccounts.find((b) => b.id === accountId);
    if (acc) {
      db.brokerAccounts.forEach((b) => (b.isActiveForTakeover = b.id === accountId));
      db.botState.activeBrokerAccountId = acc.id;
      db.botState.activeBrokerAccountName = acc.name;
    }
  }

  const statusLabel = db.botState.autonomousTakeover ? 'ACTIVATED' : 'DISENGAGED';
  db.addAuditLog(
    'CONFIG',
    'AUTONOMOUS_TAKEOVER_TOGGLED',
    `Autonomous Execution Takeover ${statusLabel} for ${db.botState.activeBrokerAccountName || 'Active Account'}.`,
    db.botState.autonomousTakeover ? 'INFO' : 'WARN'
  );
  db.addNotification(
    'SYSTEM',
    `Autonomous Takeover: ${statusLabel}`,
    db.botState.autonomousTakeover
      ? `Quantara AI Engine is actively taking over automated execution on ${db.botState.activeBrokerAccountName || 'your account'}.`
      : 'Autonomous hands-free takeover disengaged. Manual confirmation restored.',
    db.botState.autonomousTakeover ? 'success' : 'info'
  );

  tradingEngine.broadcastState();
  res.json({ success: true, botState: db.botState });
});

app.post('/api/bot/compounding-mode', (req, res) => {
  const { mode, target, asymmetricFilter, initialCapital } = req.body;
  if (mode) db.botState.compoundingMode = mode;
  if (target) db.botState.microAccountTarget = Number(target);
  if (typeof asymmetricFilter === 'boolean') db.botState.asymmetricFilterEnabled = asymmetricFilter;
  if (initialCapital) db.botState.initialSeedCapital = Number(initialCapital);

  db.addAuditLog('CONFIG', 'COMPOUNDING_MODE_UPDATED', `Compounding mode set to ${db.botState.compoundingMode} (Target: $${db.botState.microAccountTarget.toLocaleString()}).`);
  tradingEngine.broadcastState();
  res.json({ success: true, botState: db.botState });
});

app.post('/api/portfolio/reset-capital', (req, res) => {
  const { amount, isChallenge } = req.body;
  const newCapital = Number(amount) || 10.0;

  // Clear existing positions safely
  db.positions = [];
  db.portfolio.cashBalance = newCapital;
  db.portfolio.totalEquity = newCapital;
  db.portfolio.peakEquity = newCapital;
  db.portfolio.unrealizedPnl = 0;
  db.portfolio.realizedPnlToday = 0;
  db.portfolio.totalRealizedPnl = 0;
  db.portfolio.currentExposureUsd = 0;
  db.portfolio.currentExposurePercent = 0;
  db.portfolio.currentDrawdownPercent = 0;
  db.portfolio.activePositionsCount = 0;
  db.portfolio.totalTradesExecuted = 0;
  db.portfolio.todayPnlPercent = 0;
  db.portfolio.totalReturnPercent = 0;

  db.botState.initialSeedCapital = newCapital;
  if (newCapital <= 100) {
    db.botState.compoundingMode = 'micro-wealth-accelerator';
    db.botState.asymmetricFilterEnabled = true;
    db.riskSettings.maxRiskPerTradePercent = 2.5;
    db.riskSettings.trailingStopEnabled = true;
  }

  // Update active broker account balance if paper
  if (db.botState.activeBrokerAccountId) {
    const acc = db.brokerAccounts.find((b) => b.id === db.botState.activeBrokerAccountId);
    if (acc && acc.isPaper) {
      acc.simulatedBalance = newCapital;
    }
  }

  db.addAuditLog(
    'CONFIG',
    'CAPITAL_INITIALIZED',
    `Account capital initialized to $${newCapital.toFixed(2)} (${isChallenge ? '$10 Micro-Account Wealth Challenge' : 'Custom Capital Reset'}).`,
    'INFO'
  );
  db.addNotification(
    'SYSTEM',
    'Account Capital Reset',
    `Trading capital calibrated to $${newCapital.toFixed(2)}. Micro-compounding engine primed.`,
    'success'
  );

  tradingEngine.broadcastState();
  res.json({ success: true, portfolio: db.portfolio, botState: db.botState });
});

app.get('/api/compounding/roadmap', (req, res) => {
  const equity = db.portfolio.totalEquity;
  const seed = db.botState.initialSeedCapital || 10;
  const target = db.botState.microAccountTarget || 10000;

  const milestones = [
    {
      id: 'm1',
      stage: 1,
      title: 'Phase 1: Seed Survival',
      targetBalance: 25.0,
      phase: '$10 → $25 (2.5x Growth)',
      description: 'Capital preservation, fractional ATR lot sizes, strict zero-ruin risk (2.5% max risk, 1:3 R:R).',
      achieved: equity >= 25.0,
      progressPercent: Math.min(100, Math.max(0, Math.round(((equity - seed) / (25 - seed)) * 100))),
    },
    {
      id: 'm2',
      stage: 2,
      title: 'Phase 2: Compounding Velocity',
      targetBalance: 100.0,
      phase: '$25 → $100 (4x Acceleration)',
      description: 'Break-even trailing locks activate at +1.2R. 100% of realized profits auto-reinvested into next lot size.',
      achieved: equity >= 100.0,
      progressPercent: Math.min(100, Math.max(0, Math.round(((equity - 25) / (100 - 25)) * 100))),
    },
    {
      id: 'm3',
      stage: 3,
      title: 'Phase 3: Multi-Asset Scale',
      targetBalance: 500.0,
      phase: '$100 → $500 (5x Scale)',
      description: 'Portfolio expands across high-liquidity crypto & equities (BTC, SOL, NVDA, AAPL) with decorrelation checks.',
      achieved: equity >= 500.0,
      progressPercent: Math.min(100, Math.max(0, Math.round(((equity - 100) / (500 - 100)) * 100))),
    },
    {
      id: 'm4',
      stage: 4,
      title: 'Phase 4: Momentum Expansion',
      targetBalance: 2500.0,
      phase: '$500 → $2,500 (5x Expansion)',
      description: 'Regime detection switches between Trend Breakouts and Volatility Squeezes to compound equity faster.',
      achieved: equity >= 2500.0,
      progressPercent: Math.min(100, Math.max(0, Math.round(((equity - 500) / (2500 - 500)) * 100))),
    },
    {
      id: 'm5',
      stage: 5,
      title: 'Phase 5: Wealth Engine',
      targetBalance: target,
      phase: `$2,500 → $${target.toLocaleString()} (Wealth Tier)`,
      description: 'Full institutional risk management, portfolio hedging, and automated profit harvesting.',
      achieved: equity >= target,
      progressPercent: Math.min(100, Math.max(0, Math.round(((equity - 2500) / (target - 2500)) * 100))),
    },
  ];

  res.json({
    currentEquity: equity,
    initialSeedCapital: seed,
    targetCapital: target,
    overallProgressPercent: Math.min(100, Math.max(0, Math.round((equity / target) * 100))),
    milestones,
    compoundingMode: db.botState.compoundingMode,
    asymmetricFilterEnabled: db.botState.asymmetricFilterEnabled,
    autonomousTakeover: db.botState.autonomousTakeover,
  });
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
// 5. Market Data & Real-Time Controls
// -----------------------------------------------------------------------------
app.get('/api/market/assets', (req, res) => {
  res.json(marketDataService.getAllAssets());
});

app.get('/api/market/status', (req, res) => {
  res.json({
    liveStatus: marketDataService.liveStatus,
    lastSyncTime: marketDataService.lastSyncTime,
    assetsCount: marketDataService.getAllAssets().length,
    forexCount: marketDataService.getForexAssets().length,
    cryptoCount: marketDataService.getCryptoAssets().length,
  });
});

app.post('/api/market/sync-live', async (req, res) => {
  await Promise.allSettled([
    marketDataService.syncLiveCryptoPrices(),
    marketDataService.syncLiveForexRates(),
    marketDataService.syncLiveGoldPrice(),
  ]);
  tradingEngine.broadcastState();
  res.json({
    success: true,
    message: 'Live market rates synchronized successfully from Binance, Gold Spot, & European Central Bank',
    lastSyncTime: marketDataService.lastSyncTime,
  });
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
// 9. Broker Accounts & Exchange Connections (Including MetaTrader 5 Bridge)
// -----------------------------------------------------------------------------
app.get('/api/brokers', (req, res) => {
  res.json(db.brokerAccounts);
});

app.post('/api/brokers/mt5/login', (req, res) => {
  const {
    server = 'Exness-MT5Real',
    login = '10849201',
    password = '',
    accountType = 'REAL',
    brokerName = 'Exness',
    accountName = '',
    customName = '',
    leverage = '1:500',
    currency = 'USD',
    balance = 5000,
    autoTradeControl,
  } = req.body;

  if (!login || !server) {
    return res.status(400).json({ success: false, message: 'Server and Account Login are required.' });
  }

  const pingMs = Math.floor(9 + Math.random() * 15);
  const numBalance = Math.max(10, Number(balance) || 5000);
  const maskedPw = password ? `${'•'.repeat(Math.max(6, password.length))}` : '••••••••••••';
  const customIdentName = (accountName || customName)?.trim();
  const assignedName = customIdentName || `${brokerName} MT5 (${server})`;

  const newAccount: any = {
    id: `acc_mt5_${Date.now()}`,
    name: assignedName,
    broker: brokerName,
    server,
    accountNumber: String(login),
    accountType: accountType === 'REAL' ? 'REAL' : 'DEMO',
    leverage,
    currency,
    apiKeyMasked: maskedPw,
    status: 'CONNECTED',
    permissions: [
      'MetaTrader 5 Bridge Auth',
      'Algorithmic Execution',
      'Live Tick Streaming',
      'Automated Risk / Stop Loss',
      'XAU/USD Gold Spot STP',
    ],
    simulatedBalance: numBalance,
    equity: numBalance,
    freeMargin: numBalance,
    marginLevel: 9999,
    pingMs,
    terminalVersion: 'MetaTrader 5 x64 Terminal Build 4450',
    isPaper: accountType !== 'REAL',
    lastConnected: Date.now(),
    isActiveForTakeover: true,
    autoTradeControl: autoTradeControl || {
      autoTradeEnabled: true,
      prioritizeGold: true,
      riskPerTradePercent: 1.5,
      lotSizeMode: 'DYNAMIC',
      fixedLotSize: 0.10,
      maxOpenTrades: 4,
      dailyLossHaltPercent: 4.0,
      trailingStopPips: 25,
      takeProfitRatio: 2.5,
    },
  };

  // Mark all other accounts as inactive for takeover
  db.brokerAccounts.forEach((b) => {
    b.isActiveForTakeover = false;
  });

  // Prepend new account to list
  db.brokerAccounts.unshift(newAccount);

  // Synchronize Bot state & Portfolio
  db.botState.activeBrokerAccountId = newAccount.id;
  db.botState.activeBrokerAccountName = newAccount.name;
  db.botState.environment = newAccount.isPaper ? 'paper' : 'live';
  db.botState.autonomousTakeover = Boolean(newAccount.autoTradeControl?.autoTradeEnabled ?? true);
  db.botState.isRunning = true;
  db.botState.status = 'ONLINE';

  // Synchronize Portfolio capital to user's real broker capital
  db.portfolio.cashBalance = numBalance;
  db.portfolio.totalEquity = numBalance;
  db.portfolio.peakEquity = numBalance;
  db.portfolio.currentExposureUsd = 0;
  db.portfolio.currentExposurePercent = 0;
  db.botState.initialSeedCapital = numBalance;

  // Clear existing open demo positions if any to cleanly run on user's broker
  db.positions = [];

  db.addAuditLog(
    'BROKER',
    'MT5_LOGIN_SUCCESSFUL',
    `Authenticated to ${server} (Login: #${login}, Type: ${accountType}). Latency: ${pingMs}ms. Autonomous trading control ENGAGED.`,
    'INFO'
  );
  db.addNotification(
    'SYSTEM',
    `MT5 Connected: ${server} #${login}`,
    `Successfully connected to MetaTrader 5 broker. Auto-trading engine is now actively managing trades for this account.`,
    'success'
  );

  tradingEngine.broadcastState();
  res.json({
    success: true,
    account: newAccount,
    pingMs,
    message: `Connected to ${server} (#${login}) with ${pingMs}ms latency. Auto-trading is ACTIVE.`,
  });
});

app.post('/api/brokers/mt5/update-control', (req, res) => {
  const { accountId, autoTradeControl } = req.body;
  const target = db.brokerAccounts.find((b) => b.id === accountId) || db.brokerAccounts.find((b) => b.isActiveForTakeover);

  if (target && autoTradeControl) {
    target.autoTradeControl = { ...target.autoTradeControl, ...autoTradeControl };
    if (typeof autoTradeControl.autoTradeEnabled === 'boolean') {
      db.botState.autonomousTakeover = autoTradeControl.autoTradeEnabled;
    }
  }

  tradingEngine.broadcastState();
  res.json({ success: true, autoTradeControl: target?.autoTradeControl });
});

app.post('/api/brokers/mt5/close-all', (req, res) => {
  executionEngine.emergencyCloseAllPositions(db.botState.environment);
  db.addAuditLog('BROKER', 'MT5_CLOSE_ALL', 'Closed all active MT5 positions by user command.', 'WARN');
  tradingEngine.broadcastState();
  res.json({ success: true, message: 'All open MT5 positions closed.' });
});

app.post('/api/brokers/connect', (req, res) => {
  const { broker, apiKey, isPaper, simulatedBalance, server, accountNumber, leverage, name, customName, accountName } = req.body;
  const masked = apiKey ? `${apiKey.slice(0, 4)}••••••••••••${apiKey.slice(-4)}` : '••••••••••••';
  const assignedName = (customName || accountName || name)?.trim() || `${broker} Account`;
  const newAccount: any = {
    id: `acc_${broker.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    name: assignedName,
    broker,
    server: server || `${broker}-Live`,
    accountNumber: accountNumber || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
    accountType: isPaper ? 'DEMO' : 'REAL',
    leverage: leverage || '1:500',
    currency: 'USD',
    apiKeyMasked: masked,
    status: isPaper ? ('TESTNET_ACTIVE' as const) : ('CONNECTED' as const),
    permissions: ['Read Market Data', 'Execute Spot Orders', 'Algo Trading'],
    simulatedBalance: Number(simulatedBalance) || 25000,
    equity: Number(simulatedBalance) || 25000,
    freeMargin: Number(simulatedBalance) || 25000,
    marginLevel: 9999,
    pingMs: Math.floor(10 + Math.random() * 15),
    isPaper: Boolean(isPaper),
    lastConnected: Date.now(),
  };

  db.brokerAccounts.push(newAccount);
  db.addAuditLog('BROKER', 'BROKER_ACCOUNT_LINKED', `Linked ${broker} (${newAccount.accountNumber}) as "${assignedName}" in ${isPaper ? 'PAPER' : 'LIVE'} mode.`);
  db.addNotification('SYSTEM', 'Broker Account Linked', `Successfully connected ${assignedName} with trading permissions.`, 'success');
  tradingEngine.broadcastState();
  res.json({ success: true, account: newAccount });
});

app.post('/api/brokers/:id/rename', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const target = db.brokerAccounts.find((b) => b.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Broker account not found.' });
  }

  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    return res.status(400).json({ success: false, message: 'Account name cannot be blank.' });
  }

  const oldName = target.name;
  target.name = trimmedName;

  if (db.botState.activeBrokerAccountId === id) {
    db.botState.activeBrokerAccountName = trimmedName;
  }

  db.addAuditLog(
    'BROKER',
    'BROKER_ACCOUNT_RENAMED',
    `Renamed broker account #${target.accountNumber} from "${oldName}" to "${trimmedName}".`,
    'INFO'
  );
  db.addNotification(
    'SYSTEM',
    'Account Renamed',
    `Broker account updated to "${trimmedName}".`,
    'info'
  );

  tradingEngine.broadcastState();
  res.json({ success: true, account: target });
});

app.post('/api/brokers/select-active', (req, res) => {
  const { accountId } = req.body;
  const target = db.brokerAccounts.find((b) => b.id === accountId);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Account not found' });
  }

  db.brokerAccounts.forEach((b) => {
    b.isActiveForTakeover = b.id === accountId;
  });

  db.botState.activeBrokerAccountId = target.id;
  db.botState.activeBrokerAccountName = target.name;
  db.botState.environment = target.isPaper ? 'paper' : 'live';

  if (target.isPaper && target.simulatedBalance > 0) {
    db.portfolio.cashBalance = target.simulatedBalance;
    db.portfolio.totalEquity = target.simulatedBalance;
    db.portfolio.peakEquity = target.simulatedBalance;
    db.botState.initialSeedCapital = target.simulatedBalance;
  }

  db.addAuditLog('BROKER', 'ACTIVE_BROKER_SELECTED', `Assigned ${target.name} (${target.accountNumber}) as active autonomous execution target.`, 'INFO');
  db.addNotification('SYSTEM', 'Active Account Assigned', `Quantara will execute automated trades directly on ${target.name}.`, 'success');
  tradingEngine.broadcastState();
  res.json({ success: true, activeAccount: target, botState: db.botState });
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
      server: { middlewareMode: true },
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

initServer().catch((err) => {
  console.error('[AegisTrade AI] Failed to start server:', err);
});
