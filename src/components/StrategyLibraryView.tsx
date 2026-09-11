import React, { useState } from 'react';
import {
  Check,
  CheckCircle,
  Cpu,
  Layers,
  Percent,
  Plus,
  Radio,
  Sliders,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { StrategyConfig } from '../types';

interface StrategyLibraryViewProps {
  strategies: StrategyConfig[];
  activeStrategyId: string;
  onSelectActiveStrategy: (id: string) => void;
  onToggleStrategy: (id: string, enabled: boolean) => void;
  onUpdateParams: (id: string, params: Record<string, any>) => void;
}

export const StrategyLibraryView: React.FC<StrategyLibraryViewProps> = ({
  strategies,
  activeStrategyId,
  onSelectActiveStrategy,
  onToggleStrategy,
  onUpdateParams,
}) => {
  const [editingParamsId, setEditingParamsId] = useState<string | null>(null);
  const [localParams, setLocalParams] = useState<Record<string, any>>({});

  const startEditing = (strategy: StrategyConfig) => {
    setEditingParamsId(strategy.id);
    setLocalParams({ ...strategy.parameters });
  };

  const saveParams = (strategyId: string) => {
    onUpdateParams(strategyId, localParams);
    setEditingParamsId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5">
        <div className="flex items-center space-x-3 pb-3 border-b border-[#1F1F23]">
          <Layers className="h-5 w-5 text-blue-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            Quantitative Strategy Intelligence Library
          </h2>
        </div>
        <p className="text-xs text-[#8E9299] mt-3 leading-relaxed">
          Select and calibrate production-tested trading algorithms. The system communicates:
          <span className="text-white italic ml-1">
            "Strategy selected based on historical and current performance metrics, subject to market and execution risk."
          </span>
        </p>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((strat) => {
          const isActive = strat.id === activeStrategyId;
          const isEditing = editingParamsId === strat.id;

          return (
            <div
              key={strat.id}
              className={`rounded-xl border p-5 transition-all text-xs space-y-4 ${
                isActive
                  ? 'border-blue-500/50 bg-[#141416] shadow-lg shadow-blue-500/5'
                  : 'border-[#1F1F23] bg-[#141416] hover:border-[#2E2E33]'
              }`}
            >
              {/* Header: Title & Badges */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-white">{strat.name}</span>
                    {isActive && (
                      <span className="rounded bg-blue-500/10 text-blue-400 px-2 py-0.5 text-[10px] font-bold border border-blue-500/20 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 inline" /> ACTIVE ENGINE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E9299] leading-relaxed">{strat.description}</p>
                </div>
              </div>

              {/* Supported Market Regimes */}
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase tracking-wider block mb-1.5 font-semibold">Optimized For Regimes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {strat.regimes.map((reg) => (
                    <span
                      key={reg}
                      className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] text-[#E4E4E7] border border-[#2E2E33]"
                    >
                      {reg}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parameters Box */}
              <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3 space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs text-[#8E9299]">
                  <span className="font-semibold uppercase tracking-wider flex items-center text-white">
                    <Sliders className="h-3 w-3 mr-1.5 text-blue-400 inline" /> Parameters
                  </span>
                  {!isEditing ? (
                    <button
                      onClick={() => startEditing(strat)}
                      className="text-blue-400 hover:underline text-[11px] font-sans font-medium"
                    >
                      Calibrate
                    </button>
                  ) : (
                    <button
                      onClick={() => saveParams(strat.id)}
                      className="text-blue-400 font-bold hover:underline text-[11px] font-sans"
                    >
                      Save Values
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(isEditing ? localParams : strat.parameters).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-[#8E9299] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) =>
                            setLocalParams({ ...localParams, [key]: parseFloat(e.target.value) || 0 })
                          }
                          className="w-16 rounded border border-[#1F1F23] bg-[#0A0A0B] px-1.5 py-0.5 text-right text-white focus:border-blue-500 focus:outline-none"
                        />
                      ) : (
                        <span className="font-semibold text-white">{String(val)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions: Activate / Enable */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1F1F23]">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strat.enabled}
                    onChange={(e) => onToggleStrategy(strat.id, e.target.checked)}
                    className="rounded accent-blue-500 h-3.5 w-3.5"
                  />
                  <span className="text-xs text-[#8E9299]">Enabled in Watcher</span>
                </label>

                {!isActive ? (
                  <button
                    onClick={() => onSelectActiveStrategy(strat.id)}
                    className="rounded-lg bg-[#1F1F23] px-3.5 py-1.5 font-semibold text-white hover:bg-blue-600 transition-all text-xs shadow-sm"
                  >
                    Deploy to Bot
                  </button>
                ) : (
                  <span className="text-blue-400 text-xs font-semibold flex items-center">
                    <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Live in Execution
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
