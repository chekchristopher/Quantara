import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { NotificationItem, Position } from '../types';
import {
  playTradeExecutedSound,
  playBreakevenLockedSound,
  playProfitBankedSound,
  playEmergencyAlertSound,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/soundEffects';

interface ToastNotificationCenterProps {
  notifications: NotificationItem[];
  positions: Position[];
}

interface ToastMessage {
  id: string;
  type: 'TRADE_EXECUTED' | 'BREAKEVEN_LOCKED' | 'PARTIAL_PROFIT' | 'SAFETY_ALERT' | 'INFO';
  title: string;
  message: string;
  timestamp: number;
}

export const ToastNotificationCenter: React.FC<ToastNotificationCenterProps> = ({
  notifications,
  positions,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const seenBreakevenPositionsRef = useRef<Set<string>>(new Set());
  const seenPartialProfitPositionsRef = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const newToast: ToastMessage = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Play corresponding synthetic sound effect
    if (toast.type === 'BREAKEVEN_LOCKED') {
      playBreakevenLockedSound();
    } else if (toast.type === 'PARTIAL_PROFIT') {
      playProfitBankedSound();
    } else if (toast.type === 'TRADE_EXECUTED') {
      playTradeExecutedSound();
    } else if (toast.type === 'SAFETY_ALERT') {
      playEmergencyAlertSound();
    }

    // Auto dismiss after 5s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 5000);
  };

  // Monitor positions for Breakeven Lock and Partial Profit transitions
  useEffect(() => {
    positions.forEach((pos) => {
      if (pos.breakevenLocked && !seenBreakevenPositionsRef.current.has(pos.id)) {
        seenBreakevenPositionsRef.current.add(pos.id);
        addToast({
          type: 'BREAKEVEN_LOCKED',
          title: `🔒 ZERO-RISK ACHIEVED: ${pos.symbol}`,
          message: `Stop Loss trailed to entry price (${pos.entryPrice}). This trade now carries $0.00 downside risk.`,
        });
      }

      if (pos.partialProfitTaken && !seenPartialProfitPositionsRef.current.has(pos.id)) {
        seenPartialProfitPositionsRef.current.add(pos.id);
        addToast({
          type: 'PARTIAL_PROFIT',
          title: `💰 50% PROFIT BANKED: ${pos.symbol}`,
          message: `Target +1.8R reached. 50% lot closed into realized cash balance. Remaining runner active.`,
        });
      }
    });
  }, [positions]);

  // Monitor incoming server notifications
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latest = notifications.slice(-5);
    latest.forEach((n) => {
      if (!seenNotifIdsRef.current.has(n.id)) {
        seenNotifIdsRef.current.add(n.id);
        let type: ToastMessage['type'] = 'INFO';
        if (n.type === 'ORDER_FILLED' || n.title.includes('Executed') || n.title.includes('Position')) {
          type = 'TRADE_EXECUTED';
        } else if (n.type === 'RISK_ALERT' || n.title.includes('Risk') || n.title.includes('Kill Switch')) {
          type = 'SAFETY_ALERT';
        }

        addToast({
          type,
          title: n.title,
          message: n.message,
        });
      }
    });
  }, [notifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderColor = 'border-blue-500/40 bg-[#0E1322]/95 text-blue-200';
        let icon = <Bell className="h-4 w-4 text-blue-400 shrink-0" />;

        if (toast.type === 'BREAKEVEN_LOCKED') {
          borderColor = 'border-emerald-500/60 bg-[#091812]/95 text-emerald-200 shadow-emerald-950/50';
          icon = <Lock className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />;
        } else if (toast.type === 'PARTIAL_PROFIT') {
          borderColor = 'border-amber-500/60 bg-[#1A1608]/95 text-amber-200 shadow-amber-950/50';
          icon = <Coins className="h-4 w-4 text-amber-400 shrink-0" />;
        } else if (toast.type === 'SAFETY_ALERT') {
          borderColor = 'border-red-500/60 bg-[#1C0D0F]/95 text-red-200 shadow-red-950/50';
          icon = <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />;
        } else if (toast.type === 'TRADE_EXECUTED') {
          borderColor = 'border-cyan-500/60 bg-[#0A161E]/95 text-cyan-200 shadow-cyan-950/50';
          icon = <ArrowUpRight className="h-4 w-4 text-cyan-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all font-mono text-xs ${borderColor}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5">{icon}</div>
                <div>
                  <div className="font-bold text-white text-[11px] leading-tight tracking-wide">
                    {toast.title}
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-300 leading-relaxed font-sans">
                    {toast.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-white p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
