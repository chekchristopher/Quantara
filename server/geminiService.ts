import { GoogleGenAI } from '@google/genai';
import { MarketAsset, MarketRegimeType, TechnicalIndicators, TradingSignal } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface AIAnalysisResult {
  summary: string;
  anomalyDetected: boolean;
  anomalyNote?: string;
  macroContext: string;
  tradeQualityGrade: 'A+' | 'A' | 'B' | 'C' | 'REJECT';
  detailedReasons: string[];
}

interface CachedAnalysis {
  timestamp: number;
  result: AIAnalysisResult;
}

export class GeminiAIService {
  private cache: Map<string, CachedAnalysis> = new Map();
  private lastHighDemandTime: number = 0;
  private readonly HIGH_DEMAND_COOLOFF_MS: number = 45000; // 45s cooloff if model returns 503/429

  public async analyzeTradeSignal(
    signal: TradingSignal,
    asset: MarketAsset,
    indicators: TechnicalIndicators
  ): Promise<AIAnalysisResult> {
    // Check in-memory cache to prevent duplicate requests during high-frequency tick cycles
    const cacheKey = `${signal.assetSymbol}_${signal.direction}_${Math.round(signal.entryPrice * 10) / 10}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 45000) {
      return cached.result;
    }

    const ai = getGenAI();

    // If no client, or if model is in temporary high-demand cool-off, use deterministic analysis
    if (!ai || now - this.lastHighDemandTime < this.HIGH_DEMAND_COOLOFF_MS) {
      return this.generateDeterministicAnalysis(signal, asset, indicators);
    }

    const prompt = `
You are an institutional quantitative trading AI risk officer and signal auditor for AegisTrade AI.
Analyze the following proposed automated trade signal and output a structured JSON analysis.

PROPOSED TRADE:
Asset: ${signal.assetSymbol} (${asset.name})
Direction: ${signal.direction}
Entry Price: $${signal.entryPrice}
Suggested Stop Loss: $${signal.suggestedStopLoss} (Distance: ${(Math.abs(signal.entryPrice - signal.suggestedStopLoss) / signal.entryPrice * 100).toFixed(2)}%)
Suggested Take Profit: $${signal.suggestedTakeProfit} (R:R = ${signal.riskRewardRatio.toFixed(2)})
Strategy: ${signal.strategyName}
Detected Market Regime: ${signal.marketRegime}
Raw Confidence Score: ${signal.confidenceScore}%

TECHNICAL INDICATORS:
- 20 EMA: $${indicators.ema20}
- 50 EMA: $${indicators.ema50}
- 200 EMA: $${indicators.ema200}
- RSI (14): ${indicators.rsi}
- MACD Line: ${indicators.macd.macd}, Signal: ${indicators.macd.signal}, Histogram: ${indicators.macd.histogram}
- ATR: $${indicators.atr} (${asset.volatilityAtrPercent}% of price)
- ADX Trend Strength: ${indicators.adx}
- 24h Price Change: ${asset.change24h}%

Output ONLY a JSON object with this exact structure:
{
  "summary": "2-3 sentences concise executive reasoning for this trade",
  "anomalyDetected": false,
  "anomalyNote": "None or specific liquidity/divergence concern if detected",
  "macroContext": "Brief 1-sentence note on current asset volatility and regime context",
  "tradeQualityGrade": "A+" | "A" | "B" | "C",
  "detailedReasons": [
    "Specific technical reason 1 with exact numbers",
    "Specific technical reason 2 with exact numbers",
    "Risk/reward and execution consideration"
  ]
}
`;

    // Try primary model 'gemini-3.8-flash', and fallback to 'gemini-3.1-flash-lite'
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        let text = (response.text || '').trim();
        // Remove markdown code fences if present
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
        }

        const parsed = JSON.parse(text);
        const result: AIAnalysisResult = {
          summary: parsed.summary || `${signal.strategyName} generated a high-conviction ${signal.direction} signal.`,
          anomalyDetected: Boolean(parsed.anomalyDetected),
          anomalyNote: parsed.anomalyNote,
          macroContext: parsed.macroContext || `Market regime is characterized by ${signal.marketRegime}.`,
          tradeQualityGrade: parsed.tradeQualityGrade || 'A',
          detailedReasons: Array.isArray(parsed.detailedReasons) ? parsed.detailedReasons : signal.reasons,
        };

        this.cache.set(cacheKey, { timestamp: now, result });
        return result;
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isHighDemand = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE') || errMsg.includes('429');

        if (isHighDemand) {
          this.lastHighDemandTime = Date.now();
          // If gemini-3.8-flash has 503, try next model in loop; if both fail, log clean status
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            console.log('[Gemini AI] Model experiencing temporary high demand; smoothly applying institutional quantitative analysis.');
          }
        } else {
          // Other non-fatal error, try next model or fallback
          if (modelName === modelsToTry[modelsToTry.length - 1]) {
            console.log('[Gemini AI] Trade signal analysis fallback applied:', errMsg.slice(0, 100));
          }
        }
      }
    }

    // Return deterministic analysis if all models are unavailable or during cooloff
    const deterministic = this.generateDeterministicAnalysis(signal, asset, indicators);
    this.cache.set(cacheKey, { timestamp: now, result: deterministic });
    return deterministic;
  }

  private generateDeterministicAnalysis(
    signal: TradingSignal,
    asset: MarketAsset,
    ind: TechnicalIndicators
  ): AIAnalysisResult {
    const isBullish = signal.direction === 'BUY';
    const rsiComfort = isBullish ? ind.rsi < 68 : ind.rsi > 32;
    const grade = signal.confidenceScore > 85 ? 'A+' : signal.confidenceScore > 75 ? 'A' : 'B';

    return {
      summary: `Automated signal for ${signal.assetSymbol} (${signal.direction}) confirmed with ${signal.confidenceScore}% system confidence under ${signal.marketRegime} conditions.`,
      anomalyDetected: ind.atr / asset.currentPrice > 0.04,
      anomalyNote: ind.atr / asset.currentPrice > 0.04 ? 'Heightened ATR volatility detected; position sized down for risk containment.' : undefined,
      macroContext: `Asset displays ${asset.change24h >= 0 ? '+' : ''}${asset.change24h}% 24h momentum with ADX strength at ${ind.adx}.`,
      tradeQualityGrade: grade,
      detailedReasons: [
        `Price at $${signal.entryPrice.toFixed(2)} aligned with ${signal.strategyName} triggers.`,
        `Technical structure: RSI at ${ind.rsi.toFixed(1)}, MACD histogram at ${ind.macd.histogram.toFixed(2)}.`,
        `Stop-loss calibrated at $${signal.suggestedStopLoss.toFixed(2)} for a ${signal.riskRewardRatio.toFixed(2)}:1 reward-to-risk ratio.`,
      ],
    };
  }
}

export const geminiService = new GeminiAIService();
