import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Percent,
  RefreshCw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PortfolioSummary, RiskSettings } from '../types';

interface RiskManagementViewProps {
  riskSettings: RiskSettings;
  portfolio: PortfolioSummary;
  onUpdateRiskSettings: (settings: Partial<RiskSettings>) => Promise<any>;
  onTriggerKillSwitch: () => void;
  onResetKillSwitch: () => void;
}

export const RiskManagementView: React.FC<RiskManagementViewProps> = ({
  riskSettings,
  portfolio,
  onUpdateRiskSettings,
  onTriggerKillSwitch,
  onResetKillSwitch,
}) => {
  const [formData, setFormData] = useState<RiskSettings>({ ...riskSettings });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateRiskSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-300 flex items-start space-x-3">
        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold uppercase tracking-wider text-blue-200">
            Quantara Core Risk Directive
          </p>
          <p className="text-xs text-[#E4E4E7]/90 leading-relaxed font-sans">
            "The objective is to maximize risk-adjusted performance while controlling downside risk, not to guarantee profit. Every proposed trade must pass through this deterministic risk-management layer before execution."
          </p>
        </div>
      </div>

      {/* Emergency Kill Switch Status & Control */}
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
              <h3 className="font-semibold uppercase tracking-wider text-white text-sm">
                Autonomous Kill Switch Circuit Breaker
              </h3>
              <p className="text-xs text-[#8E9299]">
                Instantly disconnects autonomous bot order generation and freezes trade execution
              </p>
            </div>
          </div>
          <span
            className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
              riskSettings.killSwitchActive
                ? 'bg-[#EF4444] text-white animate-bounce'
                : 'bg-[#1F1F23] text-[#8E9299] border border-[#2E2E33]'
            }`}
          >
            STATUS: {riskSettings.killSwitchActive ? 'ENGAGED / LOCKED' : 'ARMED & READY'}
          </span>
        </div>

        {riskSettings.killSwitchActive ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-[#EF4444]/20 p-3 border border-[#EF4444]/30 text-[#EF4444] text-xs">
              <strong>Kill Switch Reason:</strong> {riskSettings.killSwitchTriggerReason || 'Manual trigger by operator'}
            </div>
            <button
              onClick={onResetKillSwitch}
              className="rounded-lg bg-[#10B981] px-4 py-2 font-bold text-white hover:bg-[#059669] transition-colors shadow-lg shadow-emerald-900/20"
            >
              Clear Risk Lock & Reset Kill Switch
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#8E9299]">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.closePositionsOnKillSwitch}
                  onChange={(e) => setFormData({ ...formData, closePositionsOnKillSwitch: e.target.checked })}
                  className="rounded accent-red-500 h-3.5 w-3.5"
                />
                <span>Automatically liquidate all open positions when Kill Switch is engaged</span>
              </label>
            </div>
            <button
              onClick={onTriggerKillSwitch}
              className="rounded-lg bg-[#EF4444] px-4 py-2 font-bold text-white hover:bg-[#DC2626] transition-all shadow-md shadow-red-900/20"
            >
              Trigger Emergency Kill Switch
            </button>
          </div>
        )}
      </div>

      {/* Risk Configuration Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-6 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold uppercase tracking-wider text-white text-sm">
              Deterministic Risk Guardrails Calibration
            </h3>
          </div>
          {saveSuccess && (
            <span className="text-[#10B981] font-bold flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 inline" /> Parameters Applied
            </span>
          )}
        </div>

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
              max="20"
              value={formData.maxOpenPositions}
              onChange={(e) => setFormData({ ...formData, maxOpenPositions: parseInt(e.target.value) || 1 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Max Exposure Per Asset */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#E4E4E7] font-semibold font-sans">Max Asset Concentration (%)</span>
              <span className="text-white font-bold">{formData.maxExposurePerAssetPercent}%</span>
            </div>
            <p className="text-[11px] text-[#8E9299] font-sans">Maximum allocation allowed in any single asset ticker.</p>
            <input
              type="number"
              step="1"
              min="5"
              max="100"
              value={formData.maxExposurePerAssetPercent}
              onChange={(e) => setFormData({ ...formData, maxExposurePerAssetPercent: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Max Leverage */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#E4E4E7] font-semibold font-sans">Max Leverage Multiplier</span>
              <span className="text-white font-bold">{formData.maxLeverage}x</span>
            </div>
            <p className="text-[11px] text-[#8E9299] font-sans">Conservative margin leverage ceiling.</p>
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="10.0"
              value={formData.maxLeverage}
              onChange={(e) => setFormData({ ...formData, maxLeverage: parseFloat(e.target.value) || 1 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* ATR Stop Loss Multiplier */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#E4E4E7] font-semibold font-sans">Stop Loss ATR Multiplier</span>
              <span className="text-white font-bold">{formData.defaultStopLossAtrMultiplier}x ATR</span>
            </div>
            <p className="text-[11px] text-[#8E9299] font-sans">Dynamically sets SL distance to match current asset volatility.</p>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="4.0"
              value={formData.defaultStopLossAtrMultiplier}
              onChange={(e) => setFormData({ ...formData, defaultStopLossAtrMultiplier: parseFloat(e.target.value) || 1.5 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Take Profit R:R */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-[#E4E4E7] font-semibold font-sans">Take Profit Target (R:R)</span>
              <span className="text-[#10B981] font-bold">{formData.defaultTakeProfitRiskReward}:1</span>
            </div>
            <p className="text-[11px] text-[#8E9299] font-sans">Minimum reward-to-risk ratio for profit target placement.</p>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={formData.defaultTakeProfitRiskReward}
              onChange={(e) => setFormData({ ...formData, defaultTakeProfitRiskReward: parseFloat(e.target.value) || 2.0 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Trailing Stop */}
          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.trailingStopEnabled}
                  onChange={(e) => setFormData({ ...formData, trailingStopEnabled: e.target.checked })}
                  className="rounded accent-blue-500 h-3.5 w-3.5"
                />
                <span className="font-semibold text-[#E4E4E7] font-sans">Trailing Stop Ratchet</span>
              </label>
              <span className="text-[#10B981] font-bold">{formData.trailingStopPercent}%</span>
            </div>
            <p className="text-[11px] text-[#8E9299] font-sans">Automatically advances stop loss as trade moves in profit.</p>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="5.0"
              disabled={!formData.trailingStopEnabled}
              value={formData.trailingStopPercent}
              onChange={(e) => setFormData({ ...formData, trailingStopPercent: parseFloat(e.target.value) || 1.5 })}
              className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none disabled:opacity-40"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#1F1F23] flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white hover:bg-blue-500 transition-colors flex items-center space-x-2 shadow-lg shadow-blue-600/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Updating Engine...' : 'Commit Risk Parameters'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
