import { RiskProfileDetails, RiskProfileType, RiskSettings } from '../types';

export const RISK_PROFILES: Record<RiskProfileType, RiskProfileDetails> = {
  CONSERVATIVE: {
    id: 'CONSERVATIVE',
    name: 'Conservative (Capital Preservation)',
    badge: 'Prop Firm & Funded Safe',
    tagline: 'Drawdown minimization with early zero-risk breakeven locks',
    recommendedAccountSize: '$500 to $50,000+ (or Prop Firm Challenges)',
    maxRiskPerTradePercent: 0.75,
    maxDailyLossPercent: 2.0,
    minRiskRewardRatio: 3.0,
    maxOpenPositions: 2,
    breakevenTriggerR: 0.8,
    partialTakeProfitR: 1.8,
    newsBlackoutMinutes: 30,
    defaultStopLossAtrMultiplier: 1.8,
    trailingStopPercent: 1.2,
    hardCapitalFloorPercent: 92,
    targetUser:
      'Large account holders, prop firm funded traders (FTMO, FundedNext), or risk-averse investors who require steady capital accumulation with near-zero drawdown risk.',
    description:
      'Engineered for maximum capital preservation. Caps risk at 0.75% per trade and requires an ultra-high 1:3.0 Risk-to-Reward ratio before any trade is permitted. Immediately locks Stop-Loss to entry at +0.8R into profit, eliminating risk of loss early.',
    mathematicalSafetyProof:
      'With 0.75% risk per trade, an account would require 133 consecutive losing trades without a single win to deplete capital. Combined with the 2.0% daily circuit breaker, your maximum possible single-day drawdown is mathematically capped at 2.0%.',
    keyBenefits: [
      'Ultra-low single trade risk (max 0.75% of portfolio equity)',
      '1:3.0 minimum Risk-to-Reward ratio (profitable even with a 30% win-rate)',
      'Early breakeven lock at +0.8R converts trades into zero-risk "free trades"',
      '30-minute news blackout window before and after CPI, FOMC, and NFP',
      'Hard capital floor locks engine if portfolio ever dips below 92% of peak equity',
    ],
    safetyGuards: [
      'Daily Drawdown Circuit Breaker: 2.0% max loss/day',
      'Max concurrent positions: Strictly 2 pairs at a time',
      'Spread Protection: No entry if broker spread exceeds 1.8 pips',
      'Macroeconomic blackout: Completely halts during red-folder events',
    ],
  },
  BALANCED: {
    id: 'BALANCED',
    name: 'Balanced (Institutional Compounding)',
    badge: 'Institutional Standard (Recommended)',
    tagline: 'Optimal statistical expectancy and disciplined equity compounding',
    recommendedAccountSize: '$100 to $10,000',
    maxRiskPerTradePercent: 1.5,
    maxDailyLossPercent: 3.5,
    minRiskRewardRatio: 2.5,
    maxOpenPositions: 3,
    breakevenTriggerR: 1.0,
    partialTakeProfitR: 1.8,
    newsBlackoutMinutes: 15,
    defaultStopLossAtrMultiplier: 1.5,
    trailingStopPercent: 1.8,
    hardCapitalFloorPercent: 85,
    targetUser:
      'Everyday day and swing traders seeking steady, reliable equity growth with high mathematical positive expectancy and automated profit-taking.',
    description:
      'The sweet spot of quantitative trading. Balances steady frequency with asymmetric 1:2.5 R:R filtering. Automatically banks 50% profit at +1.8R and trails the remaining half behind a dynamic 1.5x ATR stop to capture major market momentum.',
    mathematicalSafetyProof:
      'At 1:2.5 Risk-to-Reward, a 40% win rate yields high monthly compounding: Expectancy = (0.40 × 2.5) - (0.60 × 1.0) = +0.40R per trade. Even through normal statistical drawdowns, maximum daily risk is capped at 3.5%.',
    keyBenefits: [
      '1.5% fixed fractional risk sized strictly backwards from ATR stop-loss',
      'Asymmetric 1:2.5+ Risk-to-Reward filter rejects mediocre setups',
      'Automatic +1.0R Breakeven lock moves SL to entry + 1 pip',
      'Partial profit taking: Secures 50% at +1.8R and trails the rest',
      '15-minute news blackout before & 20 minutes after major economic news',
    ],
    safetyGuards: [
      'Daily Drawdown Circuit Breaker: 3.5% max daily loss limit',
      'Max concurrent positions: 3 positions across decorrelated assets',
      'Trailing Stop Ratchet: Dynamic ATR trailing prevents profit giveback',
      'Capital Floor Lock: Auto-halts if account dips below 85% of peak equity',
    ],
  },
  MICRO_COMPOUNDING: {
    id: 'MICRO_COMPOUNDING',
    name: 'Micro-Compounding ($10 Velocity Accelerator)',
    badge: '$10 Seed Growth Protocol',
    tagline: 'Fractional 0.01 lot compounding for micro-accounts ($10 → $1,000+)',
    recommendedAccountSize: '$10 to $250 Seed Capital',
    maxRiskPerTradePercent: 2.5,
    maxDailyLossPercent: 5.0,
    minRiskRewardRatio: 2.8,
    maxOpenPositions: 2,
    breakevenTriggerR: 1.0,
    partialTakeProfitR: 2.0,
    newsBlackoutMinutes: 10,
    defaultStopLossAtrMultiplier: 1.4,
    trailingStopPercent: 2.0,
    hardCapitalFloorPercent: 80,
    targetUser:
      'Traders starting with small balances ($10, $25, $50, $100) who want to turn micro-capital into significant wealth without risking catastrophic blowout.',
    description:
      'Engineered specifically to solve the small-account dilemma. Uses fractional 0.01 micro-lot sizing and high-expectancy setups (1:2.8+ R:R) to compound small seed capital into hundreds and thousands of dollars safely.',
    mathematicalSafetyProof:
      'On a $10 seed account, a 2.5% risk limits any single loss to strictly $0.25. One winning trade at 1:2.8 R:R nets +$0.70 (a +7% account gain in a single trade), covering almost 3 losses and propelling the compounding cycle.',
    keyBenefits: [
      'Strict 0.01 micro-lot sizing calculated backwards from equity',
      'High 1:2.8+ minimum Risk-to-Reward guarantees explosive compounding',
      'Instant +1.0R Breakeven lock prevents small wins from turning into losses',
      'Zero-Ruin Architecture: Max single trade loss is $0.25 on a $10 account',
      '100% of realized gains dynamically compound into subsequent trade sizes',
    ],
    safetyGuards: [
      'Daily Circuit Breaker: 5.0% max loss per day ($0.50 on a $10 account)',
      'Max open positions: 2 positions maximum to avoid margin stress',
      'Dynamic Breakeven Lock: Snap to entry as soon as trade is in green',
      'High-impact event buffer: 10-minute blackout around major releases',
    ],
  },
};

export function getProfileSettings(profileId: RiskProfileType): Partial<RiskSettings> {
  const profile = RISK_PROFILES[profileId];
  return {
    activeRiskProfile: profile.id,
    maxRiskPerTradePercent: profile.maxRiskPerTradePercent,
    maxDailyLossPercent: profile.maxDailyLossPercent,
    minRiskRewardRatio: profile.minRiskRewardRatio,
    maxOpenPositions: profile.maxOpenPositions,
    breakevenTriggerR: profile.breakevenTriggerR,
    partialTakeProfitR: profile.partialTakeProfitR,
    partialTakeProfitPercent: 50,
    newsBlackoutMinutes: profile.newsBlackoutMinutes,
    defaultStopLossAtrMultiplier: profile.defaultStopLossAtrMultiplier,
    trailingStopPercent: profile.trailingStopPercent,
    hardCapitalFloorPercent: profile.hardCapitalFloorPercent,
  };
}
