import { MarketAsset, OrderBookDepthData, OrderBookLevel } from '../types';

/**
 * Derives a suitable price step increment between order book depth levels.
 */
export function getOrderBookStep(asset: MarketAsset): number {
  const sym = asset.symbol.toUpperCase();
  const price = asset.currentPrice;

  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return 0.25; // 2.5 pips on Gold
  }
  if (sym.includes('BTC')) {
    return 15.0; // $15 increments
  }
  if (sym.includes('ETH')) {
    return 1.5;
  }
  if (sym.includes('SOL')) {
    return 0.10;
  }
  if (sym.includes('JPY')) {
    return 0.02; // 2 pips on JPY
  }
  if (asset.category === 'forex') {
    return 0.0001; // 1 standard pip on FX
  }
  if (price > 1000) {
    return 1.0;
  }
  if (price > 100) {
    return 0.10;
  }
  if (price > 1) {
    return 0.001;
  }
  return 0.0001;
}

/**
 * Checks if a given price represents a psychological / round-number liquidity wall.
 */
function isRoundNumberLevel(price: number, step: number, asset: MarketAsset): boolean {
  const sym = asset.symbol.toUpperCase();
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    // Round $5 or $10 levels on gold
    const roundedToFive = Math.round(price / 5) * 5;
    return Math.abs(price - roundedToFive) < step * 0.7;
  }
  if (sym.includes('BTC')) {
    // Round $500 or $1000 levels on BTC
    const roundedToFiveHundred = Math.round(price / 500) * 500;
    return Math.abs(price - roundedToFiveHundred) < step * 0.8;
  }
  if (asset.category === 'forex') {
    // Round 50-pip or 100-pip handle (.5000 or .0000)
    const pipsInt = Math.round(price * 10000);
    return pipsInt % 50 === 0 || pipsInt % 25 === 0;
  }
  return false;
}

/**
 * Generates an institutional-grade Level 2 Order Book Depth snapshot
 * for the selected asset based on current prices, spreads, volatility, and order flow momentum.
 */
