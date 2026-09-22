import React, { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Percent,
  Play,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BacktestRequest, BacktestResult, StrategyConfig } from '../types';
import { useTheme } from '../context/ThemeContext';

interface BacktestingViewProps {
  strategies: StrategyConfig[];
  onRunBacktest: (req: BacktestRequest) => Promise<BacktestResult>;
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({ strategies, onRunBacktest }) => {
  const { isDark } = useTheme();
  const [symbol, setSymbol] = useState('BTC/USD');
  const [strategyId, setStrategyId] = useState('adaptive-regime');
  const [timeframe, setTimeframe] = useState<'1m' | '15m' | '1h'>('1h');
  const [days, setDays] = useState(60);
  const [startingCapital, setStartingCapital] = useState(25000);
  const [riskPerTrade, setRiskPerTrade] = useState(1.25);
  const [feeRate, setFeeRate] = useState(0.075);
  const [slippage, setSlippage] = useState(0.01);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await onRunBacktest({
        symbol,
        strategyId,
        timeframe,
        days,
        startingCapital,
        riskPerTradePercent: riskPerTrade,
        feeRatePercent: feeRate,
        slippagePercent: slippage,
      });
      setResult(res);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CONFIGURATION FORM */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Institutional Backtesting Laboratory
              </h2>
              <p className="text-xs text-[#8E9299]">
                Walk-forward simulation with realistic taker fees, slippage modeling, and risk-adjusted ratios
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleRun} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Asset & Strategy */}
          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Asset Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="BTC/USD">BTC/USD (Bitcoin)</option>
              <option value="ETH/USD">ETH/USD (Ethereum)</option>
              <option value="SOL/USD">SOL/USD (Solana)</option>
              <option value="NVDA">NVDA (Nvidia Corp)</option>
              <option value="AAPL">AAPL (Apple Inc)</option>
              <option value="SPY">SPY (S&P 500 ETF)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Strategy Model</label>
            <select
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe & Period */}
          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Candle Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="1m">1 Minute (High Frequency)</option>
              <option value="15m">15 Minutes (Intraday Swing)</option>
              <option value="1h">1 Hour (Macro Trend)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Historical Period</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
              <option value={180}>Last 180 Days</option>
            </select>
          </div>

          {/* Financials & Risk */}
          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Starting Capital ($)</label>
            <input
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Risk Per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[#8E9299] mb-1 font-sans font-medium">Taker Fee (%)</label>
            <input
              type="number"
              step="0.005"
              value={feeRate}
              onChange={(e) => setFeeRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-500 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Computing Math...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Quantitative Backtest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. RESULTS DASHBOARD */}
      {result && (
        <div className="space-y-6">
          {/* Institutional Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 font-mono">
            {/* Net Return */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Net Profit / Return</span>
              <div
                className={`text-base sm:text-lg font-bold mt-1 truncate ${
                  result.netProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toLocaleString()}
              </div>
              <span className="text-[10px] text-[#8E9299]">({result.netProfitPercent}%)</span>
            </div>

            {/* Win Rate */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Win Rate (Wins/Loss)</span>
              <div className="text-base sm:text-lg font-bold text-white mt-1 truncate">{result.winRate}%</div>
              <span className="text-[10px] text-[#8E9299]">
                {result.winningTrades}W / {result.losingTrades}L
              </span>
            </div>

            {/* Profit Factor */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Profit Factor</span>
              <div className="text-base sm:text-lg font-bold text-indigo-400 mt-1 truncate">{result.profitFactor}x</div>
              <span className="text-[10px] text-[#8E9299]">Gross Win / Loss</span>
            </div>

            {/* Sharpe Ratio */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Sharpe Ratio</span>
              <div className="text-base sm:text-lg font-bold text-blue-400 mt-1 truncate">{result.sharpeRatio}</div>
              <span className="text-[10px] text-[#8E9299]">Sortino: {result.sortinoRatio}</span>
            </div>

            {/* Max Drawdown */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Max Drawdown</span>
              <div className="text-base sm:text-lg font-bold text-yellow-400 mt-1 truncate">-{result.maxDrawdownPercent}%</div>
              <span className="text-[10px] text-[#8E9299]">-${result.maxDrawdownUsd.toLocaleString()}</span>
            </div>

            {/* Consecutive Losses */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3 sm:p-4">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8E9299]">Max Loss Streak</span>
              <div className="text-base sm:text-lg font-bold text-white mt-1 truncate">{result.maxConsecutiveLosses}</div>
              <span className="text-[10px] text-[#8E9299]">Avg Win: ${result.avgWinUsd}</span>
            </div>
          </div>

          {/* Equity Curve Area Chart */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23] font-mono text-xs">
              <div className="flex items-center space-x-2">
                <BarChart2 className="h-4 w-4 text-[#10B981]" />
                <span className="font-bold uppercase text-white">
                  Walk-Forward Equity Curve (${result.startingCapital.toLocaleString()} → ${result.endingCapital.toLocaleString()})
                </span>
              </div>
              <span className="text-[#8E9299] text-xs">
                {result.strategyName} • {result.symbol}
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.equityCurve} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1F1F23' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="time" stroke={isDark ? '#8E9299' : '#64748B'} fontSize={10} tickLine={false} />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke={isDark ? '#8E9299' : '#64748B'}
                    fontSize={10}
                    orientation="right"
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0A0A0B' : '#FFFFFF',
                      borderColor: isDark ? '#1F1F23' : '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isDark ? '#E4E4E7' : '#0F172A',
                      boxShadow: isDark
                        ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        : '0 10px 15px -3px rgba(15, 23, 42, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#10B981"
                    fill="url(#btGradient)"
                    strokeWidth={2}
                    name="Portfolio Equity ($)"
                  />
                  <defs>
                    <linearGradient id="btGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={isDark ? 0.25 : 0.18} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Granular Simulated Trades Table */}
          <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23] font-mono text-xs">
              <span className="font-bold uppercase text-white">
                Simulated Execution Log ({result.trades.length} trades sampled)
              </span>
              <span className="text-[#8E9299] text-xs">Taker fee 0.075% applied</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-[#8E9299] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Entry Time</th>
                    <th className="py-2.5 px-3">Exit Time</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3">Exit Reason</th>
                    <th className="py-2.5 px-3 text-right">Net Realized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F23]">
                  {result.trades.map((t) => {
                    const isWin = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-[#1F1F23]/30">
                        <td className="py-2.5 px-3 text-[#8E9299]">{t.entryTime}</td>
                        <td className="py-2.5 px-3 text-[#8E9299]">{t.exitTime}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.side === 'LONG' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                            }`}
                          >
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#E4E4E7]">${t.entryPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-[#E4E4E7]">${t.exitPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] text-[#8E9299] font-bold">{t.exitReason}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-bold ${isWin ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {isWin ? '+' : ''}${t.pnl.toFixed(2)} ({isWin ? '+' : ''}{t.pnlPercent}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
