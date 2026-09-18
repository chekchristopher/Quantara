import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  Flame,
  Pause,
  Play,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wifi,
  X,
} from 'lucide-react';
import { OfflineSessionStats } from '../types';

interface OfflineWealthReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: OfflineSessionStats | null;
  onPauseBot?: () => void;
  onResumeBot?: () => void;
  isEngineRunning?: boolean;
  onViewJournal?: () => void;
}

export const OfflineWealthReportModal: React.FC<OfflineWealthReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onPauseBot,
  onResumeBot,
  isEngineRunning = true,
  onViewJournal,
}) => {
  if (!isOpen || !report) return null;

  const pnl = report.realizedPnlOffline || 0;
  const isPositive = pnl >= 0;
  const tradesCount = report.tradesExecutedOffline || 0;
  const winRate = tradesCount > 0 ? Math.round((report.winningTradesOffline / tradesCount) * 100) : 0;

  // Format duration
  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remM = m % 60;
      return `${h}h ${remM}m`;
    }
    return `${m}m`;
  };

  return (
    <div
      id="offline-wealth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="offline-wealth-modal-container"
        className="relative w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-[#0C111A] text-zinc-100 shadow-2xl shadow-emerald-950/40 overflow-hidden my-auto"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-[#1F2633] relative z-10">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-tech text-lg sm:text-xl font-bold uppercase tracking-wide text-white">
                  24/7 Autonomous Wealth Report
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NON-STOP EXECUTION</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Your connected servers executed trades and managed positions while you were away.
              </p>
            </div>
          </div>
          <button
            id="btn-close-offline-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Dismiss report"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Key Metric Hero Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-[#101926] to-[#0A101D] p-4 sm:p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-tech uppercase tracking-wider text-emerald-400/80 font-bold block">
                  Net Wealth Generated Offline
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold font-tech tracking-tight ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ({isPositive ? '+' : ''}
                    {report.startingBalance > 0
                      ? ((pnl / report.startingBalance) * 100).toFixed(2)
                      : '0.00'}
                    % return)
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-[#1F2633] pt-2 sm:pt-0 sm:pl-4">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono block">Offline Session</span>
                  <span className="text-xs font-mono font-bold text-white flex items-center sm:justify-end space-x-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span>{formatDuration(report.offlineDurationSeconds)} elapsed</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
            <div className="rounded-lg border border-[#1F2633] bg-[#0E1420] p-3">
              <span className="text-[10px] text-zinc-400 uppercase font-tech block">Trades Taken</span>
              <span className="text-base font-bold text-white mt-1 block">{tradesCount}</span>
              <span className="text-[10px] text-emerald-400">100% Algorithmic</span>
            </div>

            <div className="rounded-lg border border-[#1F2633] bg-[#0E1420] p-3">
              <span className="text-[10px] text-zinc-400 uppercase font-tech block">Win Rate</span>
              <span className="text-base font-bold text-emerald-400 mt-1 block">{winRate}%</span>
              <span className="text-[10px] text-zinc-400">
                {report.winningTradesOffline}W / {report.losingTradesOffline}L
              </span>
            </div>

            <div className="rounded-lg border border-[#1F2633] bg-[#0E1420] p-3">
              <span className="text-[10px] text-zinc-400 uppercase font-tech block">Initial Seed</span>
              <span className="text-base font-bold text-zinc-300 mt-1 block">
                ${report.startingBalance.toFixed(2)}
              </span>
              <span className="text-[10px] text-zinc-400">At disconnect</span>
            </div>

            <div className="rounded-lg border border-[#1F2633] bg-[#0E1420] p-3">
              <span className="text-[10px] text-zinc-400 uppercase font-tech block">Current Equity</span>
              <span className="text-base font-bold text-emerald-300 mt-1 block">
                ${report.endingBalance.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Compounded</span>
            </div>
          </div>

          {/* 24/7 Continuity Assurance Box */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-3.5 flex items-start space-x-3 text-xs">
            <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-tech font-bold uppercase tracking-wide text-blue-300 block">
                24/7 Persistent Server Architecture
              </span>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                The Quantara trading server continues analyzing price action, managing stop-loss triggers, and executing high-expectancy setups around the clock. Your server state and compounding balance persist in persistent storage even when your browser is closed.
              </p>
              {report.activeServerAccounts?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-mono">Active Servers:</span>
                  {report.activeServerAccounts.map((srv, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-blue-300"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Offline Trades Breakdown List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center space-x-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Trades Executed While Offline ({report.trades?.length || 0})</span>
              </span>
              {onViewJournal && (
                <button
                  onClick={() => {
                    onClose();
                    onViewJournal();
                  }}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                >
                  View in Journal →
                </button>
              )}
            </div>

            {report.trades && report.trades.length > 0 ? (
              <div className="rounded-xl border border-[#1F2633] bg-[#0E1420] divide-y divide-[#1A202C] overflow-hidden">
                {report.trades.map((t, idx) => {
                  const isTradeWin = t.realizedPnl >= 0;
                  return (
                    <div
                      key={t.id || idx}
                      className="p-3 flex items-center justify-between hover:bg-zinc-800/40 transition-colors text-xs font-mono"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${
                            t.side === 'LONG' || t.side === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {t.side === 'LONG' || t.side === 'BUY' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{t.symbol}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                t.side === 'LONG' || t.side === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {t.side}
                            </span>
                            <span className="text-[10px] text-zinc-400">{t.strategyName}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            Entry: ${t.entryPrice?.toFixed(2)} ➔ Exit: ${t.exitPrice?.toFixed(2)} • {t.exitReason}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            isTradeWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isTradeWin ? '+' : '-'}${Math.abs(t.realizedPnl).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {t.realizedPnlPercent ? `${t.realizedPnlPercent.toFixed(2)}%` : 'Verified'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-[#1F2633] bg-[#0E1420] p-4 text-center text-xs text-zinc-400 font-mono">
                No closed trades during this brief offline period. Open positions continue to be monitored by the 24/7 server loop.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-[#090D14] border-t border-[#1F2633] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                isEngineRunning ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'
              }`}
            />
            <span>Engine Status: {isEngineRunning ? 'RUNNING NON-STOP 24/7' : 'PAUSED'}</span>
          </div>

          <div className="flex items-center space-x-2">
            {isEngineRunning && onPauseBot ? (
              <button
                onClick={() => {
                  onPauseBot();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-medium flex items-center space-x-1.5 transition-colors"
                title="Pause automated executions"
              >
                <Pause className="h-3.5 w-3.5" />
                <span>Pause Engine</span>
              </button>
            ) : onResumeBot ? (
              <button
                onClick={() => {
                  onResumeBot();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors shadow-md"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Resume 24/7 Trading</span>
              </button>
            ) : null}

            <button
              id="btn-keep-engine-running"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold tracking-wide shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Keep 24/7 Engine Running</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
