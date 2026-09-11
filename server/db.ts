import {
  AuditLog,
  BacktestResult,
  BotState,
  BrokerAccount,
  NotificationItem,
  Order,
  PortfolioSummary,
  Position,
  RiskSettings,
  TradeHistoryItem,
  TradingSignal,
  UserProfile,
} from '../src/types';
import { ALL_STRATEGIES } from './strategies';

export class AppDatabase {
  public user: UserProfile = {
    id: 'usr_institutional_01',
    email: 'trader@aegistrade.ai',
    name: 'Alexander Wright',
    role: 'admin',
    twoFactorEnabled: true,
    createdTime: Date.now() - 90 * 24 * 3600 * 1000,
    preferences: {
      theme: 'dark',
      currency: 'USD',
      notifications: {
        inApp: true,
        email: true,
        telegram: false,
        discordWebhookUrl: '',
      },
    },
  };

  public botState: BotState = {
    isRunning: true,
    status: 'ONLINE',
    mode: 'semi-automatic',
    environment: 'paper',
    activeStrategyId: 'adaptive-regime',
    activeStrategyName: 'Adaptive Regime Meta-Engine',
    selectedAssets: ['BTC/USD', 'ETH/USD', 'SOL/USD', 'NVDA', 'AAPL'],
    tradesExecutedToday: 4,
    lastTickTimestamp: Date.now(),
    currentRegime: 'Strong Bullish Trend',
    activeRiskLevel: 'SAFE',
  };

  public riskSettings: RiskSettings = {
    maxRiskPerTradePercent: 1.25,
    maxDailyLossPercent: 3.5,
    maxWeeklyLossPercent: 7.5,
    maxAccountDrawdownPercent: 12.0,
    maxOpenPositions: 5,
    maxExposurePerAssetPercent: 25.0,
    maxPortfolioExposurePercent: 85.0,
    maxLeverage: 3.0,
    defaultStopLossAtrMultiplier: 1.5,
    defaultTakeProfitRiskReward: 2.2,
    trailingStopEnabled: true,
    trailingStopPercent: 1.8,
    killSwitchActive: false,
    killSwitchTriggerReason: undefined,
    closePositionsOnKillSwitch: true,
  };

  public portfolio: PortfolioSummary = {
    totalEquity: 54320.5,
    cashBalance: 41850.2,
    unrealizedPnl: 1120.3,
    realizedPnlToday: 430.0,
    totalRealizedPnl: 4320.5,
    todayPnlPercent: 1.45,
    totalReturnPercent: 8.64,
    maxDrawdownPercent: 3.8,
    currentDrawdownPercent: 1.2,
    winRatePercent: 68.4,
    profitFactor: 2.34,
    totalTradesExecuted: 48,
    activePositionsCount: 2,
    currentExposureUsd: 11350.0,
    currentExposurePercent: 20.9,
    peakEquity: 54950.0,
  };

  public brokerAccounts: BrokerAccount[] = [
    {
      id: 'acc_binance_paper',
      name: 'Binance Global Pro',
      broker: 'Binance',
      apiKeyMasked: 'bina_••••••••••••94F2',
      status: 'TESTNET_ACTIVE',
      permissions: ['Read Market Data', 'Execute Spot Orders', 'Execute Margin Orders'],
      accountNumber: 'BIN-948201',
      simulatedBalance: 35000.0,
      isPaper: true,
      lastConnected: Date.now() - 3600 * 1000,
    },
    {
      id: 'acc_alpaca_paper',
      name: 'Alpaca US Equities',
      broker: 'Alpaca',
      apiKeyMasked: 'alpa_••••••••••••10A9',
      status: 'CONNECTED',
      permissions: ['Equities Trading', 'Realtime Quotes'],
      accountNumber: 'ALP-109244',
      simulatedBalance: 20000.0,
      isPaper: true,
      lastConnected: Date.now() - 7200 * 1000,
    },
    {
      id: 'acc_coinbase_live',
      name: 'Coinbase Advanced',
      broker: 'Coinbase Pro',
      apiKeyMasked: 'cbpr_••••••••••••83B1',
      status: 'DISCONNECTED',
      permissions: ['Trading Only (No Withdrawals)'],
      accountNumber: 'CB-883921',
      simulatedBalance: 0,
      isPaper: false,
      lastConnected: Date.now() - 86400 * 1000,
    },
  ];

