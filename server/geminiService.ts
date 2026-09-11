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

export class GeminiAIService {
  public async analyzeTradeSignal(
    signal: TradingSignal,
    asset: MarketAsset,
    indicators: TechnicalIndicators
  ): Promise<AIAnalysisResult> {
    const ai = getGenAI();

    if (!ai) {
      // Deterministic institutional fallback
      return this.generateDeterministicAnalysis(signal, asset, indicators);
    }

    try {
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text.trim());
      return {
        summary: parsed.summary || `${signal.strategyName} generated a high-conviction ${signal.direction} signal.`,
        anomalyDetected: Boolean(parsed.anomalyDetected),
        anomalyNote: parsed.anomalyNote,
        macroContext: parsed.macroContext || `Market regime is characterized by ${signal.marketRegime}.`,
        tradeQualityGrade: parsed.tradeQualityGrade || 'A',
        detailedReasons: Array.isArray(parsed.detailedReasons) ? parsed.detailedReasons : signal.reasons,
      };
    } catch (err) {
      console.warn('Gemini trade analysis fallback triggered:', err);
      return this.generateDeterministicAnalysis(signal, asset, indicators);
    }
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
