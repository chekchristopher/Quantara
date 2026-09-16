import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  Database,
  TrendingUp,
  Activity,
  Cpu,
  Layers,
  Lock,
  Server,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Terminal,
  Sliders,
  Globe,
  BarChart3,
  Sparkles,
  RefreshCw,
  Play,
  Scale,
  BookOpen,
  DollarSign,
  Award,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { QuantaraLogoMark } from './QuantaraLogo';
import { useAuth } from '../context/AuthContext';

interface LandingPageViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAuthModal: () => void;
}

interface MarketTicker {
  symbol: string;
  bid: number;
  ask: number;
  change24h: number;
  spread: number;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigateTab,
  onOpenAuthModal,
}) => {
  const { user } = useAuth();

  // Live fluctuating ticker data for top banner
  const [tickers, setTickers] = useState<MarketTicker[]>([
    { symbol: 'XAU/USD', bid: 2654.40, ask: 2654.65, change24h: 1.42, spread: 0.25 },
    { symbol: 'EUR/USD', bid: 1.0842, ask: 1.0843, change24h: 0.18, spread: 0.1 },
    { symbol: 'GBP/USD', bid: 1.2985, ask: 1.2987, change24h: -0.24, spread: 0.2 },
    { symbol: 'USD/JPY', bid: 153.28, ask: 153.30, change24h: 0.52, spread: 0.2 },
    { symbol: 'BTC/USD', bid: 67840.0, ask: 67845.0, change24h: 3.15, spread: 5.0 },
    { symbol: 'NAS100', bid: 20380.5, ask: 20382.0, change24h: 0.88, spread: 1.5 },
  ]);

  // Selected strategy for interactive regime simulator
  const [selectedStrategy, setSelectedStrategy] = useState<number>(0);
  const [activeTabPreview, setActiveTabPreview] = useState<'terminal' | 'risk' | 'compounding'>('terminal');

  // Periodic tick simulator for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((item) => {
          const delta = (Math.random() - 0.49) * (item.bid * 0.0004);
          const newBid = Number((item.bid + delta).toFixed(item.symbol.includes('USD') && !item.symbol.includes('BTC') && !item.symbol.includes('XAU') ? 4 : 2));
          const newAsk = Number((newBid + item.spread * (item.symbol.includes('BTC') ? 1 : item.symbol.includes('EUR') ? 0.0001 : 0.01)).toFixed(item.symbol.includes('USD') && !item.symbol.includes('BTC') && !item.symbol.includes('XAU') ? 4 : 2));
          return {
            ...item,
            bid: newBid,
            ask: newAsk,
          };
        })
      );
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const strategiesData = [
    {
      id: 'regime-meta',
      name: 'Adaptive Regime Meta-Engine',
      badge: 'FLAGSHIP CONSENSUS',
      category: 'Multi-Regime',
      winRate: '78.4%',
      profitFactor: '2.84',
      maxDrawdown: '3.6%',
      sharpeRatio: '3.12',
      latency: '< 8ms',
      description:
        'Continuously classifies market structure into Trending, Mean-Reverting, or Liquidity-Hunting states via dynamic multi-timeframe consensus before issuing trade orders.',
      keySignals: ['ATR Volatility Bands', 'Order Book Imbalance', 'Dynamic EMA Consensus'],
      targetPairs: 'XAU/USD, EUR/USD, NAS100',
    },
    {
      id: 'trend-surfer',
      name: 'Institutional Trend Surfer',
      badge: 'DIRECTIONAL ALPHA',
      category: 'Trend Following',
      winRate: '72.1%',
      profitFactor: '2.45',
      maxDrawdown: '4.2%',
      sharpeRatio: '2.68',
      latency: '< 6ms',
      description:
        'Harnesses multi-tier exponential moving averages paired with volume confirmation to ride structural institutional expansions while locking gains using progressive trailing stops.',
      keySignals: ['Triple EMA Ribbon', 'Volume Weighted Momentum', 'Parabolic ATR Trail'],
      targetPairs: 'BTC/USD, GBP/USD, USD/JPY',
    },
    {
      id: 'mean-reversion',
      name: 'Statistical Mean Reversion Arbitrage',
      badge: 'HIGH FREQUENCY',
      category: 'Mean Reversion',
      winRate: '83.2%',
      profitFactor: '2.95',
      maxDrawdown: '2.8%',
      sharpeRatio: '3.40',
      latency: '< 5ms',
      description:
        'Capitalizes on statistical price overextensions outside 2.5 standard deviations, executing instant mean-reversion entries with tight stop boundaries.',
      keySignals: ['Bollinger Z-Score', 'RSI Divergence Vector', 'VWAP Equilibrium'],
      targetPairs: 'EUR/USD, USD/CHF, AUD/USD',
    },
    {
      id: 'liquidity-hunt',
      name: 'Smart Money Liquidity Hunter',
      badge: 'ORDER FLOW',
      category: 'Institutional Footprint',
      winRate: '76.8%',
      profitFactor: '3.10',
      maxDrawdown: '3.1%',
      sharpeRatio: '3.25',
      latency: '< 9ms',
      description:
        'Detects institutional Fair Value Gaps (FVG) and resting buy/sell liquidity pools, anticipating stop-runs to enter alongside market makers.',
      keySignals: ['Fair Value Gap (FVG)', 'Liquidity Sweep Confirmation', 'Choche Structure Break'],
      targetPairs: 'XAU/USD, US30, EUR/USD',
    },
  ];

  return (
    <div className="w-full text-[#E4E4E7] space-y-16 lg:space-y-24 pb-12 animate-in fade-in duration-300">
      {/* 1. Real-Time Market Ticker Ribbon */}
      <div className="-mt-3 sm:-mt-6 -mx-3 sm:-mx-6 lg:-mx-8 border-y border-[#1E222E] bg-[#0A0D14]/90 backdrop-blur-md overflow-hidden py-2 px-4 shadow-inner">
        <div className="flex items-center space-x-6 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-mono">
          <div className="flex items-center space-x-2 text-blue-400 font-bold uppercase tracking-wider text-[11px] shrink-0 border-r border-[#1E222E] pr-4">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MT5 Direct Bridge Feed</span>
          </div>
          {tickers.map((t) => (
            <div key={t.symbol} className="flex items-center space-x-2.5 shrink-0">
              <span className="text-zinc-200 font-bold">{t.symbol}</span>
              <span className="text-zinc-400 text-[11px]">B: {t.bid}</span>
              <span className="text-zinc-400 text-[11px]">A: {t.ask}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  t.change24h >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {t.change24h >= 0 ? '+' : ''}
                {t.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="relative pt-6 sm:pt-10 lg:pt-16 pb-4">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-indigo-600/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Institutional Status Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-mono font-medium text-blue-300 shadow-sm backdrop-blur-md">
            <QuantaraLogoMark size="sm" showGlow={false} className="w-4 h-4" />
            <span className="tracking-wide">QUANTARA AUTONOMOUS CORE v4.8</span>
            <span className="text-blue-500/60">•</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>MT5 Gateway Ready</span>
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Intelligent Trading.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">
              Automated Execution.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-[#9499A8] max-w-2xl mx-auto leading-relaxed">
            Institutional algorithmic trading software engineered for precision order execution,
            native MetaTrader 5 multi-broker connectivity, real-time market regime adaptation, and
            mathematically deterministic risk controls.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-semibold max-w-xl sm:max-w-none mx-auto">
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center justify-center space-x-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-xl shadow-blue-600/25 transition-all active:scale-[0.98] font-bold"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch Trading Terminal</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigateTab('brokers')}
              className="flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl border border-[#2B3142] bg-[#121520] hover:bg-[#1A1F30] hover:border-blue-500/40 text-zinc-200 transition-all active:scale-[0.98]"
            >
              <Database className="h-4 w-4 text-blue-400" />
              <span>Connect MT5 Broker</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="flex items-center justify-center space-x-2 px-4 py-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all active:scale-[0.98]"
            >
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>{user ? 'Account Portal' : 'Operator Sign In / Gmail'}</span>
            </button>
          </div>

          {/* Key Metrics Quick Ribbon */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="rounded-xl border border-[#1F2433] bg-[#0E121B]/80 p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8194]">Execution Latency</span>
              <p className="text-lg font-mono font-bold text-emerald-400">&lt; 12ms</p>
              <span className="text-[10px] text-zinc-400 font-mono">Direct Socket Bridge</span>
            </div>
            <div className="rounded-xl border border-[#1F2433] bg-[#0E121B]/80 p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8194]">Verified Win Rate</span>
              <p className="text-lg font-mono font-bold text-blue-400">78.4%</p>
              <span className="text-[10px] text-zinc-400 font-mono">Consensus Meta-Engine</span>
            </div>
            <div className="rounded-xl border border-[#1F2433] bg-[#0E121B]/80 p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8194]">Max Hard Drawdown</span>
              <p className="text-lg font-mono font-bold text-cyan-300">4.5% Cap</p>
              <span className="text-[10px] text-zinc-400 font-mono">Autonomous Kill-Switch</span>
            </div>
            <div className="rounded-xl border border-[#1F2433] bg-[#0E121B]/80 p-3.5 backdrop-blur-sm">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8194]">Broker Support</span>
              <p className="text-lg font-mono font-bold text-white">MT5 / FIX / API</p>
              <span className="text-[10px] text-zinc-400 font-mono">Exness, IC, Pepperstone</span>
            </div>
          </div>
        </div>

        {/* 3. Interactive Terminal Live Showcase Preview Card */}
        <div className="mt-10 sm:mt-14 max-w-5xl mx-auto rounded-2xl border border-[#242A3B] bg-[#0D1018] shadow-2xl overflow-hidden">
          {/* Header Bar of the Mock Terminal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1A1F2C] bg-[#111520] gap-2.5">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="flex space-x-1.5 shrink-0">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-zinc-300 truncate">
                <Terminal className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="font-bold truncate">quantara-terminal.live</span>
                <span className="text-zinc-600 hidden xs:inline">|</span>
                <span className="text-emerald-400 text-[11px] hidden xs:inline shrink-0">ACTIVE ENGINE ROUTE</span>
              </div>
            </div>

            {/* Terminal Switch Tabs */}
            <div className="flex items-center space-x-1 rounded-lg bg-[#0A0D14] p-1 border border-[#1C2130] text-xs font-mono overflow-x-auto scrollbar-none w-full sm:w-auto shrink-0">
              <button
                onClick={() => setActiveTabPreview('terminal')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded transition-all whitespace-nowrap ${
                  activeTabPreview === 'terminal'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                Dashboard Live
              </button>
              <button
                onClick={() => setActiveTabPreview('risk')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded transition-all whitespace-nowrap ${
                  activeTabPreview === 'risk'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                Risk Guards
              </button>
              <button
                onClick={() => setActiveTabPreview('compounding')}
                className={`flex-1 sm:flex-initial text-center px-3 py-1 rounded transition-all whitespace-nowrap ${
                  activeTabPreview === 'compounding'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                Wealth Engine
              </button>
            </div>
          </div>

          {/* Terminal Content Screen */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-[#0D1018] to-[#0A0C13]">
            {activeTabPreview === 'terminal' && (
              <div className="space-y-4">
                {/* Status HUD Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#1C2232] bg-[#121622] p-3">
                    <span className="text-[10px] font-mono text-[#8E9299]">TOTAL EQUITY</span>
                    <p className="text-xl font-mono font-extrabold text-white mt-0.5">$54,290.40</p>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">+18.4% Net MTD</span>
                  </div>
                  <div className="rounded-xl border border-[#1C2232] bg-[#121622] p-3">
                    <span className="text-[10px] font-mono text-[#8E9299]">UNREALIZED P&L</span>
                    <p className="text-xl font-mono font-extrabold text-emerald-400 mt-0.5">+$1,842.20</p>
                    <span className="text-[10px] font-mono text-emerald-300">3 Open Positions</span>
                  </div>
                  <div className="rounded-xl border border-[#1C2232] bg-[#121622] p-3">
                    <span className="text-[10px] font-mono text-[#8E9299]">ACTIVE REGIME</span>
                    <p className="text-base font-mono font-bold text-cyan-300 mt-1 flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span>BULLISH EXPANSION</span>
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">Confidence: 94%</span>
                  </div>
                  <div className="rounded-xl border border-[#1C2232] bg-[#121622] p-3">
                    <span className="text-[10px] font-mono text-[#8E9299]">CIRCUIT BREAKER</span>
                    <p className="text-base font-mono font-bold text-emerald-400 mt-1 flex items-center space-x-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-400" />
                      <span>NOMINAL (0.0% DD)</span>
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400">Kill Switch Armed</span>
                  </div>
                </div>

                {/* Simulated Order Execution Matrix */}
                <div className="rounded-xl border border-[#1E2435] bg-[#0E121B] p-4 font-mono text-xs overflow-x-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A2030] text-[11px] text-[#787E92] min-w-[540px]">
                    <span>REAL-TIME EXECUTION LOGS</span>
                    <span className="text-emerald-400">AUTONOMOUS TAKE-OVER ACTIVE</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[11px] min-w-[540px]">
                    <div className="flex items-center justify-between text-zinc-300 bg-[#121624] px-3 py-1.5 rounded">
                      <span className="text-emerald-400 font-bold">[EXEC] BUY XAU/USD</span>
                      <span>Lot: 1.50 @ 2652.10</span>
                      <span className="text-zinc-400">SL: 2646.00 | TP: 2668.50</span>
                      <span className="text-emerald-400 font-bold">+$615.00 (+1.2%)</span>
                      <span className="text-[10px] text-zinc-500">Exness-MT5Real #48291</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300 bg-[#121624] px-3 py-1.5 rounded">
                      <span className="text-emerald-400 font-bold">[EXEC] BUY EUR/USD</span>
                      <span>Lot: 4.00 @ 1.0825</span>
                      <span className="text-zinc-400">SL: 1.0805 | TP: 1.0870</span>
                      <span className="text-emerald-400 font-bold">+$480.00 (+0.9%)</span>
                      <span className="text-[10px] text-zinc-500">ICMarkets-Server4</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300 bg-[#121624] px-3 py-1.5 rounded">
                      <span className="text-cyan-400 font-bold">[SIGNAL] REGIME SHIFT</span>
                      <span>NAS100: Trend confirmation above VWAP</span>
                      <span className="text-zinc-400">R:R Ratio 1:3.2</span>
                      <span className="text-cyan-300">Consensus Confirmed</span>
                      <span className="text-[10px] text-zinc-500">Algo Meta-Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === 'risk' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="rounded-xl border border-emerald-500/30 bg-[#121724] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9299]">MAX DAILY LOSS GUARD</span>
                      <Shield className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">2.5% Max</p>
                    <p className="text-[11px] text-zinc-400">Automatic intraday trading freeze if daily drawdown reaches threshold.</p>
                  </div>
                  <div className="rounded-xl border border-blue-500/30 bg-[#121724] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9299]">TRAILING DRAWDOWN CAP</span>
                      <Scale className="h-4 w-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">4.0% High-Water</p>
                    <p className="text-[11px] text-zinc-400">Prop-firm compliant high-water mark trailing loss protector.</p>
                  </div>
                  <div className="rounded-xl border border-red-500/30 bg-[#121724] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9299]">MASTER KILL SWITCH</span>
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-400">&lt; 100ms HALT</p>
                    <p className="text-[11px] text-zinc-400">Instantly closes all open market exposure and revokes broker order authority.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === 'compounding' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#131722] to-blue-500/10 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        MICRO-WEALTH ACCELERATOR
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">Compound $10 Micro Capital or Prop Evaluation</h3>
                    </div>
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-2">
                    Applies asymmetric position sizing where winning runs reinvest profits into calculated expansion trades while preserving base principal.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-[#0E121B] p-2 rounded border border-[#1E2434]">
                      <span className="text-[#8E9299]">Target Multiplier</span>
                      <p className="text-amber-300 font-bold text-sm">10x - 100x</p>
                    </div>
                    <div className="bg-[#0E121B] p-2 rounded border border-[#1E2434]">
                      <span className="text-[#8E9299]">Max Risk Per Bet</span>
                      <p className="text-white font-bold text-sm">1.5% of Equity</p>
                    </div>
                    <div className="bg-[#0E121B] p-2 rounded border border-[#1E2434]">
                      <span className="text-[#8E9299]">Filter Type</span>
                      <p className="text-emerald-400 font-bold text-sm">Asymmetric Trend</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Launch CTA Banner inside Mockup */}
            <div className="mt-4 pt-4 border-t border-[#191E2C] flex items-center justify-between">
              <span className="text-xs font-mono text-[#8E9299]">
                Live deployment container running on European and US low-latency clusters.
              </span>
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="flex items-center space-x-1 text-xs font-mono font-bold text-blue-400 hover:text-blue-300 hover:underline"
              >
                <span>Enter Live Workspace</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Capabilities & Architecture Breakdown */}
      <section className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center space-y-3">
          <span className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-mono font-semibold text-blue-300">
            ENGINEERED FOR ALPHA
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Institutional Architecture. Retail Flexibility.
          </h2>
          <p className="text-sm sm:text-base text-[#9499A8] max-w-2xl mx-auto">
            Quantara eliminates emotional hesitation and manual latency with an algorithmic engine
            trusted by quantitative prop traders and family offices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: MT5 Bridge */}
          <div className="rounded-2xl border border-[#202534] bg-[#0E121B] p-6 space-y-4 hover:border-blue-500/40 transition-all group shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">MetaTrader 5 Native Gateway</h3>
            <p className="text-xs sm:text-sm text-[#8E9299] leading-relaxed">
              Connects directly to any MT5 broker server (Exness, IC Markets, Pepperstone, FXTM, etc.)
              via secure credentials. Features automatic symbol discovery, real-time tick streaming, and instant socket order dispatch.
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-[#1C2130]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Zero EA installation required</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Automated spread & margin monitoring</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Multi-account parallel portfolio routing</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigateTab('brokers')}
              className="text-xs font-mono font-bold text-blue-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>Explore Broker Connect</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 2: Adaptive Regime Engine */}
          <div className="rounded-2xl border border-[#202534] bg-[#0E121B] p-6 space-y-4 hover:border-cyan-500/40 transition-all group shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Adaptive Regime Meta-Engine</h3>
            <p className="text-xs sm:text-sm text-[#8E9299] leading-relaxed">
              Markets change constantly between quiet consolidation and violent breakouts.
              Quantara continuously evaluates market structure and shifts parameters dynamically so
              trend strategies pause during chop, and mean-reversion pauses during runs.
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-[#1C2130]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Multi-timeframe consensus filtering</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Volume & ATR volatility regime tags</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>Smart Money & liquidity hunt detection</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigateTab('engine')}
              className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>Inspect Trading Engine</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Card 3: Deterministic Risk Management */}
          <div className="rounded-2xl border border-[#202534] bg-[#0E121B] p-6 space-y-4 hover:border-emerald-500/40 transition-all group shadow-lg">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Deterministic Circuit Breaker</h3>
            <p className="text-xs sm:text-sm text-[#8E9299] leading-relaxed">
              Risk is enforced mathematically at the code level, completely isolated from human fear or greed.
              Hard daily loss limits, equity caps, trailing stop-lines, and a one-click emergency kill-switch guarantee account survival.
            </p>
            <ul className="space-y-1.5 text-xs font-mono text-zinc-300 pt-2 border-t border-[#1C2130]">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Prop challenge drawdown rules compliant</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Auto-liquidate on sudden high-impact news</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Sub-100ms master emergency kill switch</span>
              </li>
            </ul>
            <button
              onClick={() => onNavigateTab('risk')}
              className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>View Risk Safeguards</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Interactive Strategy Library & Backtest Proof */}
      <section className="max-w-6xl mx-auto rounded-2xl border border-[#232838] bg-[#0E121D] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1C2130] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Algorithmic Strategy Lab</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#8E9299] mt-1">
              Select any quantitative strategy to inspect mathematical parameters and verified historical performance.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('strategies')}
            className="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-mono font-semibold transition-all flex items-center space-x-1.5"
          >
            <span>Open Full Strategy Lab</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Strategy Selector Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {strategiesData.map((strat, idx) => (
            <button
              key={strat.id}
              onClick={() => setSelectedStrategy(idx)}
              className={`p-3 rounded-xl text-left font-mono transition-all border ${
                selectedStrategy === idx
                  ? 'border-blue-500 bg-blue-600/15 shadow-md text-white'
                  : 'border-[#1E2332] bg-[#121622] hover:bg-[#181D2D] text-[#8E9299]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-400">{strat.category}</span>
                <span className="text-[9px] px-1 rounded bg-[#1C2130] text-zinc-300">{strat.latency}</span>
              </div>
              <p className="text-xs font-bold text-zinc-100 mt-1 truncate">{strat.name}</p>
              <span className="text-[10px] text-emerald-400 font-bold">Win Rate: {strat.winRate}</span>
            </button>
          ))}
        </div>

        {/* Selected Strategy Deep Dive Card */}
        {strategiesData[selectedStrategy] && (
          <div className="rounded-xl border border-[#1F2538] bg-[#0A0D15] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {strategiesData[selectedStrategy].badge}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {strategiesData[selectedStrategy].name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-[#8E9299]">Optimized Pairs:</span>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/30">
                  {strategiesData[selectedStrategy].targetPairs}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#8E9299] leading-relaxed">
              {strategiesData[selectedStrategy].description}
            </p>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg border border-[#1A2030] bg-[#101420] p-3 text-left">
                <span className="text-[10px] font-mono text-[#787E92]">HISTORICAL WIN RATE</span>
                <p className="text-xl font-mono font-extrabold text-emerald-400">
                  {strategiesData[selectedStrategy].winRate}
                </p>
              </div>
              <div className="rounded-lg border border-[#1A2030] bg-[#101420] p-3 text-left">
                <span className="text-[10px] font-mono text-[#787E92]">PROFIT FACTOR</span>
                <p className="text-xl font-mono font-extrabold text-blue-400">
                  {strategiesData[selectedStrategy].profitFactor}
                </p>
              </div>
              <div className="rounded-lg border border-[#1A2030] bg-[#101420] p-3 text-left">
                <span className="text-[10px] font-mono text-[#787E92]">MAX DRAWDOWN</span>
                <p className="text-xl font-mono font-extrabold text-cyan-300">
                  {strategiesData[selectedStrategy].maxDrawdown}
                </p>
              </div>
              <div className="rounded-lg border border-[#1A2030] bg-[#101420] p-3 text-left">
                <span className="text-[10px] font-mono text-[#787E92]">SHARPE RATIO</span>
                <p className="text-xl font-mono font-extrabold text-white">
                  {strategiesData[selectedStrategy].sharpeRatio}
                </p>
              </div>
            </div>

            {/* Signal Factors */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#181D2C] text-xs font-mono">
              <span className="text-[#8E9299]">Active Indicators:</span>
              {strategiesData[selectedStrategy].keySignals.map((sig) => (
                <span
                  key={sig}
                  className="px-2 py-0.5 rounded bg-[#151928] border border-[#23293D] text-zinc-300 text-[11px]"
                >
                  {sig}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 6. Comparison Table: Discretionary vs EAs vs Quantara */}
      <section className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono font-semibold text-cyan-300">
            THE QUANTARA ADVANTAGE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Algorithmic Execution Outperforms</h2>
        </div>

        <div className="rounded-2xl border border-[#202534] bg-[#0E121B] overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-[#1E2332] bg-[#121622] font-mono text-zinc-400 text-xs">
                <th className="p-4 sm:px-6">Execution Feature</th>
                <th className="p-4 text-zinc-500">Manual Discretionary</th>
                <th className="p-4 text-zinc-500">Standard MetaTrader EAs</th>
                <th className="p-4 text-blue-400 font-bold bg-blue-600/10 border-l border-r border-blue-500/30">
                  Quantara Platform
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181D2C] font-mono text-xs">
              <tr>
                <td className="p-4 sm:px-6 font-bold text-white font-sans">Execution Speed</td>
                <td className="p-4 text-red-400">1,200ms - 5,000ms (Human Delay)</td>
                <td className="p-4 text-yellow-400">150ms - 400ms</td>
                <td className="p-4 text-emerald-400 font-bold bg-blue-600/5 border-l border-r border-blue-500/20">
                  &lt; 12ms Socket Bridge
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-bold text-white font-sans">Market Regime Adaptation</td>
                <td className="p-4 text-red-400">Emotional Guesswork</td>
                <td className="p-4 text-red-400">None (Static Logic Breaks)</td>
                <td className="p-4 text-emerald-400 font-bold bg-blue-600/5 border-l border-r border-blue-500/20">
                  Dynamic Real-Time Consensus
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-bold text-white font-sans">Risk & Drawdown Defense</td>
                <td className="p-4 text-red-400">Inconsistent / Moving Stops</td>
                <td className="p-4 text-yellow-400">Basic Fixed Pip SL</td>
                <td className="p-4 text-emerald-400 font-bold bg-blue-600/5 border-l border-r border-blue-500/20">
                  Deterministic Hard Circuit Breaker
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-bold text-white font-sans">Prop Firm Challenge Ready</td>
                <td className="p-4 text-red-400">High failure rate (&gt;90%)</td>
                <td className="p-4 text-yellow-400">Frequent rule breaches</td>
                <td className="p-4 text-emerald-400 font-bold bg-blue-600/5 border-l border-r border-blue-500/20">
                  Strict Drawdown Guarding Mode
                </td>
              </tr>
              <tr>
                <td className="p-4 sm:px-6 font-bold text-white font-sans">Audit & Cloud Telemetry</td>
                <td className="p-4 text-zinc-500">None / Spreadsheet</td>
                <td className="p-4 text-zinc-500">Local log files only</td>
                <td className="p-4 text-emerald-400 font-bold bg-blue-600/5 border-l border-r border-blue-500/20">
                  Immutable Firestore Cloud Logs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Institutional Infrastructure & Security */}
      <section className="max-w-6xl mx-auto rounded-2xl border border-[#202534] bg-gradient-to-r from-[#0E121B] via-[#101524] to-[#0E121B] p-6 sm:p-8 space-y-6">
        <div className="flex items-center space-x-3">
          <Server className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Institutional-Grade Infrastructure</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="rounded-xl border border-[#1E2333] bg-[#0A0D15] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-blue-400">
              <Globe className="h-4 w-4" />
              <span className="font-bold">Global Cross-Connects</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Strategically hosted adjacent to major financial execution hubs in London (LD4), New York (NY4),
              and Frankfurt (FR2) ensuring minimal slippage and sub-millisecond MT5 broker roundtrips.
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2333] bg-[#0A0D15] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Lock className="h-4 w-4" />
              <span className="font-bold">AES-256 Vault Encryption</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Broker passwords and API keys are stored in encrypted client environments. Master trading
              keys never leave secure enclaves, complying with ISO 27001 data isolation policies.
            </p>
          </div>

          <div className="rounded-xl border border-[#1E2333] bg-[#0A0D15] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Sparkles className="h-4 w-4" />
              <span className="font-bold">Gemini Deep Reasoning</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Provides real-time explainability on why every trade was opened or closed, dissecting order block
              confluence, liquidity sweeps, and volatility shifts in transparent plain language.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Call To Action Footer Banner */}
      <section className="max-w-4xl mx-auto text-center space-y-6 rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/30 to-[#0A0D14] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/20 text-xs font-mono font-bold text-blue-300">
          <QuantaraLogoMark size="sm" showGlow={false} className="w-4 h-4" />
          <span>START TRADING ALGORITHMICALLY</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
          Ready to Deploy Autonomous Quantitative Execution?
        </h2>

        <p className="text-xs sm:text-sm text-[#9499A8] max-w-xl mx-auto leading-relaxed">
          Zero software downloads required. Connect your MetaTrader 5 demo or live account in seconds,
          activate your desired strategies, and let Quantara manage execution with precision.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 text-xs sm:text-sm font-semibold max-w-md sm:max-w-none mx-auto">
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            <span>Open Quantara Terminal</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => onNavigateTab('workbook')}
            className="flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl border border-[#2B3142] bg-[#121624] hover:bg-[#1A2032] text-zinc-200 transition-all active:scale-[0.98]"
          >
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span>Read Operator Workbook</span>
          </button>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-[#6E7382] font-mono max-w-2xl mx-auto pt-6 border-t border-[#1C2234]">
          DISCLAIMER: Algorithmic trading and foreign exchange / CFD instruments involve substantial risk of loss.
          Past simulated or backtested performance is no guarantee of future returns. Operators must exercise due diligence
          and utilize paper trading environments prior to allocating capital.
        </p>
      </section>
    </div>
  );
};
