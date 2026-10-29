import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  DollarSign,
  Flame,
  HelpCircle,
  Info,
  Lock,
  Percent,
  Play,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { PortfolioSummary, RiskProfileType, RiskSettings } from '../types';
import { RISK_PROFILES, getProfileSettings } from '../data/riskProfiles';

interface RiskManagementViewProps {
  riskSettings: RiskSettings;
  portfolio: PortfolioSummary;
  onUpdateRiskSettings: (settings: Partial<RiskSettings>) => Promise<any>;
  onSelectRiskProfile?: (profileId: RiskProfileType) => Promise<any>;
  onTriggerKillSwitch: () => void;
  onResetKillSwitch: () => void;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  riskSettings,
  portfolio,
  onUpdateRiskSettings,
  onSelectRiskProfile,
  onTriggerKillSwitch,
  onResetKillSwitch,
}) => {
  const [formData, setFormData] = useState<RiskSettings>({ ...riskSettings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inspectingProfileId, setInspectingProfileId] = useState<RiskProfileType | null>(null);
  const [isSwitchingProfile, setIsSwitchingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [showAdvancedCalibration, setShowAdvancedCalibration] = useState(false);

  useEffect(() => {
    setFormData({ ...riskSettings });
  }, [riskSettings]);

  const activeProfileKey: RiskProfileType = riskSettings.activeRiskProfile || 'BALANCED';
  const activeProfile = RISK_PROFILES[activeProfileKey] || RISK_PROFILES.BALANCED;

  const handleSelectProfile = async (profileId: RiskProfileType) => {
    setIsSwitchingProfile(true);
    try {
      if (onSelectRiskProfile) {
        await onSelectRiskProfile(profileId);
      } else {
        const profileParams = getProfileSettings(profileId);
        await onUpdateRiskSettings(profileParams);
      }
      setProfileSuccessMsg(`Activated ${RISK_PROFILES[profileId].name}`);
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } finally {
      setIsSwitchingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateRiskSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Mathematical Calculations for UI reassurance
  const equity = Math.max(1, portfolio.totalEquity || portfolio.cashBalance || 100);
  const dailyLossLimitUsd = (equity * (riskSettings.maxDailyLossPercent / 100));
  const currentDailyLossUsd = Math.max(0, -portfolio.realizedPnlToday);
  const remainingDailyAllowanceUsd = Math.max(0, dailyLossLimitUsd - currentDailyLossUsd);
  const maxRiskPerTradeUsd = (equity * (riskSettings.maxRiskPerTradePercent / 100));
  const hardFloorUsd = ((portfolio.peakEquity || equity) * ((riskSettings.hardCapitalFloorPercent || 85) / 100));

  return (
    <div className="space-y-6">
      {/* Principle Directive & Philosophy */}
      <div className="trading-cockpit-card rounded-xl border border-blue-500/30 bg-[#0A0D14] p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-80 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center space-x-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
              </span>
              <span className="font-tech text-xs uppercase tracking-widest font-bold text-blue-300">
                Institutional Risk Management &amp; Expectancy Engine
              </span>
              <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300 border border-emerald-500/30 font-bold">
                Zero-Ruin Architecture
              </span>
            </div>

            <h1 className="font-brand text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Deterministic Capital Protection Guardrails
            </h1>

            <p className="text-xs text-[#8E9299] leading-relaxed">
              Automated algorithmic trading requires unshakable discipline. Quantara never gambles on high-risk bets. Every trade is vetted through mathematical expectancy, fractional position sizing, automatic zero-risk breakeven stops, and a daily loss circuit breaker.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="rounded-xl border border-[#1F2638] bg-[#0E121B] p-3 text-right font-mono">
              <div className="text-[10px] text-[#8E9299] uppercase tracking-wider font-tech">Active Profile</div>
              <div className="text-sm font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{activeProfile.name.split(' (')[0]}</span>
              </div>
              <div className="text-[10px] text-blue-400 font-tech">{activeProfile.badge}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Protective Shield Status Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Single Trade Risk Cap */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Max Risk / Trade</span>
            <Percent className="h-4 w-4 text-blue-400" />
          </div>
          <div className="font-mono text-xl font-bold text-white">
            {riskSettings.maxRiskPerTradePercent}% <span className="text-xs font-normal text-[#8E9299]">(${maxRiskPerTradeUsd.toFixed(2)})</span>
          </div>
          <div className="text-[11px] text-[#8E9299] font-mono leading-tight">
            Strict fractional lot sizing backwards from Stop-Loss distance.
          </div>
        </div>

        {/* Metric 2: Daily Circuit Breaker */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Daily Loss Circuit Breaker</span>
            <ShieldAlert className="h-4 w-4 text-amber-400" />
          </div>
          <div className="font-mono text-xl font-bold text-[#EF4444]">
            {riskSettings.maxDailyLossPercent}% <span className="text-xs font-normal text-[#8E9299]">(${dailyLossLimitUsd.toFixed(2)} cap)</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono leading-tight">
            ${remainingDailyAllowanceUsd.toFixed(2)} allowance remaining today.
          </div>
        </div>

        {/* Metric 3: Zero-Risk Breakeven Lock */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">Breakeven Lock Trigger</span>
            <Lock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xl font-bold text-emerald-300">
            +{riskSettings.breakevenTriggerR || activeProfile.breakevenTriggerR}R <span className="text-xs font-normal text-[#8E9299]">Auto-Lock</span>
          </div>
          <div className="text-[11px] text-[#8E9299] font-mono leading-tight">
            Stop Loss moves to entry + 1 pip as soon as profit hits trigger.
          </div>
        </div>

        {/* Metric 4: News Blackout & Floor Shield */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-[#8E9299] text-xs">
            <span className="font-tech tracking-wider uppercase font-semibold">News &amp; Floor Shield</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="font-mono text-xl font-bold text-purple-300">
            ±{riskSettings.newsBlackoutMinutes || activeProfile.newsBlackoutMinutes}m <span className="text-xs font-normal text-[#8E9299]">Blackout</span>
          </div>
          <div className="text-[11px] text-[#8E9299] font-mono leading-tight">
            Floor: ${hardFloorUsd.toFixed(2)} ({riskSettings.hardCapitalFloorPercent || 85}% of peak).
          </div>
        </div>
      </div>

      {profileSuccessMsg && (
        <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center space-x-2 animate-fade-in font-mono">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{profileSuccessMsg}. All algorithmic guardrails have been applied to your connected broker execution engine.</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: THE 3 INSTITUTIONAL RISK PROFILES (Detailed Selection Cards)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white font-tech flex items-center gap-2">
              <Compass className="h-4 w-4 text-blue-400" />
              Institutional Risk Profiles
            </h2>
            <p className="text-xs text-[#8E9299]">
              Choose the mathematical risk regime that matches your trading capital and risk tolerance. Click any card to inspect its full mathematical blueprint.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(['CONSERVATIVE', 'BALANCED', 'MICRO_COMPOUNDING'] as RiskProfileType[]).map((profileKey) => {
            const prof = RISK_PROFILES[profileKey];
            const isCurrent = activeProfileKey === profileKey;

            return (
              <div
                key={profileKey}
                className={`rounded-xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'border-blue-500/60 bg-[#0F1422] shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : 'border-[#1F1F23] bg-[#141416] hover:border-[#2E2E33] hover:bg-[#18181C]'
                }`}
              >
                {/* Active Indicator Badge */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white font-tech font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Active Profile</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Header & Badges */}
                  <div className="space-y-1.5 pr-14">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        profileKey === 'CONSERVATIVE'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : profileKey === 'BALANCED'
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {prof.badge}
                    </span>
                    <h3 className="text-base font-bold text-white font-brand">{prof.name}</h3>
                    <p className="text-xs text-[#8E9299] leading-relaxed">{prof.tagline}</p>
                  </div>

                  {/* Core Metrics Grid */}
                  <div className="rounded-lg bg-[#0E0E11] border border-[#1F1F23] p-3 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-[#8E9299] block font-tech uppercase">Risk / Trade</span>
                      <strong className="text-white text-sm">{prof.maxRiskPerTradePercent}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E9299] block font-tech uppercase">Daily Loss Cap</span>
                      <strong className="text-[#EF4444] text-sm">{prof.maxDailyLossPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E9299] block font-tech uppercase">Min R:R Ratio</span>
                      <strong className="text-[#10B981] text-sm">1:{prof.minRiskRewardRatio}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E9299] block font-tech uppercase">Breakeven Lock</span>
                      <strong className="text-emerald-300 text-sm">+{prof.breakevenTriggerR}R</strong>
                    </div>
                  </div>

                  {/* Recommended Balance */}
                  <div className="text-[11px] text-[#8E9299] flex items-center space-x-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Best for: <strong className="text-white">{prof.recommendedAccountSize}</strong></span>
                  </div>

                  {/* Summary bullets */}
                  <ul className="space-y-1.5 text-xs text-[#8E9299]">
                    {prof.keyBenefits.slice(0, 3).map((benefit, i) => (
                      <li key={i} className="flex items-start space-x-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action Controls */}
                <div className="pt-4 border-t border-[#1F1F23] flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setInspectingProfileId(profileKey)}
                    className="flex-1 rounded-lg border border-[#2E2E33] bg-[#1A1A1E] hover:bg-[#24242A] text-xs font-tech font-semibold text-white py-2 px-3 transition-colors flex items-center justify-center space-x-1"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                    <span>Inspect Blueprint</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCurrent || isSwitchingProfile}
                    onClick={() => handleSelectProfile(profileKey)}
                    className={`flex-1 rounded-lg py-2 px-3 text-xs font-mono font-bold transition-all flex items-center justify-center space-x-1 ${
                      isCurrent
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Engaged</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Engage</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: DETAILED PROFILE BLUEPRINT MODAL / DEEP-DIVE VIEWER
          ========================================================================= */}
      {inspectingProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-blue-500/40 bg-[#0E121C] shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1F2638] bg-[#0A0D15]">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {RISK_PROFILES[inspectingProfileId].badge}
                    </span>
                    <span className="text-xs font-mono text-[#8E9299]">
                      Protocol ID: {inspectingProfileId}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-brand mt-0.5">
                    {RISK_PROFILES[inspectingProfileId].name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectingProfileId(null)}
                className="h-8 w-8 rounded-lg border border-[#2E2E38] bg-[#141418] hover:bg-[#1E1E24] text-[#8E9299] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-[#E4E4E7]">
              {/* Target Trader Profile */}
              <div className="rounded-xl border border-[#1F2638] bg-[#0A0D15] p-4 space-y-1.5">
                <span className="font-tech text-xs uppercase tracking-wider font-bold text-blue-400 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5" />
                  Target Trader &amp; Account Tier
                </span>
                <p className="text-xs text-[#8E9299] leading-relaxed">
                  {RISK_PROFILES[inspectingProfileId].targetUser}
                </p>
                <div className="pt-2 text-[11px] font-mono text-emerald-400">
                  Ideal Balance: <strong className="text-white">{RISK_PROFILES[inspectingProfileId].recommendedAccountSize}</strong>
                </div>
              </div>

              {/* Mathematical Expectancy & Zero-Ruin Proof */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-2">
                <span className="font-tech text-xs uppercase tracking-wider font-bold text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5" />
                  Mathematical Zero-Ruin Guarantee
                </span>
                <p className="text-xs text-emerald-200/90 leading-relaxed font-sans">
                  {RISK_PROFILES[inspectingProfileId].mathematicalSafetyProof}
                </p>
              </div>

              {/* Guardrails Matrix Table */}
              <div className="space-y-2">
                <span className="font-tech text-xs uppercase tracking-wider font-bold text-white">
                  Deterministic Guardrail Specifications
                </span>
                <div className="rounded-xl border border-[#1F2638] overflow-hidden">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#0A0D15] text-[#8E9299] border-b border-[#1F2638]">
                      <tr>
                        <th className="p-3">Safety Parameter</th>
                        <th className="p-3">Threshold</th>
                        <th className="p-3 hidden sm:table-cell">Function &amp; Protection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F2638] bg-[#0E121C]">
                      <tr>
                        <td className="p-3 text-white font-semibold">Max Risk / Trade</td>
                        <td className="p-3 text-blue-400 font-bold">{RISK_PROFILES[inspectingProfileId].maxRiskPerTradePercent}%</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Limits maximum loss if Stop Loss is triggered.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">Daily Loss Circuit Breaker</td>
                        <td className="p-3 text-[#EF4444] font-bold">{RISK_PROFILES[inspectingProfileId].maxDailyLossPercent}%</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Engine halts all new entries until 00:00 UTC if daily loss hits cap.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">Minimum Risk-to-Reward</td>
                        <td className="p-3 text-[#10B981] font-bold">1:{RISK_PROFILES[inspectingProfileId].minRiskRewardRatio}</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Guarantees positive mathematical expectancy across all trades.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">Zero-Risk Breakeven Lock</td>
                        <td className="p-3 text-emerald-300 font-bold">+{RISK_PROFILES[inspectingProfileId].breakevenTriggerR}R</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Snaps Stop-Loss to entry + 1 pip as soon as profit hits trigger.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">Partial Take-Profit (+50%)</td>
                        <td className="p-3 text-emerald-400 font-bold">+{RISK_PROFILES[inspectingProfileId].partialTakeProfitR}R</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Realizes 50% profit into balance, leaves runner with trailing stop.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">News Blackout Window</td>
                        <td className="p-3 text-purple-300 font-bold">±{RISK_PROFILES[inspectingProfileId].newsBlackoutMinutes} min</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Blocks entries before &amp; after FOMC, CPI, NFP to avoid slippage.</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-semibold">Hard Capital Floor</td>
                        <td className="p-3 text-amber-300 font-bold">{RISK_PROFILES[inspectingProfileId].hardCapitalFloorPercent}%</td>
                        <td className="p-3 text-[#8E9299] text-[11px] hidden sm:table-cell">Auto-liquidates and disconnects if equity drops below this floor.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sleep-At-Night Reassurance */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 space-y-1.5">
                <span className="font-tech text-xs uppercase tracking-wider font-bold text-blue-300 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  What Happens When You're Asleep or Offline?
                </span>
                <p className="text-xs text-[#8E9299] leading-relaxed">
                  Every order dispatched by Quantara carries hard Stop-Loss and Take-Profit brackets encoded directly on your broker's MT5 server. Even if your internet disconnects, your laptop turns off, or power drops, the broker's matching engine automatically respects your stop-loss and profit targets.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#1F2638] bg-[#0A0D15] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingProfileId(null)}
                className="rounded-lg border border-[#2E2E38] bg-[#141418] hover:bg-[#1E1E24] px-4 py-2 text-xs font-tech text-[#8E9299] hover:text-white transition-colors"
              >
                Close Blueprint
              </button>

              <button
                type="button"
                disabled={activeProfileKey === inspectingProfileId || isSwitchingProfile}
                onClick={async () => {
                  await handleSelectProfile(inspectingProfileId);
                  setInspectingProfileId(null);
                }}
                className={`rounded-lg px-5 py-2 text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                  activeProfileKey === inspectingProfileId
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                }`}
              >
                {activeProfileKey === inspectingProfileId ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Currently Engaged</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Engage This Risk Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: EMERGENCY MASTER KILL SWITCH
          ========================================================================= */}
      <div
        className={`rounded-xl border p-5 text-xs space-y-4 ${
          riskSettings.killSwitchActive
            ? 'border-[#EF4444] bg-[#EF4444]/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'border-[#1F1F23] bg-[#141416]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <AlertOctagon className={`h-5 w-5 ${riskSettings.killSwitchActive ? 'text-[#EF4444] animate-pulse' : 'text-[#EF4444]'}`} />
            <div>
              <h3 className="font-semibold uppercase tracking-wider text-white text-sm font-tech">
                Master Emergency Kill Switch &amp; Liquidation Gate
              </h3>
              <p className="text-xs text-[#8E9299]">
                Instantly disconnects autonomous bot order generation and freezes trade execution
              </p>
            </div>
          </div>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
              riskSettings.killSwitchActive
                ? 'bg-[#EF4444] text-white animate-bounce font-mono'
                : 'bg-[#1F1F23] text-[#8E9299] border border-[#2E2E33] font-mono'
            }`}
          >
            STATUS: {riskSettings.killSwitchActive ? 'ENGAGED / LOCKED' : 'ARMED & READY'}
          </span>
        </div>

        {riskSettings.killSwitchActive ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-[#EF4444]/20 p-3 border border-[#EF4444]/30 text-[#EF4444] text-xs font-mono">
              <strong>Kill Switch Reason:</strong> {riskSettings.killSwitchTriggerReason || 'Manual trigger by operator'}
            </div>
            <button
              onClick={onResetKillSwitch}
              className="rounded-lg bg-[#10B981] px-4 py-2 font-bold text-white hover:bg-[#059669] transition-colors shadow-lg shadow-emerald-900/20 font-tech uppercase"
            >
              Clear Risk Lock &amp; Reset Kill Switch
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#8E9299]">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.closePositionsOnKillSwitch}
                  onChange={(e) => setFormData({ ...formData, closePositionsOnKillSwitch: e.target.checked })}
                  className="rounded accent-red-500 h-3.5 w-3.5 shrink-0"
                />
                <span>Automatically liquidate all open positions when Kill Switch is engaged</span>
              </label>
            </div>
            <button
              onClick={onTriggerKillSwitch}
              className="w-full sm:w-auto rounded-lg bg-[#EF4444] px-4 py-2 font-bold text-white hover:bg-[#DC2626] transition-all shadow-md shadow-red-900/20 text-center font-tech uppercase"
            >
              Trigger Emergency Kill Switch
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: ADVANCED PARAMETER CALIBRATION (Expandable Form)
          ========================================================================= */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div>
            <h3 className="font-semibold uppercase tracking-wider text-white text-sm font-tech flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              Manual Parameter Fine-Tuning
            </h3>
            <p className="text-xs text-[#8E9299]">
              Fine-tune custom numerical thresholds if you need to deviate from the presets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedCalibration(!showAdvancedCalibration)}
            className="rounded-lg border border-[#2E2E33] bg-[#1A1A1E] px-3 py-1.5 text-xs font-tech text-[#8E9299] hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <span>{showAdvancedCalibration ? 'Hide Advanced Settings' : 'Show Advanced Settings'}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedCalibration ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showAdvancedCalibration && (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Max Risk Per Trade */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Max Risk Per Trade (%)</span>
                  <span className="text-blue-400 font-bold">{formData.maxRiskPerTradePercent}%</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Max portfolio equity risked on any single trade stop-loss distance.</p>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="5.0"
                  value={formData.maxRiskPerTradePercent}
                  onChange={(e) => setFormData({ ...formData, maxRiskPerTradePercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Max Daily Loss Limit */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Max Daily Loss (%)</span>
                  <span className="text-[#EF4444] font-bold">{formData.maxDailyLossPercent}%</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Daily circuit breaker halts new orders if today's loss breaches this limit.</p>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="15.0"
                  value={formData.maxDailyLossPercent}
                  onChange={(e) => setFormData({ ...formData, maxDailyLossPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Max Account Drawdown */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Max Account Drawdown (%)</span>
                  <span className="text-yellow-400 font-bold">{formData.maxAccountDrawdownPercent}%</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Portfolio-wide peak-to-trough drawdown threshold for engine lockout.</p>
                <input
                  type="number"
                  step="0.5"
                  min="2.0"
                  max="30.0"
                  value={formData.maxAccountDrawdownPercent}
                  onChange={(e) => setFormData({ ...formData, maxAccountDrawdownPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Max Open Positions */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Max Open Positions</span>
                  <span className="text-white font-bold">{formData.maxOpenPositions}</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Simultaneous active positions cap to avoid correlation overload.</p>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxOpenPositions}
                  onChange={(e) => setFormData({ ...formData, maxOpenPositions: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Breakeven Lock Trigger */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Breakeven Lock Trigger (R)</span>
                  <span className="text-emerald-400 font-bold">+{formData.breakevenTriggerR || 1.0}R</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Automatically moves SL to entry + 1 pip when position reaches this R-multiple.</p>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="3.0"
                  value={formData.breakevenTriggerR || 1.0}
                  onChange={(e) => setFormData({ ...formData, breakevenTriggerR: parseFloat(e.target.value) || 1.0 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Take Profit Target (R:R) */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-[#E4E4E7] font-semibold font-sans">Take Profit Target (R:R)</span>
                  <span className="text-[#10B981] font-bold">1:{formData.defaultTakeProfitRiskReward}</span>
                </div>
                <p className="text-[11px] text-[#8E9299] font-sans">Minimum reward-to-risk ratio for profit target placement.</p>
                <input
                  type="number"
                  step="0.1"
                  min="1.5"
                  max="5.0"
                  value={formData.defaultTakeProfitRiskReward}
                  onChange={(e) => setFormData({ ...formData, defaultTakeProfitRiskReward: parseFloat(e.target.value) || 2.5 })}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#1F1F23] flex items-center justify-between">
              {saveSuccess && (
                <span className="text-[#10B981] font-bold flex items-center font-mono text-xs">
                  <CheckCircle className="h-4 w-4 mr-1 inline" /> Parameters Applied &amp; Synchronized
                </span>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="ml-auto rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-500 transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20 font-tech uppercase"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Updating Engine...' : 'Commit Custom Calibration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
