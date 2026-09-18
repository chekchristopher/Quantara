import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  BacktestResult,
  BotState,
  BrokerAccount,
  NotificationItem,
  OfflineSessionStats,
  OfflineTradeRecord,
  Order,
  PortfolioSummary,
  Position,
  RiskSettings,
  TradeHistoryItem,
  TradingSignal,
  UserProfile,
} from '../src/types';
import { ALL_STRATEGIES } from './strategies';

const ACCOUNTS_STORAGE_DIR = path.join(process.cwd(), 'server', 'data');
const ACCOUNTS_STORAGE_FILE = path.join(ACCOUNTS_STORAGE_DIR, 'connected_accounts.json');
const ENGINE_STATE_FILE = path.join(ACCOUNTS_STORAGE_DIR, 'trading_engine_state.json');

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
  public offlineSessionStats?: OfflineSessionStats;

  constructor() {
    this.initializePersistedAccounts();
    this.initializeEngineState();
  }

  private loadPersistedAccounts(): BrokerAccount[] {
    try {
      if (fs.existsSync(ACCOUNTS_STORAGE_FILE)) {
        const raw = fs.readFileSync(ACCOUNTS_STORAGE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Notice: Unable to parse persisted accounts, starting clean:', err);
    }
    return [];
  }

  public persistAccounts(): void {
    try {
      if (!fs.existsSync(ACCOUNTS_STORAGE_DIR)) {
        fs.mkdirSync(ACCOUNTS_STORAGE_DIR, { recursive: true });
      }
      fs.writeFileSync(ACCOUNTS_STORAGE_FILE, JSON.stringify(this.brokerAccounts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write accounts to storage file:', err);
    }
  }

  public persistEngineState(): void {
    try {
      if (!fs.existsSync(ACCOUNTS_STORAGE_DIR)) {
        fs.mkdirSync(ACCOUNTS_STORAGE_DIR, { recursive: true });
      }
      const stateToSave = {
        portfolio: this.portfolio,
        positions: this.positions,
        orders: this.orders.slice(0, 100),
        tradesHistory: this.tradesHistory.slice(0, 150),
        offlineSessionStats: this.offlineSessionStats,
        riskSettings: this.riskSettings,
        botState: {
          isRunning: this.botState.isRunning,
          status: this.botState.status,
          mode: this.botState.mode,
          environment: this.botState.environment,
          activeStrategyId: this.botState.activeStrategyId,
          activeStrategyName: this.botState.activeStrategyName,
          selectedAssets: this.botState.selectedAssets,
          tradesExecutedToday: this.botState.tradesExecutedToday,
          autonomousTakeover: this.botState.autonomousTakeover,
          activeBrokerAccountId: this.botState.activeBrokerAccountId,
          activeBrokerAccountName: this.botState.activeBrokerAccountName,
          compoundingMode: this.botState.compoundingMode,
          initialSeedCapital: this.botState.initialSeedCapital,
          microAccountTarget: this.botState.microAccountTarget,
          asymmetricFilterEnabled: this.botState.asymmetricFilterEnabled,
          serverEngineStatus: this.botState.serverEngineStatus,
          serverUptimeSeconds: this.botState.serverUptimeSeconds,
          isNonStopLoop: this.botState.isNonStopLoop,
        },
      };
      fs.writeFileSync(ENGINE_STATE_FILE, JSON.stringify(stateToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write engine state to storage file:', err);
    }
  }

  private initializeEngineState(): void {
    try {
      if (fs.existsSync(ENGINE_STATE_FILE)) {
        const raw = fs.readFileSync(ENGINE_STATE_FILE, 'utf-8');
        const state = JSON.parse(raw);
        if (state) {
          if (state.portfolio && typeof state.portfolio.totalEquity === 'number') {
            this.portfolio = { ...this.portfolio, ...state.portfolio };
          }
          if (Array.isArray(state.positions)) {
            this.positions = state.positions;
          }
          if (Array.isArray(state.orders)) {
            this.orders = state.orders;
          }
          if (Array.isArray(state.tradesHistory)) {
            this.tradesHistory = state.tradesHistory;
          }
          if (state.offlineSessionStats) {
            this.offlineSessionStats = state.offlineSessionStats;
          }
          if (state.riskSettings) {
            this.riskSettings = { ...this.riskSettings, ...state.riskSettings };
          }
          if (state.botState) {
            // Restore running status if broker account is configured to run
            const activeAcc = this.brokerAccounts.find((a) => a.id === state.botState.activeBrokerAccountId || a.isActiveForTakeover);
            const isServerAllowed = activeAcc ? activeAcc.serverStatus !== 'STOPPED' : true;
            this.botState = {
              ...this.botState,
              ...state.botState,
              isRunning: isServerAllowed && state.botState.isRunning !== false,
              status: (isServerAllowed && state.botState.isRunning !== false) ? 'ONLINE' : (state.botState.status || 'PAUSED'),
              serverEngineStatus: (isServerAllowed && state.botState.isRunning !== false) ? 'RUNNING' : (state.botState.serverEngineStatus || 'STOPPED'),
              isNonStopLoop: true,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Notice: Unable to parse persisted engine state:', err);
    }
  }

  private initializePersistedAccounts(): void {
    const loaded = this.loadPersistedAccounts();
    if (loaded.length > 0) {
      // Normalize loaded accounts and ensure non-stop server properties are set
      this.brokerAccounts = loaded.map((acc, idx) => ({
        ...acc,
        serverStatus: acc.serverStatus || 'RUNNING',
        isNonStop: acc.isNonStop !== false,
        savedInSystem: true,
        connectedAt: acc.connectedAt || acc.lastConnected || Date.now(),
        uptimeSeconds: acc.uptimeSeconds || 0,
        status: acc.serverStatus === 'PAUSED' ? 'CONNECTED' : acc.serverStatus === 'STOPPED' ? 'DISCONNECTED' : 'CONNECTED',
      }));

      // Find currently active account or select first
      const active = this.brokerAccounts.find((a) => a.isActiveForTakeover) || this.brokerAccounts[0];
      if (active) {
        active.isActiveForTakeover = true;
        this.botState.activeBrokerAccountId = active.id;
        this.botState.activeBrokerAccountName = active.name;
        this.botState.environment = active.isPaper ? 'paper' : 'live';
        this.botState.autonomousTakeover = Boolean(active.autoTradeControl?.autoTradeEnabled ?? true);

        // Resume non-stop execution if not paused or stopped
        if (active.serverStatus !== 'STOPPED') {
          this.botState.isRunning = active.serverStatus === 'RUNNING';
          this.botState.status = active.serverStatus === 'RUNNING' ? 'ONLINE' : 'PAUSED';
          this.botState.serverEngineStatus = active.serverStatus;
          this.botState.isNonStopLoop = true;
        } else {
          this.botState.isRunning = false;
          this.botState.status = 'STOPPED';
          this.botState.serverEngineStatus = 'STOPPED';
        }

        const bal = active.simulatedBalance || 5000;
        this.portfolio.cashBalance = bal;
        this.portfolio.totalEquity = bal;
        this.portfolio.peakEquity = bal;
        this.botState.initialSeedCapital = bal;

        this.addAuditLog(
          'SYSTEM',
          'SYSTEM_ACCOUNTS_RESTORED',
          `Restored ${this.brokerAccounts.length} saved broker account(s) from persistent storage. Active server: ${active.name} (#${active.accountNumber}). Engine state: ${this.botState.status}.`,
          'INFO'
        );
        this.addNotification(
          'SYSTEM',
          'Connected Accounts Restored',
          `Restored ${this.brokerAccounts.length} saved accounts. Server running non-stop 24/7 on ${active.name}.`,
          'info'
        );
      }
    }
  }

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
