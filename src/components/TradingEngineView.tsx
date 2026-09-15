import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle,
  Cpu,
  Flame,
  HelpCircle,
  Layers,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BotState, MarketAsset, RiskSettings, TradingSignal } from '../types';

interface TradingEngineViewProps {
  botState: BotState;
  signals: TradingSignal[];
  assets: MarketAsset[];
  riskSettings: RiskSettings;
  onInjectMarketShock: (symbol: string, dropPercent: number) => void;
  onOpenExplanationModal: (signalId: string, signal: TradingSignal) => void;
}

export const TradingEngineView: React.FC<TradingEngineViewProps> = ({
  botState,
  signals,
  assets,
  riskSettings,
  onInjectMarketShock,
  onOpenExplanationModal,
}) => {
  const [selectedShockSymbol, setSelectedShockSymbol] = useState('BTC/USD');
  const [shockPercent, setShockPercent] = useState(4.5);
  const [isInjectingShock, setIsInjectingShock] = useState(false);

  const handleShock = async () => {
    setIsInjectingShock(true);
    try {
      await onInjectMarketShock(selectedShockSymbol, shockPercent);
    } finally {
      setTimeout(() => setIsInjectingShock(false), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUALIZED SYSTEM PIPELINE ARCHITECTURE */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <Cpu className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Quantara Autonomous Pipeline Flow
              </h2>
              <p className="text-xs text-[#8E9299]">
                Decoupled micro-services pipeline with strict multi-layer risk validation
              </p>
            </div>
          </div>
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
            LATENCY: ~12ms
          </span>
        </div>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
          {/* Step 1 */}
          <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-1 relative">
            <div className="flex items-center justify-between text-[#8E9299] text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 01</span>
              <Radio className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
            </div>
            <div className="font-semibold text-white text-xs">Market Data Feed</div>
            <div className="text-[10px] text-[#8E9299]">Realtime OHLCV + Order Book</div>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#8E9299] text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 02</span>
              <Activity className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="font-semibold text-white text-xs">Technical Indicators</div>
            <div className="text-[10px] text-[#8E9299]">EMA, RSI, MACD, ATR, Bands</div>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#8E9299] text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 03</span>
              <Layers className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <div className="font-semibold text-white text-xs">Regime Classifier</div>
            <div className="text-[10px] text-[#8E9299]">Trend / Range Matrix</div>
          </div>

          {/* Step 4 */}
          <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-1">
            <div className="flex items-center justify-between text-[#8E9299] text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 04</span>
              <Brain className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="font-semibold text-white text-xs">Strategy Signals</div>
            <div className="text-[10px] text-[#8E9299] truncate">{botState.activeStrategyName}</div>
          </div>

          {/* Step 5 */}
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 space-y-1">
            <div className="flex items-center justify-between text-purple-400 text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 05</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="font-semibold text-purple-200 text-xs">Gemini AI Auditor</div>
            <div className="text-[10px] text-purple-300/80">Audit & Anomaly Scan</div>
          </div>

          {/* Step 6 */}
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 space-y-1">
            <div className="flex items-center justify-between text-yellow-400 text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 06</span>
              <Shield className="h-3.5 w-3.5 text-yellow-400" />
            </div>
            <div className="font-semibold text-yellow-200 text-xs">Risk Gatekeeper</div>
            <div className="text-[10px] text-yellow-300/80">Volatility Position Sizing</div>
          </div>

          {/* Step 7 */}
          <div className="rounded-lg border border-[#10B981]/20 bg-[#10B981]/10 p-3 space-y-1">
            <div className="flex items-center justify-between text-[#10B981] text-[10px] uppercase tracking-wider font-semibold">
              <span>STEP 07</span>
              <Zap className="h-3.5 w-3.5 text-[#10B981]" />
            </div>
            <div className="font-semibold text-emerald-200 text-xs">Broker Router</div>
            <div className="text-[10px] text-emerald-300/80">Execution + SL/TP</div>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME SIGNAL STREAM & AI AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Signals Feed (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Generated Strategy Signals Stream ({signals.length})
              </h3>
            </div>
            <span className="text-xs text-[#8E9299]">Auto-Filtered by Risk Engine</span>
          </div>

          {signals.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[#8E9299]">
              Scanning active watchlist tickers ({botState.selectedAssets.join(', ')}) for trigger setups...
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {signals.map((sig) => {
                const isBuy = sig.direction === 'BUY';
                return (
                  <div
                    key={sig.id}
                    className={`rounded-xl border p-4 transition-all text-xs font-mono ${
                      sig.passedRiskChecks
                        ? 'border-[#1F1F23] bg-[#0E0E11] hover:bg-[#1F1F23]/40'
                        : 'border-[#EF4444]/30 bg-[#EF4444]/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{sig.assetSymbol}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isBuy
                              ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                              : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                          }`}
                        >
                          {sig.direction}
                        </span>
                        <span className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] text-[#8E9299]">
                          {sig.marketRegime}
                        </span>
                      </div>

                      {/* Confidence & Risk Status */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] text-[#8E9299]">Confidence:</span>
                          <span className="font-bold text-[#10B981]">{sig.confidenceScore}%</span>
                        </div>
                        {sig.passedRiskChecks ? (
                          <span className="flex items-center text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                            <CheckCircle className="h-3 w-3 mr-1 inline" /> RISK APPROVED
                          </span>
                        ) : (
                          <span className="flex items-center text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/20">
                            <AlertTriangle className="h-3 w-3 mr-1 inline" /> RISK REJECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trade Pricing Coordinates */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs rounded-lg bg-[#141416] p-3 border border-[#1F1F23]">
                      <div>
                        <span className="text-[#8E9299] block text-[10px] uppercase">Entry Price</span>
                        <span className="text-white font-bold">${sig.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#8E9299] block text-[10px] uppercase">Suggested Stop Loss</span>
                        <span className="text-[#EF4444] font-bold">${sig.suggestedStopLoss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#8E9299] block text-[10px] uppercase">Suggested Take Profit</span>
                        <span className="text-[#10B981] font-bold">${sig.suggestedTakeProfit.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#8E9299] block text-[10px] uppercase">Reward/Risk</span>
                        <span className="text-blue-400 font-bold">{sig.riskRewardRatio}:1</span>
                      </div>
                    </div>

                    {/* AI Explanation Summary */}
                    {sig.aiAnalysis && (
                      <div className="mt-3 text-xs rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-purple-200">
                        <div className="flex items-center justify-between text-[10px] text-purple-400 mb-1 font-semibold">
                          <span className="flex items-center">
                            <Sparkles className="h-3 w-3 mr-1 inline" /> AI AUDIT GRADE: {sig.aiAnalysis.tradeQualityGrade}
                          </span>
                          <span>{sig.aiAnalysis.macroContext}</span>
                        </div>
                        <p className="leading-relaxed text-[11px]">{sig.aiAnalysis.summary}</p>
                      </div>
                    )}

                    {/* Rejection Note */}
                    {!sig.passedRiskChecks && sig.riskRejectionReason && (
                      <div className="mt-3 text-xs text-[#EF4444] bg-[#EF4444]/10 p-2.5 rounded-lg border border-[#EF4444]/20">
                        <strong>Risk Filter Notice:</strong> {sig.riskRejectionReason}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-[#8E9299]">
                      <span>Strategy: {sig.strategyName}</span>
                      <button
                        onClick={() => onOpenExplanationModal(sig.id, sig)}
                        className="text-blue-400 hover:underline font-semibold flex items-center"
                      >
                        Inspect AI Rationale <ArrowRight className="h-3 w-3 ml-1 inline" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Market Shock Simulator & Stress Tester (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#1F1F23]">
              <Flame className="h-4 w-4 text-[#EF4444]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Market Shock Simulator
              </h3>
            </div>
            <p className="text-xs text-[#8E9299] leading-relaxed">
              Inject controlled volatility shocks into the live tick stream to stress-test Stop-Loss triggers, slippage tolerance, and the Risk Engine.
            </p>

            <div className="space-y-3 text-xs pt-2">
              <div>
                <label className="block text-[11px] text-[#8E9299] font-medium mb-1">Target Asset</label>
                <select
                  value={selectedShockSymbol}
                  onChange={(e) => setSelectedShockSymbol(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                >
                  {assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol} (${a.currentPrice.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#8E9299] mb-1 font-mono">
                  <span>Flash Drop Severity</span>
                  <span className="text-[#EF4444] font-bold">-{shockPercent}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={shockPercent}
                  onChange={(e) => setShockPercent(parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <button
                onClick={handleShock}
                disabled={isInjectingShock}
                className="w-full rounded-lg bg-[#EF4444] py-2.5 font-bold text-white hover:bg-[#DC2626] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-900/20"
              >
                <Flame className="h-4 w-4" />
                <span>{isInjectingShock ? 'Simulating Shock...' : `Trigger -${shockPercent}% Flash Drop`}</span>
              </button>
            </div>
          </div>

          {/* Active Risk Guardrails Overview */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3 text-xs font-mono">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#1F1F23] text-white font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4 text-yellow-400" />
              <span>Active Risk Guardrails</span>
            </div>
            <div className="space-y-2.5 text-[#8E9299] text-xs">
              <div className="flex justify-between">
                <span>Max Risk / Trade:</span>
                <span className="text-white font-bold">{riskSettings.maxRiskPerTradePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Max Daily Loss Limit:</span>
                <span className="text-white font-bold">{riskSettings.maxDailyLossPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Account Drawdown Cap:</span>
                <span className="text-white font-bold">{riskSettings.maxAccountDrawdownPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span>Max Open Positions:</span>
                <span className="text-white font-bold">{riskSettings.maxOpenPositions}</span>
              </div>
              <div className="flex justify-between">
                <span>Trailing Stop:</span>
                <span className="text-[#10B981] font-bold">
                  {riskSettings.trailingStopEnabled ? `${riskSettings.trailingStopPercent}% active` : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
