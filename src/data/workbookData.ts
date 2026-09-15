export interface SectionCallout {
  type: 'warning' | 'info' | 'success' | 'danger';
  title: string;
  text: string;
}

export interface SectionTable {
  headers: string[];
  rows: string[][];
}

export interface ContentSection {
  heading: string;
  paragraphs: string[];
  codeOrFormula?: string;
  tips?: string[];
  callout?: SectionCallout;
  table?: SectionTable;
}

export interface ChapterQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WorkbookChapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  readTime: string;
  category: 'FOUNDATIONS' | 'BROKERS & MT5' | 'COMPOUNDING' | 'STRATEGIES' | 'RISK MANAGEMENT' | 'DIAGNOSTICS' | 'ROUTINES';
  summary: string;
  actionTab?: string;
  actionLabel?: string;
  keyTakeaways: string[];
  sections: ContentSection[];
  quiz: ChapterQuiz;
}

export const WORKBOOK_CHAPTERS: WorkbookChapter[] = [
  {
    id: 'ch-1-orientation',
    number: 1,
    title: 'Orientation & Core Platform Architecture',
    subtitle: 'Understanding the Meta-Engine, real-time tick processor, and state loop',
    readTime: '6 min read',
    category: 'FOUNDATIONS',
    summary: 'Master the high-level architecture of Quantara, understand the sub-second execution engine, and learn how client telemetry coordinates with backend algorithmic models.',
    actionTab: 'dashboard',
    actionLabel: 'Explore Live Dashboard',
    keyTakeaways: [
      'Quantara operates a continuous 1,500ms algorithmic tick loop evaluating multi-asset market data.',
      'The architecture cleanly decouples the risk evaluation layer from order dispatch for 100% deterministic safety.',
      'Always observe market feeds in Paper or Demo mode before granting execution rights to real accounts.',
    ],
    sections: [
      {
        heading: '1. The Vision of Quantara',
        paragraphs: [
          'Quantara is an institutional-grade quantitative trading platform designed to bridge algorithmic execution models directly into MetaTrader 5 (MT5) terminals. Unlike manual discretionary trading—which is plagued by emotional panic, hesitation, and over-leveraging—Quantara enforces strictly quantified mathematical rules across every single tick.',
          'The core thesis is simple: market movements are non-random fluctuations governed by volatility regimes, liquidity imbalances, and cyclical momentum. By detecting the active market regime in real time, Quantara selects the optimal algorithmic model to capture alpha while strictly curtailing maximum downside exposure.',
        ],
        callout: {
          type: 'info',
          title: 'Core Philosophy: Capital Preservation Precedes Capital Growth',
          text: 'The first goal of quantitative trading is not to make 1,000% in a week, but to eliminate catastrophic drawdowns. When risk is mathematically bounded, compound interest produces sustainable wealth.',
        },
      },
      {
        heading: '2. The System Architecture & Sub-Second Tick Loop',
        paragraphs: [
          'The engine runs a high-precision tick loop every 1,500 milliseconds. During each cycle, the following four phases execute sequentially:',
          'Phase 1: Ingestion & Regime Classification — Real-time price ticks from XAU/USD (Gold), EUR/USD, GBP/USD, USD/JPY, and BTC/USD are parsed through exponential moving averages (EMA), Relative Strength Index (RSI), Average True Range (ATR), and Bollinger Band widths.',
          'Phase 2: Alpha Generation — Active algorithmic strategies generate buy/sell signals with calculated entry, stop loss (SL), and take profit (TP) levels.',
          'Phase 3: The Risk Firewall — Before any order can touch a broker, it must pass 8 independent risk filters (Max Drawdown, Daily Loss Limit, Spread Cap, Margin Utilization, and Slippage Tolerance).',
          'Phase 4: Execution & Position Telemetry — Orders are routed to the connected MT5 terminal or paper-trading simulated account with millisecond time-stamping.',
        ],
        table: {
          headers: ['Cycle Stage', 'Latency Budget', 'Deterministic Action', 'Failure Mode'],
          rows: [
            ['Tick Feed Ingestion', '< 5ms', 'Normalizes OHLCV & bid/ask spreads', 'Hold previous tick state'],
            ['Regime Classification', '< 15ms', 'Evaluates ADX, ATR, and volume surges', 'Fallback to Neutral/Choppy'],
            ['Risk Firewall Audit', '< 2ms', 'Validates 8 strict risk checks', 'Hard Reject with Audit Log'],
            ['Order Dispatch', '< 25ms', 'Transmits order to MT5 bridge', 'Abort execution on timeout'],
          ],
        },
      },
      {
        heading: '3. Navigating the Interface',
        paragraphs: [
          'The Quantara interface is organized into specialized workspaces. The top navigation bar houses system-wide kill switches, environment toggles (Paper vs. Live), and real-time UTC clocks. The central tabs allow you to switch seamlessly between the Overview Dashboard, $10 Wealth Engine, Strategy Lab, MT5 Broker Bridge, Risk Management, and System Telemetry.',
        ],
      },
    ],
    quiz: {
      question: 'What is the absolute highest priority in the Quantara algorithmic architecture?',
      options: [
        'Maximizing trade frequency to generate maximum commissions',
        'Capital preservation and deterministic risk bounds before profit taking',
        'Executing trades manually whenever emotional conviction is high',
        'Overriding stop loss limits during fast-moving market dips',
      ],
      correctIndex: 1,
      explanation: 'Quantara enforces that capital preservation strictly precedes capital growth. Every trade passes an immutable risk firewall before order execution.',
    },
  },
  {
    id: 'ch-2-broker-mt5',
    number: 2,
    title: 'MetaTrader 5 Connection & The Demo Proving Ground',
    subtitle: 'Connecting broker servers, verifying execution ping, and the Demo-First workflow',
    readTime: '8 min read',
    category: 'BROKERS & MT5',
    summary: 'Learn how to connect your MetaTrader 5 account from brokers like Exness, IC Markets, Pepperstone, or FTMO, and why running a Demo test is mandatory before deploying real funds.',
    actionTab: 'brokers',
    actionLabel: 'Connect MT5 Account',
    keyTakeaways: [
      'Always connect a Demo Account (e.g. Exness-MT5Trial9) before connecting live capital.',
      'Verify that ping latency is under 50ms and slippage is below 0.3 pips before activating autonomous trading.',
      'The software takes full control over trade placement, stop losses, and trailing exits once authorized.',
    ],
    sections: [
      {
        heading: '1. Why MetaTrader 5 (MT5)?',
        paragraphs: [
          'MetaTrader 5 is the global institutional standard for electronic forex, index, and precious metal CFDs. It provides true raw-spread Direct Market Access (DMA), sub-millisecond execution matching, and native support for micro-lot trading (0.01 lots = 1,000 currency units or 1 ounce of Gold).',
          'Quantara connects directly to your MT5 account via low-latency terminal APIs. You retain 100% control of your broker account, deposits, and withdrawals at all times.',
        ],
      },
      {
        heading: '2. The Mandatory Demo-First Proving Workflow',
        paragraphs: [
          'The single most important rule for any algorithmic trader is: Never deploy a new algorithmic configuration directly to a live account without a 7-day or 50-trade Demo verification run.',
          'A Demo account uses the exact same live tick stream, broker liquidity pool, and real-time execution speeds as a live account, but uses simulated balance. By connecting a Demo account first, you can:',
          '• Verify that order execution latency is optimal (typically 10ms - 40ms).',
          '• Confirm that dynamic lot calculations fit your intended risk tolerance.',
          '• Experience market volatility without stress or psychological anxiety.',
          '• Confirm that daily loss limits and trailing stops execute flawlessly.',
        ],
        callout: {
          type: 'warning',
          title: 'Institutional Mandate: The 50-Trade Proving Rule',
          text: 'Allow Quantara to complete at least 25 to 50 automated trades on your Demo account. When you observe consistent positive expectancy and zero risk breaches, switch to your Real account with complete confidence.',
        },
      },
      {
        heading: '3. Step-by-Step Connection Guide',
        paragraphs: [
          'Step 1: Open the "MT5 & Broker Login" tab from the navigation bar.',
          'Step 2: Select your broker preset (Exness, IC Markets, Pepperstone, XM, FTMO, or Custom MT5 Server).',
          'Step 3: Choose "DEMO Testing Run" (recommended) or "REAL Live Account".',
          'Step 4: Input your MT5 Account Number and Trading Password. Your credentials remain securely stored in your local container and are never shared.',
          'Step 5: Select your leverage (1:500 recommended for standard ECN accounts) and input your initial capital.',
          'Step 6: Toggle "Authorize Autonomous Trade Execution" and click "Connect MT5 Terminal".',
        ],
        table: {
          headers: ['Broker', 'Recommended Server', 'Typical Gold Spread', 'Recommended Leverage'],
          rows: [
            ['Exness', 'Exness-MT5Trial9 (Demo) / Exness-MT5Real', '1.0 - 1.5 pips', '1:500 or 1:2000'],
            ['IC Markets', 'ICMarketsSC-Demo01 / ICMarketsSC-Live', '0.8 - 1.2 pips', '1:500'],
            ['Pepperstone', 'Pepperstone-Demo01 / Pepperstone-Live', '1.0 - 1.4 pips', '1:400'],
            ['FTMO Prop', 'FTMO-Demo / FTMO-Server', '1.2 - 1.8 pips', '1:100'],
          ],
        },
      },
    ],
    quiz: {
      question: 'Why does Quantara strongly encourage connecting a Demo account first?',
      options: [
        'Demo accounts generate higher leverage bonuses from the platform',
        'It allows verifying execution speed, slippage, and algorithmic profitability with zero risk to personal capital',
        'Real accounts cannot trade Gold (XAU/USD)',
        'Demo accounts never experience market spreads or fees',
      ],
      correctIndex: 1,
      explanation: 'Running a Demo account proves that the broker ping, order execution, and risk settings work properly in real market conditions without risking your hard-earned funds.',
    },
  },
  {
    id: 'ch-3-takeover-compounding',
    number: 3,
    title: 'Autonomous Takeover & The $10 Compounding Engine',
    subtitle: 'Micro-capital multiplication, lot-sizing mechanics, and the psychology of automation',
    readTime: '9 min read',
    category: 'COMPOUNDING',
    summary: 'Discover how the $10 Micro-Account Compounding Engine turns modest starting capital into substantial balances using disciplined fractional lot sizing and exponential reinvestment.',
    actionTab: 'compounding',
    actionLabel: 'Launch $10 Wealth Engine',
    keyTakeaways: [
      'Autonomous Takeover eliminates emotional execution errors by managing entries, stops, and targets 24/5.',
      'Starting with $10 or $50 requires strict 0.01 micro-lot sizing to prevent margin stop-outs.',
      'Compounding 2.5% daily over 100 trading sessions mathematically turns $10 into over $118.',
    ],
    sections: [
      {
        heading: '1. What is "Autonomous Software Takeover"?',
        paragraphs: [
          'Autonomous Software Takeover is the mode where Quantara actively places and manages orders on your connected MT5 terminal without requiring you to sit in front of charts all day.',
          'When enabled, the engine continuously computes technical indicators, detects breakout zones, calculates the exact lot size permitted by your risk settings, issues market orders, and dynamically shifts stop losses to break-even once a position is in profit.',
        ],
        callout: {
          type: 'success',
          title: 'Fail-Safe Guarantee',
          text: 'You can disable Autonomous Takeover at any millisecond with a single click, or press the Emergency Kill Switch to immediately close all open trades.',
        },
      },
      {
        heading: '2. The Mathematical Power of $10 Micro-Compounding',
        paragraphs: [
          'Many aspiring traders believe you need $10,000 to trade profitably. This is a myth. By utilizing 1:500 leverage and 0.01 micro lots (the minimum contract size), an initial capital of $10 can be safely traded with strict risk controls.',
          'Consider the compounding formula: A = P * (1 + r)^n, where P = $10, r = average daily return (e.g. 2.5%), and n = number of trading days. Over time, the exponential curve takes over:',
        ],
        table: {
          headers: ['Stage / Days', 'Starting Capital', 'Target Daily %', 'Projected Equity', 'Lot Size Policy'],
          rows: [
            ['Day 1 - 20 (Foundational)', '$10.00', '2.5% / day', '$16.38', 'Fixed 0.01 micro lots'],
            ['Day 21 - 50 (Acceleration)', '$16.38', '2.5% / day', '$34.37', '0.01 - 0.02 micro lots'],
            ['Day 51 - 100 (Expansion)', '$34.37', '2.5% / day', '$118.14', '0.03 - 0.05 micro lots'],
            ['Day 101 - 180 (Scale)', '$118.14', '2.0% / day', '$578.43', '0.10 - 0.25 mini lots'],
            ['Day 181 - 250 (Institutional)', '$578.43', '1.8% / day', '$1,992.50', '0.50 - 1.00 standard lots'],
          ],
        },
      },
      {
        heading: '3. Gold (XAU/USD) Specific Sizing Rules',
        paragraphs: [
          'Gold is the highest-liquidity instrument in modern retail trading, but it has high pip volatility. A $1 move in spot gold equals 100 pips. On a standard 1.0 lot, a $1 move equals $100. On a 0.01 micro lot, a $1 move equals $1.00.',
          'For a $10 to $50 account trading Gold:',
          '• Never open more than ONE 0.01 position at any time.',
          '• Set your maximum stop loss to $2.50 (25 pips on Gold), representing a controlled 5% risk on a $50 account.',
          '• Never enter trades during high-impact US CPI or interest rate releases when spreads widen beyond 3.0 pips.',
        ],
      },
    ],
    quiz: {
      question: 'When trading a $10 micro-capital account, what is the maximum recommended lot size on Gold?',
      options: [
        '1.00 Standard Lot (100 oz)',
        '0.10 Mini Lot (10 oz)',
        '0.01 Micro Lot (1 oz)',
        '0.50 Half Lot (50 oz)',
      ],
      correctIndex: 2,
      explanation: 'A 0.01 micro lot is the only mathematically viable size for a small capital base, keeping dollar risk per pip at roughly $0.10 to $0.01.',
    },
  },
  {
    id: 'ch-4-strategies-regimes',
    number: 4,
    title: 'Algorithmic Strategies & Market Regime Detection',
    subtitle: 'The 5 built-in alpha models and how the regime classifier switches tactics',
    readTime: '10 min read',
    category: 'STRATEGIES',
    summary: 'Deep dive into the 5 algorithmic models powering Quantara. Understand how market regimes dictate whether the bot trades trend momentum or mean reversion.',
    actionTab: 'strategies',
    actionLabel: 'View Strategy Lab',
    keyTakeaways: [
      'No single strategy works in all market conditions; regime switching is essential.',
      'The Adaptive Regime Meta-Engine acts as an executive conductor, activating sub-strategies.',
      'Mean Reversion operates in low-ADX range markets, while Trend Surfer requires high ADX momentum.',
    ],
    sections: [
      {
        heading: '1. The Paradigm of Market Regimes',
        paragraphs: [
          'Financial markets spend roughly 70% of their time consolidating in horizontal ranges, and only 30% of their time in directional trending breakouts. Traditional trading robots fail because they apply trend-following strategies during choppy consolidations, or mean-reversion strategies during explosive breakouts.',
          'Quantara solves this using a dynamic Regime Classifier that computes ATR (volatility), ADX (trend strength), and volume divergence every 1,500ms. The market is assigned one of four distinct regimes:',
        ],
        table: {
          headers: ['Market Regime', 'Technical Signature', 'Active Alpha Strategy', 'Risk Stance'],
          rows: [
            ['Trending Bullish / Bearish', 'ADX > 25, Price outside EMA 21 band', 'Trend Surfer / Momentum Breakout', 'Wide Take-Profits, Trailing Stops'],
            ['Mean Reverting / Range', 'ADX < 20, RSI oscillating 35 - 65', 'Mean Reversion RSI & Bollinger', 'Tight Targets, Strict Boundaries'],
            ['Institutional Imbalance', 'Fair Value Gap, Volume spike > 2x', 'Institutional Liquidity Flow', 'Enter at Order Block retest'],
            ['High Volatility / News', 'ATR > 2.5x 20-period average', 'Capital Preservation / Volatility Scalp', 'Reduced lot size by 50%'],
          ],
        },
      },
      {
        heading: '2. The 5 Core Algorithmic Strategies',
        paragraphs: [
          '1. Adaptive Regime Meta-Engine: The flagship conductor model. It evaluates machine learning sentiment, multi-timeframe moving average alignments, and macro indicators to seamlessly route orders to the highest-scoring model.',
          '2. Trend Surfer Engine: Built on dynamic EMA ribbon envelopes (21, 55, 200) paired with a trailing volatility stop. It rides directional momentum until a structural trend exhaustion candle appears.',
          '3. Mean Reversion RSI/Bollinger: Identifies statistical price extremities where the market has moved more than 2.2 standard deviations from the 20-period mean. It enters counter-cyclical positions aiming for regression to the mean.',
          '4. Institutional Liquidity Flow: Detects algorithmic liquidity grabs (sweep of previous day high/low), fair value gaps (FVG), and order blocks created by institutional market makers.',
          '5. Volatility Breakout: Captures the explosive expansion phase when tight consolidation ranges break during the London/New York session overlap.',
        ],
      },
    ],
    quiz: {
      question: 'What happens when the market regime shifts into high chop with an ADX below 20?',
      options: [
        'The bot automatically quadruples its leverage to force a profit',
        'The engine shifts from trend-following to mean-reversion, or reduces exposure until a clear trend emerges',
        'All accounts are immediately permanently terminated',
        'The bot stops reading market data until the next day',
      ],
      correctIndex: 1,
      explanation: 'During low-trend consolidation, trend-following leads to whipsaws. Quantara switches to mean-reversion tactics or stays in protective cash conservation.',
    },
  },
  {
    id: 'ch-5-risk-management',
    number: 5,
    title: 'Deterministic Institutional Risk Management',
    subtitle: 'Stop loss mechanics, daily drawdown circuit breakers, and emergency protocols',
    readTime: '8 min read',
    category: 'RISK MANAGEMENT',
    summary: 'Examine the 8-stage risk firewall that protects your account from ruin. Learn how daily loss halts, trailing stops, and the hardware Kill Switch guarantee survival.',
    actionTab: 'risk',
    actionLabel: 'Configure Risk Controls',
    keyTakeaways: [
      'Risk per trade must never exceed 1% - 2% on real accounts.',
      'The Daily Drawdown Circuit Breaker automatically halts trading if daily losses exceed 5%.',
      'The Emergency Kill Switch provides single-click instant liquidation of all positions.',
    ],
    sections: [
      {
        heading: '1. The 8-Stage Risk Firewall',
        paragraphs: [
          'In Quantara, execution is strictly subordinate to risk control. Every signal generated by an algorithm is intercepted by the Risk Engine and must pass 8 independent sanity checks before reaching the broker bridge:',
          '1. Kill Switch Check: Verifies that the emergency halt switch is disengaged.',
          '2. Daily Loss Limit Check: Confirms today\'s cumulative realized loss has not breached the user-configured ceiling (default: 5%).',
          '3. Max Drawdown Check: Evaluates current account equity against peak historical equity to prevent deep drawdowns.',
          '4. Concurrent Position Limit: Limits total open positions across all instruments (default: 3 max).',
          '5. Instrument Exposure Cap: Enforces maximum dollar exposure on any single pair (e.g., Gold).',
          '6. Spread Threshold Audit: Rejects trades if broker spread spikes beyond acceptable levels (e.g., > 2.5 pips).',
          '7. Slippage Protection: Rejects execution if current market ask diverges from signal price by more than 0.5 pips.',
          '8. Margin Level Buffer: Ensures free margin remains above 300% to prevent broker stop-outs.',
        ],
      },
      {
        heading: '2. The Trailing Stop Algorithm',
        paragraphs: [
          'Protecting open profits is just as important as cutting losses. Quantara utilizes an automated two-stage trailing stop:',
          'Stage 1: Break-Even Migration — As soon as a trade achieves 1.0x risk-to-reward (e.g. +30 pips), the stop loss is automatically moved to Entry Price + 2 pips (covering commission). Risk is now 0%.',
          'Stage 2: Volatility Ratchet — As price continues favorably, the stop loss trails at a distance of 1.8x ATR. When the market eventually reverses, profits are locked in automatically.',
        ],
        callout: {
          type: 'danger',
          title: 'The Emergency Kill Switch Protocol',
          text: 'Located prominently in the top navbar and risk panel, the Kill Switch instantly halts all incoming signals and can cancel all pending orders. Use this if major unpredicted geopolitical black swan news breaks.',
        },
      },
    ],
    quiz: {
      question: 'What occurs when the account hits its user-defined Max Daily Loss Limit (e.g. 5%)?',
      options: [
        'The bot borrows additional credit from the broker to recover losses',
        'Trading is automatically locked for the remainder of the day to protect capital from further decline',
        'The bot doubles its lot size on the next trade (Martingale)',
        'The application shuts down and deletes all historical records',
      ],
      correctIndex: 1,
      explanation: 'The circuit breaker locks trading for the day. Emotional revenge trading is mathematically prevented.',
    },
  },
  {
    id: 'ch-6-backtesting-simulation',
    number: 6,
    title: 'Backtesting & Monte Carlo Stress Simulation',
    subtitle: 'Evaluating Sharpe ratio, profit factors, and historical stress curves',
    readTime: '7 min read',
    category: 'DIAGNOSTICS',
    summary: 'Discover how to validate strategies over historical market data, interpret quantitative performance statistics, and run Monte Carlo simulations to test resilience.',
    actionTab: 'backtesting',
    actionLabel: 'Run Backtest Engine',
    keyTakeaways: [
      'A robust strategy has a Profit Factor > 1.8 and a Sharpe Ratio > 1.5.',
      'High win rates (e.g. 80%) often hide severe tail risk; focus on risk-to-reward ratios.',
      'Stress testing across volatile historical events reveals how the bot behaves during market panics.',
    ],
    sections: [
      {
        heading: '1. Interpreting Quantitative Metrics',
        paragraphs: [
          'When evaluating a strategy in the Backtesting tab, look beyond total net profit. Institutional analysts prioritize risk-adjusted return metrics:',
          '• Profit Factor (Gross Profits / Gross Losses): Any value above 1.5 is viable; values above 2.0 indicate exceptional edge.',
          '• Sharpe Ratio: Measures excess return per unit of volatility. A Sharpe above 1.5 is standard institutional quality; above 2.0 is world-class.',
          '• Maximum Drawdown (MDD): The peak-to-trough decline in equity. Keep this under 10% to 15% for sustainable peace of mind.',
          '• Win Rate vs. Risk-Reward Ratio (R:R): A strategy with a 45% win rate and a 1:2.5 R:R is far more profitable and durable than a 90% win rate strategy that risks $10 to make $1.',
        ],
      },
      {
        heading: '2. Running Historical Stress Shocks',
        paragraphs: [
          'Quantara includes historical shock presets (e.g. 2020 Liquidity Crisis, 2022 Inflation Spikes, Gold Flash Crash). Testing your risk settings against these periods verifies whether your maximum daily drawdown limits hold under extreme slippage.',
        ],
      },
    ],
    quiz: {
      question: 'Which of the following strategy profiles is mathematically superior for long-term survival?',
      options: [
        '95% Win Rate with 10:1 Risk-to-Reward (risking $100 to make $10)',
        '45% Win Rate with 1:2.5 Risk-to-Reward and Profit Factor of 2.05',
        '100% Win Rate with no Stop Losses whatsoever',
        '70% Win Rate with 50% Maximum Drawdown',
      ],
      correctIndex: 1,
      explanation: 'A 45% win rate with a 1:2.5 R:R produces asymmetric upside and cannot be ruined by one or two consecutive losses.',
    },
  },
  {
    id: 'ch-7-telemetry-diagnostics',
    number: 7,
    title: 'Live Telemetry, Slippage & Audit Logging',
    subtitle: 'Reading sub-millisecond execution feeds, ping status, and order routing logs',
    readTime: '6 min read',
    category: 'DIAGNOSTICS',
    summary: 'Understand the live telemetry dashboard, monitor server ping times, detect broker slippage, and review immutable audit logs for complete transparency.',
    actionTab: 'testing',
    actionLabel: 'Open System Testing',
    keyTakeaways: [
      'Keep latency under 50ms for optimal Gold breakout and scalping performance.',
      'Audit logs record the exact mathematical justification for every signal, rejection, and order fill.',
      'Manual overrides allow you to close or alter any position at any time.',
    ],
    sections: [
      {
        heading: '1. The Heartbeat Telemetry Panel',
        paragraphs: [
          'In high-frequency and quantitative execution, network latency is critical. The telemetry bar at the top of the interface displays your active MT5 bridge status and round-trip ping time.',
          '• Green (< 30ms): Optimal execution. Orders will fill with near-zero slippage.',
          '• Yellow (30ms - 80ms): Acceptable for swing and regime-based strategies; minor slippage possible during news.',
          '• Red (> 100ms): High latency warning. Recommended to verify internet connection or switch to a VPS closer to your broker\'s server (e.g. London or New York).',
        ],
      },
      {
        heading: '2. Immutable Audit Logs',
        paragraphs: [
          'Every decision made by Quantara is written to an in-memory and database audit log. When an order is rejected by the risk engine, the exact reason (e.g. "SPREAD_EXCEEDED: 3.2 > 2.5 pips") is saved with microsecond precision. This gives you complete diagnostic clarity into the engine\'s behavior.',
        ],
      },
    ],
    quiz: {
      question: 'What does a red latency indicator (> 100ms) signify to the operator?',
      options: [
        'Your broker account has been permanently closed',
        'Network ping to the broker terminal is delayed, increasing the likelihood of order slippage on fast moves',
        'The trading engine has generated an error and stopped operating',
        'It indicates the market is closed for the weekend',
      ],
      correctIndex: 1,
      explanation: 'High ping indicates network delay between the software and the broker server, which can cause orders to be filled at slightly different prices during rapid market surges.',
    },
  },
  {
    id: 'ch-8-sop-daily-routine',
    number: 8,
    title: 'Standard Operating Procedures (SOP) & Daily Routine',
    subtitle: 'The 15-minute morning checklist, session overlaps, and profit harvesting guidelines',
    readTime: '8 min read',
    category: 'ROUTINES',
    summary: 'Adopt the disciplined daily routine of professional institutional operators. Follow the 15-minute morning checklist, navigate London-NY session overlaps, and harvest profits systematically.',
    actionTab: 'dashboard',
    actionLabel: 'Review Operator Checklist',
    keyTakeaways: [
      'Spend 15 minutes each morning reviewing economic calendars and telemetry before market opens.',
      'The highest alpha window for Gold (XAU/USD) occurs during the London/New York session overlap (12:00 - 16:00 UTC).',
      'Harvest 30% to 50% of weekly profits every Friday to convert paper returns into real-world wealth.',
    ],
    sections: [
      {
        heading: '1. The 15-Minute Operator Morning Checklist',
        paragraphs: [
          'Professional quantitative operators do not stare at charts for 10 hours a day. They maintain a strict 15-minute daily operational routine:',
          'Step 1 (Minute 0 - 3): System Health Check — Check that Quantara server status is "OPTIMAL", ping is under 50ms, and memory usage is healthy.',
          'Step 2 (Minute 3 - 7): High-Impact News Calendar — Check ForexFactory or Investing.com for high-impact USD events (FOMC, CPI, Non-Farm Payrolls). If a major announcement is within 30 minutes, consider toggling the engine to PAUSED or reducing risk to 0.5%.',
          'Step 3 (Minute 7 - 11): Broker Equity & Drawdown Review — Review overnight compounding statistics. Confirm current equity matches your MT5 terminal balance.',
          'Step 4 (Minute 11 - 15): Strategy Verification — Confirm the active strategy aligns with current market conditions (e.g. Adaptive Regime Meta-Engine for general trading, or Trend Surfer for strong trend days).',
        ],
      },
      {
        heading: '2. The Session Overlap Alpha Windows',
        paragraphs: [
          'Forex and Gold markets operate 24 hours a day, 5 days a week, but volatility is not evenly distributed. The most profitable trading windows occur during major session overlaps:',
          '• London Open (07:00 - 10:00 UTC): High institutional volume, European bank order flows, clear trend establishment.',
          '• London / New York Overlap (12:00 - 16:00 UTC): The pinnacle of global liquidity. Approximately 70% of daily Gold (XAU/USD) volume occurs during this 4-hour window.',
          '• Asian Session (23:00 - 06:00 UTC): Lower volatility, ideal for Mean Reversion RSI strategies and tight range scalping.',
        ],
        table: {
          headers: ['Session / Time (UTC)', 'Market Liquidity', 'Spread Quality', 'Recommended Strategy'],
          rows: [
            ['London Open (07:00 - 10:00)', 'Very High', 'Ultra Tight (0.8 - 1.2 pips)', 'Volatility Breakout / Trend Surfer'],
            ['London/NY Overlap (12:00 - 16:00)', 'Peak Global Volume', 'Lowest Spreads (0.6 - 1.0 pips)', 'Adaptive Regime Meta-Engine / Gold Flow'],
            ['NY Afternoon (17:00 - 21:00)', 'Moderate', 'Normal', 'Trend Continuation'],
            ['Asian Session (23:00 - 06:00)', 'Low to Moderate', 'Wider (1.5 - 2.5 pips)', 'Mean Reversion RSI & Bollinger'],
          ],
        },
      },
      {
        heading: '3. Weekly Profit Harvesting Rule',
        paragraphs: [
          'Compound interest is powerful, but psychological reinforcement is equally vital. We recommend the "50/50 Weekly Harvest Rule":',
          'Every Friday afternoon before markets close at 21:00 UTC, withdraw 30% to 50% of your weekly net profits into your external bank account or stablecoin wallet. Leave the remaining 50% to compound your capital base for the following week. This locks in tangible real-world rewards while steadily expanding your account.',
        ],
        callout: {
          type: 'success',
          title: 'Golden Trader Rule: Realized Profits Are True Profits',
          text: 'Until profits are withdrawn from your broker, they are merely operating equity. Harvesting weekly profits protects your hard-earned gains from black swan occurrences.',
        },
      },
    ],
    quiz: {
      question: 'What is the most active and liquid window for trading Gold (XAU/USD) globally?',
      options: [
        'The Sydney session opening at midnight',
        'The London and New York session overlap (12:00 - 16:00 UTC)',
        'Sunday evening market open',
        'Late Asian session lunch hour',
      ],
      correctIndex: 1,
      explanation: 'The London and New York session overlap combines European and American institutional liquidity, delivering the lowest spreads and highest directional volume on Gold.',
    },
  },
];
