import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Compass,
  Cpu,
  DollarSign,
  FlaskConical,
  Globe,
  HelpCircle,
  Maximize2,
  MinusCircle,
  Percent,
  Plus,
  PlusCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wifi,
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
  BrokerAccount,
  MarketAsset,
  Order,
  PortfolioSummary,
  Position,
  RiskSettings,
  TradeHistoryItem,
  TradingMode,
} from '../types';
import { formatPositionLotSize, calculateEquityLotSize } from '../utils/lotSize';
import { OrderBookDepthVisualizer } from './OrderBookDepthVisualizer';
import { SessionPnlChart } from './SessionPnlChart';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  portfolio: PortfolioSummary;
  botState: BotState;
  positions: Position[];
  orders: Order[];
  tradesHistory: TradeHistoryItem[];
  assets: MarketAsset[];
  riskSettings: RiskSettings;
  brokerAccounts?: BrokerAccount[];
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
  brokerAccounts = [],
  onClosePosition,
  onEmergencyCloseAll,
  onSetTradingMode,
  onPlaceManualOrder,
  onOpenExplanationModal,
  onNavigateTab,
}) => {
  const { isDark } = useTheme();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU/USD');
  const [marketFilter, setMarketFilter] = useState<'all' | 'crypto' | 'forex'>('all');
  const [activeTimeframe, setActiveTimeframe] = useState<'1m' | '5m' | '15m' | '1h'>('1m');
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const [showIndicators, setShowIndicators] = useState<{ ema: boolean; bb: boolean; rsi: boolean }>({
    ema: true,
    bb: true,
    rsi: true,
  });

  // Manual trade form state
  const [manualSide, setManualSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [manualQuantity, setManualQuantity] = useState<number>(0.1);
  const [manualLotSize, setManualLotSize] = useState<number>(0.10); // Standard for Forex
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const selectedAsset = assets.find((a) => a.symbol === selectedSymbol) || assets[0];
  const isForex = selectedAsset?.category === 'forex';

  const filteredAssets = assets.filter((a) => {
    if (marketFilter === 'all') return true;
    return a.category === marketFilter;
  });

  const handleSyncLive = async () => {
    setIsSyncingLive(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/market/sync-live', { method: 'POST' });
      if (res.ok) {
        setSyncFeedback('Synchronized live exchange rates!');
      } else {
        setSyncFeedback('Live sync completed.');
      }
    } catch {
      setSyncFeedback('Sync timed out.');
    } finally {
      setIsSyncingLive(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Helper formatting for asset prices
  const formatAssetPrice = (price: number, asset?: MarketAsset) => {
    if (price === undefined || price === null || isNaN(price)) return '---';
    if (!asset) return `$${price.toFixed(2)}`;
    const digits = asset.digits ?? (asset.category === 'forex' ? (asset.symbol.includes('JPY') ? 2 : 4) : 2);
    if (asset.symbol === 'XAU/USD') {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (asset.category === 'forex') {
      return price.toFixed(digits);
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  };

  const formatPosPrice = (symbol: string, price: number) => {
    if (price === undefined || price === null || isNaN(price)) return '---';
    if (symbol === 'XAU/USD' || symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL') || symbol.includes('BNB')) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (symbol.includes('JPY')) {
      return price.toFixed(2);
    }
    return price.toFixed(price > 10 ? 2 : 4);
  };

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
      const isGold = selectedAsset.symbol === 'XAU/USD';
      const effectiveQty = isForex
        ? (isGold ? manualLotSize * 100 : manualLotSize * 100000)
        : manualQuantity;
      const digits = selectedAsset.digits ?? (isForex ? (isGold ? 2 : 4) : 2);
      const slDist = isForex ? (isGold ? 0.0075 : 0.0025) : 0.015;
      const tpDist = isForex ? (isGold ? 0.0175 : 0.0055) : 0.035;
      const sl = manualSide === 'LONG' ? selectedAsset.currentPrice * (1 - slDist) : selectedAsset.currentPrice * (1 + slDist);
      const tp = manualSide === 'LONG' ? selectedAsset.currentPrice * (1 + tpDist) : selectedAsset.currentPrice * (1 - tpDist);

      await onPlaceManualOrder({
        symbol: selectedAsset.symbol,
        side: manualSide,
        quantity: effectiveQty,
        stopLoss: Number(sl.toFixed(digits)),
        takeProfit: Number(tp.toFixed(digits)),
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const activeBroker = brokerAccounts.find((b) => b.id === botState.activeBrokerAccountId) || brokerAccounts[0];
  const isDemoActive = activeBroker ? activeBroker.accountType === 'DEMO' || activeBroker.isPaper : false;

  return (
    <div className="space-y-6">
      {/* Operator Curriculum & Workbook Banner */}
      <div className="rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-950/20 via-[#10131C] to-[#0D0E13] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-blue-300">
                Operator Workbook & Lecture Series
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Offline Ready
              </span>
            </div>
            <p className="text-[11px] text-[#8E9299] mt-0.5">
              Read the 8-module lecture series on MT5 broker setup, $10 compounding, and deterministic risk management. Downloadable for offline reading.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('workbook')}
            className="rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-3 py-1.5 text-xs font-mono font-bold text-blue-300 hover:text-white transition-all flex items-center space-x-1.5"
          >
            <span>Open Workbook</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Broker Connection & Testing Guidance Hero */}
      {!activeBroker ? (
        <div className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#0C1427] via-[#101826] to-[#0A0E17] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    <span>AWAITING BROKER CONNECTION</span>
                  </span>
                  <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 border border-blue-500/30">
                    REAL OR DEMO MT5
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white font-tech uppercase tracking-wide">
                  Connect Your Trading Account (Real or Demo)
                </h2>
                <p className="text-xs text-[#8E9299] max-w-2xl leading-relaxed">
                  Connect your MT5 broker account to start automated algorithmic trade execution. The software directly monitors live ticks, enforces dynamic stop-losses, and manages positions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateTab('brokers')}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-mono font-bold text-white transition-all shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Connect Demo (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('brokers')}
                  className="rounded-lg bg-[#1F1F23] hover:bg-[#2A2A30] border border-[#2E2E35] px-3 py-2 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all text-center"
                >
                  Connect Real
                </button>
              </div>
            </div>

            {/* Clear encouragement to test on demo first */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 flex items-start space-x-3 text-xs">
              <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-amber-200">
                  Recommended Proving Workflow: Test on Demo First
                </span>
                <p className="text-[#8E9299] leading-relaxed">
                  We encourage you to connect a <strong className="text-white">broker Demo account</strong> (e.g. <em>Exness-MT5Trial9</em>) before connecting your real funds. This allows you to evaluate automated execution speed, verify entry precision, and confirm profitability with <strong className="text-amber-300">zero risk to real funds</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : isDemoActive ? (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/25 via-[#141416] to-[#0E0E11] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <FlaskConical className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-amber-300">
                  🧪 Testing on Demo: {activeBroker.name} ({activeBroker.server} #{activeBroker.accountNumber})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Zero Risk to Real Capital
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#8E9299] mt-0.5">
                Autonomous trading engine is active on your demo account. When you're ready to trade with live funds, you can switch or connect your Real account anytime.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateTab('brokers')}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-mono font-bold text-white transition-colors shadow-sm whitespace-nowrap"
            >
              Connect Real Account →
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/25 via-[#101915] to-[#0E0E11] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-emerald-300">
                  🟢 Live Production Trading: {activeBroker.name} ({activeBroker.server} #{activeBroker.accountNumber})
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real Funds Protected
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#8E9299] mt-0.5">
                Institutional risk engine active. Stop Loss & Daily Loss Limits (${((portfolio.totalEquity || 1000) * (riskSettings.maxDailyLossPercent / 100)).toFixed(2)}) are strictly enforced.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateTab('brokers')}
              className="rounded-lg bg-[#1F1F23] border border-[#2E2E33] hover:border-blue-500/50 px-3 py-1.5 text-xs font-mono font-semibold text-white transition-colors whitespace-nowrap"
            >
              Manage Accounts
            </button>
          </div>
        </div>
      )}

      {/* Micro-Wealth Accelerator & Autonomous Takeover Banner */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#141416] to-[#0E0E11] p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-3.5">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-blue-300">
                {botState.compoundingMode === 'micro-wealth-accelerator'
                  ? 'Micro-Wealth Engine Active ($10 → $10,000+)'
                  : 'Quantara Quantitative Engine'}
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  botState.autonomousTakeover
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                Takeover: {botState.autonomousTakeover ? 'Engaged' : 'Standby'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8E9299] mt-0.5 leading-relaxed">
              {botState.autonomousTakeover
                ? `System is actively trading account #${botState.activeBrokerAccountId || 'primary'} with strict asymmetric 1:2.5+ risk-reward filters.`
                : 'Connect your demo or live account to let Quantara autonomously execute asymmetric micro-compounding trades.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => onNavigateTab('compounding')}
            className="flex-1 sm:flex-initial text-center rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-tech font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-600/30 transition-colors whitespace-nowrap"
          >
            $10 Wealth Roadmap →
          </button>
          <button
            onClick={() => onNavigateTab('brokers')}
            className="flex-1 sm:flex-initial text-center rounded-lg bg-[#1F1F23] border border-[#2E2E33] px-3 sm:px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-white hover:border-blue-500/50 transition-colors whitespace-nowrap"
          >
            Connect Account
          </button>
        </div>
      </div>

      {/* LIVE MARKET FEEDS & TICKER STREAM STRIP */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-white">
                Institutional Real-Time Feeds
              </span>
              <span className="inline-flex items-center space-x-1 rounded bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#10B981] border border-[#10B981]/20">
                <Wifi className="h-3 w-3 inline mr-0.5" /> LIVE
              </span>
              <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-300 border border-yellow-500/30">
                ★ XAU/USD Gold Spot
              </span>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/20">
                Binance Crypto
              </span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-blue-300 border border-blue-500/20">
                ECB Forex
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {syncFeedback && (
              <span className="text-[11px] font-mono text-[#10B981] animate-fade-in">
                {syncFeedback}
              </span>
            )}
            <button
              onClick={handleSyncLive}
              disabled={isSyncingLive}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-[#2E2E33] bg-[#1F1F23] px-2.5 py-1 text-xs font-mono text-[#E4E4E7] hover:bg-[#27272A] hover:text-white transition-colors disabled:opacity-50"
              title="Force sync rates directly from Binance and European Central Bank"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingLive ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isSyncingLive ? 'Syncing...' : 'Sync Live Rates'}</span>
            </button>
          </div>
        </div>

        {/* Live Market Tape with Category Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex items-center space-x-1 text-xs font-mono shrink-0">
            <button
              onClick={() => setMarketFilter('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                marketFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0E0E11] text-[#8E9299] hover:text-white border border-[#1F1F23]'
              }`}
            >
              All ({assets.length})
            </button>
            <button
              onClick={() => setMarketFilter('forex')}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                marketFilter === 'forex'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0E0E11] text-[#8E9299] hover:text-white border border-[#1F1F23]'
              }`}
            >
              <Globe className="h-3 w-3 inline" />
              <span>Forex FX ({assets.filter((a) => a.category === 'forex').length})</span>
            </button>
            <button
              onClick={() => setMarketFilter('crypto')}
              className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                marketFilter === 'crypto'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0E0E11] text-[#8E9299] hover:text-white border border-[#1F1F23]'
              }`}
            >
              <Coins className="h-3 w-3 inline" />
              <span>Crypto ({assets.filter((a) => a.category === 'crypto').length})</span>
            </button>
          </div>

          {/* Scrolling / Scannable Live Ticker Strip */}
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
            {filteredAssets.map((asset) => {
              const isSelected = asset.symbol === selectedSymbol;
              const isPos = positions.some((p) => p.symbol === asset.symbol);
              const isFx = asset.category === 'forex';
              return (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedSymbol(asset.symbol)}
                  className={`flex items-center space-x-2 rounded-lg px-2.5 py-1.5 font-mono text-xs transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'border-blue-500/60 bg-blue-600/10 text-white'
                      : 'border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {asset.isRecommended ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center space-x-0.5">
                      <span>★</span>
                      <span>{asset.badge || 'RECOMMENDED'}</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                        isFx ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isFx ? 'FX' : 'CRYPTO'}
                    </span>
                  )}
                  <span className={`font-bold ${asset.isRecommended ? 'text-amber-300' : 'text-white'}`}>{asset.symbol}</span>
                  <span className="font-semibold text-zinc-300">
                    {formatAssetPrice(asset.currentPrice, asset)}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      asset.change24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                  </span>
                  {asset.spreadPips !== undefined && isFx && (
                    <span className="text-[9px] text-[#71717A]">
                      {asset.spreadPips.toFixed(1)}p
                    </span>
                  )}
                  {isPos && <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. TOP INSTITUTIONAL METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Total Equity */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Total Equity</span>
            <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#10B981]" />
          </div>
          <div className="mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold text-white truncate">
            ${portfolio.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span>Cash: ${portfolio.cashBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Today's P&L */}
        <div
          onClick={() => {
            const el = document.getElementById('session-pnl-trend-container');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm hover:border-blue-500/40 cursor-pointer transition-colors group"
          title="Click to focus Session Realized P&L Trend Chart"
        >
          <div className="flex items-center justify-between text-[#8E9299]">
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Today's P&amp;L</span>
              <span className="text-[9px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                Trend ↓
              </span>
            </div>
            {portfolio.realizedPnlToday >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#10B981]" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#EF4444]" />
            )}
          </div>
          <div
            className={`mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold truncate ${
              portfolio.realizedPnlToday >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {portfolio.realizedPnlToday >= 0 ? '+' : ''}${portfolio.realizedPnlToday.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span className={portfolio.todayPnlPercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}>
              {portfolio.todayPnlPercent >= 0 ? '+' : ''}{portfolio.todayPnlPercent}%
            </span>
            <span className="ml-1 text-[#71717A] hidden xs:inline">/ cap {riskSettings.maxDailyLossPercent}%</span>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Unrealized P&L</span>
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
          </div>
          <div
            className={`mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold truncate ${
              portfolio.unrealizedPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {portfolio.unrealizedPnl >= 0 ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span>{positions.length} pos</span>
          </div>
        </div>

        {/* Current Drawdown */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Drawdown</span>
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-400" />
          </div>
          <div className="mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold text-yellow-400 truncate">
            {portfolio.currentDrawdownPercent.toFixed(2)}%
          </div>
          <div className="mt-1 flex items-center text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span>Max DD: {riskSettings.maxAccountDrawdownPercent}%</span>
          </div>
        </div>

        {/* Win Rate & Profit Factor */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Win Rate</span>
            <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
          </div>
          <div className="mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold text-white truncate">
            {portfolio.winRatePercent}% <span className="text-[10px] sm:text-xs text-[#8E9299] font-normal">({portfolio.profitFactor}x)</span>
          </div>
          <div className="mt-1 flex items-center text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span>{portfolio.totalTradesExecuted} closed</span>
          </div>
        </div>

        {/* Portfolio Exposure */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold">Exposure</span>
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
          </div>
          <div className="mt-1 sm:mt-2 font-mono text-lg sm:text-2xl font-bold text-white truncate">
            {portfolio.currentExposurePercent}%
          </div>
          <div className="mt-1 flex items-center text-[10px] sm:text-xs font-mono text-[#8E9299]">
            <span>${portfolio.currentExposureUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })} used</span>
          </div>
        </div>
      </div>

      {/* 1.5 SESSION REALIZED P&L (realizedPnlToday) PERFORMANCE LINE CHART */}
      <SessionPnlChart
        portfolio={portfolio}
        tradesHistory={tradesHistory}
        riskSettings={riskSettings}
        onNavigateTab={onNavigateTab}
      />

      {/* 2. MAIN TERMINAL GRID: CHART + BOT CONTROLLER & QUICK TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        {/* Left Column: Interactive Price Chart & Indicators (8 cols) */}
        <div className="lg:col-span-8 min-w-0 rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 sm:p-5 space-y-4">
          {/* Asset Tabs & Real-time Quote Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F1F23]">
            {/* Symbol Pills filtered by active category */}
            <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none max-w-full">
              {filteredAssets.map((asset) => {
                const isSelected = asset.symbol === selectedSymbol;
                const isPos = positions.some((p) => p.symbol === asset.symbol);
                const isFx = asset.category === 'forex';
                return (
                  <button
                    key={asset.symbol}
                    onClick={() => setSelectedSymbol(asset.symbol)}
                    className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-[#1F1F23] text-[#8E9299] hover:bg-[#27272A] hover:text-white border border-transparent'
                    }`}
                  >
                    {asset.isRecommended ? (
                      <span className="text-[10px] text-amber-300 font-bold flex items-center space-x-0.5">
                        <span>★</span>
                        <span>{asset.badge || 'GOLD'}:</span>
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-75">{isFx ? 'FX' : 'CRYPTO'}:</span>
                    )}
                    <span className={asset.isRecommended && !isSelected ? 'text-amber-200' : ''}>{asset.symbol}</span>
                    {asset.isRecommended && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                    )}
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
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-white">
                    {formatAssetPrice(selectedAsset.currentPrice, selectedAsset)}
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

                  {/* Bid, Ask and Spread */}
                  <div className="flex items-center space-x-2 text-[11px] text-[#A1A1AA] bg-[#0E0E11] px-2.5 py-1 rounded-lg border border-[#1F1F23]">
                    <span>Bid: <strong className="text-white">{formatAssetPrice(selectedAsset.bidPrice ?? selectedAsset.currentPrice, selectedAsset)}</strong></span>
                    <span className="text-[#3F3F46]">|</span>
                    <span>Ask: <strong className="text-white">{formatAssetPrice(selectedAsset.askPrice ?? selectedAsset.currentPrice, selectedAsset)}</strong></span>
                    {selectedAsset.spreadPips !== undefined && (
                      <>
                        <span className="text-[#3F3F46]">|</span>
                        <span className="text-amber-400 font-semibold">{selectedAsset.spreadPips.toFixed(1)} pips spread</span>
                      </>
                    )}
                  </div>

                  <span className="text-[#71717A] text-[11px] hidden xl:inline">
                    Feed: <span className="text-[#A1A1AA] font-semibold">{selectedAsset.source || (isForex ? 'Frankfurter/ECB Live' : 'Binance Live')}</span>
                  </span>
                </div>

                {/* Detected Market Regime Badge */}
                <div className="flex items-center space-x-2">
                  <span className="text-[#8E9299] text-xs">Regime:</span>
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

              {/* Institutional Recommendation Banner for Flagship Asset */}
              {selectedAsset.isRecommended && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 px-3.5 py-2 font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs shrink-0">★</span>
                    <span className="font-bold text-amber-300">MOST RECOMMENDED FOREX PAIR:</span>
                    <span className="text-white font-medium">{selectedAsset.symbol} (Gold Spot / USD)</span>
                  </div>
                  <span className="text-[11px] text-amber-200/80">
                    {selectedAsset.recommendationReason || 'Optimal macro hedging & asymmetric trend breakout potential'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Recharts Price Chart Area */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F1F23' : '#E2E8F0'} vertical={false} />
                <XAxis dataKey="time" stroke={isDark ? '#8E9299' : '#64748B'} fontSize={10} tickLine={false} />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke={isDark ? '#8E9299' : '#64748B'}
                  fontSize={10}
                  orientation="right"
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0E0E11' : '#FFFFFF',
                    borderColor: isDark ? '#1F1F23' : '#CBD5E1',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: isDark ? '#E4E4E7' : '#0F172A',
                    boxShadow: isDark
                      ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                      : '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
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
            <div className="pt-3 border-t border-[#1F1F23] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
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

          {/* Real-Time Order Book Depth Visualizer */}
          <OrderBookDepthVisualizer
            assets={assets}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => setSelectedSymbol(sym)}
            onSelectPrice={(_price, side) => {
              setManualSide(side === 'BUY' ? 'LONG' : 'SHORT');
            }}
          />
        </div>

        {/* Right Column: Bot Status, Mode & Manual Trade Ticket (4 cols) */}
        <div className="lg:col-span-4 min-w-0 space-y-4">
          {/* Bot State & Mode Control Card */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 sm:p-5 space-y-4">
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
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Direct Execution Ticket
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    isForex ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isForex ? 'Forex ECN' : 'Crypto Spot'}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-white">
                {selectedAsset ? selectedAsset.symbol : ''}
              </span>
            </div>

            <form onSubmit={handleManualOrderSubmit} className="space-y-3.5 text-xs">
              {/* Buy / Sell Direction with Live Bid / Ask Pricing */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setManualSide('LONG')}
                  className={`rounded-lg p-2.5 text-left transition-all border ${
                    manualSide === 'LONG'
                      ? 'border-[#10B981] bg-[#10B981]/20 text-white shadow-md shadow-emerald-950/40'
                      : 'border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#10B981]">BUY / LONG</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    Ask: {formatAssetPrice(selectedAsset ? (selectedAsset.askPrice ?? selectedAsset.currentPrice) : 0, selectedAsset)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setManualSide('SHORT')}
                  className={`rounded-lg p-2.5 text-left transition-all border ${
                    manualSide === 'SHORT'
                      ? 'border-[#EF4444] bg-[#EF4444]/20 text-white shadow-md shadow-red-950/40'
                      : 'border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#EF4444]">SELL / SHORT</div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    Bid: {formatAssetPrice(selectedAsset ? (selectedAsset.bidPrice ?? selectedAsset.currentPrice) : 0, selectedAsset)}
                  </div>
                </button>
              </div>

              {/* Spread & Market Data Indicator */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8E9299] bg-[#0E0E11] px-2.5 py-1.5 rounded-lg border border-[#1F1F23]">
                <span>Exchange Spread:</span>
                <span className="font-semibold text-white">
                  {selectedAsset?.spreadPips !== undefined && isForex
                    ? `${selectedAsset.spreadPips.toFixed(1)} Pips`
                    : '0.01% Standard'}
                </span>
              </div>

              {/* Quantity Input: Contextual Lot vs Units */}
              {isForex ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#8E9299]">
                    <span>
                      {selectedAsset?.symbol === 'XAU/USD'
                        ? 'Gold Standard Lot (1.0 = 100 oz Troy)'
                        : 'Forex Lot Size (1.0 = 100k units)'}
                    </span>
                    <span className="font-mono text-zinc-300">
                      {selectedAsset?.symbol === 'XAU/USD'
                        ? `${(manualLotSize * 100).toFixed(1)} oz Gold`
                        : `Units: ${(manualLotSize * 100000).toLocaleString()}`}
                    </span>
                  </div>

                  {/* Quick Lot Buttons */}
                  <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
                    {[0.01, 0.05, 0.10, 0.50, 1.00].map((lot) => (
                      <button
                        key={lot}
                        type="button"
                        onClick={() => setManualLotSize(lot)}
                        className={`rounded py-1 border transition-colors ${
                          manualLotSize === lot
                            ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                            : 'bg-[#0E0E11] border-[#1F1F23] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        {lot.toFixed(2)}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={manualLotSize}
                    onChange={(e) => setManualLotSize(parseFloat(e.target.value) || 0.01)}
                    className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. 0.10"
                    required
                  />
                  <div className="text-[10px] text-[#8E9299] flex justify-between font-mono">
                    <span>Est. Pip Value: ~${(manualLotSize * (selectedAsset?.symbol === 'XAU/USD' ? 10 : 10)).toFixed(2)}/pip</span>
                    <span>
                      Notional: $
                      {(
                        (selectedAsset?.currentPrice || 1) *
                        manualLotSize *
                        (selectedAsset?.symbol === 'XAU/USD' ? 100 : 100000)
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#8E9299]">
                    <span>Order Quantity ({selectedAsset?.symbol.split('/')[0]})</span>
                    <span className="font-mono text-zinc-300">
                      Est. Value: ${selectedAsset ? (manualQuantity * selectedAsset.currentPrice).toFixed(2) : '0'}
                    </span>
                  </div>

                  {/* Quick crypto presets */}
                  <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                    {[0.01, 0.05, 0.10, 0.50].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setManualQuantity(qty)}
                        className={`rounded py-1 border transition-colors ${
                          manualQuantity === qty
                            ? 'bg-blue-600/30 border-blue-500 text-white font-bold'
                            : 'bg-[#0E0E11] border-[#1F1F23] text-[#8E9299] hover:text-white'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
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
              )}

              {/* Dynamic Position Sizing Check */}
              <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-3 text-xs text-[#8E9299] space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Stop Loss Target:</span>
                  <span className="text-[#EF4444] font-semibold">
                    {selectedAsset ? (
                      isForex
                        ? `${(manualSide === 'LONG' ? selectedAsset.currentPrice * 0.9975 : selectedAsset.currentPrice * 1.0025).toFixed(selectedAsset.digits ?? 4)} (-25 pips)`
                        : `$${(manualSide === 'LONG' ? selectedAsset.currentPrice * 0.985 : selectedAsset.currentPrice * 1.015).toFixed(2)} (-1.5%)`
                    ) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Take Profit Target:</span>
                  <span className="text-[#10B981] font-semibold">
                    {selectedAsset ? (
                      isForex
                        ? `${(manualSide === 'LONG' ? selectedAsset.currentPrice * 1.0055 : selectedAsset.currentPrice * 0.9945).toFixed(selectedAsset.digits ?? 4)} (+55 pips)`
                        : `$${(manualSide === 'LONG' ? selectedAsset.currentPrice * 1.035 : selectedAsset.currentPrice * 0.965).toFixed(2)} (+3.5%)`
                    ) : '0'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20 font-mono text-xs"
              >
                {isSubmittingOrder
                  ? 'Routing to Engine...'
                  : isForex
                  ? `Execute ${manualSide} (${manualLotSize} Lots) @ Market`
                  : `Execute ${manualSide} (${manualQuantity}) @ Market`}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE OPEN POSITIONS TABLE */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold uppercase tracking-wider text-white">
                Active Open Positions ({positions.length})
              </span>
            </div>
            {/* Strict Risk Management Lot Sizing Pill */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold">Risk Policy: 0.01 – 0.10 Lots</span>
              <span className="text-amber-400/60">•</span>
              <span>Tier: <strong className="text-white">{calculateEquityLotSize(portfolio.totalEquity).toFixed(2)} Lots</strong> @ ${portfolio.totalEquity.toFixed(0)} Eq</span>
            </div>
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
            No active positions. Trading engine is scanning market data feeds for qualifying strategy confluence (Risk Sizing: {calculateEquityLotSize(portfolio.totalEquity).toFixed(2)} Lots).
          </div>
        ) : (
          <>
            {/* Mobile Cards View (md:hidden) */}
            <div className="md:hidden space-y-3">
              {positions.map((pos) => {
                const isProfit = pos.unrealizedPnl >= 0;
                const openedDate = new Date(pos.openedAt || Date.now());
                const dateStr = openedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const lotStr = formatPositionLotSize(pos);
                return (
                  <div
                    key={pos.id}
                    className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-3.5 space-y-3 font-mono text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{pos.symbol}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              pos.side === 'LONG'
                                ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                                : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                            }`}
                          >
                            {pos.side}
                          </span>
                          {/* Prominent Lot Size Taken Badge */}
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                            {lotStr} Lots
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8E9299] mt-0.5">
                          {pos.strategyName} • Qty: {pos.size} (${pos.sizeUsd.toLocaleString()})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold text-sm ${isProfit ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                        </div>
                        <span className="text-[10px] text-[#8E9299]">
                          ({isProfit ? '+' : ''}{pos.unrealizedPnlPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Time & Date Opened Badge */}
                    <div className="flex items-center justify-between text-[11px] bg-[#141418] px-2.5 py-1.5 rounded-lg border border-[#1F1F23]">
                      <div className="flex items-center space-x-1.5 text-zinc-300">
                        <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="text-[#8E9299] text-[10px]">Position Taken:</span>
                        <span className="font-semibold text-zinc-200">{dateStr}</span>
                        <span className="text-[#8E9299] text-[10px]">{timeStr}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {lotStr} Lots
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#141416] p-2.5 border border-[#1F1F23] text-[11px]">
                      <div>
                        <span className="text-[10px] text-[#8E9299] block">Entry Price:</span>
                        <span className="text-white font-semibold">{formatPosPrice(pos.symbol, pos.entryPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E9299] block">Current:</span>
                        <span className="text-white font-bold">{formatPosPrice(pos.symbol, pos.currentPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E9299] block">Stop Loss:</span>
                        <span className="text-[#EF4444]">{formatPosPrice(pos.symbol, pos.stopLossPrice)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#8E9299] block">Take Profit:</span>
                        <span className="text-[#10B981]">{formatPosPrice(pos.symbol, pos.takeProfitPrice)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onOpenExplanationModal(pos.explanationId || pos.id, pos)}
                        className="rounded-lg border border-purple-500/30 bg-purple-500/10 py-2 text-xs text-purple-300 hover:bg-purple-500/20 font-sans font-medium flex items-center justify-center space-x-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Rationale</span>
                      </button>
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="rounded-lg border border-[#2E2E33] bg-[#1F1F23] py-2 text-xs text-white hover:bg-red-900/30 hover:text-red-400 font-sans font-medium"
                      >
                        Close Position
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Full Data Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-[#8E9299] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Lots Taken</th>
                    <th className="py-2.5 px-3">Time / Date</th>
                    <th className="py-2.5 px-3">Contract Size</th>
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
                    const openedDate = new Date(pos.openedAt || Date.now());
                    const dateStr = openedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    const timeStr = openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const lotStr = formatPositionLotSize(pos);
                    return (
                      <tr key={pos.id} className="hover:bg-[#1F1F23]/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-white">
                          <div className="flex items-center space-x-1.5">
                            <span>{pos.symbol}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[#1F1F23] text-[#8E9299]">
                              {pos.symbol.includes('USD') && !pos.symbol.includes('USDT') && !pos.symbol.includes('BTC') ? 'FX' : 'CRYPTO'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              pos.side === 'LONG' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </td>
                        {/* Dedicated Lots Taken Column */}
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold font-mono text-xs shadow-sm">
                            {lotStr} Lots
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono">
                          <div className="text-zinc-200 text-xs font-semibold flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                          <div className="text-[10px] text-[#8E9299] flex items-center space-x-1 mt-0.5">
                            <Clock className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                            <span>{timeStr}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#E4E4E7]">
                          <span className="font-semibold">{pos.size} units</span>{' '}
                          <span className="text-[#8E9299]">(${pos.sizeUsd.toLocaleString()})</span>
                        </td>
                        <td className="py-3 px-3 text-[#E4E4E7]">{formatPosPrice(pos.symbol, pos.entryPrice)}</td>
                        <td className="py-3 px-3 text-white font-bold">{formatPosPrice(pos.symbol, pos.currentPrice)}</td>
                        <td className="py-3 px-3 text-[#EF4444]">{formatPosPrice(pos.symbol, pos.stopLossPrice)}</td>
                        <td className="py-3 px-3 text-[#10B981]">{formatPosPrice(pos.symbol, pos.takeProfitPrice)}</td>
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
          </>
        )}
      </div>

      {/* 4. RECENT CLOSED TRADES & ORDER BOOK AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Closed Trades History */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                Recent Closed Trades ({tradesHistory.length})
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('journal')}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
              >
                Trade Journal &amp; Notes ➔
              </button>
            </div>
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
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {formatPositionLotSize(t)} Lots
                        </span>
                        {t.disciplineRating ? (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            ★ {t.disciplineRating}/5
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            Unreviewed
                          </span>
                        )}
                        {t.serverName && (
                          <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                            {t.serverName}
                          </span>
                        )}
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
