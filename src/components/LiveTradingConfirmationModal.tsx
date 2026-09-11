import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Check, ShieldAlert, X } from 'lucide-react';

interface LiveTradingConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LiveTradingConfirmationModal: React.FC<LiveTradingConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-xs">
      <div className="w-full max-w-lg rounded-xl border border-[#EF4444]/40 bg-[#141416] p-6 space-y-4 shadow-2xl relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-[#8E9299] hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-3 pb-3 border-b border-[#1F1F23]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#EF4444] uppercase tracking-wider">
              Caution: Live Capital Execution Mode
            </h3>
            <p className="text-xs text-[#8E9299]">
              Mandatory institutional risk acknowledgment
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-[#EF4444]/10 p-4 border border-[#EF4444]/20 text-[#EF4444] text-xs leading-relaxed space-y-2">
          <p className="font-semibold text-[#EF4444]">
            You are about to activate real-money automated order execution.
          </p>
          <p className="text-xs text-[#E4E4E7]/90 leading-relaxed">
            Live orders will be routed to connected exchange APIs and filled against real order book liquidity. The system prioritizes risk control, but market slippage, exchange outages, and high volatility can result in capital loss.
          </p>
        </div>

        <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-4 space-y-2">
          <label className="flex items-start space-x-3 cursor-pointer text-[#E4E4E7] text-xs">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded accent-red-500 h-4 w-4 mt-0.5 shrink-0"
            />
            <span className="leading-snug text-xs">
              I understand that automated trading can result in losses and that historical/backtested performance does not guarantee future results.
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F1F23]">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-[#8E9299] hover:text-white font-medium text-xs"
          >
            Stay in Paper Trading
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={onConfirm}
            className="rounded-lg bg-[#EF4444] px-5 py-2 font-bold text-white hover:bg-[#DC2626] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 text-xs"
          >
            Unlock Live Mode
          </button>
        </div>
      </div>
    </div>
  );
};