export function generateOrderBookDepth(
  asset: MarketAsset,
  levelsCount: number = 10
): OrderBookDepthData {
  const isGold = asset.symbol.toUpperCase().includes('XAU');
  const isForex = asset.category === 'forex';
  const digits = asset.digits ?? (isForex ? (isGold ? 2 : 4) : 2);
  const step = getOrderBookStep(asset);

  const bestBid = asset.bidPrice ?? (asset.currentPrice - (isGold ? 0.15 : 0.0001));
  const bestAsk = asset.askPrice ?? (asset.currentPrice + (isGold ? 0.15 : 0.0001));
  const spread = Math.max(step * 0.4, Number((bestAsk - bestBid).toFixed(digits)));
  const midPrice = Number(((bestBid + bestAsk) / 2).toFixed(digits));

  const pipSize = isGold ? 0.10 : (isForex ? (asset.symbol.includes('JPY') ? 0.01 : 0.0001) : 1);
  const spreadPips = asset.spreadPips ?? Number((spread / pipSize).toFixed(1));

  // Market sentiment bias calculation
  let sentimentScore = 0; // -1 (extreme bearish) to +1 (extreme bullish)
  if (asset.change24h > 1.5) sentimentScore += 0.35;
  else if (asset.change24h < -1.5) sentimentScore -= 0.35;
  else sentimentScore += (asset.change24h / 5);

  if (asset.currentRegime.includes('Bullish')) sentimentScore += 0.30;
  if (asset.currentRegime.includes('Bearish')) sentimentScore -= 0.30;

  if (asset.indicators?.rsi) {
    if (asset.indicators.rsi > 60) sentimentScore += 0.20;
    else if (asset.indicators.rsi < 40) sentimentScore -= 0.20;
  }

  // Base liquidity scale per level depending on asset class
  let baseVolume = isGold ? 8.5 : (isForex ? 35.0 : 4.5);
  if (asset.symbol.includes('BTC')) baseVolume = 3.2;
  if (asset.symbol.includes('ETH')) baseVolume = 18.0;

  // Generate Bids (Descending from bestBid)
  const bids: OrderBookLevel[] = [];
  let cumBidTotal = 0;
  let topBidWallPrice: number | undefined;
  let maxBidWallSize = 0;

  for (let i = 0; i < levelsCount; i++) {
    const price = Number((bestBid - i * step).toFixed(digits));
    const isRound = isRoundNumberLevel(price, step, asset);

    // Sine-wave pseudo variability seeded by price for stability during updates
    const seed = Math.sin(price * 137.5 + (asset.lastLiveUpdate || 0) * 0.0001);
    const varFactor = 0.75 + Math.abs(seed) * 0.55;

    // Closeness to mid price curve (liquidity builds up as you move slightly away, then thins)
    const distanceCurve = 1 + Math.sin((i / levelsCount) * Math.PI) * 0.6;
    const roundBoost = isRound ? 2.4 : 1.0;
    const sentimentBoost = 1 + Math.max(-0.4, Math.min(0.4, sentimentScore * 0.5));

    let size = Number((baseVolume * varFactor * distanceCurve * roundBoost * sentimentBoost).toFixed(2));
    if (size <= 0.01) size = 0.05;

    if (isRound && size > maxBidWallSize) {
      maxBidWallSize = size;
      topBidWallPrice = price;
    }

    cumBidTotal += size;
    bids.push({
      price,
      size,
      total: Number(cumBidTotal.toFixed(2)),
      depthPercent: 0, // will compute after total known
      orderCount: Math.max(1, Math.round(size * (isGold ? 3.5 : 1.2) + Math.abs(seed) * 4)),
      isSignificantWall: isRound,
      densityScore: 0,
      volatilityImpact: 0,
      liquidityTier: 'NORMAL',
    });
  }

  // Generate Asks (Ascending from bestAsk)
  const asks: OrderBookLevel[] = [];
  let cumAskTotal = 0;
  let topAskWallPrice: number | undefined;
  let maxAskWallSize = 0;

  for (let i = 0; i < levelsCount; i++) {
    const price = Number((bestAsk + i * step).toFixed(digits));
    const isRound = isRoundNumberLevel(price, step, asset);

    const seed = Math.cos(price * 149.3 + (asset.lastLiveUpdate || 0) * 0.0001);
    const varFactor = 0.75 + Math.abs(seed) * 0.55;

    const distanceCurve = 1 + Math.sin((i / levelsCount) * Math.PI) * 0.6;
    const roundBoost = isRound ? 2.4 : 1.0;
    const sentimentBoost = 1 - Math.max(-0.4, Math.min(0.4, sentimentScore * 0.5));

    let size = Number((baseVolume * varFactor * distanceCurve * roundBoost * sentimentBoost).toFixed(2));
    if (size <= 0.01) size = 0.05;

    if (isRound && size > maxAskWallSize) {
      maxAskWallSize = size;
      topAskWallPrice = price;
    }

    cumAskTotal += size;
    asks.push({
      price,
      size,
      total: Number(cumAskTotal.toFixed(2)),
      depthPercent: 0,
      orderCount: Math.max(1, Math.round(size * (isGold ? 3.5 : 1.2) + Math.abs(seed) * 4)),
      isSignificantWall: isRound,
      densityScore: 0,
      volatilityImpact: 0,
      liquidityTier: 'NORMAL',
    });
  }

  const maxTotal = Math.max(cumBidTotal, cumAskTotal, 1);
  const allSizes = [...bids.map((b) => b.size), ...asks.map((a) => a.size)];
  const maxSingleSize = Math.max(...allSizes, 1);
  const avgSingleSize = allSizes.reduce((acc, v) => acc + v, 0) / (allSizes.length || 1);

  // Volatility pressure calculation based on ATR and 24h change
  const atrPercent = asset.volatilityAtrPercent || 1.2;
  const regimeMultiplier = asset.currentRegime.includes('High Volatility')
    ? 1.5
    : asset.currentRegime.includes('Breakout')
    ? 1.3
    : 1.0;
  const volatilityIndex = Math.min(100, Math.round(atrPercent * 32 * regimeMultiplier));

  let liquidityGapsCount = 0;

  // Compute depth percentage and heatmap density/volatility tiers
  bids.forEach((b, idx) => {
    b.depthPercent = Math.min(100, Math.round((b.total / maxTotal) * 100));
    b.densityScore = Number((b.size / maxSingleSize).toFixed(3));
    
    // Proximity to mid price increases volatility impact
    const proximityWeight = 1 - (idx / levelsCount) * 0.5;
    b.volatilityImpact = Number(
      Math.min(1, (volatilityIndex / 100) * proximityWeight * (1 / (b.densityScore + 0.3))).toFixed(3)
    );

    // Identify thin liquidity / price gap
    const isGap = b.size < avgSingleSize * 0.45 && !b.isSignificantWall;
    b.isPriceGap = isGap;
    if (isGap) liquidityGapsCount++;

    if (b.isSignificantWall || b.densityScore > 0.8) {
      b.liquidityTier = 'WALL';
    } else if (b.densityScore >= 0.55) {
      b.liquidityTier = 'HIGH';
    } else if (isGap || b.densityScore < 0.22) {
      b.liquidityTier = 'GAP';
    } else if (b.densityScore < 0.35) {
      b.liquidityTier = 'THIN';
    } else {
      b.liquidityTier = 'NORMAL';
    }
  });

  asks.forEach((a, idx) => {
    a.depthPercent = Math.min(100, Math.round((a.total / maxTotal) * 100));
    a.densityScore = Number((a.size / maxSingleSize).toFixed(3));
    
    const proximityWeight = 1 - (idx / levelsCount) * 0.5;
    a.volatilityImpact = Number(
      Math.min(1, (volatilityIndex / 100) * proximityWeight * (1 / (a.densityScore + 0.3))).toFixed(3)
    );

    const isGap = a.size < avgSingleSize * 0.45 && !a.isSignificantWall;
    a.isPriceGap = isGap;
    if (isGap) liquidityGapsCount++;

    if (a.isSignificantWall || a.densityScore > 0.8) {
      a.liquidityTier = 'WALL';
    } else if (a.densityScore >= 0.55) {
      a.liquidityTier = 'HIGH';
    } else if (isGap || a.densityScore < 0.22) {
      a.liquidityTier = 'GAP';
    } else if (a.densityScore < 0.35) {
      a.liquidityTier = 'THIN';
    } else {
      a.liquidityTier = 'NORMAL';
    }
  });

  const totalBidVolume = Number(cumBidTotal.toFixed(2));
  const totalAskVolume = Number(cumAskTotal.toFixed(2));
  const sumVol = totalBidVolume + totalAskVolume || 1;
  const bidRatio = Number(((totalBidVolume / sumVol) * 100).toFixed(1));
  const askRatio = Number((100 - bidRatio).toFixed(1));

  let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (bidRatio >= 54.0) sentiment = 'BULLISH';
  else if (bidRatio <= 46.0) sentiment = 'BEARISH';

  return {
    symbol: asset.symbol,
    timestamp: Date.now(),
    bids,
    asks,
    spread,
    spreadPips,
    midPrice,
    totalBidVolume,
    totalAskVolume,
    bidRatio,
    askRatio,
    sentiment,
    imbalanceDelta: Number((totalBidVolume - totalAskVolume).toFixed(2)),
    depthLevelsCount: levelsCount,
    topBidWall: topBidWallPrice,
    topAskWall: topAskWallPrice,
    volatilityIndex,
    liquidityGapsCount,
    maxLevelDensity: maxSingleSize,
  };
}
