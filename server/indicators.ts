import { OHLCV, TechnicalIndicators } from '../src/types';

export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Number((sum / period).toFixed(4));
}

export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (data.length < period) return data[data.length - 1];
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(4));
}

export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const currentGain = diff >= 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

export function calculateMACD(closes: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (closes.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine = fastEMA - slowEMA;

  // Signal line estimation
  const macdHistory: number[] = [];
  for (let i = slowPeriod; i <= closes.length; i++) {
    const subCloses = closes.slice(0, i);
    const f = calculateEMA(subCloses, fastPeriod);
    const s = calculateEMA(subCloses, slowPeriod);
    macdHistory.push(f - s);
  }

  const signalLine = calculateEMA(macdHistory, signalPeriod);
  const histogram = macdLine - signalLine;

  return {
    macd: Number(macdLine.toFixed(4)),
    signal: Number(signalLine.toFixed(4)),
    histogram: Number(histogram.toFixed(4)),
  };
}

export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 0;
    return { upper: last * 1.02, middle: last, lower: last * 0.98 };
  }

  const slice = closes.slice(-period);
  const middle = calculateSMA(slice, period);
  const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Number((middle + multiplier * stdDev).toFixed(4)),
    middle: Number(middle.toFixed(4)),
    lower: Number((middle - multiplier * stdDev).toFixed(4)),
  };
}

export function calculateATR(candles: OHLCV[], period = 14): number {
  if (candles.length < 2) return 1;
  const trueRanges: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  const atr = calculateEMA(trueRanges, period);
  return Number((atr || trueRanges[trueRanges.length - 1] || 1).toFixed(4));
}

export function calculateADX(candles: OHLCV[], period = 14): number {
  if (candles.length < period * 2) return 22; // default neutral
  let plusDM = 0;
  let minusDM = 0;
  let trSum = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    if (!prev) continue;

    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;

    if (upMove > downMove && upMove > 0) plusDM += upMove;
    if (downMove > upMove && downMove > 0) minusDM += downMove;

    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trSum += tr;
  }

  if (trSum === 0) return 20;
  const plusDI = (plusDM / trSum) * 100;
  const minusDI = (minusDM / trSum) * 100;
  const diSum = plusDI + minusDI;
  const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;

  return Number(Math.min(100, Math.max(0, dx)).toFixed(2));
}

export function calculateAllIndicators(candles: OHLCV[]): TechnicalIndicators {
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  return {
    ema20: calculateEMA(closes, 20),
    ema50: calculateEMA(closes, 50),
    ema200: calculateEMA(closes, Math.min(200, closes.length)),
    rsi: calculateRSI(closes, 14),
    macd: calculateMACD(closes),
    bollinger: calculateBollingerBands(closes, 20, 2),
    atr: calculateATR(candles, 14),
    adx: calculateADX(candles, 14),
    volumeSma: calculateSMA(volumes, 20),
  };
}