  public positions: Position[] = [
    {
      id: 'pos_btc_01',
      userId: 'usr_institutional_01',
      symbol: 'BTC/USD',
      side: 'LONG',
      size: 0.085,
      sizeUsd: 7433.25,
      entryPrice: 86200.0,
      currentPrice: 87450.0,
      stopLossPrice: 84900.0,
      takeProfitPrice: 89800.0,
      trailingStopPrice: 85875.9,
      unrealizedPnl: 106.25,
      unrealizedPnlPercent: 1.45,
      realizedPnl: 0,
      strategyId: 'adaptive-regime',
      strategyName: 'Adaptive Regime Meta-Engine',
      openedAt: Date.now() - 45 * 60 * 1000,
      environment: 'paper',
    },
    {
      id: 'pos_nvda_02',
      userId: 'usr_institutional_01',
      symbol: 'NVDA',
      side: 'LONG',
      size: 28,
      sizeUsd: 3875.2,
      entryPrice: 135.5,
      currentPrice: 138.4,
      stopLossPrice: 132.8,
      takeProfitPrice: 142.5,
      trailingStopPrice: 135.9,
      unrealizedPnl: 81.2,
      unrealizedPnlPercent: 2.14,
      realizedPnl: 0,
      strategyId: 'trend-following',
      strategyName: 'Trend Flow Institutional (EMA + Volume)',
      openedAt: Date.now() - 110 * 60 * 1000,
      environment: 'paper',
    },
  ];

  public orders: Order[] = [
    {
      id: 'ord_101',
      userId: 'usr_institutional_01',
      symbol: 'BTC/USD',
      type: 'MARKET',
      side: 'LONG',
      direction: 'BUY',
      quantity: 0.085,
      price: 86200.0,
      status: 'FILLED',
      filledQuantity: 0.085,
      averageFillPrice: 86204.5,
      feesUsd: 7.33,
      slippagePercent: 0.005,
      createdAt: Date.now() - 45 * 60 * 1000,
      filledAt: Date.now() - 45 * 60 * 1000 + 120,
      environment: 'paper',
      strategyName: 'Adaptive Regime Meta-Engine',
      idempotencyKey: 'idemp_btc_101_86200',
    },
    {
      id: 'ord_102',
      userId: 'usr_institutional_01',
      symbol: 'NVDA',
      type: 'MARKET',
      side: 'LONG',
      direction: 'BUY',
      quantity: 28,
      price: 135.5,
      status: 'FILLED',
      filledQuantity: 28,
      averageFillPrice: 135.52,
      feesUsd: 1.89,
      slippagePercent: 0.015,
      createdAt: Date.now() - 110 * 60 * 1000,
      filledAt: Date.now() - 110 * 60 * 1000 + 80,
      environment: 'paper',
      strategyName: 'Trend Flow Institutional',
      idempotencyKey: 'idemp_nvda_102_135.5',
    },
  ];

