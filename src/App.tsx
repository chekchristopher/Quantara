import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { WorkbookView } from './components/WorkbookView';
import { TradingEngineView } from './components/TradingEngineView';
import { BacktestingView } from './components/BacktestingView';
import { StrategyLibraryView } from './components/StrategyLibraryView';
import { RiskManagementView } from './components/RiskManagementView';
import { AccountBrokerView } from './components/AccountBrokerView';
import { MicroAccountCompoundingView } from './components/MicroAccountCompoundingView';
import { SystemTestingView } from './components/SystemTestingView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { TradeExplanationModal } from './components/TradeExplanationModal';
import { LiveTradingConfirmationModal } from './components/LiveTradingConfirmationModal';
import { EnterpriseAuthModal } from './components/EnterpriseAuthModal';
import { LandingPageView } from './components/LandingPageView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { firestoreSync } from './services/firestoreSync';
import { QuantaraLogoMark } from './components/QuantaraLogo';
import { api, SnapshotData } from './services/api';
import {
  AuditLog,
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
  TradingMode,
  TradingSignal,
} from './types';

function QuantaraApp() {
  const { user, profile, cloudSyncStatus } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Core Application State
  const [botState, setBotState] = useState<BotState>({
    isRunning: false,
    status: 'AWAITING_BROKER_CONNECTION',
    mode: 'fully-automatic',
    environment: 'paper',
    activeStrategyId: 'adaptive-regime',
    activeStrategyName: 'Adaptive Regime Meta-Engine',
    selectedAssets: ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD'],
    tradesExecutedToday: 0,
    lastTickTimestamp: Date.now(),
    currentRegime: 'Market Feeds Active',
    activeRiskLevel: 'SAFE',
    autonomousTakeover: false,
    activeBrokerAccountId: undefined,
    activeBrokerAccountName: undefined,
  });

  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
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
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradesHistory, setTradesHistory] = useState<TradeHistoryItem[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({
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
    closePositionsOnKillSwitch: true,
  });
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modal State
  const [explanationTarget, setExplanationTarget] = useState<{ id: string; data?: any } | null>(null);
  const [showLiveConfirmation, setShowLiveConfirmation] = useState(false);

  // Subscribe to Realtime Server-Sent Events (SSE)
  useEffect(() => {
    // Load initial strategy metadata and live market assets immediately
    api.getStrategies().then(setStrategies).catch(console.warn);
    api.getAuditLogs().then(setAuditLogs).catch(console.warn);
    api.getMarketAssets().then(setAssets).catch(console.warn);

    // Reliable fallback poll every 2.5s for live price freshness
    const pollInterval = setInterval(() => {
      api.getMarketAssets().then(setAssets).catch(() => {});
    }, 2500);

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/stream');

      eventSource.onmessage = (event) => {
        try {
          const data: SnapshotData = JSON.parse(event.data);
          if (data.botState) setBotState(data.botState);
          if (data.portfolio) setPortfolio(data.portfolio);
          if (data.positions) setPositions(data.positions);
          if (data.orders) setOrders(data.orders);
          if (data.tradesHistory) setTradesHistory(data.tradesHistory);
          if (data.signals) setSignals(data.signals);
          if (data.notifications) setNotifications(data.notifications);
          if (data.assets) setAssets(data.assets);
          if (data.riskSettings) setRiskSettings(data.riskSettings);
          if (data.brokerAccounts) setBrokerAccounts(data.brokerAccounts);
        } catch (err) {
          console.error('Error parsing SSE snapshot:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, []);

  // Sync with Firestore Cloud Database for authenticated user
  useEffect(() => {
    if (!user?.uid) return;

    // Real-time risk settings subscription from Firestore
    const unsubRisk = firestoreSync.subscribeRiskSettings(user.uid, (cloudRisk) => {
      if (cloudRisk && Object.keys(cloudRisk).length > 0) {
        setRiskSettings((prev) => ({ ...prev, ...cloudRisk }));
      }
    });

    // Real-time broker profiles subscription from Firestore
    const unsubBrokers = firestoreSync.subscribeBrokers(user.uid, (cloudBrokers) => {
      if (cloudBrokers && cloudBrokers.length > 0) {
        setBrokerAccounts(cloudBrokers);
      }
    });

    return () => {
      unsubRisk();
      unsubBrokers();
    };
  }, [user?.uid]);

  // Sync trade history items into user's private Firestore journal
  const syncedTradeIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user?.uid || !tradesHistory.length) return;
    tradesHistory.forEach((trade) => {
      if (!syncedTradeIdsRef.current.has(trade.id)) {
        syncedTradeIdsRef.current.add(trade.id);
        firestoreSync.logJournalTrade(user.uid, trade).catch(console.warn);
      }
    });
  }, [user?.uid, tradesHistory]);

  // Action handlers
  const handleToggleBot = async () => {
    if (botState.isRunning) {
      await api.pauseBot();
      if (user?.uid) {
        firestoreSync.appendAuditLog(user.uid, {
          action: 'PAUSE_BOT',
          category: 'SYSTEM',
          details: `Trading bot paused for strategy: ${botState.activeStrategyName}`,
          severity: 'INFO',
        }).catch(console.warn);
      }
    } else {
      await api.startBot();
      if (user?.uid) {
        firestoreSync.appendAuditLog(user.uid, {
          action: 'START_BOT',
          category: 'SYSTEM',
          details: `Trading bot resumed in ${botState.mode} mode`,
          severity: 'INFO',
        }).catch(console.warn);
      }
    }
  };

  const handleTriggerKillSwitch = async () => {
    if (riskSettings.killSwitchActive) {
      await api.resetKillSwitch();
      if (user?.uid) {
        firestoreSync.appendAuditLog(user.uid, {
          action: 'RESET_KILL_SWITCH',
          category: 'KILL_SWITCH',
          details: 'Master kill switch deactivated by operator',
          severity: 'INFO',
        }).catch(console.warn);
      }
    } else {
      await api.engageKillSwitch('Emergency Stop Activated via Operator HUD', riskSettings.closePositionsOnKillSwitch);
      if (user?.uid) {
        firestoreSync.appendAuditLog(user.uid, {
          action: 'ENGAGE_KILL_SWITCH',
          category: 'KILL_SWITCH',
          details: 'Master emergency kill switch engaged - all open exposure halted',
          severity: 'CRITICAL',
        }).catch(console.warn);
      }
    }
  };

  const handleClosePosition = async (id: string) => {
    await api.closePosition(id);
    if (user?.uid) {
      firestoreSync.appendAuditLog(user.uid, {
        action: 'CLOSE_POSITION',
        category: 'TRADE',
        details: { positionId: id },
        severity: 'INFO',
      }).catch(console.warn);
    }
  };

  const handleEmergencyCloseAll = async () => {
    await api.emergencyCloseAllPositions();
    if (user?.uid) {
      firestoreSync.appendAuditLog(user.uid, {
        action: 'EMERGENCY_CLOSE_ALL',
        category: 'RISK',
        details: 'Emergency liquidation of all open portfolio positions requested',
        severity: 'CRITICAL',
      }).catch(console.warn);
    }
  };

  const handleSetTradingMode = async (mode: TradingMode) => {
    await api.setMode(mode);
  };

  const handleRequestLiveMode = () => {
    setShowLiveConfirmation(true);
  };

  const handleConfirmLiveMode = async () => {
    setShowLiveConfirmation(false);
    await api.setMode(botState.mode, 'live');
  };

  const handleSwitchToPaper = async () => {
    await api.setMode(botState.mode, 'paper');
  };

  const handleSelectActiveStrategy = async (id: string) => {
    await api.setStrategy(id);
  };

  const handleToggleStrategy = async (id: string, enabled: boolean) => {
    await api.toggleStrategy(id, enabled);
    const updated = await api.getStrategies();
    setStrategies(updated);
  };

  const handleUpdateStrategyParams = async (id: string, params: Record<string, any>) => {
    await api.updateStrategyParams(id, params);
    const updated = await api.getStrategies();
    setStrategies(updated);
  };

  const handleRunBacktest = async (req: any) => {
    const res = await api.runBacktest(req);
    return res.result;
  };

  const handleUpdateRiskSettings = async (settings: Partial<RiskSettings>) => {
    const res = await api.updateRiskSettings(settings);
    if (user?.uid) {
      const merged = { ...riskSettings, ...settings };
      firestoreSync.saveRiskSettings(user.uid, merged).catch(console.warn);
      firestoreSync.appendAuditLog(user.uid, {
        action: 'UPDATE_RISK_SETTINGS',
        category: 'RISK',
        details: { updatedKeys: Object.keys(settings) },
      }).catch(console.warn);
    }
    return res;
  };

  const handleConnectBroker = async (payload: any) => {
    const res = await api.connectBroker(payload);
    if (user?.uid && res?.account) {
      firestoreSync.saveBrokerProfile(user.uid, res.account).catch(console.warn);
    }
    return res;
  };

  const handleLoginMT5Broker = async (payload: any) => {
    const res = await api.loginMT5Broker(payload);
    const brokers = await api.getBrokerAccounts();
    if (Array.isArray(brokers)) {
      setBrokerAccounts(brokers);
      if (user?.uid) {
        brokers.forEach((b) => firestoreSync.saveBrokerProfile(user.uid, b).catch(console.warn));
        firestoreSync.appendAuditLog(user.uid, {
          action: 'MT5_BROKER_LOGIN',
          category: 'BROKER',
          details: { broker: payload.brokerName, server: payload.server, login: payload.login },
        }).catch(console.warn);
      }
    }
    const assetsData = await api.getMarketAssets();
    if (Array.isArray(assetsData)) setAssets(assetsData);
    return res;
  };

  const handleUpdateMT5Control = async (payload: any) => {
    const res = await api.updateMT5Control(payload);
    const brokers = await api.getBrokerAccounts();
    if (Array.isArray(brokers)) setBrokerAccounts(brokers);
    return res;
  };

  const handleCloseAllMT5 = async () => {
    const res = await api.closeAllMT5Positions();
    const snap = await api.getBrokerAccounts();
    if (Array.isArray(snap)) setBrokerAccounts(snap);
    setPositions([]);
    return res;
  };

  const handleDisconnectBroker = async (id: string) => {
    const res = await api.disconnectBroker(id);
    if (user?.uid) {
      firestoreSync.deleteBrokerProfile(user.uid, id).catch(console.warn);
      firestoreSync.appendAuditLog(user.uid, {
        action: 'DISCONNECT_BROKER',
        category: 'BROKER',
        details: { brokerId: id },
        severity: 'WARN',
      }).catch(console.warn);
    }
    return res;
  };

  const handleRenameBroker = async (id: string, name: string) => {
    const res = await api.renameBrokerAccount(id, name);
    const brokers = await api.getBrokerAccounts();
    if (Array.isArray(brokers)) {
      setBrokerAccounts(brokers);
      if (user?.uid) {
        const renamed = brokers.find((b) => b.id === id);
        if (renamed) firestoreSync.saveBrokerProfile(user.uid, renamed).catch(console.warn);
        firestoreSync.appendAuditLog(user.uid, {
          action: 'RENAME_BROKER',
          category: 'BROKER',
          details: { brokerId: id, newName: name },
        }).catch(console.warn);
      }
    }
    return res;
  };

  const handleRunTests = async () => {
    return api.runAutomatedTests();
  };

  const handlePlaceManualOrder = async (order: any) => {
    return api.placeManualOrder(order);
  };

  const handleInjectMarketShock = async (symbol: string, dropPercent: number) => {
    return api.injectMarketShock(symbol, dropPercent);
  };

  const handleMarkNotificationsRead = async () => {
    await api.markNotificationsRead();
  };

  const handleToggleTakeover = async () => {
    const nextVal = !botState.autonomousTakeover;
    const res = await api.toggleTakeover(nextVal);
    if (res?.botState) {
      setBotState(res.botState);
    }
  };

  const handleResetCapital = async (amount: number, isChallenge?: boolean) => {
    const res = await api.resetCapital(amount, isChallenge);
    if (res?.portfolio) setPortfolio(res.portfolio);
    if (res?.botState) setBotState(res.botState);
    // Refresh broker accounts
    const brokers = await api.getBrokerAccounts();
    if (Array.isArray(brokers)) setBrokerAccounts(brokers);
  };

  const handleUpdateCompounding = async (payload: { mode: 'standard' | 'micro-wealth-accelerator'; target?: number; asymmetricFilter?: boolean }) => {
    const res = await api.setCompoundingMode(payload);
    if (res?.botState) setBotState(res.botState);
  };

  const handleSelectActiveBroker = async (accountId: string) => {
    const res = await api.selectActiveBroker(accountId);
    if (res?.botState) setBotState(res.botState);
    const brokers = await api.getBrokerAccounts();
    if (Array.isArray(brokers)) setBrokerAccounts(brokers);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] flex flex-col antialiased selection:bg-blue-600/30 selection:text-blue-300">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        botState={botState}
        riskSettings={riskSettings}
        notifications={notifications}
        onToggleBot={handleToggleBot}
        onToggleTakeover={handleToggleTakeover}
        onTriggerKillSwitch={handleTriggerKillSwitch}
        onRequestLiveMode={handleRequestLiveMode}
        onSwitchToPaper={handleSwitchToPaper}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8 space-y-6">
        {currentTab === 'landing' && (
          <LandingPageView
            onNavigateTab={setCurrentTab}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            portfolio={portfolio}
            botState={botState}
            positions={positions}
            orders={orders}
            tradesHistory={tradesHistory}
            assets={assets}
            riskSettings={riskSettings}
            brokerAccounts={brokerAccounts}
            onClosePosition={handleClosePosition}
            onEmergencyCloseAll={handleEmergencyCloseAll}
            onSetTradingMode={handleSetTradingMode}
            onPlaceManualOrder={handlePlaceManualOrder}
            onOpenExplanationModal={(id, data) => setExplanationTarget({ id, data })}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'workbook' && (
          <WorkbookView onNavigateTab={setCurrentTab} />
        )}

        {currentTab === 'compounding' && (
          <MicroAccountCompoundingView
            portfolio={portfolio}
            botState={botState}
            brokerAccounts={brokerAccounts}
            recentTrades={tradesHistory}
            openPositions={positions}
            onResetCapital={handleResetCapital}
            onToggleTakeover={handleToggleTakeover}
            onUpdateCompounding={handleUpdateCompounding}
            onSelectBrokerForTakeover={handleSelectActiveBroker}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'engine' && (
          <TradingEngineView
            botState={botState}
            signals={signals}
            assets={assets}
            riskSettings={riskSettings}
            onInjectMarketShock={handleInjectMarketShock}
            onOpenExplanationModal={(id, sig) => setExplanationTarget({ id, data: sig })}
          />
        )}

        {currentTab === 'backtesting' && (
          <BacktestingView
            strategies={strategies}
            onRunBacktest={handleRunBacktest}
          />
        )}

        {currentTab === 'strategies' && (
          <StrategyLibraryView
            strategies={strategies}
            activeStrategyId={botState.activeStrategyId}
            onSelectActiveStrategy={handleSelectActiveStrategy}
            onToggleStrategy={handleToggleStrategy}
            onUpdateParams={handleUpdateStrategyParams}
          />
        )}

        {currentTab === 'risk' && (
          <RiskManagementView
            riskSettings={riskSettings}
            portfolio={portfolio}
            onUpdateRiskSettings={handleUpdateRiskSettings}
            onTriggerKillSwitch={handleTriggerKillSwitch}
            onResetKillSwitch={handleTriggerKillSwitch}
          />
        )}

        {currentTab === 'brokers' && (
          <AccountBrokerView
            brokerAccounts={brokerAccounts}
            activeBrokerAccountId={botState.activeBrokerAccountId}
            autonomousTakeover={botState.autonomousTakeover}
            positions={positions}
            orders={orders}
            portfolio={portfolio}
            assets={assets}
            onLoginMT5={handleLoginMT5Broker}
            onUpdateMT5Control={handleUpdateMT5Control}
            onCloseAllMT5={handleCloseAllMT5}
            onPlaceManualOrder={handlePlaceManualOrder}
            onClosePosition={handleClosePosition}
            onConnectBroker={handleConnectBroker}
            onDisconnectBroker={handleDisconnectBroker}
            onSelectActiveBroker={handleSelectActiveBroker}
            onRenameBroker={handleRenameBroker}
            onToggleTakeover={handleToggleTakeover}
          />
        )}

        {currentTab === 'testing' && (
          <SystemTestingView onRunTests={handleRunTests} />
        )}

        {currentTab === 'admin' && (
          <AdminDashboardView
            auditLogs={auditLogs}
            botState={botState}
            portfolio={portfolio}
          />
        )}
      </main>

      {/* Trade & AI Transparency Modal */}
      {explanationTarget && (
        <TradeExplanationModal
          tradeOrSignalId={explanationTarget.id}
          customData={explanationTarget.data}
          onClose={() => setExplanationTarget(null)}
        />
      )}

      {/* Live Trading Warning Modal */}
      <LiveTradingConfirmationModal
        isOpen={showLiveConfirmation}
        onConfirm={handleConfirmLiveMode}
        onCancel={() => setShowLiveConfirmation(false)}
      />

      {/* Enterprise Authentication & Gmail Login Modal */}
      <EnterpriseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Status Bar Footer */}
      <footer className="border-t border-[#1F1F23] bg-[#0E0E11] py-3 px-4 sm:px-8 text-xs font-mono text-[#8E9299]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-[#10B981]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
              ENGINE TICK: ONLINE (1,500ms)
            </span>
            <span className="text-[#1F1F23]">|</span>
            <span>ACTIVE STRATEGY: {botState.activeStrategyName}</span>
            <span className="text-[#1F1F23]">|</span>
            <span>MODE: {botState.mode.toUpperCase()} ({botState.environment.toUpperCase()})</span>
            <span className="text-[#1F1F23]">|</span>
            <span className="text-blue-400">FIRESTORE: quantara-261d0 ({cloudSyncStatus.toUpperCase()})</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#8E9299]">
            <QuantaraLogoMark size="sm" showGlow={false} className="w-5 h-5 mr-0.5" />
            <span className="font-brand text-xs font-bold tracking-[0.16em] text-white">QUANT<span className="text-blue-400">ARA</span></span>
            <span className="text-[#2E2E33]">—</span>
            <span className="font-tech text-xs tracking-wide">Intelligent Trading. Automated Execution.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QuantaraApp />
    </AuthProvider>
  );
}

