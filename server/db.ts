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
    isRunning: false,
    status: 'AWAITING_BROKER_CONNECTION',
    mode: 'fully-automatic',
    environment: 'paper',
    activeStrategyId: 'adaptive-regime',
    activeStrategyName: 'Adaptive Regime Meta-Engine',
    selectedAssets: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD'],
    tradesExecutedToday: 0,
    lastTickTimestamp: Date.now(),
    currentRegime: 'Neutral / Choppy',
    activeRiskLevel: 'SAFE',
    autonomousTakeover: false,
    activeBrokerAccountId: undefined,
    activeBrokerAccountName: undefined,
    compoundingMode: 'micro-wealth-accelerator',
    initialSeedCapital: 0,
    microAccountTarget: 10000,
    asymmetricFilterEnabled: true,
  };

  public riskSettings: RiskSettings = {
    maxRiskPerTradePercent: 1.5,
    maxDailyLossPercent: 3.5,
    maxWeeklyLossPercent: 7.5,
    maxAccountDrawdownPercent: 10.0,
    maxOpenPositions: 4,
    maxExposurePerAssetPercent: 30.0,
    maxPortfolioExposurePercent: 75.0,
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
    totalEquity: 0.0,
    cashBalance: 0.0,
    unrealizedPnl: 0.0,
    realizedPnlToday: 0.0,
    totalRealizedPnl: 0.0,
    todayPnlPercent: 0.0,
    totalReturnPercent: 0.0,
    maxDrawdownPercent: 0.0,
    currentDrawdownPercent: 0.0,
    winRatePercent: 0.0,
    profitFactor: 0.0,
    totalTradesExecuted: 0,
    activePositionsCount: 0,
    currentExposureUsd: 0.0,
    currentExposurePercent: 0.0,
    peakEquity: 0.0,
  };

  public brokerAccounts: BrokerAccount[] = [];

  public positions: Position[] = [];

  public orders: Order[] = [];

  public tradesHistory: TradeHistoryItem[] = [];

  public signals: TradingSignal[] = [];

  public notifications: NotificationItem[] = [
    {
      id: 'notif_welcome',
      timestamp: Date.now(),
      type: 'SYSTEM',
      title: 'Connect Your MT5 Trading Account',
      message: 'Quantara autonomous trading engine is ready. Connect your broker account to begin. We strongly encourage connecting your Demo account (e.g. Exness-MT5Trial9) first for risk-free testing before connecting real funds.',
      severity: 'info',
      read: false,
    },
  ];

  public auditLogs: AuditLog[] = [
    {
      id: 'aud_init',
      timestamp: Date.now(),
      category: 'SYSTEM',
      actor: 'SystemEngine',
      action: 'PLATFORM_INITIALIZED',
      details: 'Quantara trading platform initialized with clean real-state accounting. Awaiting broker connection (Real or Demo).',
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
