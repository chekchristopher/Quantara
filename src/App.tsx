import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TradingEngineView } from './components/TradingEngineView';
import { BacktestingView } from './components/BacktestingView';
import { StrategyLibraryView } from './components/StrategyLibraryView';
import { RiskManagementView } from './components/RiskManagementView';
import { AccountBrokerView } from './components/AccountBrokerView';
import { SystemTestingView } from './components/SystemTestingView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { TradeExplanationModal } from './components/TradeExplanationModal';
import { LiveTradingConfirmationModal } from './components/LiveTradingConfirmationModal';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Application State
  const [botState, setBotState] = useState<BotState>({
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
  });

  const [portfolio, setPortfolio] = useState<PortfolioSummary>({
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
    // Load initial strategy metadata
    api.getStrategies().then(setStrategies).catch(console.warn);
    api.getAuditLogs().then(setAuditLogs).catch(console.warn);

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
      if (eventSource) eventSource.close();
    };
  }, []);

  // Action handlers
  const handleToggleBot = async () => {
    if (botState.isRunning) {
      await api.pauseBot();
    } else {
      await api.startBot();
    }
  };

  const handleTriggerKillSwitch = async () => {
    if (riskSettings.killSwitchActive) {
      await api.resetKillSwitch();
    } else {
      await api.engageKillSwitch('Emergency Stop Activated via Operator HUD', riskSettings.closePositionsOnKillSwitch);
    }
  };

  const handleClosePosition = async (id: string) => {
    await api.closePosition(id);
  };

  const handleEmergencyCloseAll = async () => {
    await api.emergencyCloseAllPositions();
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
    return api.updateRiskSettings(settings);
  };

  const handleConnectBroker = async (payload: any) => {
    return api.connectBroker(payload);
  };

  const handleDisconnectBroker = async (id: string) => {
    return api.disconnectBroker(id);
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
        onTriggerKillSwitch={handleTriggerKillSwitch}
        onRequestLiveMode={handleRequestLiveMode}
        onSwitchToPaper={handleSwitchToPaper}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            portfolio={portfolio}
            botState={botState}
            positions={positions}
            orders={orders}
            tradesHistory={tradesHistory}
            assets={assets}
            riskSettings={riskSettings}
            onClosePosition={handleClosePosition}
            onEmergencyCloseAll={handleEmergencyCloseAll}
            onSetTradingMode={handleSetTradingMode}
            onPlaceManualOrder={handlePlaceManualOrder}
            onOpenExplanationModal={(id, data) => setExplanationTarget({ id, data })}
            onNavigateTab={setCurrentTab}
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
            onConnectBroker={handleConnectBroker}
            onDisconnectBroker={handleDisconnectBroker}
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
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-[#8E9299]">
            <span className="text-white font-semibold">Quantara</span>
            <span>—</span>
            <span>Intelligent Trading. Automated Execution.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
