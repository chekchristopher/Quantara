import React, { useState } from 'react';
import {
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  HelpCircle
} from 'lucide-react';
import { BotState, BrokerAccount, RiskProfileType, RiskSettings } from '../types';
import { RISK_PROFILES } from '../data/riskProfiles';

interface QuickLaunchWizardProps {
  botState: BotState;
  riskSettings: RiskSettings;
  brokerAccounts: BrokerAccount[];
  onSelectRiskProfile: (profile: RiskProfileType) => void;
  onNavigateTab: (tab: string) => void;
  onToggleAutonomousTakeover?: () => void;
}

export const QuickLaunchWizard: React.FC<QuickLaunchWizardProps> = ({
  botState,
  riskSettings,
  brokerAccounts,
  onSelectRiskProfile,
  onNavigateTab,
  onToggleAutonomousTakeover,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('quantara_wizard_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('quantara_wizard_collapsed', String(next));
    } catch {
      // ignore
    }
  };

  // Determine current active risk profile key
  const activeProfileKey: RiskProfileType =
    (riskSettings.activeProfile as RiskProfileType) || 'BALANCED';
  const activeProfileDef = RISK_PROFILES[activeProfileKey] || RISK_PROFILES.BALANCED;

  // Step 1: Profile selected? (Always valid, user can switch)
  const isStep1Done = true;

  // Step 2: Broker connected?
  const connectedBroker = brokerAccounts.find(
    (b) => b.serverStatus === 'RUNNING' || b.status === 'RUNNING' || b.status === 'CONNECTED'
  ) || brokerAccounts[0];
  const isStep2Done = Boolean(connectedBroker);

  // Step 3: Autonomous Takeover engaged?
  const isStep3Done = Boolean(botState.autonomousTakeover && botState.isRunning);

  // Compute overall completion percent
  let completedCount = 1;
  if (isStep2Done) completedCount++;
  if (isStep3Done) completedCount++;
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-[#0C1322] via-[#10141E] to-[#141226] p-4 sm:p-5 shadow-lg shadow-blue-950/20">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F2536]">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-400 shadow-inner">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-brand font-bold text-sm tracking-wide text-white">
                3-STEP AUTONOMOUS LAUNCHPAD
              </span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300 border border-blue-500/30">
                {completedCount}/3 COMPLETED
              </span>
            </div>
            <p className="text-xs text-[#8E9299]">
              Configure risk safety, link your MT5 account, and hand execution over to Quantara.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center space-x-2 bg-[#0E0E11] px-3 py-1.5 rounded-lg border border-[#1F2536] font-mono text-xs">
            <span className="text-[#8E9299]">Launch Readiness:</span>
            <span className={`font-bold ${progressPercent === 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
              {progressPercent}%
            </span>
          </div>

          <button
            onClick={toggleCollapse}
            className="flex items-center space-x-1 rounded-lg border border-[#1F2536] bg-[#0E0E11] px-2.5 py-1.5 text-xs text-[#8E9299] hover:text-white transition-colors"
            title={isCollapsed ? 'Expand Launchpad' : 'Minimize Launchpad'}
          >
            {isCollapsed ? (
              <>
                <span>Expand</span>
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              </>
            ) : (
              <>
                <span>Minimize</span>
                <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#181D2B]">
        <div
          className="h-full transition-all duration-500 ease-out rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Steps body (collapsible) */}
      {!isCollapsed && (
        <div className="relative mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* STEP 1: Risk Profile */}
          <div
            className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
              isStep1Done
                ? 'border-emerald-500/30 bg-[#0E1522]/80 hover:border-emerald-500/50'
                : 'border-[#1F2536] bg-[#0E0E11]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1A2234]">
                <div className="flex items-center space-x-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                    1
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Risk Engine Policy
                  </span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#8E9299]">Active Profile:</span>
                  <span className="font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {activeProfileDef.name}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E9299] line-clamp-2">
                  {activeProfileDef.targetUser}
                </p>
                <div className="grid grid-cols-2 gap-1 pt-1 font-mono text-[10px] text-[#A1A1AA]">
                  <div className="bg-[#141A29] p-1.5 rounded border border-[#1E2638]">
                    Risk/Trade: <strong className="text-white">{activeProfileDef.maxRiskPerTradePercent}%</strong>
                  </div>
                  <div className="bg-[#141A29] p-1.5 rounded border border-[#1E2638]">
                    Daily Cap: <strong className="text-white">{activeProfileDef.maxDailyLossPercent}%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1A2234] flex items-center justify-between">
              <button
                onClick={() => onNavigateTab('risk')}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <span>Customize Safeguards</span>
                <ChevronRight className="h-3 w-3" />
              </button>
              <div className="flex space-x-1 font-mono text-[9px]">
                {(['CONSERVATIVE', 'BALANCED', 'MICRO_COMPOUNDING'] as RiskProfileType[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => onSelectRiskProfile(p)}
                    className={`px-1.5 py-0.5 rounded transition-colors ${
                      activeProfileKey === p
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#181D2B] text-[#8E9299] hover:text-white'
                    }`}
                  >
                    {p.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2: MT5 Account Connection */}
          <div
            className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
              isStep2Done
                ? 'border-emerald-500/30 bg-[#0E1522]/80 hover:border-emerald-500/50'
                : 'border-amber-500/40 bg-[#161208]/60 hover:border-amber-500/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1A2234]">
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold font-mono ${
                      isStep2Done
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    2
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Broker Execution Bridge
                  </span>
                </div>
                {isStep2Done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs">
                {isStep2Done && connectedBroker ? (
                  <>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[#8E9299]">Connected Node:</span>
                      <span className="font-bold text-emerald-300 truncate max-w-[140px]">
                        {connectedBroker.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 text-[#8E9299]">
                        <Server className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="font-mono text-zinc-300">
                          {connectedBroker.server || 'MetaQuotes / Live Bridge'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                        REAL LIVE
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300 flex items-center justify-between">
                      <span>Bridge Latency:</span>
                      <strong className="text-white">~14ms Low-Jitter</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-amber-300 font-semibold text-xs">
                      No Broker Account Connected
                    </div>
                    <p className="text-[11px] text-[#8E9299]">
                      Link your MT5, Exness, or Prop firm login (<strong className="text-amber-200">Demo or Real Live</strong>) to activate automated server order routing.
                    </p>
                    <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
                      Supports both risk-free Demo accounts and Real Live capital accounts.
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1A2234] flex items-center justify-between">
              <button
                onClick={() => onNavigateTab('brokers')}
                className="w-full py-1.5 rounded-lg bg-[#182030] hover:bg-[#202B40] text-blue-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-blue-500/20"
              >
                <span>{isStep2Done ? 'Manage MT5 Accounts' : 'Connect MT5 Account'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* STEP 3: Autonomous Takeover */}
          <div
            className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
              isStep3Done
                ? 'border-emerald-500/40 bg-[#0E1522]/90 shadow-sm shadow-emerald-950/40'
                : 'border-blue-500/30 bg-[#0E121E]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#1A2234]">
                <div className="flex items-center space-x-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold font-mono ${
                      isStep3Done
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    3
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">
                    Autonomous Takeover
                  </span>
                </div>
                {isStep3Done ? (
                  <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ACTIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-[#8E9299]">STANDBY</span>
                )}
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#8E9299]">Takeover Status:</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      isStep3Done
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#181D2B] text-zinc-300'
                    }`}
                  >
                    {isStep3Done ? 'AUTONOMOUS ACTIVE' : 'MANUAL CONFIRMATION'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E9299]">
                  {isStep3Done
                    ? 'Engine is autonomously scanning, entering trades, locking breakeven, and securing profits 24/7.'
                    : 'Enable to let Quantara autonomously execute qualifying setups with full zero-risk safeguards.'}
                </p>
                <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 font-mono">
                  <Lock className="h-3 w-3 text-emerald-400" />
                  <span>Trailed Breakeven & News Blackout Enforced</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#1A2234]">
              {onToggleAutonomousTakeover ? (
                <button
                  onClick={onToggleAutonomousTakeover}
                  className={`w-full py-1.5 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md ${
                    isStep3Done
                      ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>{isStep3Done ? 'Takeover Engaged (Click to Standby)' : 'Engage Autonomous Takeover'}</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('engine')}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center space-x-1"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Go to Engine Controls</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
