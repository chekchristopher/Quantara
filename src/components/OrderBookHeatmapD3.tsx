import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  AlertTriangle,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import { MarketAsset, OrderBookDepthData, OrderBookLevel } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeatmapSnapshot {
  timestamp: number;
  midPrice: number;
  spread: number;
  levels: Array<{
    price: number;
    size: number;
    densityScore: number;
    volatilityImpact: number;
    liquidityTier: 'WALL' | 'HIGH' | 'NORMAL' | 'THIN' | 'GAP';
    isPriceGap: boolean;
    isSignificantWall: boolean;
    side: 'BID' | 'ASK';
  }>;
}

interface OrderBookHeatmapD3Props {
  depthData: OrderBookDepthData;
  asset: MarketAsset;
  onSelectPrice?: (price: number, side: 'BUY' | 'SELL') => void;
  className?: string;
  maxHistorySnapshots?: number;
}

export const OrderBookHeatmapD3: React.FC<OrderBookHeatmapD3Props> = ({
  depthData,
  asset,
  onSelectPrice,
  className = '',
  maxHistorySnapshots = 16,
}) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [history, setHistory] = useState<HeatmapSnapshot[]>([]);
  const [colorTheme, setColorTheme] = useState<'TURBO' | 'CYBER' | 'VOLATILITY'>('CYBER');
  const [showGapsOnly, setShowGapsOnly] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{
    price: number;
    size: number;
    side: 'BID' | 'ASK' | 'MID';
    tier: string;
    isGap: boolean;
    isWall: boolean;
    volatilityImpact: number;
    timestamp: number;
    x: number;
    y: number;
  } | null>(null);

  const digits = asset?.digits ?? (asset?.category === 'forex' ? (asset.symbol.includes('XAU') ? 2 : 4) : 2);
  const isGold = asset?.symbol.toUpperCase().includes('XAU');
  const unitLabel = isGold || asset?.category === 'forex' ? 'Lots' : 'Units';

  // Maintain rolling snapshots of depth data
  useEffect(() => {
    if (!depthData || !depthData.bids.length || !depthData.asks.length) return;

    const currentSnapshot: HeatmapSnapshot = {
      timestamp: depthData.timestamp || Date.now(),
      midPrice: depthData.midPrice,
      spread: depthData.spread,
      levels: [
        ...depthData.asks.map((a) => ({
          price: a.price,
          size: a.size,
          densityScore: a.densityScore || (a.size / (depthData.maxLevelDensity || 10)),
          volatilityImpact: a.volatilityImpact || 0.2,
          liquidityTier: a.liquidityTier || (a.isSignificantWall ? 'WALL' : 'NORMAL'),
          isPriceGap: !!a.isPriceGap,
          isSignificantWall: !!a.isSignificantWall,
          side: 'ASK' as const,
        })),
        ...depthData.bids.map((b) => ({
          price: b.price,
          size: b.size,
          densityScore: b.densityScore || (b.size / (depthData.maxLevelDensity || 10)),
          volatilityImpact: b.volatilityImpact || 0.2,
          liquidityTier: b.liquidityTier || (b.isSignificantWall ? 'WALL' : 'NORMAL'),
          isPriceGap: !!b.isPriceGap,
          isSignificantWall: !!b.isSignificantWall,
          side: 'BID' as const,
        })),
      ],
    };

    setHistory((prev) => {
      // If symbol changed, reset history
      if (prev.length > 0 && depthData.symbol !== asset.symbol) {
        return [currentSnapshot];
      }
      const updated = [...prev, currentSnapshot];
      if (updated.length > maxHistorySnapshots) {
        return updated.slice(updated.length - maxHistorySnapshots);
      }
      return updated;
    });
  }, [depthData.timestamp, depthData.midPrice, asset.symbol]);

  // If initial load and history is small, backfill pseudo-history so the heatmap displays immediately
  useEffect(() => {
    if (history.length <= 1 && depthData.bids.length > 0) {
      const initialSnapshots: HeatmapSnapshot[] = [];
      const now = Date.now();
      for (let i = 12; i >= 1; i--) {
        const timeOffset = now - i * 1800;
        const drift = (Math.sin(i * 0.7) * (depthData.spread * 0.8));
        const midDrift = Number((depthData.midPrice + drift).toFixed(digits));

        initialSnapshots.push({
          timestamp: timeOffset,
          midPrice: midDrift,
          spread: depthData.spread,
          levels: [
            ...depthData.asks.map((a) => {
              const seedVar = Math.sin(a.price * 11 + i);
              const sizeVar = Math.max(0.05, a.size * (0.8 + Math.abs(seedVar) * 0.4));
              const isGap = sizeVar < a.size * 0.45 && !a.isSignificantWall;
              return {
                price: a.price,
                size: Number(sizeVar.toFixed(2)),
                densityScore: Math.min(1, a.densityScore * (0.85 + Math.abs(seedVar) * 0.3)),
                volatilityImpact: a.volatilityImpact,
                liquidityTier: isGap ? 'GAP' : a.liquidityTier,
                isPriceGap: isGap,
                isSignificantWall: a.isSignificantWall,
                side: 'ASK' as const,
              };
            }),
            ...depthData.bids.map((b) => {
              const seedVar = Math.cos(b.price * 13 + i);
              const sizeVar = Math.max(0.05, b.size * (0.8 + Math.abs(seedVar) * 0.4));
              const isGap = sizeVar < b.size * 0.45 && !b.isSignificantWall;
              return {
                price: b.price,
                size: Number(sizeVar.toFixed(2)),
                densityScore: Math.min(1, b.densityScore * (0.85 + Math.abs(seedVar) * 0.3)),
                volatilityImpact: b.volatilityImpact,
                liquidityTier: isGap ? 'GAP' : b.liquidityTier,
                isPriceGap: isGap,
                isSignificantWall: b.isSignificantWall,
                side: 'BID' as const,
              };
            }),
          ],
        });
      }
      setHistory(initialSnapshots);
    }
  }, [depthData.symbol]);

  // All distinct price levels sorted descending (high ask to low bid)
  const allPricesSorted = useMemo(() => {
    const askPrices = depthData.asks.map((a) => a.price);
    const bidPrices = depthData.bids.map((b) => b.price);
    const combined = Array.from(new Set([...askPrices, ...bidPrices]));
    return combined.sort((a, b) => b - a); // descending
  }, [depthData]);

  // Color generator for D3 heatmap cells
  const getCellColor = (
    tier: 'WALL' | 'HIGH' | 'NORMAL' | 'THIN' | 'GAP',
    density: number,
    side: 'BID' | 'ASK',
    isPriceGap: boolean
  ) => {
    if (isPriceGap || tier === 'GAP') {
      return '#27272A'; // Dark slate for price gaps / liquidity voids
    }

    if (colorTheme === 'CYBER') {
      if (tier === 'WALL') return '#F59E0B'; // Incandescent amber wall
      if (side === 'BID') {
        // Emerald depth gradient
        const t = Math.max(0.2, Math.min(1, density));
        return d3.interpolateRgb('#064E3B', '#10B981')(t);
      } else {
        // Rose depth gradient
        const t = Math.max(0.2, Math.min(1, density));
        return d3.interpolateRgb('#881337', '#F43F5E')(t);
      }
    } else if (colorTheme === 'TURBO') {
      // D3 turbo scale normalized
      return d3.interpolateTurbo(Math.max(0.05, Math.min(0.95, density)));
    } else {
      // Volatility theme (Hot = High volatility risk)
      const t = Math.max(0.1, Math.min(0.95, 1 - density));
      return d3.interpolateInferno(t);
    }
  };

  // D3 Rendering Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !allPricesSorted.length || !history.length) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = containerRef.current.clientWidth || 600;
    const height = Math.max(280, allPricesSorted.length * 15 + 45);
    const margin = { top: 25, right: 65, bottom: 25, left: 10 };

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Clean background area in light mode
    if (!isDark) {
      g.append('rect')
        .attr('width', chartWidth)
        .attr('height', chartHeight)
        .attr('fill', '#F8FAFC')
        .attr('rx', 4);
    }

    // X Scale: Snapshot intervals (Time progression from left to right)
    const timeLabels = history.map((_, i) => i);
    const xScale = d3
      .scaleBand<number>()
      .domain(timeLabels)
      .range([0, chartWidth])
      .paddingInner(0.06);

    // Y Scale: Discrete price levels (Descending top to bottom)
    const yScale = d3
      .scaleBand<number>()
      .domain(allPricesSorted)
      .range([0, chartHeight])
      .paddingInner(0.08);

    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();

    // Defs for gradients & patterns (e.g. diagonal stripes for Price Gaps)
    const defs = svg.append('defs');

    // Diagonal hatch pattern for Price Gaps / Liquidity Voids
    const pattern = defs
      .append('pattern')
      .attr('id', 'gap-hatch')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 6)
      .attr('height', 6);

    pattern
      .append('rect')
      .attr('width', 6)
      .attr('height', 6)
      .attr('fill', isDark ? '#18181B' : '#F1F5F9');

    pattern
      .append('path')
      .attr('d', 'M 0,6 l 6,-6 M -1.5,1.5 l 3,-3 M 4.5,7.5 l 3,-3')
      .attr('stroke', '#EF4444')
      .attr('strokeWidth', 1.2)
      .attr('strokeOpacity', 0.6);

    // Glow filter for Institutional Liquidity Walls
    const filter = defs
      .append('filter')
      .attr('id', 'wall-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', 2.5)
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw Heatmap Cells
    history.forEach((snapshot, colIdx) => {
      const x = xScale(colIdx) || 0;

      snapshot.levels.forEach((lvl) => {
        const y = yScale(lvl.price);
        if (y === undefined) return;

        const isFilteredOut = showGapsOnly && !lvl.isPriceGap;
        if (isFilteredOut) return;

        const isWall = lvl.isSignificantWall || lvl.liquidityTier === 'WALL';
        const isGap = lvl.isPriceGap || lvl.liquidityTier === 'GAP';
        const fillColor = getCellColor(lvl.liquidityTier, lvl.densityScore, lvl.side, isGap);

        const rect = g
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('rx', 2)
          .attr('fill', isGap ? 'url(#gap-hatch)' : fillColor)
          .attr('fill-opacity', isWall ? 1.0 : isGap ? 0.95 : 0.85)
          .attr('stroke', isWall ? '#FBBF24' : isGap ? '#7F1D1D' : 'none')
          .attr('stroke-width', isWall ? 1.2 : isGap ? 0.8 : 0)
          .attr('cursor', 'pointer')
          .attr('filter', isWall ? 'url(#wall-glow)' : 'none')
          .on('mouseenter', (event) => {
            const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
            setHoveredCell({
              price: lvl.price,
              size: lvl.size,
              side: lvl.side,
              tier: lvl.liquidityTier,
              isGap,
              isWall,
              volatilityImpact: lvl.volatilityImpact,
              timestamp: snapshot.timestamp,
              x: mouseX,
              y: mouseY,
            });
          })
          .on('mouseleave', () => {
            setHoveredCell(null);
          })
          .on('click', () => {
            if (onSelectPrice) {
              onSelectPrice(lvl.price, lvl.side === 'BID' ? 'BUY' : 'SELL');
            }
          });

        // Add micro indicator dot on significant resting blocks
        if (isWall && cellWidth > 18) {
          g.append('circle')
            .attr('cx', x + cellWidth / 2)
            .attr('cy', y + cellHeight / 2)
            .attr('r', 1.8)
            .attr('fill', '#FFFFFF')
            .attr('pointer-events', 'none');
        }
      });
    });

    // Mid-Price Dynamic Trajectory Line connecting snapshots
    const midLinePoints: [number, number][] = [];
    history.forEach((snapshot, colIdx) => {
      const x = (xScale(colIdx) || 0) + cellWidth / 2;
      // Closest price band to mid
      let closestPrice = allPricesSorted[0];
      let minDiff = Math.abs(allPricesSorted[0] - snapshot.midPrice);
      for (const p of allPricesSorted) {
        const diff = Math.abs(p - snapshot.midPrice);
        if (diff < minDiff) {
          minDiff = diff;
          closestPrice = p;
        }
      }
      const y = (yScale(closestPrice) || 0) + cellHeight / 2;
      midLinePoints.push([x, y]);
    });

    const midLine = d3
      .line()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(d3.curveMonotoneX);

    // Glowing Mid-Price Track
    g.append('path')
      .datum(midLinePoints)
      .attr('fill', 'none')
      .attr('stroke', '#3B82F6')
      .attr('stroke-width', 2.2)
      .attr('stroke-dasharray', '3 2')
      .attr('stroke-linecap', 'round')
      .attr('pointer-events', 'none');

    // Trajectory head pulse on the most recent snapshot
    if (midLinePoints.length > 0) {
      const lastPoint = midLinePoints[midLinePoints.length - 1];
      g.append('circle')
        .attr('cx', lastPoint[0])
        .attr('cy', lastPoint[1])
        .attr('r', 3.5)
        .attr('fill', '#60A5FA')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.2)
        .attr('pointer-events', 'none');
    }

    // Right Y-Axis: Price Labels with wall/gap badges
    const yAxisG = svg
      .append('g')
      .attr('transform', `translate(${width - margin.right + 6},${margin.top})`);

    allPricesSorted.forEach((price) => {
      const y = (yScale(price) || 0) + cellHeight / 2;
      const isCurrentMid = Math.abs(price - depthData.midPrice) < (depthData.spread * 0.7);
      const isAsk = price > depthData.midPrice;
      const isWall =
        price === depthData.topBidWall ||
        price === depthData.topAskWall ||
        depthData.bids.find((b) => b.price === price && b.isSignificantWall) ||
        depthData.asks.find((a) => a.price === price && a.isSignificantWall);

      const labelText = price.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });

      const text = yAxisG
        .append('text')
        .attr('x', 0)
        .attr('y', y + 3)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('cursor', 'pointer')
        .attr(
          'fill',
          isCurrentMid
            ? isDark ? '#60A5FA' : '#2563EB'
            : isWall
            ? isDark ? '#F59E0B' : '#D97706'
            : isAsk
            ? isDark ? '#FDA4AF' : '#BE123C'
            : isDark ? '#6EE7B7' : '#047857'
        )
        .attr('font-weight', isCurrentMid || isWall ? 'bold' : 'normal')
        .text(labelText)
        .on('click', () => {
          if (onSelectPrice) {
            onSelectPrice(price, isAsk ? 'SELL' : 'BUY');
          }
        });

      if (isWall) {
        yAxisG
          .append('circle')
          .attr('cx', -5)
          .attr('cy', y)
          .attr('r', 2)
          .attr('fill', isDark ? '#F59E0B' : '#D97706');
      }
    });

    // Bottom Axis: Time / Update Tick Labels
    const xAxisG = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${height - margin.bottom + 14})`);

    xAxisG
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', isDark ? '#71717A' : '#475569')
      .text('T -15 (Past)');

    xAxisG
      .append('text')
      .attr('x', chartWidth - 30)
      .attr('y', 0)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#10B981')
      .attr('font-weight', 'bold')
      .text('LIVE NOW');
  }, [
    allPricesSorted,
    history,
    colorTheme,
    showGapsOnly,
    depthData.midPrice,
    depthData.spread,
    depthData.topBidWall,
    depthData.topAskWall,
    isDark,
  ]);

  // Statistics calculation for the header
  const stats = useMemo(() => {
    const totalGaps =
      depthData.bids.filter((b) => b.isPriceGap).length +
      depthData.asks.filter((a) => a.isPriceGap).length;

    const totalWalls =
      depthData.bids.filter((b) => b.isSignificantWall).length +
      depthData.asks.filter((a) => a.isSignificantWall).length;

    const avgVolatilityImpact = Math.round(
      ([...depthData.bids, ...depthData.asks].reduce(
        (acc, l) => acc + (l.volatilityImpact || 0),
        0
      ) / (depthData.bids.length + depthData.asks.length || 1)) * 100
    );

    return { totalGaps, totalWalls, avgVolatilityImpact };
  }, [depthData]);

  return (
    <div
      ref={containerRef}
      id="order-book-heatmap-d3-layer"
      className={`relative rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-3 sm:p-4 space-y-3 transition-all ${className}`}
    >
      {/* Top Controls Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#1F1F23]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-tech font-bold uppercase tracking-wider text-white">
                D3 Real-Time Volatility Heatmap
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                LIQUIDITY PROFILE
              </span>
            </div>
            <p className="text-[10px] text-[#8E9299]">
              Concentrated resting blocks vs. fragile price gap zones
            </p>
          </div>
        </div>

        {/* Heatmap Layer Toggles & Color Theme */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Filter Gaps Only */}
          <button
            onClick={() => setShowGapsOnly(!showGapsOnly)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-all flex items-center space-x-1 ${
              showGapsOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-[#141416] text-[#8E9299] border-[#1F1F23] hover:text-white'
            }`}
            title="Isolate low-liquidity slippage air pockets"
          >
            <AlertTriangle className="h-3 w-3 inline text-rose-400" />
            <span>Gaps Only ({stats.totalGaps})</span>
          </button>

          {/* Palette Selector */}
          <div className="flex items-center bg-[#141416] rounded-md border border-[#1F1F23] p-0.5">
            <button
              onClick={() => setColorTheme('CYBER')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                colorTheme === 'CYBER' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'
              }`}
            >
              Cyber
            </button>
            <button
              onClick={() => setColorTheme('TURBO')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                colorTheme === 'TURBO' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'
              }`}
            >
              Turbo
            </button>
            <button
              onClick={() => setColorTheme('VOLATILITY')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                colorTheme === 'VOLATILITY' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'
              }`}
            >
              Thermal
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Heatmap Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="bg-[#141416] p-2 rounded-lg border border-[#1F1F23] flex items-center justify-between">
          <span className="text-[#8E9299] text-[11px] flex items-center gap-1">
            <Shield className="h-3 w-3 text-amber-400" />
            Resting Walls
          </span>
          <span className="text-amber-400 font-bold">{stats.totalWalls} Detected</span>
        </div>

        <div className="bg-[#141416] p-2 rounded-lg border border-[#1F1F23] flex items-center justify-between">
          <span className="text-[#8E9299] text-[11px] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-rose-400" />
            Price Gaps
          </span>
          <span className="text-rose-400 font-bold">{stats.totalGaps} Thin Pockets</span>
        </div>

        <div className="bg-[#141416] p-2 rounded-lg border border-[#1F1F23] flex items-center justify-between">
          <span className="text-[#8E9299] text-[11px] flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-400" />
            Shock Index
          </span>
          <span className="text-blue-400 font-bold">{stats.avgVolatilityImpact}% Volatility</span>
        </div>

        <div className="bg-[#141416] p-2 rounded-lg border border-[#1F1F23] flex items-center justify-between">
          <span className="text-[#8E9299] text-[11px]">Mid Price</span>
          <span className="text-white font-bold">${depthData.midPrice.toFixed(digits)}</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-x-auto scrollbar-none rounded-lg bg-[#09090B] border border-[#1F1F23]">
        <svg ref={svgRef} className="w-full h-auto block select-none" />

        {/* Hover Inspection Crosshair Card */}
        {hoveredCell && (
          <div
            className="absolute z-20 pointer-events-none bg-[#141416]/95 backdrop-blur-md border border-[#27272A] rounded-lg p-2.5 shadow-2xl text-xs font-mono space-y-1"
            style={{
              left: Math.min(hoveredCell.x + 12, (containerRef.current?.clientWidth || 500) - 200),
              top: Math.max(10, hoveredCell.y - 70),
            }}
          >
            <div className="flex items-center justify-between gap-3 text-[11px] text-[#8E9299] border-b border-[#27272A] pb-1">
              <span>{new Date(hoveredCell.timestamp).toLocaleTimeString()}</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                  hoveredCell.side === 'BID'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {hoveredCell.side === 'BID' ? 'Buy Liquidity' : 'Sell Liquidity'}
              </span>
            </div>

            <div className="text-white font-bold text-sm">
              ${hoveredCell.price.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}
            </div>

            <div className="flex items-center justify-between gap-4 text-zinc-300 text-[11px]">
              <span>Depth Size:</span>
              <span className="font-bold text-white">
                {hoveredCell.size.toFixed(2)} {unitLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 text-[10px]">
              <span className="text-[#8E9299]">Concentration:</span>
              <span
                className={`font-bold px-1 rounded ${
                  hoveredCell.isWall
                    ? 'bg-amber-500/20 text-amber-300'
                    : hoveredCell.isGap
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-zinc-300'
                }`}
              >
                {hoveredCell.isWall
                  ? 'INSTITUTIONAL WALL'
                  : hoveredCell.isGap
                  ? 'SLIPPAGE GAP VOID'
                  : hoveredCell.tier}
              </span>
            </div>

            {hoveredCell.isGap && (
              <div className="text-[10px] text-rose-400 font-semibold pt-0.5 border-t border-[#27272A]">
                ⚠️ Warning: Air pocket prone to rapid price slippage.
              </div>
            )}
            {hoveredCell.isWall && (
              <div className="text-[10px] text-amber-400 font-semibold pt-0.5 border-t border-[#27272A]">
                🛡️ High support/resistance liquidity cluster.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Heatmap Legend & Micro Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[10px] text-[#8E9299] border-t border-[#1F1F23]">
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span className="text-white font-medium">Institutional Wall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-[#10B981]" />
            <span>Dense Bid Pool</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs bg-[#F43F5E]" />
            <span>Dense Ask Pool</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-xs border border-rose-500/40 bg-zinc-800" />
            <span className="text-rose-400 font-medium">Price Gap / Void</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-500 border-b border-dashed" />
            <span className="text-blue-400">Mid Price Path</span>
          </div>
        </div>

        <span className="font-mono text-zinc-500">
          Click any level to execute trade directly
        </span>
      </div>
    </div>
  );
};
