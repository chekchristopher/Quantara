import React, { useState, useEffect } from 'react';
import { MarketAsset } from '../types';
import { Pause, Play, ArrowLeftRight, ArrowLeft, ArrowRight } from 'lucide-react';

export interface MarketTickerItem {
  symbol: string;
  bid: number | string;
  ask: number | string;
  change24h: number;
  spread?: number | string;
  category?: string;
}

interface MarketTickerRibbonProps {
  assets?: MarketAsset[];
  onSelectSymbol?: (symbol: string) => void;
}

const DEFAULT_TICKERS: MarketTickerItem[] = [
  { symbol: 'XAU/USD', bid: 2654.40, ask: 2654.65, change24h: 1.42, spread: 0.25 },
  { symbol: 'EUR/USD', bid: 1.0842, ask: 1.0843, change24h: 0.18, spread: 0.1 },
  { symbol: 'GBP/USD', bid: 1.2985, ask: 1.2987, change24h: -0.24, spread: 0.2 },
  { symbol: 'USD/JPY', bid: 153.28, ask: 153.30, change24h: 0.52, spread: 0.2 },
  { symbol: 'BTC/USD', bid: 67840.0, ask: 67845.0, change24h: 3.15, spread: 5.0 },
  { symbol: 'NAS100', bid: 20380.5, ask: 20382.0, change24h: 0.88, spread: 1.5 },
  { symbol: 'ETH/USD', bid: 2642.10, ask: 2642.50, change24h: 2.14, spread: 0.4 },
  { symbol: 'US30', bid: 42120.0, ask: 42123.0, change24h: 0.45, spread: 3.0 },
];

type ScrollMode = 'oscillate' | 'left' | 'right';
type ScrollSpeed = 'slow' | 'normal';

