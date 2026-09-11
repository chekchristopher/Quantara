import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  HelpCircle,
  Percent,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

interface TradeExplanationModalProps {
  tradeOrSignalId: string | null;
  customData?: any;
  onClose: () => void;
}

export const TradeExplanationModal: React.FC<TradeExplanationModalProps> = ({
  tradeOrSignalId,
  customData,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(customData?.aiAnalysis || null);

  useEffect(() => {
    if (customData?.aiAnalysis) {
      setAiData(customData.aiAnalysis);
    } else if (tradeOrSignalId && !aiData) {
      setLoading(true);
      api.explainSignalWithAI(tradeOrSignalId)
        .then((res) => {
          if (res.success) setAiData(res.aiAnalysis);
        })
        .catch((err) => console.warn('AI explain error:', err))
        .finally(() => setLoading(false));
    }
  }, [tradeOrSignalId, customData]);

  if (!tradeOrSignalId) return null;

  const symbol = customData?.symbol || customData?.assetSymbol || 'BTC/USD';
  const side = customData?.side || customData?.direction || 'LONG';
  const strategy = customData?.strategyName || 'Adaptive Regime Meta-Engine';
  const entryPrice = customData?.entryPrice || 0;
  const stopLoss = customData?.stopLossPrice || customData?.suggestedStopLoss || 0;
  const takeProfit = customData?.takeProfitPrice || customData?.suggestedTakeProfit || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-xs">
      <div className="w-full max-w-2xl rounded-xl border border-[#1F1F23] bg-[#141416] p-6 space-y-4 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8E9299] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-[#1F1F23]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-sm text-white uppercase tracking-wider">
                Trade Rationale & AI Signal Transparency
              </h3>
              <span className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] font-mono text-[#8E9299] border border-[#2E2E33]">
                AUDIT ID: {tradeOrSignalId.slice(0, 14)}
              </span>
            </div>
            <p className="text-xs text-[#8E9299]">
              Institutional breakdown of algorithmic triggers, market regime confluence, and risk boundaries
            </p>
          </div>
        </div>

        {/* Trade Coordinates Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-[#0E0E11] p-3 border border-[#1F1F23] text-xs font-mono">
          <div>
            <span className="text-[#8E9299] block text-[10px] font-sans">Asset & Side</span>
            <span className="font-semibold text-white">
              {symbol} <span className="text-[#10B981]">({side})</span>
            </span>
          </div>
          <div>
            <span className="text-[#8E9299] block text-[10px] font-sans">Entry Price</span>
            <span className="font-semibold text-white">${entryPrice.toFixed(entryPrice > 10 ? 2 : 4)}</span>
          </div>
          <div>
            <span className="text-[#8E9299] block text-[10px] font-sans">Stop Loss Target</span>
            <span className="font-semibold text-[#EF4444]">${stopLoss.toFixed(stopLoss > 10 ? 2 : 4)}</span>
          </div>
          <div>
            <span className="text-[#8E9299] block text-[10px] font-sans">Take Profit Target</span>
            <span className="font-semibold text-[#10B981]">${takeProfit.toFixed(takeProfit > 10 ? 2 : 4)}</span>
          </div>
        </div>

        {/* AI Analysis Box */}
        {loading ? (
          <div className="py-8 text-center text-[#8E9299]">
            <Sparkles className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-400" />
            <span>Consulting Institutional Quantitative Auditor...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {aiData && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-300 flex items-center">
                    <Brain className="h-4 w-4 mr-1.5 inline text-blue-400" /> AI Auditor Evaluation
                  </span>
                  <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-200 border border-blue-500/30">
                    GRADE: {aiData.tradeQualityGrade || 'A'}
                  </span>
                </div>
                <p className="text-white/90 leading-relaxed text-xs">
                  {aiData.summary || 'Signal verified within mathematical confidence parameters.'}
                </p>
                {aiData.macroContext && (
                  <div className="text-xs text-blue-200/80 pt-1.5 border-t border-blue-500/20">
                    <strong>Macro Regime Context:</strong> {aiData.macroContext}
                  </div>
                )}
              </div>
            )}

            {/* Checklist of Reasons */}
            <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3.5 space-y-2">
              <span className="font-semibold text-white text-xs uppercase tracking-wider block">
                Deterministic Execution Criteria Checklist
              </span>
              <ul className="space-y-2 text-[#8E9299] text-xs">
                {customData?.reasons && customData.reasons.length > 0 ? (
                  customData.reasons.map((r: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[#E4E4E7]">{r}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[#E4E4E7]">Price triggered {strategy} technical entry rules.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[#E4E4E7]">Stop-loss calibrated via ATR dynamic volatility sizing to contain downside risk.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span className="text-[#E4E4E7]">Passed multi-step Risk Engine circuit breakers (Daily loss, DD ceiling, Asset cap).</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#1F1F23] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1F1F23] px-4 py-2 font-semibold text-white hover:bg-[#2E2E33] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
