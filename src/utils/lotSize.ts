/**
 * Quantara Institutional Lot Sizing & Risk Management Architecture
 * 
 * Strict Risk Management Directives:
 * - Lot size is dynamically computed between 0.01 and 0.10 lots depending on equity.
 * - Under $50 equity: Fixed minimum 0.01 micro-lot (maximum capital preservation).
 * - Scales smoothly between $50 and $1,000 equity.
 * - Caps strictly at 0.10 lots for equity >= $1,000 (maximum risk ceiling).
 * - Guaranteed: Never less than 0.01, never more than 0.10.
 */

/**
 * Calculates the dynamic institutional lot size based on current equity.
 * Strictly bounded between 0.01 and 0.10 lots.
 */
export function calculateEquityLotSize(equity: number): number {
  const safeEquity = Math.max(0, equity || 0);
  if (safeEquity <= 50) {
    return 0.01;
  }
  // Linear scaling from 0.01 at $50 to 0.10 at $1,000
  // Formula: 0.01 + ((equity - 50) / 950) * 0.09
  const dynamicLot = 0.01 + ((safeEquity - 50) / 950) * 0.09;
  // Strictly clamp between 0.01 and 0.10
  const clampedLot = Math.min(0.10, Math.max(0.01, dynamicLot));
  // Round to 2 decimal places (standard MT5 lot step 0.01)
  return Number(clampedLot.toFixed(2));
}

/**
 * Returns formatted lot size string (e.g. "0.02") guaranteed to be between 0.01 and 0.10.
 */
export function formatPositionLotSize(pos: {
  lotSize?: number;
  size?: number;
  symbol?: string;
  sizeUsd?: number;
}): string {
  if (typeof pos.lotSize === 'number' && pos.lotSize > 0) {
    const bounded = Math.min(0.10, Math.max(0.01, pos.lotSize));
    return bounded.toFixed(2);
  }
  
  // Intelligent fallback estimation for legacy positions without explicit lotSize
  const sym = (pos.symbol || '').toUpperCase();
  const size = pos.size || 0;
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    const lot = size >= 100 ? size / 100 : size;
    return Math.min(0.10, Math.max(0.01, lot)).toFixed(2);
  }
  if (sym.includes('BTC')) {
    return Math.min(0.10, Math.max(0.01, size)).toFixed(2);
  }
  if (sym.includes('USD') || sym.includes('EUR') || sym.includes('GBP') || sym.includes('JPY')) {
    if (size >= 1000) {
      const lot = size / 100000;
      return Math.min(0.10, Math.max(0.01, lot)).toFixed(2);
    }
  }

  return '0.01';
}

export interface LotSizingTier {
  equityRange: string;
  lotSize: number;
  leverageGuidance: string;
  description: string;
}

export const LOT_SIZING_TIERS: LotSizingTier[] = [
  {
    equityRange: '$10 – $50',
    lotSize: 0.01,
    leverageGuidance: '1:100 to 1:500',
    description: 'Micro-Capital Foundation: Strict 0.01 micro-lots to eliminate account blow-up risk.',
  },
  {
    equityRange: '$50 – $150',
    lotSize: 0.01,
    leverageGuidance: '1:100 to 1:500',
    description: 'Capital Cushioning: 0.01 micro-lots while establishing initial win streaks.',
  },
  {
    equityRange: '$150 – $300',
    lotSize: 0.02,
    leverageGuidance: '1:100 to 1:200',
    description: 'First Scaling Step: 0.02 lots safely compounding equity gains.',
  },
  {
    equityRange: '$300 – $500',
    lotSize: 0.04,
    leverageGuidance: '1:100',
    description: 'Growth Acceleration: 0.04 lots with asymmetric 1:2+ R:R trade filtering.',
  },
  {
    equityRange: '$500 – $750',
    lotSize: 0.06,
    leverageGuidance: '1:50 to 1:100',
    description: 'Institutional Expansion: 0.06 lots protecting accumulated profits.',
  },
  {
    equityRange: '$750 – $999',
    lotSize: 0.08,
    leverageGuidance: '1:50 to 1:100',
    description: 'Pre-Ceiling Scaling: 0.08 lots approaching maximum risk threshold.',
  },
  {
    equityRange: '$1,000+',
    lotSize: 0.10,
    leverageGuidance: '1:30 to 1:50',
    description: 'Maximum Risk Ceiling: Strictly capped at 0.10 lots regardless of equity growth.',
  },
];