export const MarketTickerRibbon: React.FC<MarketTickerRibbonProps> = ({
  assets = [],
  onSelectSymbol,
}) => {
  const [localTickers, setLocalTickers] = useState<MarketTickerItem[]>(DEFAULT_TICKERS);
  
  // Animation state: default to 'oscillate' (moving slowly to the left and vice versa)
  const [scrollMode, setScrollMode] = useState<ScrollMode>('oscillate');
  const [speed, setSpeed] = useState<ScrollSpeed>('slow');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Sync with live assets stream whenever assets update
  useEffect(() => {
    if (!assets || assets.length === 0) return;

    setLocalTickers((prev) => {
      const updated = [...prev];
      for (const asset of assets) {
        const idx = updated.findIndex((t) => t.symbol === asset.symbol);
        const digits = asset.digits ?? (asset.category === 'forex' ? (asset.symbol.includes('JPY') ? 2 : 4) : 2);
        const bid = asset.bidPrice ?? (asset.currentPrice ? Number(asset.currentPrice.toFixed(digits)) : 0);
        const ask = asset.askPrice ?? (asset.currentPrice ? Number((asset.currentPrice + (asset.spreadPips ? asset.spreadPips * (asset.category === 'forex' && !asset.symbol.includes('JPY') ? 0.0001 : 0.01) : 0.05)).toFixed(digits)) : 0);

        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            bid,
            ask,
            change24h: Number(asset.change24h?.toFixed(2) ?? updated[idx].change24h),
            spread: asset.spreadPips ? `${asset.spreadPips.toFixed(1)}p` : updated[idx].spread,
            category: asset.category,
          };
        } else {
          updated.push({
            symbol: asset.symbol,
            bid,
            ask,
            change24h: Number(asset.change24h?.toFixed(2) ?? 0),
            spread: asset.spreadPips ? `${asset.spreadPips.toFixed(1)}p` : '0.2p',
            category: asset.category,
          });
        }
      }
      return updated;
    });
  }, [assets]);

  // Subtle micro-tick simulation for realistic liquidity feel when tick stream is quiet
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTickers((prev) =>
        prev.map((item) => {
          const numBid = typeof item.bid === 'number' ? item.bid : parseFloat(item.bid);
          if (isNaN(numBid) || numBid === 0) return item;

          const isForex = item.symbol.includes('/') && !item.symbol.includes('BTC') && !item.symbol.includes('ETH') && !item.symbol.includes('XAU');
          const isJpy = item.symbol.includes('JPY');
          const digits = isForex ? (isJpy ? 2 : 4) : 2;

          const delta = (Math.random() - 0.49) * (numBid * 0.0003);
          const newBid = Number((numBid + delta).toFixed(digits));
          const spreadOffset = isForex ? (isJpy ? 0.02 : 0.00015) : (item.symbol.includes('BTC') ? 4.5 : 0.25);
          const newAsk = Number((newBid + spreadOffset).toFixed(digits));

          return {
            ...item,
            bid: newBid,
            ask: newAsk,
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (val: number | string, symbol: string) => {
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return val;
    if (symbol === 'XAU/USD' || symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('NAS') || symbol.includes('US30')) {
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (symbol.includes('JPY')) {
      return num.toFixed(2);
    }
    if (symbol.includes('/')) {
      return num.toFixed(4);
    }
    return `$${num.toFixed(2)}`;
  };

  // Determine animation class and duration
  const animationClass =
    scrollMode === 'oscillate'
      ? 'animate-ticker-oscillate'
      : scrollMode === 'left'
      ? 'animate-ticker-left'
      : 'animate-ticker-right';

  const duration =
    scrollMode === 'oscillate'
      ? speed === 'slow'
        ? 160
        : 110
      : speed === 'slow'
      ? 140
      : 95;

  const toggleScrollMode = () => {
    if (scrollMode === 'oscillate') setScrollMode('left');
    else if (scrollMode === 'left') setScrollMode('right');
    else setScrollMode('oscillate');
  };

  const modeLabel =
    scrollMode === 'oscillate'
      ? '⇄ Left & Right (Vice Versa)'
      : scrollMode === 'left'
      ? '← Left Continuous'
      : '→ Right Continuous';

  return (
    <div
      id="top-market-ticker-ribbon"
      className="w-full border-b border-[#1E222E] bg-[#0A0D14]/95 backdrop-blur-md overflow-hidden py-1.5 px-2 sm:px-4 shadow-inner select-none transition-all z-30"
    >
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Bridge Status Indicator & Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-blue-400 text-xs font-mono shrink-0 border-r border-[#1E222E] pr-2 sm:pr-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="hidden sm:inline font-bold uppercase tracking-wider text-[11px] text-zinc-300">
            MT5 Bridge
          </span>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#1E222E] transition-colors ml-0.5"
            title={isPaused ? 'Resume slow movement' : 'Pause movement (or hover over prices)'}
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
          >
            {isPaused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3" />}
          </button>

          {/* Direction / Vice Versa Toggle Button */}
          <button
            type="button"
            onClick={toggleScrollMode}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-[#1E222E] transition-colors border border-transparent hover:border-[#2A3040]"
            title={`Movement mode: ${modeLabel}. Click to switch between oscillating (left & vice versa), left-only, or right-only.`}
          >
            {scrollMode === 'oscillate' && <ArrowLeftRight className="h-3 w-3 text-cyan-400" />}
            {scrollMode === 'left' && <ArrowLeft className="h-3 w-3 text-blue-400" />}
            {scrollMode === 'right' && <ArrowRight className="h-3 w-3 text-blue-400" />}
            <span className="hidden xl:inline text-[9px] text-zinc-400">
              {scrollMode === 'oscillate' ? 'Left & Vice Versa' : scrollMode.toUpperCase()}
            </span>
          </button>
        </div>

        {/* Live Asset Prices Animated Ribbon */}
        <div
          className="relative flex-1 overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          {/* Subtle Left and Right edge fade masks */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#0A0D14] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0A0D14] to-transparent z-10 pointer-events-none" />

          {/* Moving Ticker Track */}
          <div
            className={`inline-flex items-center space-x-4 sm:space-x-5 whitespace-nowrap text-xs font-mono will-change-transform ${animationClass}`}
            style={{
              animationDuration: `${duration}s`,
              animationPlayState: isPaused || isHovered ? 'paused' : 'running',
            }}
          >
            {/* 3 identical sets of tickers to ensure seamless coverage and fluid back-and-forth movement */}
            {[0, 1, 2].map((setIdx) => (
              <div key={`ticker-set-${setIdx}`} className="flex items-center space-x-4 sm:space-x-5 shrink-0">
                {localTickers.map((t, itemIdx) => {
                  const isGold = t.symbol === 'XAU/USD';
                  return (
                    <div
                      key={`${setIdx}-${t.symbol}-${itemIdx}`}
                      onClick={() => onSelectSymbol?.(t.symbol)}
                      className={`flex items-center space-x-2 shrink-0 py-0.5 px-2 rounded-md transition-all cursor-pointer hover:bg-[#161B28] hover:scale-105 active:scale-95 ${
                        isGold ? 'bg-amber-500/10 border border-amber-500/25 shadow-sm shadow-amber-500/5' : 'bg-[#11141E]/40 border border-[#1C2130]'
                      }`}
                      title={`Click to analyze ${t.symbol} on Institutional Terminal • Hovering pauses movement`}
                    >
                      <span className={`font-bold flex items-center space-x-1 ${isGold ? 'text-amber-300' : 'text-zinc-200'}`}>
                        {isGold && <span className="text-amber-400 text-[10px]">★</span>}
                        <span>{t.symbol}</span>
                      </span>

                      <span className="text-zinc-400 text-[11px]">
                        B: <strong className="text-zinc-200 font-normal">{formatPrice(t.bid, t.symbol)}</strong>
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        A: <strong className="text-zinc-200 font-normal">{formatPrice(t.ask, t.symbol)}</strong>
                      </span>

                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          t.change24h >= 0
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {t.change24h >= 0 ? '+' : ''}
                        {t.change24h}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hover / Status Hint */}
        {isHovered && (
          <div className="hidden lg:flex items-center text-[10px] font-mono text-zinc-400 shrink-0 border-l border-[#1E222E] pl-2 animate-in fade-in duration-150">
            <span className="text-blue-400 mr-1">⏸ Paused</span> (Click any pair to chart)
          </div>
        )}
      </div>
    </div>
  );
};
