import React, { useState, useMemo } from 'react';
import {
  Activity,
  BarChart2,
  ChevronDown,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  PieChart,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { MarketAsset, OrderBookDepthData, OrderBookLevel } from '../types';
import { generateOrderBookDepth } from '../utils/orderBook';
import { OrderBookHeatmapD3 } from './OrderBookHeatmapD3';
import { useTheme } from '../context/ThemeContext';

interface OrderBookDepthVisualizerProps {
  assets: MarketAsset[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onSelectPrice?: (price: number, side: 'BUY' | 'SELL') => void;
  className?: string;
}

export const OrderBookDepthVisualizer: React.FC<OrderBookDepthVisualizerProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  onSelectPrice,
  className = '',
}) => {
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState<'COMBINED' | 'LADDER' | 'CHART' | 'HEATMAP'>('COMBINED');
  const [levelsCount, setLevelsCount] = useState<number>(10);
  const [showHeatmapOverlay, setShowHeatmapOverlay] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Find the selected asset or fallback to Gold / first asset
  const currentAsset = useMemo(() => {
    return assets.find((a) => a.symbol === selectedSymbol) || assets[0];
  }, [assets, selectedSymbol]);

  // Compute live Order Book Depth snapshot based on current asset state & momentum
  const depthData: OrderBookDepthData = useMemo(() => {
    if (!currentAsset) {
      return {
        symbol: selectedSymbol,
        timestamp: Date.now(),
        bids: [],
        asks: [],
        spread: 0,
        spreadPips: 0,
        midPrice: 0,
        totalBidVolume: 0,
        totalAskVolume: 0,
        bidRatio: 50,
        askRatio: 50,
        sentiment: 'NEUTRAL',
        imbalanceDelta: 0,
        depthLevelsCount: levelsCount,
      };
    }
    return generateOrderBookDepth(currentAsset, levelsCount);
  }, [currentAsset, levelsCount, currentAsset?.currentPrice, currentAsset?.lastLiveUpdate]);

  // Prepare dual-sided cumulative depth data for Recharts AreaChart
  const depthChartData = useMemo(() => {
    const dataPoints: Array<{
      price: number;
      bidCumulative?: number;
      askCumulative?: number;
      size: number;
      side: 'BID' | 'ASK';
    }> = [];

    // Bids sorted ascending by price (from deepest low to best bid near mid)
    const sortedBids = [...depthData.bids].sort((a, b) => a.price - b.price);
    sortedBids.forEach((b) => {
      dataPoints.push({
        price: b.price,
        bidCumulative: b.total,
        size: b.size,
        side: 'BID',
      });
    });

    // Mid point anchor
    dataPoints.push({
      price: depthData.midPrice,
      bidCumulative: depthData.totalBidVolume,
      askCumulative: 0,
      size: 0,
      side: 'BID',
    });

    // Asks sorted ascending by price (from best ask near mid out to deepest high)
    const sortedAsks = [...depthData.asks].sort((a, b) => a.price - b.price);
    sortedAsks.forEach((a) => {
      dataPoints.push({
        price: a.price,
        askCumulative: a.total,
        size: a.size,
        side: 'ASK',
      });
    });

    return dataPoints;
  }, [depthData]);

  const digits = currentAsset?.digits ?? (currentAsset?.category === 'forex' ? (currentAsset.symbol.includes('XAU') ? 2 : 4) : 2);
  const isGold = currentAsset?.symbol.toUpperCase().includes('XAU');
  const unitLabel = isGold || currentAsset?.category === 'forex' ? 'Lots' : 'Units';

  const formatPrice = (p: number) => {
    return p.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  };

  return (
    <div
      id="order-book-depth-visualizer"
      className={`rounded-xl border border-[#1F1F23] bg-[#141416] p-4 sm:p-5 transition-all shadow-xl space-y-4 ${className}`}
    >
      {/* Top Header: Title, Asset Selector & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-tech font-bold uppercase tracking-wider text-white">
                Market Order Book & Depth
              </h3>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE TICK FEED</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8E9299]">
              Real-time bid/ask liquidity distribution & order flow imbalance
            </p>
          </div>
        </div>

        {/* Controls: Asset Switcher, View Modes & Level count */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Asset Selector */}
          <div className="relative">
            <select
              value={selectedSymbol}
              onChange={(e) => onSelectSymbol(e.target.value)}
              className="appearance-none bg-[#0E0E11] text-xs font-mono font-bold text-white border border-[#1F1F23] rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {assets.map((a) => (
                <option key={a.symbol} value={a.symbol}>
                  {a.symbol} ({a.category === 'forex' ? 'FX' : 'Crypto'})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8E9299] pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0E0E11] rounded-lg border border-[#1F1F23] p-0.5">
            <button
              onClick={() => setViewMode('COMBINED')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'COMBINED'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="Combined Depth Curve & Ladder"
            >
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('LADDER')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'LADDER'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="Order Book Ladder"
            >
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Ladder</span>
            </button>
            <button
              onClick={() => setViewMode('CHART')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'CHART'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="Liquidity Depth Chart"
            >
              <BarChart2 className="h-3 w-3" />
              <span className="hidden sm:inline">Depth</span>
            </button>
            <button
              onClick={() => setViewMode('HEATMAP')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center space-x-1 ${
                viewMode === 'HEATMAP'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-[#8E9299] hover:text-white'
              }`}
              title="D3 Real-Time Volatility Heatmap Layer"
            >
              <Flame className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Heatmap</span>
            </button>
          </div>

          {/* Heatmap Layer Toggle */}
          {viewMode !== 'HEATMAP' && (
            <button
              onClick={() => setShowHeatmapOverlay(!showHeatmapOverlay)}
              className={`px-2 py-1 text-[11px] font-mono rounded-lg border transition-all flex items-center space-x-1.5 ${
                showHeatmapOverlay
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-[#0E0E11] border-[#1F1F23] text-[#8E9299] hover:text-white'
              }`}
              title="Toggle Heatmap Layer"
            >
              <Flame className="h-3 w-3 text-amber-400" />
              <span className="hidden md:inline">Heatmap Layer:</span>
              <span className="font-bold">{showHeatmapOverlay ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Levels selector */}
          <select
            value={levelsCount}
            onChange={(e) => setLevelsCount(Number(e.target.value))}
            className="bg-[#0E0E11] text-[11px] font-mono text-[#8E9299] border border-[#1F1F23] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
            title="Number of depth levels"
          >
            <option value={8}>8 Levels</option>
            <option value={10}>10 Levels</option>
            <option value={15}>15 Levels</option>
          </select>
        </div>
      </div>

      {/* Sentiment & Liquidity Imbalance Gauge Bar */}
      <div className="bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          {/* Bid Side */}
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 inline" />
              Bids {depthData.bidRatio}%
            </span>
            <span className="text-[#8E9299] text-[11px]">
              ({depthData.totalBidVolume.toFixed(1)} {unitLabel})
            </span>
          </div>

          {/* Center Imbalance Tag */}
          <div className="flex items-center space-x-1.5">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                depthData.sentiment === 'BULLISH'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : depthData.sentiment === 'BEARISH'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              }`}
            >
              {depthData.sentiment === 'BULLISH' && '▲ Bullish Flow Dominance'}
              {depthData.sentiment === 'BEARISH' && '▼ Bearish Pressure'}
              {depthData.sentiment === 'NEUTRAL' && '◆ Balanced Liquidity'}
            </span>
            <span className="text-[10px] text-[#8E9299] font-mono hidden md:inline">
              Net Delta: {depthData.imbalanceDelta >= 0 ? '+' : ''}
              {depthData.imbalanceDelta.toFixed(1)} {unitLabel}
            </span>
          </div>

          {/* Ask Side */}
          <div className="flex items-center space-x-2">
            <span className="text-[#8E9299] text-[11px]">
              ({depthData.totalAskVolume.toFixed(1)} {unitLabel})
            </span>
            <span className="text-rose-400 font-bold flex items-center gap-1">
              Asks {depthData.askRatio}%
              <TrendingDown className="h-3.5 w-3.5 inline" />
            </span>
          </div>
        </div>

        {/* Dual Progress Meter */}
        <div className="h-2 w-full bg-[#1F1F23] rounded-full overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${depthData.bidRatio}%` }}
          />
          <div
            className="h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-300"
            style={{ width: `${depthData.askRatio}%` }}
          />
        </div>

        {/* Significant Institutional Wall Indicators */}
        {(depthData.topBidWall || depthData.topAskWall) && (
          <div className="flex items-center justify-between text-[11px] text-[#8E9299] pt-1">
            {depthData.topBidWall ? (
              <span className="flex items-center space-x-1 text-emerald-400/90 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Support Wall: ${formatPrice(depthData.topBidWall)}</span>
              </span>
            ) : <span />}
            {depthData.topAskWall && (
              <span className="flex items-center space-x-1 text-rose-400/90 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Resistance Wall: ${formatPrice(depthData.topAskWall)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Visual Content based on View Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Top: Cumulative Depth Chart */}
        {(viewMode === 'CHART' || viewMode === 'COMBINED') && (
          <div
            className={`${
              viewMode === 'COMBINED' ? 'lg:col-span-6' : 'lg:col-span-12'
            } bg-[#0E0E11] rounded-lg border border-[#1F1F23] p-3.5 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between text-xs text-[#8E9299] mb-2 font-mono">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5 text-blue-400" />
                Cumulative Liquidity Curve
              </span>
              <span>Mid: ${formatPrice(depthData.midPrice)}</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={depthChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="bidDepthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="askDepthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="price"
                    tickFormatter={(val) => Number(val).toFixed(digits > 2 ? 4 : 2)}
                    stroke={isDark ? '#52525B' : '#CBD5E1'}
                    tick={{ fill: isDark ? '#71717A' : '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <YAxis
                    stroke={isDark ? '#52525B' : '#CBD5E1'}
                    tick={{ fill: isDark ? '#71717A' : '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                  />

                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      const isBid = item.side === 'BID';
                      return (
                        <div className="bg-[#141416] p-2.5 rounded-lg border border-[#1F1F23] text-xs font-mono space-y-1 shadow-2xl">
                          <div className="flex items-center justify-between text-[11px] text-[#8E9299]">
                            <span>{isBid ? 'Buy Liquidity' : 'Sell Liquidity'}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-bold ${
                                isBid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {item.side}
                            </span>
                          </div>
                          <div className="text-white font-bold">
                            Price: ${formatPrice(item.price)}
                          </div>
                          <div className="text-zinc-300">
                            Cumulative: {(item.bidCumulative || item.askCumulative || 0).toFixed(2)} {unitLabel}
                          </div>
                          {item.size > 0 && (
                            <div className="text-[11px] text-zinc-400">
                              Level Size: {item.size.toFixed(2)} {unitLabel}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <ReferenceLine
                    x={depthData.midPrice}
                    stroke="#3B82F6"
                    strokeDasharray="3 3"
                    label={{
                      value: 'Mid Price',
                      fill: '#60A5FA',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />

                  {/* Bids Area (Green) */}
                  <Area
                    type="stepAfter"
                    dataKey="bidCumulative"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#bidDepthGrad)"
                    isAnimationActive={false}
                  />

                  {/* Asks Area (Red) */}
                  <Area
                    type="stepBefore"
                    dataKey="askCumulative"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#askDepthGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8E9299] pt-2 border-t border-[#1F1F23]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" />
                <span>Cumulative Bid Depth</span>
              </span>
              <span className="font-mono text-zinc-400">
                Spread: {depthData.spreadPips} pips (${depthData.spread.toFixed(digits)})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-rose-500" />
                <span>Cumulative Ask Depth</span>
              </span>
            </div>
          </div>
        )}

        {/* Right / Ladder: Level-2 Order Book Depth Ladder */}
        {(viewMode === 'LADDER' || viewMode === 'COMBINED') && (
          <div
            className={`${
              viewMode === 'COMBINED' ? 'lg:col-span-6' : 'lg:col-span-12'
            } bg-[#0E0E11] rounded-lg border border-[#1F1F23] p-3.5 flex flex-col justify-between`}
          >
            {/* Ladder Header */}
            <div className="grid grid-cols-3 text-[11px] font-mono font-semibold text-[#8E9299] pb-2 border-b border-[#1F1F23]">
              <span>Price ($)</span>
              <span className="text-right">Size ({unitLabel})</span>
              <span className="text-right">Total ({unitLabel})</span>
            </div>

            {/* Asks Table (Inverted: highest price on top, lowest ask near mid at bottom) */}
            <div className="space-y-0.5 py-1.5 max-h-[135px] overflow-y-auto scrollbar-none flex flex-col-reverse">
              {depthData.asks.slice(0, levelsCount).map((ask, idx) => (
                <div
                  key={`ask-${idx}`}
                  onClick={() => onSelectPrice && onSelectPrice(ask.price, 'SELL')}
                  className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded transition-all hover:bg-rose-950/30 cursor-pointer group"
                  title={`Click to fill sell order @ $${formatPrice(ask.price)}`}
                >
                  {/* Depth Background Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded-r pointer-events-none transition-all duration-300"
                    style={{ width: `${ask.depthPercent}%` }}
                  />

                  {/* Price */}
                  <span className="relative z-10 text-rose-400 font-semibold flex items-center gap-1">
                    {formatPrice(ask.price)}
                    {ask.isSignificantWall && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                        WALL
                      </span>
                    )}
                  </span>

                  {/* Size */}
                  <span className="relative z-10 text-right text-zinc-300">
                    {ask.size.toFixed(2)}
                  </span>

                  {/* Cumulative Total */}
                  <span className="relative z-10 text-right text-[#8E9299] group-hover:text-white">
                    {ask.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Center Mid Price & Spread Ribbon */}
            <div className="my-1.5 py-1.5 px-3 rounded-md bg-[#141416] border border-[#1F1F23] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-[#8E9299] uppercase">Mid Market</span>
                <span className="text-white font-bold text-sm">
                  ${formatPrice(depthData.midPrice)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    currentAsset?.change24h && currentAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentAsset?.change24h && currentAsset.change24h >= 0 ? '+' : ''}
                  {currentAsset?.change24h || 0}%
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-[#8E9299]">
                <span>Spread:</span>
                <span className="text-amber-400 font-bold">
                  {depthData.spreadPips} pips
                </span>
                <span className="text-[10px] text-zinc-500">
                  (${depthData.spread.toFixed(digits)})
                </span>
              </div>
            </div>

            {/* Bids Table (Highest bid near mid at top, decreasing prices downward) */}
            <div className="space-y-0.5 py-1.5 max-h-[135px] overflow-y-auto scrollbar-none">
              {depthData.bids.slice(0, levelsCount).map((bid, idx) => (
                <div
                  key={`bid-${idx}`}
                  onClick={() => onSelectPrice && onSelectPrice(bid.price, 'BUY')}
                  className="relative grid grid-cols-3 text-xs font-mono py-1 px-1.5 rounded transition-all hover:bg-emerald-950/30 cursor-pointer group"
                  title={`Click to fill buy order @ $${formatPrice(bid.price)}`}
                >
                  {/* Depth Background Bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded-r pointer-events-none transition-all duration-300"
                    style={{ width: `${bid.depthPercent}%` }}
                  />

                  {/* Price */}
                  <span className="relative z-10 text-emerald-400 font-semibold flex items-center gap-1">
                    {formatPrice(bid.price)}
                    {bid.isSignificantWall && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        WALL
                      </span>
                    )}
                  </span>

                  {/* Size */}
                  <span className="relative z-10 text-right text-zinc-300">
                    {bid.size.toFixed(2)}
                  </span>

                  {/* Cumulative Total */}
                  <span className="relative z-10 text-right text-[#8E9299] group-hover:text-white">
                    {bid.total.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Micro Helper Note */}
            <div className="pt-2 border-t border-[#1F1F23] flex items-center justify-between text-[10px] text-[#8E9299]">
              <span>Click any price level to pre-fill order ticket</span>
              <span className="font-mono text-zinc-400">
                {levelsCount * 2} Active Liquidity Brackets
              </span>
            </div>
          </div>
        )}

        {/* Dedicated Full D3 Volatility Heatmap View */}
        {viewMode === 'HEATMAP' && (
          <div className="lg:col-span-12">
            <OrderBookHeatmapD3
              depthData={depthData}
              asset={currentAsset}
              onSelectPrice={onSelectPrice}
            />
          </div>
        )}
      </div>

      {/* Real-Time Volatility Heatmap Layer Overlay (When in Split/Ladder/Depth views) */}
      {viewMode !== 'HEATMAP' && showHeatmapOverlay && (
        <OrderBookHeatmapD3
          depthData={depthData}
          asset={currentAsset}
          onSelectPrice={onSelectPrice}
        />
      )}
    </div>
  );
};
