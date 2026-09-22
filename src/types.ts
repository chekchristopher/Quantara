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
  bidPrice?: number;
  askPrice?: number;
  spreadPips?: number;
  pipValue?: number;
  digits?: number;
  source?: string;
  lastLiveUpdate?: number;
  isRecommended?: boolean;
  badge?: string;
  recommendationReason?: string;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPercent: number; // 0 to 100
  orderCount?: number;
  isSignificantWall?: boolean;
  densityScore: number; // 0.0 to 1.0 (relative concentration)
  volatilityImpact: number; // 0.0 to 1.0 (volatility shock index)
  isPriceGap?: boolean; // Thin liquidity / air pocket
  liquidityTier: 'WALL' | 'HIGH' | 'NORMAL' | 'THIN' | 'GAP';
}

export interface HeatmapHistoricalFrame {
  timestamp: number;
  midPrice: number;
  levels: {
    price: number;
    size: number;
    densityScore: number;
    side: 'BID' | 'ASK';
    isGap: boolean;
    isWall: boolean;
  }[];
}

export interface OrderBookDepthData {
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPips: number;
  midPrice: number;
  totalBidVolume: number;
  totalAskVolume: number;
  bidRatio: number; // 0 to 100
  askRatio: number; // 0 to 100
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  imbalanceDelta: number; // positive = bid heavy, negative = ask heavy
  depthLevelsCount: number;
  topBidWall?: number;
  topAskWall?: number;
  volatilityIndex: number; // ATR/Regime based volatility pressure (0 - 100)
  liquidityGapsCount: number; // count of detected low liquidity air pockets
  maxLevelDensity: number;
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
  lotSize: number; // Institutional MT5 lot size (strictly between 0.01 and 0.10 depending on equity)
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
  serverId?: string;
  serverName?: string;
  accountNumber?: string;
  brokerName?: string;
  realExecution?: boolean;
  ticketNumber?: number;
  brokerFillPrice?: number;
  brokerExecutionStatus?: 'PENDING_TERMINAL' | 'FILLED_ON_MT5' | 'SIMULATED';
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  type: OrderType;
  side: PositionSide;
  direction: 'BUY' | 'SELL';
  lotSize?: number; // Institutional lot size (0.01 - 0.10)
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
  serverId?: string;
  serverName?: string;
  accountNumber?: string;
  realExecution?: boolean;
  ticketNumber?: number;
}

export type DisciplineRating = 1 | 2 | 3 | 4 | 5;

export type EmotionalState =
  | 'CALM_FOCUSED'
  | 'DISCIPLINED'
  | 'PATIENT'
  | 'FOMO_IMPATIENT'
  | 'ANXIOUS_HESITANT'
  | 'OVERCONFIDENT'
  | 'REVENGE_BIAS'
  | 'FATIGUED';

export type PlanAdherence = 'STRICT_YES' | 'MINOR_DEVIATION' | 'BREACHED_RULES';

export interface TradeHistoryItem {
  id: string;
  symbol: string;
  side: PositionSide;
  lotSize?: number; // Institutional lot size taken (0.01 - 0.10)
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  feesPaid: number;
  strategyName: string;
  accountName?: string;
  serverId?: string;
  serverName?: string;
  accountNumber?: string;
  brokerName?: string;
  entryTime: number;
  exitTime: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'KILL_SWITCH' | 'MANUAL' | 'SIGNAL_REVERSAL';
  environment: EnvironmentMode;
  tradeExplanation: string;
  realExecution?: boolean;
  ticketNumber?: number;

  // Psychological discipline & subjective strategy review
  disciplineRating?: DisciplineRating;
  emotionalState?: EmotionalState;
  followedPlan?: PlanAdherence;
  mistakeTags?: string[];
  subjectiveNotes?: string;
  lessonsLearned?: string;
  targetSetupQuality?: 'A+' | 'A' | 'B' | 'C' | 'D';
  psychologyReviewCompleted?: boolean;
  reviewedAt?: number;
  notes?: string;
}

export interface TradeJournalEntry {
  id: string;
  tradeId: string;
  userId?: string;
  symbol: string;
  direction: PositionSide;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  strategyName: string;
  status: 'CLOSED' | 'OPEN';
  openedAt: string;
  closedAt?: string;

  disciplineRating?: DisciplineRating;
  emotionalState?: EmotionalState;
  followedPlan?: PlanAdherence;
  mistakeTags?: string[];
  subjectiveNotes?: string;
  lessonsLearned?: string;
  targetSetupQuality?: 'A+' | 'A' | 'B' | 'C' | 'D';
  psychologyReviewCompleted?: boolean;
  reviewedAt?: string | number;
  notes?: string;
}

export interface PortfolioRealizedPnlPoint {
  time: string;
  timestamp: number;
  realizedPnlToday: number;
  delta?: number;
  symbol?: string;
  exitReason?: string;
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
  realizedPnlTodayHistory?: PortfolioRealizedPnlPoint[];
}

export interface BotState {
  isRunning: boolean;
  status: 'ONLINE' | 'PAUSED' | 'STOPPED' | 'KILL_SWITCH_ENGAGED' | 'AWAITING_BROKER_CONNECTION';
  mode: TradingMode;
  environment: EnvironmentMode;
  activeStrategyId: string;
  activeStrategyName: string;
  selectedAssets: string[];
  tradesExecutedToday: number;
  lastTickTimestamp: number;
  currentRegime: MarketRegimeType;
  activeRiskLevel: 'SAFE' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  autonomousTakeover: boolean;
  activeBrokerAccountId?: string;
  activeBrokerAccountName?: string;
  compoundingMode: 'standard' | 'micro-wealth-accelerator';
  initialSeedCapital: number;
  microAccountTarget: number;
  asymmetricFilterEnabled: boolean;
  serverEngineStatus?: 'RUNNING' | 'PAUSED' | 'STOPPED';
  serverUptimeSeconds?: number;
  isNonStopLoop?: boolean;
  offlineSessionStats?: OfflineSessionStats;
  realBrokerExecutionEnabled?: boolean;
  realExecutionMode?: 'SIMULATED' | 'REAL_BROKER';
  activeBridgeConnected?: boolean;
}

