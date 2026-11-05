import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Pause,
  AlertTriangle,
  Server,
  TrendingUp,
  TrendingDown,
  Layers,
  FileText,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { BotState, BrokerAccount, PortfolioSummary, Position, RiskProfileType, RiskSettings } from '../types';
import { RISK_PROFILES } from '../data/riskProfiles';
import { playEmergencyAlertSound } from '../utils/soundEffects';

interface FloatingSafetyDockProps {
  portfolio: PortfolioSummary;
  botState: BotState;
  positions: Position[];
  riskSettings: RiskSettings;
  brokerAccounts: BrokerAccount[];
  onToggleBot: () => void;
  onEmergencyCloseAll: () => Promise<void> | void;
  onOpenStatementModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const FloatingSafetyDock: React.FC<FloatingSafetyDockProps> = ({
  portfolio,
  botState,
  positions,
  riskSettings,
  brokerAccounts,
  onToggleBot,
  onEmergencyCloseAll,
  onOpenStatementModal,
  onNavigateTab,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosingAll, setIsClosingAll] = useState(false);

  const activeBroker = brokerAccounts.find(
    (b) => b.serverStatus === 'RUNNING' || b.status === 'RUNNING' || b.status === 'CONNECTED'
  ) || brokerAccounts[0];

  const profileKey = (riskSettings.activeProfile as RiskProfileType) || 'BALANCED';
  const profileDef = RISK_PROFILES[profileKey] || RISK_PROFILES.BALANCED;

  const isProfitToday = portfolio.realizedPnlToday >= 0;
  const isUnrealizedProfit = portfolio.unrealizedPnl >= 0;

  const handleOpenEmergencyConfirm = () => {
    playEmergencyAlertSound();
    setShowConfirmModal(true);
  };

  const handleConfirmEmergencyClose = async () => {
    setIsClosingAll(true);
    try {
      await onEmergencyCloseAll();
      setShowConfirmModal(false);
    } finally {
      setIsClosingAll(false);
    }
  };

  return (
    <>
      {/* Floating Sticky Safety Bar */}
      <div className="fixed bottom-14 md:bottom-3 inset-x-3 md:inset-x-6 z-40 max-w-7xl mx-auto pointer-events-none">
        <div className="pointer-events-auto rounded-xl border border-blue-500/25 bg-[#0C0E14]/95 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl shadow-black/80 flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs text-white">
          {/* Left section: Node & Risk Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto scrollbar-none">
            {/* Broker connection pill */}
            <button
              onClick={() => onNavigateTab('brokers')}
              className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-[#141824] hover:bg-[#1C2234] border border-[#232B40] text-[#8E9299] hover:text-white transition-colors shrink-0"
              title="Click to view MT5 Broker Accounts"
            >
              <div className="relative">
                <Server className="h-3.5 w-3.5 text-blue-400" />
                <span className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${
                  activeBroker ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
              </div>
              <span className="text-[11px] font-semibold text-zinc-200 truncate max-w-[100px] sm:max-w-[130px]">
                {activeBroker?.name || 'Bridge Ready'}
              </span>
            </button>

            {/* Risk profile badge */}
            <button
              onClick={() => onNavigateTab('risk')}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold shrink-0 transition-colors"
              title={`Active Policy: ${profileDef.name}`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{profileDef.name}</span>
            </button>

            {/* Positions counter */}
            <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-[#8E9299] shrink-0">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Positions:</span>
              <span className="font-bold text-white">{positions.length}</span>
              {positions.length > 0 && (
                <span className={`text-[10px] font-bold ${isUnrealizedProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                  ({isUnrealizedProfit ? '+' : ''}${portfolio.unrealizedPnl.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          {/* Center section: Daily Performance stats */}
          <div className="flex items-center space-x-3 text-[11px] sm:text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-[#8E9299] text-[10px] uppercase hidden sm:inline">Today's P&amp;L:</span>
              <span className={`font-bold flex items-center ${isProfitToday ? 'text-emerald-400' : 'text-red-400'}`}>
                {isProfitToday ? (
                  <TrendingUp className="h-3 w-3 mr-1 inline" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 inline" />
                )}
                {isProfitToday ? '+' : ''}${portfolio.realizedPnlToday.toFixed(2)}
                <span className="text-[10px] ml-1 opacity-80">
                  ({isProfitToday ? '+' : ''}{portfolio.todayPnlPercent}%)
                </span>
              </span>
            </div>

            {/* Printable Statement trigger button */}
            <button
              onClick={onOpenStatementModal}
              className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#182030] hover:bg-[#202B40] border border-blue-500/20 text-blue-300 hover:text-white text-[11px] font-semibold transition-colors"
              title="Generate 1-Click Verified Performance Statement (PDF / Print / CSV)"
            >
              <FileText className="h-3 w-3 text-blue-400" />
              <span>Statement</span>
            </button>
          </div>

          {/* Right section: Autonomous Engine Controls & Emergency Close */}
          <div className="flex items-center space-x-2">
            {/* Pause / Resume Bot toggle */}
            <button
              onClick={onToggleBot}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shadow-sm ${
                botState.isRunning
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
              title={botState.isRunning ? 'Pause Engine Order Scanning' : 'Resume Autonomous Engine'}
            >
              {botState.isRunning ? (
                <>
                  <Pause className="h-3 w-3 fill-amber-300" />
                  <span>Pause Engine</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-white" />
                  <span>Resume Engine</span>
                </>
              )}
            </button>

            {/* Emergency Liquidate All Positions */}
            <button
              onClick={handleOpenEmergencyConfirm}
              disabled={positions.length === 0}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all shadow-sm ${
                positions.length > 0
                  ? 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 hover:text-white shadow-red-950/50 animate-pulse'
                  : 'bg-[#18181C] border border-[#27272A] text-zinc-600 cursor-not-allowed opacity-50'
              }`}
              title="1-Click Emergency Liquidation: Closes all open positions instantly at market"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              <span>Emergency Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal for Emergency Liquidation */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#120D0E] p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-red-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-brand">
                    CONFIRM EMERGENCY LIQUIDATION
                  </h3>
                  <p className="text-xs text-red-300/80 font-mono">
                    Immediate Market Close Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 font-mono text-xs">
              <p className="text-zinc-300">
                You are about to initiate an immediate market liquidation of all{' '}
                <strong className="text-white">{positions.length} active positions</strong> across linked broker accounts.
              </p>

              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1 text-red-200">
                <div className="flex justify-between">
                  <span>Current Unrealized P&amp;L:</span>
                  <strong className={portfolio.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    ${portfolio.unrealizedPnl.toFixed(2)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Open Exposure:</span>
                  <strong>${portfolio.currentExposureUsd.toFixed(2)}</strong>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400">
                This action is instantaneous and irreversible. All bracket stop-losses and pending take-profits will be cancelled.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white font-mono text-xs font-semibold"
              >
                Cancel / Return
              </button>
              <button
                type="button"
                disabled={isClosingAll}
                onClick={handleConfirmEmergencyClose}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-lg shadow-red-900/50 disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{isClosingAll ? 'Liquidating...' : 'Confirm Liquidation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
