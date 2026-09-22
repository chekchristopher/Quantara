import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Calendar,
  BookOpen,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { PortfolioSummary, RiskSettings, TradeHistoryItem } from '../types';

export interface SessionPnlChartProps {
  portfolio: PortfolioSummary;
  tradesHistory?: TradeHistoryItem[];
  riskSettings?: RiskSettings;
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const SessionPnlChart: React.FC<SessionPnlChartProps> = ({
  portfolio,
  tradesHistory = [],
  riskSettings,
  onNavigateTab,
  className = '',
}) => {
  const [chartMode, setChartMode] = useState<'curve' | 'stepped'>('curve');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Compute chronologically accumulated session points from existing portfolio state & trades
  const sessionPnlData = useMemo(() => {
    // 1. If backend portfolio state already provides detailed realizedPnlTodayHistory with >= 2 points, prioritize it
    if (portfolio.realizedPnlTodayHistory && portfolio.realizedPnlTodayHistory.length > 1) {
      return portfolio.realizedPnlTodayHistory.map((item, idx) => ({
        time: item.time || `T-${portfolio.realizedPnlTodayHistory!.length - idx}`,
        timestamp: item.timestamp,
        realizedPnlToday: Number(item.realizedPnlToday.toFixed(2)),
        delta: item.delta ?? 0,
        symbol: item.symbol || 'Execution',
        exitReason: item.exitReason,
      }));
    }

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startOfDayMs = todayStart.getTime();

    // 2. Filter trades belonging to the current trading session (within today or past 24h)
    const sessionTrades = [...tradesHistory]
      .filter((t) => (t.exitTime || 0) >= startOfDayMs - 24 * 3600 * 1000)
      .sort((a, b) => (a.exitTime || 0) - (b.exitTime || 0));

    const points: Array<{
      time: string;
      timestamp: number;
      realizedPnlToday: number;
      delta: number;
      symbol: string;
      exitReason?: string;
    }> = [];

    // Session opening baseline at $0.00
    const initialTime = sessionTrades.length > 0
      ? (sessionTrades[0].exitTime || now) - 30 * 60 * 1000
      : now - 3 * 3600 * 1000;

    points.push({
      time: new Date(initialTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: initialTime,
      realizedPnlToday: 0.0,
      delta: 0,
      symbol: 'Session Open',
    });

    let runningPnl = 0;
    sessionTrades.forEach((trade) => {
      runningPnl = Number((runningPnl + trade.realizedPnl).toFixed(2));
      points.push({
        time: new Date(trade.exitTime || now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: trade.exitTime || now,
        realizedPnlToday: runningPnl,
        delta: trade.realizedPnl,
        symbol: trade.symbol,
        exitReason: trade.exitReason,
      });
    });

    // Final point anchoring current portfolio.realizedPnlToday
    points.push({
      time: 'Now',
      timestamp: now,
      realizedPnlToday: Number(portfolio.realizedPnlToday.toFixed(2)),
      delta: Number((portfolio.realizedPnlToday - runningPnl).toFixed(2)),
      symbol: 'Current Session',
    });

    return points;
  }, [portfolio.realizedPnlToday, portfolio.realizedPnlTodayHistory, tradesHistory]);

  // Derive session statistics
  const stats = useMemo(() => {
    const values = sessionPnlData.map((d) => d.realizedPnlToday);
    const peak = Math.max(0, ...values);
    const trough = Math.min(0, ...values);
    const isNetPositive = portfolio.realizedPnlToday >= 0;
    const maxDailyLossBudget = ((portfolio.totalEquity || 10000) * (riskSettings?.maxDailyLossPercent || 3.0)) / 100;
    const tradesTodayCount = sessionPnlData.filter((d) => d.delta !== 0).length;

    return {
      peak,
      trough,
      isNetPositive,
      maxDailyLossBudget,
      tradesTodayCount,
    };
  }, [sessionPnlData, portfolio.realizedPnlToday, portfolio.totalEquity, riskSettings?.maxDailyLossPercent]);

  const lineColor = stats.isNetPositive ? '#10B981' : '#EF4444';
  const gradientId = `pnlSessionGradient_${stats.isNetPositive ? 'profit' : 'loss'}`;

  return (
    <div
      id="session-pnl-trend-container"
      className={`rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 sm:p-5 space-y-3.5 shadow-sm min-w-0 ${className}`}
    >
      {/* 1. Header with Title, Live Session Pill, and Stat Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            {stats.isNetPositive ? (
              <div className="p-1.5 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                <TrendingUp className="h-4 w-4 text-[#10B981]" />
              </div>
            ) : (
              <div className="p-1.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
                <TrendingDown className="h-4 w-4 text-[#EF4444]" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white">
                  Session Realized P&amp;L Trend
                </h3>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  realizedPnlToday
                </span>
              </div>
              <p className="text-[11px] text-[#8E9299]">
                Live trajectory of closed trade returns over the active trading session
              </p>
            </div>
          </div>

          {/* Pulsing Active Session Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#0E0E11] border border-[#1F1F23] text-[11px] font-mono text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>Active Session</span>
            <span className="text-[#52525B]">•</span>
            <span className={stats.isNetPositive ? 'text-[#10B981] font-bold' : 'text-[#EF4444] font-bold'}>
              {stats.isNetPositive ? '+' : ''}${portfolio.realizedPnlToday.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          {/* Curve / Step Mode Toggle */}
          <div className="flex items-center rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-0.5">
            <button
              type="button"
              onClick={() => setChartMode('curve')}
              className={`rounded px-2 py-1 text-[11px] transition-colors ${
                chartMode === 'curve' ? 'bg-[#1F1F23] text-white font-semibold' : 'text-[#8E9299] hover:text-white'
              }`}
              title="Smooth interpolated curve"
            >
              Curve
            </button>
            <button
              type="button"
              onClick={() => setChartMode('stepped')}
              className={`rounded px-2 py-1 text-[11px] transition-colors ${
                chartMode === 'stepped' ? 'bg-[#1F1F23] text-white font-semibold' : 'text-[#8E9299] hover:text-white'
              }`}
              title="Stepped trade-by-trade delta"
            >
              Steps
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid((p) => !p)}
            className={`rounded-lg px-2.5 py-1 text-[11px] border transition-colors ${
              showGrid
                ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                : 'border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:text-white'
            }`}
            title="Toggle chart background grid lines"
          >
            Grid
          </button>

          {/* Direct Link to Trade Journal */}
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('journal')}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-[11px] transition-colors"
              title="Open Trade Journal with psychological reflections"
            >
              <BookOpen className="h-3 w-3" />
              <span>Trade Journal</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Metrics Bar: Today's Realized, Session Peak, Session Low, Risk Cap */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-2.5">
          <div className="text-[10px] uppercase text-[#8E9299] flex items-center justify-between">
            <span>Realized P&amp;L Today</span>
            {stats.isNetPositive ? (
              <ArrowUpRight className="h-3 w-3 text-[#10B981]" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-[#EF4444]" />
            )}
          </div>
          <div className={`mt-0.5 text-base sm:text-lg font-bold ${stats.isNetPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {stats.isNetPositive ? '+' : ''}${portfolio.realizedPnlToday.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8E9299]">
            {portfolio.todayPnlPercent >= 0 ? '+' : ''}{portfolio.todayPnlPercent}% equity return
          </div>
        </div>

        <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-2.5">
          <div className="text-[10px] uppercase text-[#8E9299] flex items-center justify-between">
            <span>Session High (Peak)</span>
            <Activity className="h-3 w-3 text-[#10B981]" />
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-bold text-white">
            +${stats.peak.toFixed(2)}
          </div>
          <div className="text-[10px] text-zinc-400">
            Watermark zenith
          </div>
        </div>

        <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-2.5">
          <div className="text-[10px] uppercase text-[#8E9299] flex items-center justify-between">
            <span>Session Low (Trough)</span>
            <Activity className="h-3 w-3 text-yellow-400" />
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-bold text-zinc-200">
            {stats.trough < 0 ? `-$${Math.abs(stats.trough).toFixed(2)}` : '$0.00'}
          </div>
          <div className="text-[10px] text-zinc-400">
            Max intraday pullback
          </div>
        </div>

        <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-2.5">
          <div className="text-[10px] uppercase text-[#8E9299] flex items-center justify-between">
            <span>Daily Loss Limit</span>
            <ShieldAlert className="h-3 w-3 text-red-400" />
          </div>
          <div className="mt-0.5 text-base sm:text-lg font-bold text-red-400">
            -${stats.maxDailyLossBudget.toFixed(2)}
          </div>
          <div className="text-[10px] text-[#8E9299]">
            {riskSettings?.maxDailyLossPercent || 3}% account risk cap
          </div>
        </div>
      </div>

      {/* 3. Recharts LineChart for realizedPnlToday */}
      <div className="h-48 sm:h-56 w-full min-w-0 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sessionPnlData} margin={{ top: 12, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.22} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" vertical={false} />}

            <XAxis
              dataKey="time"
              stroke="#71717A"
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
              tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
            />

            <YAxis
              stroke="#71717A"
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
              tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => `$${val}`}
              domain={['auto', 'auto']}
            />

            {/* Break-even zero baseline */}
            <ReferenceLine
              y={0}
              stroke="#52525B"
              strokeDasharray="3 3"
              label={{
                value: '$0 Break-even',
                fill: '#71717A',
                fontSize: 9,
                position: 'right',
                fontFamily: 'monospace',
              }}
            />

            {/* Daily loss limit line */}
            <ReferenceLine
              y={-stats.maxDailyLossBudget}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeOpacity={0.65}
              label={{
                value: 'Daily Cap',
                fill: '#EF4444',
                fontSize: 9,
                position: 'left',
                fontFamily: 'monospace',
              }}
            />

            {/* Custom Interactive Tooltip */}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                const isPositive = d.realizedPnlToday >= 0;
                return (
                  <div className="rounded-xl border border-[#2E2E33] bg-[#0A0D14]/95 backdrop-blur-md p-3 font-mono text-xs shadow-2xl space-y-1.5 min-w-[190px]">
                    <div className="flex items-center justify-between text-[10px] text-[#8E9299] border-b border-[#1F2433] pb-1">
                      <span>{d.time}</span>
                      <span className="text-blue-400 font-semibold">{d.symbol}</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-zinc-400 text-[11px]">realizedPnlToday:</span>
                      <span className={`text-sm font-bold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {isPositive ? '+' : ''}${d.realizedPnlToday.toFixed(2)}
                      </span>
                    </div>

                    {d.delta !== 0 && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1F2433]">
                        <span className="text-[#8E9299]">Trade Impact:</span>
                        <span className={`font-semibold ${d.delta > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {d.delta > 0 ? '+' : ''}${d.delta.toFixed(2)}
                          {d.exitReason ? ` (${d.exitReason})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Glowing fill underneath the line */}
            <Area
              type={chartMode === 'stepped' ? 'stepAfter' : 'monotone'}
              dataKey="realizedPnlToday"
              fill={`url(#${gradientId})`}
              stroke="none"
              isAnimationActive={false}
            />

            {/* Primary Trajectory Line */}
            <Line
              type={chartMode === 'stepped' ? 'stepAfter' : 'monotone'}
              dataKey="realizedPnlToday"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{
                r: 3,
                fill: lineColor,
                stroke: '#141416',
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 6,
                fill: '#FFFFFF',
                stroke: lineColor,
                strokeWidth: 2,
              }}
              isAnimationActive={true}
              animationDuration={600}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Footer Note & Session Summary */}
      <div className="flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] font-mono text-[#8E9299] pt-1">
        <span>
          Tracking metric: <strong className="text-zinc-300">portfolio.realizedPnlToday</strong> across session ticks
        </span>
        <span className="text-zinc-400">
          {stats.tradesTodayCount} closed trade execution{stats.tradesTodayCount === 1 ? '' : 's'} logged today
        </span>
      </div>
    </div>
  );
};