export interface OfflineTradeRecord {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  exitReason: string;
  exitTime: number;
  strategyName: string;
  accountName?: string;
}

export interface OfflineSessionStats {
  hasUnseenReport: boolean;
  wentOfflineAt: number;
  returnedAt: number;
  offlineDurationSeconds: number;
  tradesExecutedOffline: number;
  realizedPnlOffline: number;
  winningTradesOffline: number;
  losingTradesOffline: number;
  startingBalance: number;
  endingBalance: number;
  trades: OfflineTradeRecord[];
  activeServerAccounts: string[];
}

export interface CompoundingMilestone {
  id: string;
  stage: number;
  title: string;
  targetBalance: number;
  phase: string;
  description: string;
  achieved: boolean;
  progressPercent: number;
}

export interface MT5TradeControlConfig {
  autoTradeEnabled: boolean;
  prioritizeGold: boolean;
  riskPerTradePercent: number;
  lotSizeMode: 'DYNAMIC' | 'FIXED';
  fixedLotSize: number;
  maxOpenTrades: number;
  dailyLossHaltPercent: number;
  trailingStopPips: number;
  takeProfitRatio: number;
}

export interface BrokerAccount {
  id: string;
  name: string;
  broker: string;
  server?: string;
  accountNumber: string;
  accountType?: 'REAL' | 'DEMO';
  leverage?: string;
  currency?: string;
  apiKeyMasked: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'TESTNET_ACTIVE';
  permissions: string[];
  simulatedBalance: number;
  equity?: number;
  freeMargin?: number;
  marginLevel?: number;
  pingMs?: number;
  terminalVersion?: string;
  isPaper: boolean;
  lastConnected: number;
  isActiveForTakeover?: boolean;
  autoTradeControl?: MT5TradeControlConfig;
  serverStatus?: 'RUNNING' | 'PAUSED' | 'STOPPED';
  isNonStop?: boolean;
  savedInSystem?: boolean;
  connectedAt?: number;
  uptimeSeconds?: number;
  lastExecutionTick?: number;
  tradesCount?: number;
  pnlRealized?: number;
  // Enterprise Connected Server & Firebase Security Metadata
  serverHost?: string;
  protocol?: string;
  encryptionLevel?: string;
  securityHash?: string;
  isSecuredInFirebase?: boolean;
  lastCloudSyncTimestamp?: number;
  winningTradesCount?: number;
  losingTradesCount?: number;
  winRatePercent?: number;
  profitFactor?: number;
  lotsTradedTotal?: number;
  peakBalance?: number;
  drawdownPercent?: number;
  // Real MT5 Terminal Bridge Protocol
  bridgeToken?: string;
  executionMode?: 'SIMULATED' | 'REAL_BROKER';
  isTerminalConnected?: boolean;
  lastTerminalPing?: number;
  terminalBuild?: string;
  realOrdersExecutedCount?: number;
  realTickets?: number[];
}

export interface RealExecutionEvent {
  id: string;
  timestamp: number;
  type: 'DISPATCH' | 'FILL' | 'CLOSE' | 'SYNC' | 'ERROR' | 'REJECT';
  message: string;
  ticket?: number;
  symbol: string;
  lotSize: number;
  price?: number;
  pnl?: number;
  source: 'MQL5_EA_BRIDGE' | 'METAAPI_CLOUD' | 'BROKER_WEBHOOK';
}

export interface RealBrokerBridgeStatus {
  enabled: boolean;
  activeMode: 'SIMULATED' | 'REAL_BROKER';
  connectedTerminalsCount: number;
  terminals: {
    accountId: string;
    accountNumber: string;
    server: string;
    broker: string;
    bridgeToken: string;
    isOnline: boolean;
    pingMs: number;
    terminalBuild: string;
    lastPingTime: number;
    balance: number;
    equity: number;
  }[];
  pendingOrdersCount: number;
  realOrdersExecutedCount: number;
  cloudMetaApiConfigured: boolean;
  cloudWebhookConfigured: boolean;
  recentEvents: RealExecutionEvent[];
}

export interface ServerAccountReport {
  id: string;
  serverId: string;
  serverName: string;
  broker: string;
  accountNumber: string;
  accountType: 'REAL' | 'DEMO';
  currency: string;
  leverage: string;
  generatedAt: number;
  serverTelemetry: {
    host: string;
    protocol: string;
    pingMs: number;
    encryption: string;
    status: string;
    uptimeHours: number;
    securityHash: string;
    cloudDatabase: string;
    isSecuredInFirebase: boolean;
    lastSyncedAt: number;
  };
  financialSummary: {
    initialBalance: number;
    currentBalance: number;
    totalEquity: number;
    netProfitUsd: number;
    returnPercent: number;
    peakBalance: number;
    freeMargin: number;
    marginLevel: number;
    maxDrawdownPercent: number;
  };
  executionSummary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRatePercent: number;
    profitFactor: number;
    averageWinUsd: number;
    averageLossUsd: number;
    bestTradeUsd: number;
    worstTradeUsd: number;
    totalLotsTraded: number;
    averageLotSize: number;
  };
  trades: TradeHistoryItem[];
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
