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

  // Risk Settings
  async updateRiskSettings(settings: Partial<RiskSettings>): Promise<{ success: boolean; riskSettings: RiskSettings }> {
    const res = await fetch('/api/risk/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Brokers
  async connectBroker(payload: { broker: string; apiKey: string; isPaper: boolean; simulatedBalance?: number }): Promise<any> {
    const res = await fetch('/api/brokers/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async disconnectBroker(id: string): Promise<any> {
    const res = await fetch(`/api/brokers/${id}`, { method: 'DELETE' });
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
};