  public tradesHistory: TradeHistoryItem[] = [
    {
      id: 'trd_001',
      symbol: 'ETH/USD',
      side: 'LONG',
      entryPrice: 3045.0,
      exitPrice: 3140.0,
      quantity: 2.5,
      realizedPnl: 237.5,
      realizedPnlPercent: 3.12,
      feesPaid: 7.6,
      strategyName: 'Multi-Indicator Confluence',
      entryTime: Date.now() - 5 * 3600 * 1000,
      exitTime: Date.now() - 2 * 3600 * 1000,
      exitReason: 'TAKE_PROFIT',
      environment: 'paper',
      tradeExplanation: 'RSI oversold rebound + 50 EMA bounce triggered profit target execution at $3,140.',
    },
    {
      id: 'trd_002',
      symbol: 'SOL/USD',
      side: 'LONG',
      entryPrice: 188.2,
      exitPrice: 196.5,
      quantity: 24,
      realizedPnl: 199.2,
      realizedPnlPercent: 4.41,
      feesPaid: 4.6,
      strategyName: 'ATR Volatility Dynamic Breakout',
      entryTime: Date.now() - 9 * 3600 * 1000,
      exitTime: Date.now() - 4 * 3600 * 1000,
      exitReason: 'TAKE_PROFIT',
      environment: 'paper',
      tradeExplanation: 'Consolidation breakout confirmed by 2.1x volume surge. Reached target +4.41%.',
    },
    {
      id: 'trd_003',
      symbol: 'AAPL',
      side: 'SHORT',
      entryPrice: 231.0,
      exitPrice: 232.8,
      quantity: 30,
      realizedPnl: -54.0,
      realizedPnlPercent: -0.78,
      feesPaid: 3.5,
      strategyName: 'RSI Statistical Mean Reversion',
      entryTime: Date.now() - 14 * 3600 * 1000,
      exitTime: Date.now() - 12 * 3600 * 1000,
      exitReason: 'STOP_LOSS',
      environment: 'paper',
      tradeExplanation: 'Controlled stop loss triggered when price breached above upper ATR envelope.',
    },
  ];

  public signals: TradingSignal[] = [];

  public notifications: NotificationItem[] = [
    {
      id: 'notif_01',
      timestamp: Date.now() - 45 * 60 * 1000,
      type: 'TRADE_OPEN',
      title: 'Position Opened: BTC/USD',
      message: 'Adaptive Regime Meta-Engine executed LONG 0.085 BTC @ $86,200.00. Stop loss: $84,900.00.',
      severity: 'info',
      read: false,
    },
    {
      id: 'notif_02',
      timestamp: Date.now() - 2 * 3600 * 1000,
      type: 'TAKE_PROFIT',
      title: 'Take Profit Filled: ETH/USD',
      message: 'ETH/USD reached target at $3,140.00 (+3.12%, +$237.50). Capital secured.',
      severity: 'success',
      read: true,
    },
    {
      id: 'notif_03',
      timestamp: Date.now() - 6 * 3600 * 1000,
      type: 'AI_INSIGHT',
      title: 'AI Market Regime Shift Detected',
      message: 'Macro regime shifted from Ranging to Strong Bullish Trend for BTC/USD and Tech Equities.',
      severity: 'info',
      read: true,
    },
  ];

  public auditLogs: AuditLog[] = [
    {
      id: 'aud_01',
      timestamp: Date.now() - 15 * 60 * 1000,
      category: 'RISK',
      actor: 'RiskEngine',
      action: 'VOLATILITY_RESCALING',
      details: 'Dynamic position sizer adjusted BTC risk fraction to 1.25% based on ATR index.',
      severity: 'INFO',
    },
    {
      id: 'aud_02',
      timestamp: Date.now() - 45 * 60 * 1000,
      category: 'TRADE',
      actor: 'ExecutionEngine',
      action: 'ORDER_FILLED_PAPER',
      details: 'Filled Market Buy Order for 0.085 BTC/USD with 0.005% simulated slippage.',
      severity: 'INFO',
    },
    {
      id: 'aud_03',
      timestamp: Date.now() - 2 * 3600 * 1000,
      category: 'SYSTEM',
      actor: 'SystemWatcher',
      action: 'CIRCUIT_BREAKER_VERIFIED',
      details: 'All daily risk parameters verified within safe bounds (Current Drawdown: 1.2%).',
      severity: 'INFO',
    },
  ];

  public backtestHistory: BacktestResult[] = [];

  // Mutator helpers
  public addAuditLog(category: AuditLog['category'], action: string, details: string, severity: AuditLog['severity'] = 'INFO') {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      category,
      actor: 'AegisTradingBot',
      action,
      details,
      severity,
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
  }

  public addNotification(type: NotificationItem['type'], title: string, message: string, severity: NotificationItem['severity'] = 'info') {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      type,
      title,
      message,
      severity,
      read: false,
    };
    this.notifications.unshift(item);
    if (this.notifications.length > 100) this.notifications.pop();
  }
}

export const db = new AppDatabase();
