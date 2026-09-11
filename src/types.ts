export type TradingMode = 'manual' | 'semi-automatic' | 'fully-automatic';
export type EnvironmentMode = 'paper' | 'live';
export type MarketRegimeType = 
  | 'Strong Bullish Trend'
  | 'Strong Bearish Trend'
  | 'Weak Bullish Trend'
  | 'Weak Bearish Trend'
  | 'Ranging / Consolidation'
  | 'High Volatility'
  | 'Low Volatility'
  | 'Neutral / Choppy';

export type SignalDirection = 'BUY' | 'SELL' | 'HOLD';
export type PositionSide = 'LONG' | 'SHORT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP';

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  atr: number;
  adx: number;
  volumeSma: number;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  category: 'crypto' | 'stocks' | 'forex' | 'commodities';
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volatilityAtrPercent: number;
  currentRegime: MarketRegimeType;
  history: OHLCV[];
  indicators: TechnicalIndicators;
}

export interface StrategyConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  idealMarketRegimes: MarketRegimeType[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  parameters: Record<string, number | string | boolean>;
  historicalStats: {
    winRate: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    netProfitPercent: number;
  };
}

export interface RiskSettings {
  maxRiskPerTradePercent: number; // e.g. 1.0%
  maxDailyLossPercent: number; // e.g. 3.0%
  maxWeeklyLossPercent: number; // e.g. 7.0%
  maxAccountDrawdownPercent: number; // e.g. 10.0%
  maxOpenPositions: number; // e.g. 5
  maxExposurePerAssetPercent: number; // e.g. 25%
  maxPortfolioExposurePercent: number; // e.g. 80%
  maxLeverage: number; // e.g. 3x
  defaultStopLossAtrMultiplier: number; // e.g. 1.5
  defaultTakeProfitRiskReward: number; // e.g. 2.0
  trailingStopEnabled: boolean;
  trailingStopPercent: number; // e.g. 1.5%
  killSwitchActive: boolean;
  killSwitchTriggerReason?: string;
  closePositionsOnKillSwitch: boolean;
}

export interface TradingSignal {
  id: string;
  timestamp: number;
  assetSymbol: string;
  direction: SignalDirection;
  strategyId: string;
  strategyName: string;
  marketRegime: MarketRegimeType;
  confidenceScore: number; // 0 - 100
  entryPrice: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  riskRewardRatio: number;
  recommendedPositionSizeUsd: number;
  reasons: string[];
  aiAnalysis?: {
    summary: string;
    anomalyDetected: boolean;
    anomalyNote?: string;
    macroContext: string;
    tradeQualityGrade: 'A+' | 'A' | 'B' | 'C' | 'REJECT';
  };
  passedRiskChecks: boolean;
  riskRejectionReason?: string;
}

export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: PositionSide;
  size: number; // quantity
  sizeUsd: number;
  entryPrice: number;
  currentPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  trailingStopPrice?: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  strategyId: string;
  strategyName: string;
  openedAt: number;
  environment: EnvironmentMode;
  explanationId?: string;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  type: OrderType;
  side: PositionSide;
  direction: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  stopPrice?: number;
  status: OrderStatus;
  filledQuantity: number;
  averageFillPrice?: number;
  feesUsd: number;
  slippagePercent: number;
  createdAt: number;
  filledAt?: number;
  environment: EnvironmentMode;
  strategyName: string;
  idempotencyKey: string;
}

export interface TradeHistoryItem {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  feesPaid: number;
  strategyName: string;
  entryTime: number;
  exitTime: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'KILL_SWITCH' | 'MANUAL' | 'SIGNAL_REVERSAL';
  environment: EnvironmentMode;
  tradeExplanation: string;
}

export interface PortfolioSummary {
  totalEquity: number;
  cashBalance: number;
  unrealizedPnl: number;
  realizedPnlToday: number;
  totalRealizedPnl: number;
  todayPnlPercent: number;
  totalReturnPercent: number;
  maxDrawdownPercent: number;
  currentDrawdownPercent: number;
  winRatePercent: number;
  profitFactor: number;
  totalTradesExecuted: number;
  activePositionsCount: number;
  currentExposureUsd: number;
  currentExposurePercent: number;
  peakEquity: number;
}

export interface BotState {
  isRunning: boolean;
  status: 'ONLINE' | 'PAUSED' | 'STOPPED' | 'KILL_SWITCH_ENGAGED';
  mode: TradingMode;
  environment: EnvironmentMode;
  activeStrategyId: string;
  activeStrategyName: string;
  selectedAssets: string[];
  tradesExecutedToday: number;
  lastTickTimestamp: number;
  currentRegime: MarketRegimeType;
  activeRiskLevel: 'SAFE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
}

export interface BrokerAccount {
  id: string;
  name: string;
  broker: 'Binance' | 'Coinbase Pro' | 'Alpaca' | 'Interactive Brokers' | 'Kraken' | 'Bybit';
  apiKeyMasked: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'TESTNET_ACTIVE';
  permissions: string[];
  accountNumber: string;
  simulatedBalance: number;
  isPaper: boolean;
  lastConnected: number;
}

export interface NotificationItem {
  id: string;
  timestamp: number;
  type: 'TRADE_OPEN' | 'TRADE_CLOSE' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'KILL_SWITCH' | 'RISK_ALERT' | 'SYSTEM' | 'AI_INSIGHT';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  read: boolean;
  linkId?: string;
}

export interface BacktestRequest {
  symbol: string;
  strategyId: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  days: number;
  startingCapital: number;
  riskPerTradePercent: number;
  feeRatePercent: number;
  slippagePercent: number;
  strategyParams?: Record<string, number | string | boolean>;
}

export interface BacktestResult {
  id: string;
  symbol: string;
  strategyName: string;
  timeframe: string;
  days: number;
  startingCapital: number;
  endingCapital: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPercent: number;
  maxDrawdownUsd: number;
  avgTradeReturnPercent: number;
  avgWinUsd: number;
  avgLossUsd: number;
  maxConsecutiveLosses: number;
  equityCurve: { time: string; equity: number; drawdownPercent: number }[];
  trades: {
    id: string;
    entryTime: string;
    exitTime: string;
    side: PositionSide;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
    exitReason: string;
  }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  twoFactorEnabled: boolean;
  createdTime: number;
  preferences: {
    theme: 'dark' | 'light';
    currency: 'USD' | 'EUR' | 'GBP';
    notifications: {
      inApp: boolean;
      email: boolean;
      telegram: boolean;
      discordWebhookUrl?: string;
    };
  };
}

export interface AuditLog {
  id: string;
  timestamp: number;
  category: 'AUTH' | 'TRADE' | 'RISK' | 'KILL_SWITCH' | 'CONFIG' | 'BROKER' | 'SYSTEM';
  actor: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  ipAddress?: string;
}

export interface SystemHealth {
  status: 'OPTIMAL' | 'DEGRADED' | 'MAINTENANCE';
  uptimeSeconds: number;
  memoryUsageMb: number;
  tradingEngineLatencyMs: number;
  marketDataFeedLatencyMs: number;
  geminiAiServiceStatus: 'ACTIVE' | 'OFFLINE_FALLBACK' | 'RATE_LIMITED';
  activeConnectionsCount: number;
  ordersProcessedTotal: number;
  circuitBreakerTripped: boolean;
}
