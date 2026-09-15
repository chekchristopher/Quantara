import React, { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Cpu,
  DollarSign,
  Flame,
  Layers,
  Lock,
  Percent,
  Play,
  Pause,
  RefreshCw,
  Rocket,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { BotState, BrokerAccount, PortfolioSummary, Position, TradeHistoryItem } from '../types';

interface MicroAccountCompoundingViewProps {
  portfolio: PortfolioSummary;
  botState: BotState;
  brokerAccounts: BrokerAccount[];
  recentTrades: TradeHistoryItem[];
  openPositions: Position[];
  onResetCapital: (amount: number, isChallenge?: boolean) => Promise<any>;
  onToggleTakeover: () => Promise<any>;
  onUpdateCompounding: (payload: { mode: 'standard' | 'micro-wealth-accelerator'; target?: number; asymmetricFilter?: boolean }) => Promise<any>;
  onSelectBrokerForTakeover: (accountId: string) => Promise<any>;
  onNavigateToTab: (tab: string) => void;
}

export const MicroAccountCompoundingView: React.FC<MicroAccountCompoundingViewProps> = ({
  portfolio,
  botState,
  brokerAccounts,
  recentTrades,
  openPositions,
  onResetCapital,
  onToggleTakeover,
  onUpdateCompounding,
  onSelectBrokerForTakeover,
  onNavigateToTab,
}) => {
  const [customCapital, setCustomCapital] = useState<string>('10');
  const [targetWealth, setTargetWealth] = useState<number>(botState.microAccountTarget || 10000);
  const [isResetting, setIsResetting] = useState(false);

  // Compounding Calculator Simulator State
  const [simSeed, setSimSeed] = useState<number>(10);
  const [simWinRate, setSimWinRate] = useState<number>(68);
  const [simRiskReward, setSimRiskReward] = useState<number>(2.8);
  const [simTradesPerWeek, setSimTradesPerWeek] = useState<number>(14);
  const [simRiskPercent, setSimRiskPercent] = useState<number>(2.5);

  const activeAccount = brokerAccounts.find((b) => b.id === botState.activeBrokerAccountId) || brokerAccounts[0];

  const currentEquity = portfolio.totalEquity;
  const seedCapital = botState.initialSeedCapital || 10;
  const growthMultiplier = seedCapital > 0 ? (currentEquity / seedCapital).toFixed(2) : '1.00';
  const totalReturnPercent = seedCapital > 0 ? (((currentEquity - seedCapital) / seedCapital) * 100).toFixed(1) : '0.0';

  // Calculate geometric compounding roadmap milestones
  const milestones = [
    {
      stage: 1,
      title: 'Stage 1: Seed Survival & Calibration',
      target: 25,
      from: 10,
      multiple: '2.5x',
      focus: 'Zero-Ruin Discipline',
      description: 'Fractional lot sizing, strict 2.5% max risk per trade, minimum 1:3 R:R filter to build a buffer without taking catastrophic drawdowns.',
      achieved: currentEquity >= 25,
      progress: Math.min(100, Math.max(0, Math.round(((currentEquity - seedCapital) / Math.max(1, 25 - seedCapital)) * 100))),
    },
    {
      stage: 2,
      title: 'Stage 2: Compounding Velocity',
      target: 100,
      from: 25,
      multiple: '4.0x',
      focus: 'Break-Even Locks & Reinvestment',
      description: 'Stop losses automatically jump to break-even once trade reaches +1.2R. 100% of realized profits are dynamically compounded into next trade sizing.',
      achieved: currentEquity >= 100,
      progress: Math.min(100, Math.max(0, Math.round(((currentEquity - 25) / (100 - 25)) * 100))),
    },
    {
      stage: 3,
      title: 'Stage 3: Multi-Asset Scale',
      target: 500,
      from: 100,
      multiple: '5.0x',
      focus: 'Decorrelated Diversification',
      description: 'The engine expands from single crypto pairs to high-beta equities and volatility breakouts (BTC, SOL, NVDA) with max asset correlation guardrails.',
      achieved: currentEquity >= 500,
      progress: Math.min(100, Math.max(0, Math.round(((currentEquity - 100) / (500 - 100)) * 100))),
    },
    {
      stage: 4,
      title: 'Stage 4: Exponential Momentum',
      target: 2500,
      from: 500,
      multiple: '5.0x',
      focus: 'Regime-Adaptive Squeezes',
      description: 'Meta-Engine shifts weights between Trend Following in high ADX markets and Mean Reversion in consolidations for high compounding frequency.',
      achieved: currentEquity >= 2500,
      progress: Math.min(100, Math.max(0, Math.round(((currentEquity - 500) / (2500 - 500)) * 100))),
    },
    {
      stage: 5,
      title: 'Stage 5: Institutional Wealth Tier',
      target: targetWealth,
      from: 2500,
      multiple: `${(targetWealth / 2500).toFixed(1)}x`,
      focus: 'Financial Sovereignty & Autopilot',
      description: 'Sustained wealth accumulation. System auto-rebalances between aggressive compounder and capital preservation lock mode.',
      achieved: currentEquity >= targetWealth,
      progress: Math.min(100, Math.max(0, Math.round(((currentEquity - 2500) / Math.max(1, targetWealth - 2500)) * 100))),
    },
  ];

  // Mathematical Simulator: Geometric growth calculation
  const calculateSimulatedGrowth = (weeks: number) => {
    const trades = Math.round(weeks * simTradesPerWeek);
    const winProbability = simWinRate / 100;
    const lossProbability = 1 - winProbability;
    const riskFraction = simRiskPercent / 100;
    const winFraction = riskFraction * simRiskReward;

    // Geometric expected growth factor per trade: (1 + winFraction)^winProb * (1 - riskFraction)^lossProb
    const growthPerTrade = Math.pow(1 + winFraction, winProbability) * Math.pow(1 - riskFraction, lossProbability);
    const projectedBalance = simSeed * Math.pow(growthPerTrade, trades);
    return Math.round(projectedBalance);
  };

  const sim30Days = calculateSimulatedGrowth(4.3);
  const sim60Days = calculateSimulatedGrowth(8.6);
  const sim90Days = calculateSimulatedGrowth(13);

  const handleQuickReset = async (amount: number, isChallenge: boolean) => {
    setIsResetting(true);
    try {
      await onResetCapital(amount, isChallenge);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Autonomous Takeover Hero Banner */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-[#0F172A] via-[#141416] to-[#0A0A0C] p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-80 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${botState.autonomousTakeover ? 'bg-[#10B981]' : 'bg-yellow-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${botState.autonomousTakeover ? 'bg-[#10B981]' : 'bg-yellow-400'}`} />
              </span>
              <span className="font-tech text-xs uppercase tracking-widest font-bold text-blue-300">
                {botState.autonomousTakeover ? 'Autonomous Takeover: Engaged' : 'Autonomous Takeover: Standby / Paused'}
              </span>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 font-mono text-[10px] text-blue-400 border border-blue-500/20">
                {activeAccount ? `${activeAccount.broker} (${activeAccount.accountNumber})` : 'Connected Broker'}
              </span>
            </div>

            <h1 className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Small-Account Wealth Accelerator
              <span className="text-xs font-tech font-normal px-2 py-0.5 rounded bg-[#1F1F23] text-blue-400 border border-blue-500/30">
                $10 → ${targetWealth.toLocaleString()} Protocol
              </span>
            </h1>

            <p className="text-xs text-[#8E9299] max-w-2xl leading-relaxed">
              Engineered specifically for micro-capital compounding. The software executes 24/7 on your connected account using fractional Kelly-criterion sizing, asymmetric R:R filtering (1:2.8+), and break-even trailing stop locks to turn a $10 seed into substantial wealth.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onToggleTakeover}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 font-tech text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                botState.autonomousTakeover
                  ? 'bg-[#10B981] hover:bg-emerald-600 text-black shadow-[#10B981]/25'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25'
              }`}
            >
              {botState.autonomousTakeover ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Pause Takeover</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Hand Over To Quantara</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigateToTab('brokers')}
              className="rounded-lg border border-[#2E2E33] bg-[#141416] px-3 py-2 text-xs font-tech text-[#8E9299] hover:text-white hover:border-blue-500/40 transition-colors flex items-center space-x-1.5"
            >
              <span>Switch Broker Account</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Equity & Milestone Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Current Account Equity</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tracking-tight">
            ${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className={Number(totalReturnPercent) >= 0 ? 'text-[#10B981]' : 'text-red-400'}>
              {Number(totalReturnPercent) >= 0 ? '+' : ''}{totalReturnPercent}%
            </span>
            <span className="text-[#8E9299]">from ${seedCapital.toFixed(2)} seed</span>
            <span className="rounded bg-blue-500/10 text-blue-400 text-[10px] px-1.5 font-bold">
              {growthMultiplier}x
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Wealth Target</span>
            <Target className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-bold text-white tracking-tight">
            ${targetWealth.toLocaleString()}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-[#8E9299]">
              <span>Progress</span>
              <span className="text-white font-bold">{Math.min(100, Math.max(0, (currentEquity / targetWealth) * 100)).toFixed(2)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1F1F23] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(1, (currentEquity / targetWealth) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Ruin Prevention Level</span>
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
          </div>
          <div className="font-mono text-xl font-bold text-[#10B981] tracking-tight flex items-center gap-1.5">
            <span>MAXIMUM</span>
            <span className="text-xs font-normal text-[#8E9299] font-sans">(Zero-Ruin Protocol)</span>
          </div>
          <div className="text-[11px] text-[#8E9299] font-mono">
            Max Risk: <strong className="text-white">2.5% / Trade</strong> (${(currentEquity * 0.025).toFixed(2)})
          </div>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Asymmetric Filter</span>
            <Zap className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
            <span className="text-amber-400">≥ 1:2.5 R:R</span>
            <span className="text-xs text-[#8E9299] font-normal font-sans">Min Expectancy</span>
          </div>
          <div className="text-[11px] text-[#8E9299] font-mono">
            Breakeven Lock: <strong className="text-white">+1.2R Auto-Trigger</strong>
          </div>
        </div>
      </div>

      {/* Quick Capital Reset & Challenge Starter */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1F1F23] gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Rocket className="h-4 w-4 text-blue-400" />
              Capital Calibration & Challenge Presets
            </h2>
            <p className="text-xs text-[#8E9299]">
              Calibrate your trading capital to test turning a micro-account into wealth or set up a live broker balance.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs text-[#8E9299]">
            <span>Active Account:</span>
            <span className="font-mono text-white font-semibold">{activeAccount?.name}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleQuickReset(10, true)}
            disabled={isResetting}
            className="group rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 p-4 text-left transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="rounded bg-blue-500/20 text-blue-400 font-tech font-bold text-[11px] px-2 py-0.5 border border-blue-500/30">
                RECOMMENDED
              </span>
              <Flame className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="font-mono text-2xl font-bold text-white mb-1">$10.00</div>
            <div className="font-semibold text-xs text-blue-300">The $10 Micro Challenge</div>
            <div className="text-[11px] text-[#8E9299] mt-1">
              Start with exactly $10. Watch the engine trade fractional lots and compound automatically.
            </div>
          </button>

          <button
            onClick={() => handleQuickReset(50, false)}
            disabled={isResetting}
            className="group rounded-xl border border-[#1F1F23] bg-[#0E0E11] hover:border-blue-500/30 p-4 text-left transition-all"
          >
            <div className="font-mono text-2xl font-bold text-white mb-1">$50.00</div>
            <div className="font-semibold text-xs text-[#E4E4E7]">Velocity Booster</div>
            <div className="text-[11px] text-[#8E9299] mt-1">
              Stage 2 velocity balance. Allows broader asset coverage across crypto & micro equities.
            </div>
          </button>

          <button
            onClick={() => handleQuickReset(100, false)}
            disabled={isResetting}
            className="group rounded-xl border border-[#1F1F23] bg-[#0E0E11] hover:border-blue-500/30 p-4 text-left transition-all"
          >
            <div className="font-mono text-2xl font-bold text-white mb-1">$100.00</div>
            <div className="font-semibold text-xs text-[#E4E4E7]">Centurion Account</div>
            <div className="text-[11px] text-[#8E9299] mt-1">
              Standard seed for aggressive compounding. Enables full multi-position concurrency.
            </div>
          </button>

          <div className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-4 flex flex-col justify-between space-y-2">
            <div>
              <label className="block text-xs font-semibold text-[#8E9299] mb-1">Custom Capital ($)</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={customCapital}
                  onChange={(e) => setCustomCapital(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-1.5 font-mono text-sm text-white focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. 25"
                />
                <button
                  onClick={() => handleQuickReset(parseFloat(customCapital) || 10, false)}
                  disabled={isResetting}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 font-tech text-xs font-bold text-white hover:bg-blue-500 transition-colors shrink-0"
                >
                  Set
                </button>
              </div>
            </div>
            <div className="text-[10px] text-[#8E9299]">
              Resets balance, closes open positions, and recalibrates risk sizing.
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Compounding Roadmap ($10 -> $10,000) */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1F1F23] gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Compounding Pathway: $10 to ${targetWealth.toLocaleString()}
            </h2>
            <p className="text-xs text-[#8E9299]">
              Autonomous phase gates designed to protect capital at small sizes and scale rapidly as equity expands.
            </p>
          </div>

          <div className="text-xs font-mono text-[#8E9299]">
            Active Mode: <span className="text-[#10B981] font-semibold uppercase">{botState.compoundingMode}</span>
          </div>
        </div>

        <div className="space-y-3">
          {milestones.map((m) => {
            const isCurrent = currentEquity >= m.from && currentEquity < m.target;
            return (
              <div
                key={m.stage}
                className={`rounded-xl border p-4 transition-all ${
                  m.achieved
                    ? 'border-[#10B981]/30 bg-[#10B981]/5'
                    : isCurrent
                    ? 'border-blue-500/40 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                    : 'border-[#1F1F23] bg-[#0E0E11] opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                          m.achieved
                            ? 'bg-[#10B981]/20 text-[#10B981]'
                            : isCurrent
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-[#1F1F23] text-[#8E9299]'
                        }`}
                      >
                        STAGE {m.stage}
                      </span>
                      <h3 className="font-semibold text-sm text-white">{m.title}</h3>
                      <span className="font-mono text-xs text-blue-400 font-bold">
                        (${m.from} → ${m.target.toLocaleString()})
                      </span>
                      {m.achieved && (
                        <span className="flex items-center text-[#10B981] text-xs font-mono font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> COMPLETED
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-blue-500/20 text-blue-300 px-2 py-0.5 text-[10px] font-mono font-bold animate-pulse">
                          CURRENT STAGE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E9299] max-w-2xl leading-relaxed">{m.description}</p>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-white font-bold">${m.target.toLocaleString()}</div>
                      <div className="text-[10px] text-[#8E9299]">Target Capital</div>
                    </div>
                    <div className="w-24">
                      <div className="flex justify-between text-[10px] text-[#8E9299] mb-1">
                        <span>Progress</span>
                        <span className="text-white font-bold">{m.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1F1F23] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            m.achieved ? 'bg-[#10B981]' : 'bg-blue-500'
                          }`}
                          style={{ width: `${m.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Geometric Compounding Calculator */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-5">
        <div className="pb-3 border-b border-[#1F1F23]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <Calculator className="h-4 w-4 text-blue-400" />
            Mathematical Compounding Simulator
          </h2>
          <p className="text-xs text-[#8E9299]">
            Simulate how Kelly-criterion reinvestment exponentially compounds small accounts without risking catastrophic drawdown.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8E9299]">Initial Seed Capital:</span>
                <span className="text-white font-bold">${simSeed}.00</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={simSeed}
                onChange={(e) => setSimSeed(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8E9299]">Engine Win Rate:</span>
                <span className="text-[#10B981] font-bold">{simWinRate}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="85"
                step="1"
                value={simWinRate}
                onChange={(e) => setSimWinRate(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8E9299]">Average Asymmetric R:R:</span>
                <span className="text-blue-400 font-bold">1:{simRiskReward.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={simRiskReward}
                onChange={(e) => setSimRiskReward(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8E9299]">Trades Executed Per Week:</span>
                <span className="text-white font-bold">{simTradesPerWeek} trades</span>
              </div>
              <input
                type="range"
                min="4"
                max="28"
                step="2"
                value={simTradesPerWeek}
                onChange={(e) => setSimTradesPerWeek(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8E9299]">Risk Allocated Per Trade:</span>
                <span className="text-amber-400 font-bold">{simRiskPercent}%</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.25"
                value={simRiskPercent}
                onChange={(e) => setSimRiskPercent(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Projection Outputs */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#0A0A0B] p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="font-tech text-xs uppercase tracking-widest text-[#8E9299] font-bold block mb-1">
                Projected Geometric Compounding Curve
              </span>
              <div className="font-mono text-xs text-[#8E9299]">
                Starting with <strong className="text-white">${simSeed}</strong> @ {simWinRate}% win rate & 1:{simRiskReward} R:R:
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1F1F23] bg-[#141416] p-3 text-center">
                <div className="text-[10px] text-[#8E9299] uppercase font-mono">30 Days</div>
                <div className="font-mono text-lg font-bold text-white mt-1">
                  ${sim30Days.toLocaleString()}
                </div>
                <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                  {(sim30Days / Math.max(1, simSeed)).toFixed(1)}x Multiple
                </div>
              </div>

              <div className="rounded-lg border border-[#1F1F23] bg-[#141416] p-3 text-center">
                <div className="text-[10px] text-[#8E9299] uppercase font-mono">60 Days</div>
                <div className="font-mono text-lg font-bold text-white mt-1">
                  ${sim60Days.toLocaleString()}
                </div>
                <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                  {(sim60Days / Math.max(1, simSeed)).toFixed(1)}x Multiple
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                <div className="text-[10px] text-emerald-400 uppercase font-mono font-bold">90 Days</div>
                <div className="font-mono text-lg font-bold text-[#10B981] mt-1">
                  ${sim90Days.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-300 font-mono mt-0.5">
                  {(sim90Days / Math.max(1, simSeed)).toFixed(1)}x Multiple
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 shrink-0 text-blue-400" />
              <span>
                <strong>The Compounding Law:</strong> Growth accelerates exponentially because profits from every win are automatically used to scale the next trade's lot size.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* The 4 Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <Shield className="h-4 w-4 text-[#10B981]" />
            <span>1. Zero-Ruin Sizing</span>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed">
            Position sizes are calculated using ATR volatility and fractional risk (2.5% max). Even a rare streak of 5 consecutive losses only dents equity by ~12%, keeping the account fully alive.
          </p>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <span>2. Asymmetric R:R Filter</span>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed">
            Quantara ignores setups offering less than 1:2.5 reward-to-risk. Risking $0.25 to make $0.75+ ensures positive mathematical expectancy even during choppy market regimes.
          </p>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <Lock className="h-4 w-4 text-amber-400" />
            <span>3. Break-Even Lock-In</span>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed">
            When a position moves +1.2R in your favor, the stop loss instantly leaps to the entry price (+ fee buffer). This converts winning runners into completely risk-free trades.
          </p>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-2">
          <div className="flex items-center space-x-2 text-white font-semibold text-xs">
            <Cpu className="h-4 w-4 text-purple-400" />
            <span>4. Hands-Free Execution</span>
          </div>
          <p className="text-xs text-[#8E9299] leading-relaxed">
            Connect any supported demo or live exchange account. The autonomous engine executes with sub-millisecond precision, removing emotional hesitation and revenge trading completely.
          </p>
        </div>
      </div>
    </div>
  );
};
