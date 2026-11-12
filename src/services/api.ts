import {
  AuditLog,
  BacktestRequest,
  BacktestResult,
  BotState,
  BrokerAccount,
  MarketAsset,
  NotificationItem,
  Order,
  PortfolioSummary,
  Position,
  RiskProfileType,
  RiskSettings,
  StrategyConfig,
  TradeHistoryItem,
  TradingSignal,
  UserProfile,
} from '../types';

export interface SnapshotData {
  type: string;
  timestamp: number;
  botState: BotState;
  portfolio: PortfolioSummary;
  positions: Position[];
  orders: Order[];
  tradesHistory: TradeHistoryItem[];
  signals: TradingSignal[];
  notifications: NotificationItem[];
  assets: MarketAsset[];
  riskSettings: RiskSettings;
  brokerAccounts: BrokerAccount[];
  offlineSessionStats?: import('../types').OfflineSessionStats;
  economicEvents?: any[];
  blackoutStatus?: {
    isBlackout: boolean;
    activeEvent?: any;
    minutesUntilEvent?: number;
    reason?: string;
  };
}

export const api = {
  // Bot Controls
  async startBot(): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/start', { method: 'POST' });
    return res.json();
  },

  async pauseBot(): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/pause', { method: 'POST' });
    return res.json();
  },

  async stopBot(): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/stop', { method: 'POST' });
    return res.json();
  },

  async setMode(mode: string, environment?: string): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, environment }),
    });
    return res.json();
  },

  async toggleTakeover(takeover: boolean, accountId?: string): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ takeover, accountId }),
    });
    return res.json();
  },

  async setCompoundingMode(payload: {
    mode: 'standard' | 'micro-wealth-accelerator';
    target?: number;
    asymmetricFilter?: boolean;
    initialCapital?: number;
  }): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/compounding-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async resetCapital(amount: number, isChallenge?: boolean): Promise<{ success: boolean; portfolio: PortfolioSummary; botState: BotState }> {
    const res = await fetch('/api/portfolio/reset-capital', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, isChallenge }),
    });
    return res.json();
  },

  async getCompoundingRoadmap(): Promise<any> {
    const res = await fetch('/api/compounding/roadmap');
    return res.json();
  },

  async setStrategy(strategyId: string): Promise<{ success: boolean; botState: BotState }> {
    const res = await fetch('/api/bot/strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyId }),
    });
    return res.json();
  },

  async setSelectedAssets(assets: string[]): Promise<{ success: boolean; selectedAssets: string[] }> {
    const res = await fetch('/api/bot/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets }),
    });
    return res.json();
  },

  async engageKillSwitch(reason?: string, closePositions?: boolean): Promise<{ success: boolean }> {
    const res = await fetch('/api/bot/kill-switch/engage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, closePositions }),
    });
    return res.json();
  },

  async resetKillSwitch(): Promise<{ success: boolean }> {
    const res = await fetch('/api/bot/kill-switch/reset', { method: 'POST' });
    return res.json();
  },

  // Positions & Orders
  async closePosition(positionId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/positions/${positionId}/close`, { method: 'POST' });
    return res.json();
  },

  async emergencyCloseAllPositions(): Promise<{ success: boolean; closedCount: number }> {
    const res = await fetch('/api/positions/emergency-close-all', { method: 'POST' });
    return res.json();
  },

  async placeManualOrder(order: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    quantity: number;
    stopLoss?: number;
    takeProfit?: number;
  }): Promise<any> {
    const res = await fetch('/api/orders/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    return res.json();
  },

  // Market Data & Real-Time Live Feed
  async getMarketAssets(): Promise<MarketAsset[]> {
    const res = await fetch('/api/market/assets');
    return res.json();
  },

  async getMarketStatus(): Promise<{
    liveStatus: string;
    lastSyncTime: number;
    assetsCount: number;
    forexCount: number;
    cryptoCount: number;
  }> {
    const res = await fetch('/api/market/status');
    return res.json();
  },

  async syncLiveMarketRates(): Promise<{ success: boolean; message: string; lastSyncTime: number }> {
    const res = await fetch('/api/market/sync-live', { method: 'POST' });
    return res.json();
  },

  // Market Simulation
  async injectMarketShock(symbol: string, dropPercent: number): Promise<{ success: boolean }> {
    const res = await fetch('/api/market/shock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, dropPercent }),
    });
    return res.json();
  },

  // AI & Strategies
  async getStrategies(): Promise<StrategyConfig[]> {
    const res = await fetch('/api/strategies');
    return res.json();
  },

  async toggleStrategy(id: string, enabled: boolean): Promise<{ success: boolean }> {
    const res = await fetch(`/api/strategies/${id}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return res.json();
  },

  async updateStrategyParams(id: string, parameters: Record<string, any>): Promise<{ success: boolean }> {
    const res = await fetch(`/api/strategies/${id}/parameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parameters }),
    });
    return res.json();
  },

  async explainSignalWithAI(signalId: string): Promise<any> {
    const res = await fetch(`/api/signals/${signalId}/ai-explain`, { method: 'POST' });
    return res.json();
  },

  // Backtesting
  async runBacktest(req: BacktestRequest): Promise<{ success: boolean; result: BacktestResult }> {
    const res = await fetch('/api/backtest/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.json();
  },

  // Risk Settings & Profiles
  async updateRiskSettings(settings: Partial<RiskSettings>): Promise<{ success: boolean; riskSettings: RiskSettings }> {
    const res = await fetch('/api/risk/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async setRiskProfile(profileId: RiskProfileType): Promise<{ success: boolean; activeProfile: RiskProfileType; riskSettings: RiskSettings }> {
    const res = await fetch('/api/risk/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId }),
    });
    return res.json();
  },

  async getRiskProfiles(): Promise<{ activeProfile: RiskProfileType; profiles: Record<string, any> }> {
    const res = await fetch('/api/risk/profiles');
    return res.json();
  },

  // Brokers & MT5 (Scoped strictly per user for zero-leakage security)
  async getBrokerAccounts(userId?: string): Promise<BrokerAccount[]> {
    const url = userId ? `/api/brokers?userId=${encodeURIComponent(userId)}` : '/api/brokers';
    const res = await fetch(url);
    return res.json();
  },

  async loginMT5Broker(payload: {
    server: string;
    login: string;
    password?: string;
    accountType?: 'REAL' | 'DEMO';
    brokerName?: string;
    accountName?: string;
    customName?: string;
    leverage?: string;
    currency?: string;
    balance?: number;
    autoTradeControl?: any;
    userId?: string;
    userEmail?: string;
  }): Promise<{ success: boolean; account: BrokerAccount; pingMs: number; message: string }> {
    const res = await fetch('/api/brokers/mt5/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async renameBrokerAccount(id: string, name: string): Promise<{ success: boolean; account: BrokerAccount; message?: string }> {
    const res = await fetch(`/api/brokers/${id}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },

  async updateMT5Control(payload: { accountId?: string; autoTradeControl: any }): Promise<any> {
    const res = await fetch('/api/brokers/mt5/update-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async closeAllMT5Positions(): Promise<any> {
    const res = await fetch('/api/brokers/mt5/close-all', { method: 'POST' });
    return res.json();
  },

  async connectBroker(payload: {
    broker: string;
    apiKey: string;
    isPaper: boolean;
    simulatedBalance?: number;
    server?: string;
    accountNumber?: string;
    leverage?: string;
    accountName?: string;
    customName?: string;
    userId?: string;
    userEmail?: string;
  }): Promise<any> {
    const res = await fetch('/api/brokers/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async disconnectBroker(id: string, userId?: string): Promise<any> {
    const url = userId ? `/api/brokers/${id}?userId=${encodeURIComponent(userId)}` : `/api/brokers/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
    return res.json();
  },

  async purgeAllBrokers(): Promise<{ success: boolean; count: number; brokerAccounts: BrokerAccount[]; botState: any }> {
    const res = await fetch('/api/brokers/purge-all', { method: 'POST' });
    return res.json();
  },

  async selectActiveBroker(accountId: string, userId?: string): Promise<{ success: boolean; activeAccount: BrokerAccount; botState: BotState }> {
    const res = await fetch('/api/brokers/select-active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, userId }),
    });
    return res.json();
  },

  async pauseBrokerServer(id: string, userId?: string): Promise<{ success: boolean; account: BrokerAccount; botState: BotState }> {
    const url = userId ? `/api/brokers/${id}/pause-server?userId=${encodeURIComponent(userId)}` : `/api/brokers/${id}/pause-server`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  async resumeBrokerServer(id: string, userId?: string): Promise<{ success: boolean; account: BrokerAccount; botState: BotState }> {
    const url = userId ? `/api/brokers/${id}/resume-server?userId=${encodeURIComponent(userId)}` : `/api/brokers/${id}/resume-server`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  async stopBrokerServer(id: string, userId?: string): Promise<{ success: boolean; account: BrokerAccount; botState: BotState }> {
    const url = userId ? `/api/brokers/${id}/stop-server?userId=${encodeURIComponent(userId)}` : `/api/brokers/${id}/stop-server`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  async pauseAllServers(userId?: string): Promise<{ success: boolean; botState: BotState; brokerAccounts: BrokerAccount[] }> {
    const url = userId ? `/api/brokers/server/pause-all?userId=${encodeURIComponent(userId)}` : `/api/brokers/server/pause-all`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  async runAllServersNonStop(userId?: string): Promise<{ success: boolean; botState: BotState; brokerAccounts: BrokerAccount[] }> {
    const url = userId ? `/api/brokers/server/run-all?userId=${encodeURIComponent(userId)}` : `/api/brokers/server/run-all`;
    const res = await fetch(url, { method: 'POST' });
    return res.json();
  },

  async syncBrokerAccounts(accounts: BrokerAccount[], userId?: string, userEmail?: string): Promise<{ success: boolean; accounts: BrokerAccount[]; botState: BotState }> {
    const res = await fetch('/api/brokers/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts, userId, userEmail }),
    });
    return res.json();
  },

  // Automated Tests
  async runAutomatedTests(): Promise<{ total: number; passed: number; failed: number; results: any[] }> {
    const res = await fetch('/api/tests/run', { method: 'POST' });
    return res.json();
  },

  // Admin & User
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/audit-logs');
    return res.json();
  },

  async getAdminTelemetry(adminEmail?: string): Promise<any> {
    const url = adminEmail ? `/api/admin/system-telemetry?adminEmail=${encodeURIComponent(adminEmail)}` : '/api/admin/system-telemetry';
    const res = await fetch(url);
    return res.json();
  },

  async adminGrantLicense(payload: {
    adminEmail: string;
    targetUserId: string;
    targetEmail: string;
    plan?: string;
    durationDays?: number;
    notes?: string;
  }): Promise<{ success: boolean; paymentId?: string; message: string }> {
    const res = await fetch('/api/admin/grant-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async adminRevokeLicense(payload: {
    adminEmail: string;
    targetUserId: string;
    targetEmail: string;
    reason?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/revoke-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async markNotificationsRead(): Promise<any> {
    const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
    return res.json();
  },

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch('/api/auth/profile');
    return res.json();
  },

  async updateUserSettings(data: any): Promise<any> {
    const res = await fetch('/api/auth/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 24/7 Offline Wealth Report
  async getOfflineReport(): Promise<{ success: boolean; offlineReport: import('../types').OfflineSessionStats | null }> {
    const res = await fetch('/api/offline-report');
    return res.json();
  },

  async dismissOfflineReport(): Promise<{ success: boolean }> {
    const res = await fetch('/api/offline-report/dismiss', { method: 'POST' });
    return res.json();
  },

  async getServerReport(brokerId: string): Promise<any> {
    const res = await fetch(`/api/brokers/${brokerId}/report`);
    return res.json();
  },

  async getEnterpriseReport(): Promise<any> {
    const res = await fetch('/api/reports/enterprise');
    return res.json();
  },

  // Trade Journal Review & Psychological Notes
  async updateTradeJournalReview(
    tradeId: string,
    review: Partial<TradeHistoryItem>
  ): Promise<{ success: boolean; trade: TradeHistoryItem }> {
    const res = await fetch(`/api/trades/${tradeId}/journal`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    return res.json();
  },

  // Macro Economic Calendar & News Blackout
  async getEconomicCalendar(): Promise<{ events: any[]; blackoutStatus: any }> {
    const res = await fetch('/api/economic/calendar');
    return res.json();
  },
};
