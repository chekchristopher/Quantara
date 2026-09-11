import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  DollarSign,
  HelpCircle,
  Maximize2,
  MinusCircle,
  Percent,
  PlusCircle,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
} from 'recharts';
import {
  BotState,
  MarketAsset,
  Order,
  PortfolioSummary,
  Position,
  RiskSettings,
  TradeHistoryItem,
  TradingMode,
} from '../types';

interface DashboardViewProps {
  portfolio: PortfolioSummary;
  botState: BotState;
  positions: Position[];
  orders: Order[];
  tradesHistory: TradeHistoryItem[];
  assets: MarketAsset[];
  riskSettings: RiskSettings;
  onClosePosition: (id: string) => void;
  onEmergencyCloseAll: () => void;
  onSetTradingMode: (mode: TradingMode) => void;
  onPlaceManualOrder: (order: { symbol: string; side: 'LONG' | 'SHORT'; quantity: number; stopLoss?: number; takeProfit?: number }) => void;
  onOpenExplanationModal: (tradeOrSignalId: string, customData?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portfolio,
  botState,
  positions,
  orders,
  tradesHistory,
  assets,
  riskSettings,
  onClosePosition,
  onEmergencyCloseAll,
  onSetTradingMode,
  onPlaceManualOrder,
  onOpenExplanationModal,
  onNavigateTab,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(assets[0]?.symbol || 'BTC/USD');
  const [activeTimeframe, setActiveTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('1m');
  const [showIndicators, setShowIndicators] = useState<{ ema: boolean; bb: boolean; rsi: boolean }>({
    ema: true,
    bb: true,
    rsi: true,
  });

  // Manual trade form state
  const [manualSide, setManualSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [manualQuantity, setManualQuantity] = useState<number>(0.1);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];

  // Chart data formatting
  const chartData = selectedAsset
    ? selectedAsset.history.map((c, i) => {
        const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          time: timeStr,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          ema20: selectedAsset.indicators.ema20,
          ema50: selectedAsset.indicators.ema50,
          bbUpper: selectedAsset.indicators.bollinger.upper,
          bbLower: selectedAsset.indicators.bollinger.lower,
          bbMiddle: selectedAsset.indicators.bollinger.middle,
        };
      })
    : [];

  const handleManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsSubmittingOrder(true);
    try {
      const sl = manualSide === 'LONG' ? selectedAsset.currentPrice * 0.985 : selectedAsset.currentPrice * 1.015;
      const tp = manualSide === 'LONG' ? selectedAsset.currentPrice * 1.035 : selectedAsset.currentPrice * 0.965;
      await onPlaceManualOrder({
        symbol: selectedAsset.symbol,
        side: manualSide,
        quantity: manualQuantity,
        stopLoss: Number(sl.toFixed(selectedAsset.currentPrice > 10 ? 2 : 4)),
        takeProfit: Number(tp.toFixed(selectedAsset.currentPrice > 10 ? 2 : 4)),
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP INSTITUTIONAL METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Equity */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Total Equity</span>
            <DollarSign className="h-4 w-4 text-[#10B981]" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            ${portfolio.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span>Cash: ${portfolio.cashBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Today's P&L */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Today's P&L</span>
            {portfolio.realizedPnlToday >= 0 ? (
              <TrendingUp className="h-4 w-4 text-[#10B981]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[#EF4444]" />
            )}
          </div>
          <div
            className={`mt-2 font-mono text-2xl font-bold ${
              portfolio.realizedPnlToday >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {portfolio.realizedPnlToday >= 0 ? '+' : ''}${portfolio.realizedPnlToday.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span className={portfolio.todayPnlPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
              {portfolio.todayPnlPercent >= 0 ? '+' : ''}{portfolio.todayPnlPercent}%
            </span>
            <span className="ml-1 text-[#71717A]">vs daily cap {riskSettings.maxDailyLossPercent}%</span>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Unrealized P&L</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div
            className={`mt-2 font-mono text-2xl font-bold ${
              portfolio.unrealizedPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {portfolio.unrealizedPnl >= 0 ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span>{positions.length} open position{positions.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Current Drawdown */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Drawdown</span>
            <Shield className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-yellow-400">
            {portfolio.currentDrawdownPercent.toFixed(2)}%
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span>Max DD limit: {riskSettings.maxAccountDrawdownPercent}%</span>
          </div>
        </div>

        {/* Win Rate & Profit Factor */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Win Rate / PF</span>
            <Percent className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {portfolio.winRatePercent}% <span className="text-xs text-[#8E9299] font-normal">/ {portfolio.profitFactor}x</span>
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span>{portfolio.totalTradesExecuted} closed executions</span>
          </div>
        </div>

        {/* Portfolio Exposure */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Exposure</span>
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {portfolio.currentExposurePercent}%
          </div>
          <div className="mt-1 flex items-center text-xs font-mono text-[#8E9299]">
            <span>${portfolio.currentExposureUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} deployed</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN TERMINAL GRID: CHART + BOT CONTROLLER & QUICK TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Price Chart & Indicators (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
          {/* Asset Tabs & Real-time Quote Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F1F23]">
            {/* Symbol Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              {assets.map((asset) => {
                const isSelected = asset.symbol === selectedSymbol;
                const isPos = positions.some((p) => p.symbol === asset.symbol);
                return (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedSymbol(asset.symbol)}
                    className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#1F1F23] text-[#8E9299] hover:bg-[#27272A] hover:text-white border border-transparent'
                    }`}
                  >
                    <span>{asset.symbol}</span>
                    {isPos && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Timeframe & Overlays */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-0.5 text-xs font-mono">
                {(['1m', '5m', '15m', '1h'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      activeTimeframe === tf ? 'bg-[#1F1F23] text-white font-bold' : 'text-[#8E9299] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Indicator toggle pills */}
              <div className="flex items-center space-x-1 text-xs font-mono">
                <button
                  onClick={() => setShowIndicators((p) => ({ ...p, ema: !p.ema }))}
                  className={`rounded-md px-2 py-1 border transition-colors ${
                    showIndicators.ema ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' : 'border-[#1F1F23] text-[#8E9299] hover:text-white'
                  }`}
                >
                  EMA
                </button>
                <button
                  onClick={() => setShowIndicators((p) => ({ ...p, bb: !p.bb }))}
                  className={`rounded-md px-2 py-1 border transition-colors ${
                    showIndicators.bb ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-[#1F1F23] text-[#8E9299] hover:text-white'
                  }`}
                >
                  BB
                </button>
                <button
                  onClick={() => setShowIndicators((p) => ({ ...p, rsi: !p.rsi }))}
                  className={`rounded-md px-2 py-1 border transition-colors ${
                    showIndicators.rsi ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-[#1F1F23] text-[#8E9299] hover:text-white'
                  }`}
                >
                  RSI
                </button>
              </div>
            </div>
          </div>

          {/* Selected Asset Header Details */}
          {selectedAsset && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono">
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-white">
                  ${selectedAsset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: selectedAsset.currentPrice > 10 ? 2 : 4 })}
                </span>
                <span
                  className={`flex items-center px-2 py-0.5 rounded font-semibold text-xs ${
                    selectedAsset.change24h >= 0
                      ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                      : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                  }`}
                >
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
                </span>
                <span className="text-[#8E9299] hidden sm:inline">
                  24h High: ${selectedAsset.high24h.toFixed(2)} | Low: ${selectedAsset.low24h.toFixed(2)}
                </span>
              </div>

              {/* Detected Market Regime Badge */}
              <div className="flex items-center space-x-2">
                <span className="text-[#8E9299] text-xs">Detected Regime:</span>
                <span
                  className={`rounded border px-2.5 py-1 text-xs font-semibold ${
                    selectedAsset.currentRegime.includes('Strong Bullish')
                      ? 'border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]'
                      : selectedAsset.currentRegime.includes('Strong Bearish')
                      ? 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]'
                      : selectedAsset.currentRegime.includes('High Volatility')
                      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 animate-pulse'
                      : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {selectedAsset.currentRegime}
                </span>
              </div>
            </div>
          )}

          {/* Recharts Price Chart Area */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />
                <XAxis dataKey="time" stroke="#8E9299" fontSize={10} tickLine={false} />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke="#8E9299"
                  fontSize={10}
                  orientation="right"
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E0E11',
                    borderColor: '#1F1F23',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: '#E4E4E7',
                  }}
                  itemStyle={{ padding: '1px 0' }}
                />
                {showIndicators.bb && (
                  <>
                    <Line type="monotone" dataKey="bbUpper" stroke="#3B82F6" strokeDasharray="2 2" dot={false} strokeWidth={1} />
                    <Line type="monotone" dataKey="bbLower" stroke="#3B82F6" strokeDasharray="2 2" dot={false} strokeWidth={1} />
                  </>
                )}
                {showIndicators.ema && (
                  <>
                    <Line type="monotone" dataKey="ema20" stroke="#EAB308" dot={false} strokeWidth={1.5} name="EMA 20" />
                    <Line type="monotone" dataKey="ema50" stroke="#818CF8" dot={false} strokeWidth={1.5} name="EMA 50" />
                  </>
                )}
                <Area type="monotone" dataKey="close" stroke="#10B981" fill="url(#colorClose)" strokeWidth={2} name="Price" />
                <defs>
                  <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Sub-chart: RSI & ATR Indicator Bar */}
          {selectedAsset && showIndicators.rsi && (
            <div className="pt-3 border-t border-[#1F1F23] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-4">
                <span className="text-[#8E9299]">
                  RSI (14):{' '}
                  <span
                    className={`font-bold ${
                      selectedAsset.indicators.rsi > 70
                        ? 'text-[#EF4444]'
                        : selectedAsset.indicators.rsi < 30
                        ? 'text-[#10B981]'
                        : 'text-purple-300'
                    }`}
                  >
                    {selectedAsset.indicators.rsi}
                  </span>
                </span>
                <span className="text-[#8E9299]">
                  MACD Hist:{' '}
                  <span
                    className={`font-bold ${
                      selectedAsset.indicators.macd.histogram >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {selectedAsset.indicators.macd.histogram}
                  </span>
                </span>
                <span className="text-[#8E9299]">
                  ATR Volatility: <span className="text-yellow-400 font-bold">{selectedAsset.volatilityAtrPercent}%</span>
                </span>
                <span className="text-[#8E9299]">
                  ADX Strength: <span className="text-blue-400 font-bold">{selectedAsset.indicators.adx}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bot Status, Mode & Manual Trade Ticket (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Bot State & Mode Control Card */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Trading Bot Control
                </span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  botState.status === 'ONLINE'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                    : botState.status === 'PAUSED'
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                }`}
              >
                {botState.status}
              </span>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#8E9299] mb-1.5 uppercase tracking-wider">
                Execution Mode
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-1">
                {(['manual', 'semi-automatic', 'fully-automatic'] as const).map((m) => {
                  const isSelected = botState.mode === m;
                  return (
                    <button
                      key={m}
                      onClick={() => onSetTradingMode(m)}
                      className={`rounded-md px-2 py-1.5 text-[11px] font-semibold capitalize transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-[#8E9299] hover:text-white'
                      }`}
                    >
                      {m.replace('-automatic', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Strategy Badge */}
            <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#8E9299]">
                <span>Active Strategy:</span>
                <button
                  onClick={() => onNavigateTab('strategies')}
                  className="text-blue-400 hover:underline flex items-center font-medium"
                >
                  Change <ChevronRight className="h-3 w-3 inline" />
                </button>
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {botState.activeStrategyName}
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3">
                <span className="text-[10px] text-[#8E9299] block uppercase tracking-wider">Trades Today</span>
                <span className="text-base font-bold text-white">{botState.tradesExecutedToday}</span>
              </div>
              <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3">
                <span className="text-[10px] text-[#8E9299] block uppercase tracking-wider">Risk Status</span>
                <span
                  className={`text-base font-bold ${
                    botState.activeRiskLevel === 'SAFE'
                      ? 'text-[#10B981]'
                      : botState.activeRiskLevel === 'MODERATE'
                      ? 'text-yellow-400'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {botState.activeRiskLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Manual / Test Execution Ticket */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Direct Execution Ticket
              </span>
              <span className="font-mono text-xs text-[#8E9299]">
                {selectedAsset ? selectedAsset.symbol : ''}
              </span>
            </div>

            <form onSubmit={handleManualOrderSubmit} className="space-y-3 text-xs">
              {/* Buy / Sell Direction */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualSide('LONG')}
                  className={`rounded-lg py-2 font-bold transition-all ${
                    manualSide === 'LONG'
                      ? 'bg-[#10B981] text-white shadow-md shadow-emerald-950/40'
                      : 'border border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:text-white'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setManualSide('SHORT')}
                  className={`rounded-lg py-2 font-bold transition-all ${
                    manualSide === 'SHORT'
                      ? 'bg-[#EF4444] text-white shadow-md shadow-red-950/40'
                      : 'border border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:text-white'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>

              {/* Quantity Input */}
              <div>
                <div className="flex justify-between text-xs text-[#8E9299] mb-1">
                  <span>Order Quantity</span>
                  <span className="font-mono">Est. Value: ${selectedAsset ? (manualQuantity * selectedAsset.currentPrice).toFixed(2) : '0'}</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* Dynamic Position Sizing Check */}
              <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-3 text-xs text-[#8E9299] space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Stop Loss Target:</span>
                  <span className="text-[#EF4444]">
                    ${selectedAsset ? (manualSide === 'LONG' ? selectedAsset.currentPrice * 0.985 : selectedAsset.currentPrice * 1.015).toFixed(2) : 0} (-1.5%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Take Profit Target:</span>
                  <span className="text-[#10B981]">
                    ${selectedAsset ? (manualSide === 'LONG' ? selectedAsset.currentPrice * 1.035 : selectedAsset.currentPrice * 0.965).toFixed(2) : 0} (+3.5%)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
              >
                {isSubmittingOrder ? 'Routing to Engine...' : `Place ${manualSide} Market Order`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE OPEN POSITIONS TABLE */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold uppercase tracking-wider text-white">
              Active Open Positions ({positions.length})
            </span>
          </div>
          {positions.length > 0 && (
            <button
              onClick={onEmergencyCloseAll}
              className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
            >
              Close All Positions
            </button>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="py-8 text-center text-xs font-mono text-[#8E9299]">
            No active positions. Trading engine is scanning market data feeds for qualifying strategy confluence.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1F1F23] text-[#8E9299] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Size / Value</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Current Price</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">Take Profit</th>
                  <th className="py-2.5 px-3">Unrealized P&L</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F23]">
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-[#1F1F23]/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{pos.symbol}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            pos.side === 'LONG' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#E4E4E7]">
                        {pos.size} <span className="text-[#8E9299]">(${pos.sizeUsd.toLocaleString()})</span>
                      </td>
                      <td className="py-3 px-3 text-[#E4E4E7]">${pos.entryPrice.toFixed(pos.entryPrice > 10 ? 2 : 4)}</td>
                      <td className="py-3 px-3 text-white font-bold">${pos.currentPrice.toFixed(pos.currentPrice > 10 ? 2 : 4)}</td>
                      <td className="py-3 px-3 text-[#EF4444]">${pos.stopLossPrice.toFixed(pos.stopLossPrice > 10 ? 2 : 4)}</td>
                      <td className="py-3 px-3 text-[#10B981]">${pos.takeProfitPrice.toFixed(pos.takeProfitPrice > 10 ? 2 : 4)}</td>
                      <td className="py-3 px-3">
                        <div className={`font-bold ${isProfit ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                          <span className="text-[10px] ml-1 opacity-80">({isProfit ? '+' : ''}{pos.unrealizedPnlPercent}%)</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#8E9299] truncate max-w-[140px]">{pos.strategyName}</td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => onOpenExplanationModal(pos.explanationId || pos.id, pos)}
                          className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
                          title="View detailed AI rationale and indicator math"
                        >
                          <Sparkles className="h-3 w-3 inline mr-1" />
                          AI Explain
                        </button>
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] px-2.5 py-1 text-xs text-[#E4E4E7] hover:bg-[#1F1F23] transition-colors"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RECENT CLOSED TRADES & ORDER BOOK AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Trades History */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Recent Closed Trades ({tradesHistory.length})
            </span>
            <span className="font-mono text-xs text-[#10B981] font-semibold">
              Net Realized: ${portfolio.totalRealizedPnl.toFixed(2)}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {tradesHistory.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[#8E9299]">No closed trades yet</div>
            ) : (
              tradesHistory.slice(0, 8).map((t) => {
                const isWin = t.realizedPnl >= 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenExplanationModal(t.id, t)}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#0E0E11] hover:bg-[#1F1F23]/60 border border-[#1F1F23] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-white">{t.symbol}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            t.side === 'LONG' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                          }`}
                        >
                          {t.side}
                        </span>
                        <span className="text-[10px] font-mono text-[#8E9299]">[{t.exitReason}]</span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8E9299] mt-0.5 truncate max-w-[240px]">
                        {t.tradeExplanation}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-xs font-bold ${isWin ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {isWin ? '+' : ''}${t.realizedPnl.toFixed(2)}
                      </div>
                      <span className="font-mono text-[10px] text-[#8E9299]">
                        {new Date(t.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Orders Log */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
            <span className="text-xs font-semibold uppercase tracking-wider text-white">
              Execution Orders Log ({orders.length})
            </span>
            <span className="font-mono text-xs text-[#8E9299]">Slippage & Fees Monitored</span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {orders.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[#8E9299]">No orders logged</div>
            ) : (
              orders.slice(0, 8).map((ord) => (
                <div key={ord.id} className="p-3 rounded-lg bg-[#0E0E11] border border-[#1F1F23] text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{ord.symbol}</span>
                      <span className="text-[#8E9299] font-medium">{ord.direction} {ord.quantity} units</span>
                    </div>
                    <span className="rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 text-[9px] font-bold">
                      {ord.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8E9299] mt-1.5">
                    <span>Fill Price: ${ord.averageFillPrice?.toFixed(2)} (Slippage: {ord.slippagePercent}%)</span>
                    <span>Fee: ${ord.feesUsd}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
