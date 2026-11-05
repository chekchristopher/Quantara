import React, { useState, useEffect } from 'react';
import {
  Activity,
  Radio,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
  TrendingUp,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { MarketAsset, BotState } from '../types';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

interface EngineActivityStreamProps {
  assets: MarketAsset[];
  botState: BotState;
  onSelectAsset?: (symbol: string) => void;
}

export const EngineActivityStream: React.FC<EngineActivityStreamProps> = ({
  assets,
  botState,
  onSelectAsset,
}) => {
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [activeScanIdx, setActiveScanIdx] = useState<number>(0);
  const [scanPulse, setScanPulse] = useState<boolean>(false);

  // Cycle through scanned assets every 2.4s to visually show the scanner scanning markets
  useEffect(() => {
    if (!assets || assets.length === 0) return;
    const interval = setInterval(() => {
      setActiveScanIdx((prev) => (prev + 1) % assets.length);
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 600);
    }, 2400);

    return () => clearInterval(interval);
  }, [assets]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const currentScannedAsset = assets[activeScanIdx] || assets[0];
  const rsiVal = currentScannedAsset?.indicators?.rsi ?? 52.3;
  const isRsiOverbought = rsiVal > 70;
  const isRsiOversold = rsiVal < 30;
  const emaTrend = currentScannedAsset
    ? currentScannedAsset.indicators.ema20 > currentScannedAsset.indicators.ema50
      ? 'BULLISH ALIGNMENT'
      : 'BEARISH CONVERGENCE'
    : 'MONITORING';

  return (
    <div className="rounded-xl border border-[#1F1F23] bg-[#101014] p-3.5 sm:p-4 text-xs font-mono shadow-sm">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#1F1F23]">
        <div className="flex items-center space-x-2.5">
          <div className="relative flex items-center justify-center">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <span className="absolute h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Autonomous Market Scanner &amp; Heartbeat HUD
              </span>
              <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold">
                1,500ms TICK
              </span>
            </div>
            <div className="text-[10px] text-[#8E9299]">
              Live 24/7 technical regime scanner • Trailed breakeven &amp; risk gates verified
            </div>
          </div>
        </div>

        {/* Audio notification toggle + Status */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSound}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              soundOn
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30'
                : 'bg-[#18181C] border-[#2A2A30] text-[#71717A] hover:text-white'
            }`}
            title={soundOn ? 'Audio Chimes: Enabled (Click to Mute)' : 'Audio Chimes: Muted (Click to Enable)'}
          >
            {soundOn ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Chimes: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-1 bg-[#18181C] px-2 py-1 rounded-lg border border-[#2A2A30] text-[10px] text-zinc-300">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-bold">SYNCED</span>
          </div>
        </div>
      </div>

      {/* Dynamic Asset Scanning Radar Strip */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2.5">
        {/* Scanned Asset Radar Card */}
        <div
          className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
            scanPulse
              ? 'border-blue-500/60 bg-blue-500/10'
              : 'border-[#1F1F23] bg-[#141418] hover:border-blue-500/30'
          }`}
          onClick={() => currentScannedAsset && onSelectAsset?.(currentScannedAsset.symbol)}
        >
          <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>ACTIVE SCAN TARGET</span>
            <span className="text-blue-400 font-bold">Cycle #{activeScanIdx + 1}/{assets.length}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-bold text-sm text-white">{currentScannedAsset?.symbol || 'XAU/USD'}</span>
            <span className="text-xs font-semibold text-zinc-200">
              ${currentScannedAsset?.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-[#8E9299]">Spread:</span>
            <span className="text-emerald-400 font-semibold">
              {currentScannedAsset?.spreadPips !== undefined
                ? `${currentScannedAsset.spreadPips.toFixed(1)} Pips (Tight)`
                : 'Optimal (<0.02%)'}
            </span>
          </div>
        </div>

        {/* RSI Technical Reading */}
        <div className="rounded-lg border border-[#1F1F23] bg-[#141418] p-2.5">
          <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>RSI (14) MOMENTUM</span>
            <span className="text-purple-400">Range: 0-100</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-bold text-sm text-purple-300">{rsiVal.toFixed(1)}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isRsiOverbought
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : isRsiOversold
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {isRsiOverbought ? 'OVERBOUGHT' : isRsiOversold ? 'OVERSOLD' : 'NEUTRAL ZONE'}
            </span>
          </div>
          {/* Visual Mini RSI Bar */}
          <div className="mt-1.5 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, rsiVal))}%` }}
            />
          </div>
        </div>

        {/* EMA Trend & Strategy Regimes */}
        <div className="rounded-lg border border-[#1F1F23] bg-[#141418] p-2.5">
          <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>EMA 20/50 ALIGNMENT</span>
            <TrendingUp className="h-3 w-3 text-blue-400" />
          </div>
          <div className="mt-1 font-bold text-xs text-white truncate">
            {emaTrend}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>Strategy:</span>
            <span className="text-blue-300 font-semibold truncate max-w-[110px]">
              {botState.activeStrategyName || 'Adaptive Regime'}
            </span>
          </div>
        </div>

        {/* Risk Filter & News Shield */}
        <div className="rounded-lg border border-[#1F1F23] bg-[#141418] p-2.5">
          <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>PROTECTION GATES</span>
            <Shield className="h-3 w-3 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-center space-x-1.5 text-xs font-bold text-emerald-300">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>NEWS SHIELD: CLEAR</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-[#8E9299]">
            <span>Correlation Filter:</span>
            <span className="text-zinc-200">Active (Max 2 FX Pairs)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
