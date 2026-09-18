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
  category:
    | 'FOUNDATIONS'
    | 'BROKERS & MT5'
    | '24/7 CLOUD PERSISTENCE'
    | 'COMPOUNDING'
    | 'STRATEGIES'
    | 'RISK MANAGEMENT'
    | 'AI & ARCHITECTURE'
    | 'DIAGNOSTICS'
    | 'ROUTINES';
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
    readTime: '7 min read',
    category: 'FOUNDATIONS',
    summary: 'Master the high-level architecture of Quantara, understand the sub-second 1,500ms execution engine, and learn how client telemetry coordinates with backend algorithmic models.',
    actionTab: 'dashboard',
    actionLabel: 'Explore Live Dashboard',
    keyTakeaways: [
      'Quantara operates a continuous 1,500ms algorithmic tick loop evaluating multi-asset market data.',
      'The architecture cleanly decouples the risk evaluation layer from order dispatch for 100% deterministic safety.',
      'Dual environments: Low-slippage Paper simulation for forward-testing and Institutional Live MT5 routing.',
      'All states, positions, and accounts synchronize in real time via Server-Sent Events (SSE) and Firestore.',
    ],
    sections: [
      {
        heading: '1. The Vision and Engineering Paradigm of Quantara',
        paragraphs: [
          'Quantara is an institutional-grade quantitative trading platform designed to bridge algorithmic execution models directly into MetaTrader 5 (MT5) terminals. Unlike manual discretionary trading—which is plagued by emotional panic, hesitation, and over-leveraging—Quantara enforces strictly quantified mathematical rules across every single tick.',
          'The core thesis is simple: market movements are non-random fluctuations governed by volatility regimes, liquidity imbalances, and cyclical momentum. By detecting the active market regime in real time, Quantara selects the optimal algorithmic model to capture alpha while strictly curtailing maximum downside exposure.',
        ],
        callout: {
          type: 'info',
          title: 'Core Philosophy: Capital Preservation Precedes Capital Growth',
          text: 'The primary mandate of quantitative trading is not making 1,000% in a week, but mathematically eliminating catastrophic drawdowns. When downside risk is strictly bounded, compound interest reliably produces life-changing wealth.',
        },
      },
      {
        heading: '2. The Sub-Second 1,500ms Tick Pipeline',
        paragraphs: [
          'The core engine runs a high-precision cycle every 1,500 milliseconds (1.5s). During each cycle, the following five stages execute sequentially:',
          'Phase 1: Ingestion & Price Normalization — Real-time price ticks from XAU/USD (Gold), EUR/USD, GBP/USD, USD/JPY, and BTC/USD are parsed, calculating live spreads, bid/ask depths, and pip velocities.',
          'Phase 2: Indicator Calculus & Regime Classification — The engine updates Exponential Moving Averages (EMA 21, 55, 200), Relative Strength Index (RSI 14), Average True Range (ATR 14), and Bollinger Bands (20, 2.2 std dev) to classify market state into Trending, Mean-Reverting, Imbalance, or High-Volatility.',
          'Phase 3: Alpha Generation — Active algorithmic strategies generate long/short candidate signals equipped with calculated entry, stop loss (SL), and take profit (TP) price levels.',
          'Phase 4: The 8-Stage Risk Firewall — Before any candidate signal can become an order, it must pass 8 independent mathematical risk filters (Kill Switch, Daily Loss Limit, Max Drawdown, Spread Cap, Margin Utilization, Slippage, and Asset Exposure).',
          'Phase 5: Execution & Position Telemetry — Validated orders are dispatched to the connected MT5 bridge or paper engine with millisecond timestamps, emitting state snapshots to connected frontends via Server-Sent Events (SSE).',
        ],
        table: {
          headers: ['Pipeline Stage', 'Latency Budget', 'Deterministic Action', 'Failure Mode'],
          rows: [
            ['Tick Feed Ingestion', '< 5ms', 'Normalizes OHLCV & bid/ask spreads', 'Hold previous tick state'],
            ['Indicator Calculus', '< 10ms', 'Updates EMA, ATR, RSI, & Bollinger', 'Preserve previous indicator buffers'],
            ['Regime Classification', '< 15ms', 'Evaluates ADX, ATR, & volume surges', 'Fallback to Neutral/Choppy mode'],
            ['Risk Firewall Audit', '< 2ms', 'Validates 8 strict risk checks', 'Hard Reject with immutable audit log'],
            ['Order Dispatch', '< 25ms', 'Transmits order to MT5 bridge', 'Abort execution on socket timeout'],
          ],
        },
      },
      {
        heading: '3. Dual Environments: Paper Simulation vs. Institutional Live',
        paragraphs: [
          'Quantara provides two fully isolated trading environments accessible with a single click from the top navigation bar:',
          '• Paper Trading Mode: A zero-risk simulated liquidity pool that mirrors real market prices, spreads, and slippage. Ideal for evaluating new strategies, tuning compounding parameters, and training new operators.',
          '• Institutional Live Mode: Directly dispatches real buy/sell orders to your connected MetaTrader 5 broker terminal (e.g. Exness, IC Markets, Pepperstone). Live mode enforces strict confirmation prompts and dual-factor risk checks before execution.',
        ],
      },
    ],
    quiz: {
      question: 'What is the absolute highest priority in the Quantara algorithmic architecture?',
      options: [
        'Maximizing trade frequency to generate maximum broker commission rebates',
        'Capital preservation and deterministic risk bounds before profit taking',
        'Executing discretionary trades whenever personal emotional conviction is high',
        'Overriding stop loss limits during fast-moving market dips to avoid getting stopped out',
      ],
      correctIndex: 1,
      explanation: 'Quantara enforces that capital preservation strictly precedes capital growth. Every trade passes an immutable 8-stage risk firewall before order execution.',
    },
  },
  {
    id: 'ch-2-broker-mt5',
    number: 2,
    title: 'MetaTrader 5 Bridge & The Demo Proving Ground',
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
      'Credentials remain stored securely inside your private container and are never shared with third parties.',
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
          'Step 1: Open the "MT5 & Broker Login" tab from the hamburger navigation menu.',
          'Step 2: Select your broker preset (Exness, IC Markets, Pepperstone, XM, FTMO, Deriv, JustMarkets, HFM, FXTM, or Custom MT5 Server).',
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
    id: 'ch-3-cloud-persistence',
    number: 3,
    title: '24/7 Autonomous Cloud Execution & State Persistence',
    subtitle: 'Uninterrupted server-side trading, atomic persistence, and offline wealth reporting',
    readTime: '9 min read',
    category: '24/7 CLOUD PERSISTENCE',
    summary: 'Discover how Quantara operates 24 hours a day, 7 days a week on persistent cloud infrastructure. Learn how trades continue executing while you sleep or are offline, and how reconnection wealth reports track every dollar generated.',
    actionTab: 'brokers',
    actionLabel: 'View Server Management',
    keyTakeaways: [
      'The trading engine runs as a server-side Node.js daemon completely independent of browser tabs.',
      'Closing your laptop or browser does NOT stop trading; positions continue being monitored and executed 24/7.',
      'State is atomically persisted to disk and Firestore every 20 ticks and on every trade event.',
      'When you log back in, the Offline Wealth Report modal displays all trades and profits generated while you were away.',
    ],
    sections: [
      {
        heading: '1. True Server-Side Autonomy (24/7 Operation)',
        paragraphs: [
          'Most web-based trading bots cease functioning the moment you close your browser tab or lose internet connection. Quantara was engineered with a modern decoupled full-stack architecture:',
          'The core TradingEngine, ExecutionEngine, and RiskManager run as an independent background daemon inside a dedicated Node.js cloud container. The browser interface is strictly a telemetry viewer and control cockpit.',
          'This means once you connect your broker account and leave the engine running, it operates 24/7 without interruption. It continues monitoring tick streams, detecting technical breakout signals, executing orders, adjusting trailing stops, and taking profits around the clock.',
        ],
        callout: {
          type: 'success',
          title: '24/7 Wealth Generation Guarantee',
          text: 'You do not need to leave your computer running or keep your browser tab open. The cloud server executes trades 24/7 until you explicitly choose to pause or stop the engine.',
        },
      },
      {
        heading: '2. Atomic Persistence Architecture',
        paragraphs: [
          'To ensure zero data loss across container reboots, network shifts, or server updates, Quantara employs a dual-tier persistence layer:',
          '1. Atomic Disk Persistence (`trading_engine_state.json`): The engine writes its active state (cash balance, open positions, pending orders, risk limits, and broker uptimes) atomically to disk every 20 tick cycles (~30 seconds) and immediately upon any position open/close.',
          '2. Cloud Database Sync (Firestore): Authenticated operators have their account configuration, journal logs, and compounding records synchronized in real time with Google Cloud Firestore, enabling seamless access across desktop, tablet, and mobile devices.',
        ],
        codeOrFormula: '// Atomic State Persistence Cycle\ntickCycle() {\n  if (this.tickCounter % 20 === 0) {\n    db.persistAccounts();\n    db.persistEngineState();\n  }\n}',
      },
      {
        heading: '3. The Offline Wealth Generation Report',
        paragraphs: [
          'Whenever the engine detects that no active browser clients are connected (`sseClients.size === 0`), it automatically activates Offline Tracking Mode.',
          'During this period, any trades opened, managed, and closed by the autonomous algorithms are categorized as offline executions. The engine logs:',
          '• Total duration the operator spent offline (hours and minutes).',
          '• Number of automated executions taken while offline.',
          '• Win rate and profit factor during the unattended session.',
          '• Net profit or loss generated in dollars and percentage.',
          '• Individual trade breakdowns with entry price, exit price, and closing rationales.',
          'Upon logging back into Quantara, the system automatically presents the Offline Wealth Report Modal, celebrating your returns and allowing you to review your journal or adjust engine parameters with a single tap.',
        ],
        table: {
          headers: ['Server State', 'Browser Closed?', 'Trades Executing?', 'Persistence Trigger', 'Operator Action'],
          rows: [
            ['RUNNING', 'Yes (Offline)', 'Yes — 24/7 Autonomous', 'Every 20 ticks & on fills', 'Review upon reconnection'],
            ['PAUSED', 'Yes (Offline)', 'No — Safety Hold', 'Immediate state write', 'Resume from Hamburger or Hub'],
            ['STOPPED', 'Yes (Offline)', 'No — Disconnected', 'Immediate state write', 'Start server to resume'],
          ],
        },
      },
      {
        heading: '4. Batch Server Controls: Run All vs. Pause All',
        paragraphs: [
          'If you manage multiple MT5 accounts (e.g. an Exness Gold scalper, an IC Markets swing account, and an FTMO prop challenge), you can control them collectively:',
          '• "Run All Non-Stop": Immediately resumes continuous 24/7 background algorithmic execution across all connected accounts.',
          '• "Pause All": Temporarily halts new trade entries across all accounts simultaneously (ideal ahead of major interest rate announcements or weekend closes).',
        ],
      },
    ],
    quiz: {
      question: 'What happens to active positions and pending orders if you close your browser tab while the engine is RUNNING?',
      options: [
        'All open positions are immediately liquidated at market price',
        'The engine continues running 24/7 in the cloud, managing stops and taking profits uninterrupted',
        'Trading is suspended until you reopen the exact same browser tab',
        'The broker account is disconnected and deleted from the database',
      ],
      correctIndex: 1,
      explanation: 'Quantara runs as a persistent cloud server daemon. Closing your browser has zero effect on background trade execution or risk management.',
    },
  },
  {
    id: 'ch-4-takeover-compounding',
    number: 4,
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
      'Asymmetric filtering rejects trades with risk-to-reward ratios lower than 1:2.0.',
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
    id: 'ch-5-strategies-regimes',
    number: 5,
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
      'Institutional Liquidity Flow identifies Smart Money Concepts (FVG, Order Blocks, and Liquidity Sweeps).',
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
    id: 'ch-6-gold-mechanics',
    number: 6,
    title: 'Gold (XAU/USD) Execution Mechanics & Volatility Sizing',
    subtitle: 'Pip values, contract specifications, and mastering precious metal volatility',
    readTime: '8 min read',
    category: 'STRATEGIES',
    summary: 'Master the exact mathematics of trading Gold (XAU/USD). Learn contract specifications, pip calculation formulas, session liquidity habits, and protective sizing for small capital bases.',
    actionTab: 'dashboard',
    actionLabel: 'Inspect Gold Terminal',
    keyTakeaways: [
      '1 standard lot of XAU/USD = 100 troy ounces; 0.01 micro lot = 1 troy ounce.',
      'A $1.00 move in Gold equals 100 pips (or 10 points depending on broker digits).',
      'The London/NY overlap (12:00 - 16:00 UTC) produces the highest liquidity and lowest spreads on Gold.',
      'Never allow open adverse drawdown on Gold to exceed 5% of account balance.',
    ],
    sections: [
      {
        heading: '1. Gold Contract Specifications & Pip Mathematics',
        paragraphs: [
          'Gold is quoted in US Dollars per troy ounce. Unlike currency pairs like EUR/USD where 1 pip is the 4th decimal (0.0001), in spot Gold (XAU/USD):',
          '• Standard Lot (1.00 lot) = 100 ounces. A $1.00 move in gold price = $100.00 P&L.',
          '• Mini Lot (0.10 lot) = 10 ounces. A $1.00 move in gold price = $10.00 P&L.',
          '• Micro Lot (0.01 lot) = 1 ounce. A $1.00 move in gold price = $1.00 P&L ($0.10 per 10 cents).',
        ],
        codeOrFormula: 'P&L = (ExitPrice - EntryPrice) * LotSize * 100 Ounces\nExample: BUY 0.01 at $2,650.00, SELL at $2,655.50\nP&L = ($2,655.50 - $2,650.00) * 0.01 * 100 = +$5.50 profit',
      },
      {
        heading: '2. Gold Daily Volatility Waves',
        paragraphs: [
          'Spot Gold has an average daily range (ADR) of $25 to $45 (2,500 to 4,500 pips). Because of this vast range, trading Gold requires strict awareness of global market sessions:',
          '• Asian Session (00:00 - 07:00 UTC): Typically consolidates in a $5 - $10 channel. Excellent for Mean Reversion algorithms.',
          '• London Morning (07:00 - 11:00 UTC): Institutional accumulation/distribution establishes the preliminary directional trend.',
          '• London / New York Overlap (12:00 - 16:00 UTC): Peak volatility. Heavy algorithmic executions, COMEX futures volume, and economic releases produce clean multi-dollar breakouts.',
        ],
      },
      {
        heading: '3. Small Account Survival Guidelines on Gold',
        paragraphs: [
          'If trading an account under $100:',
          '1. Enforce strict 0.01 lot maximum size.',
          '2. Cap stop losses to $2.00 - $3.00 on the gold chart (200 - 300 pips = $2.00 - $3.00 risk).',
          '3. Never trade during US Non-Farm Payrolls (NFP) or FOMC rate announcements when spreads can widen to $0.80 ($8 per lot).',
        ],
      },
    ],
    quiz: {
      question: 'If you buy 0.01 lots of Gold at $2,640.00 and sell at $2,643.00, what is your net profit before commission?',
      options: [
        '$30.00',
        '$3.00',
        '$0.30',
        '$300.00',
      ],
      correctIndex: 1,
      explanation: '0.01 lots represents 1 ounce of Gold. A $3.00 price move multiplied by 1 ounce equals exactly $3.00 profit.',
    },
  },
  {
    id: 'ch-7-risk-management',
    number: 7,
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
      'The two-stage trailing stop migrates to break-even before ratcheting with volatility.',
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
      {
        heading: '3. Equity-Bounded Dynamic Lot Sizing (0.01 to 0.10 Lots Policy)',
        paragraphs: [
          'To strictly safeguard trading capital and guarantee that margin utilization never threatens account survival, Quantara enforces an algorithmic lot size bounding policy directly in the Risk Engine:',
          '• Hard Minimum: 0.01 Lots (Micro Lot) for small accounts starting at $50 equity.',
          '• Hard Maximum: 0.10 Lots (Mini Lot cap) reached at $1,000 equity.',
          '• Dynamic Equity Formula: Lot Size = 0.01 + [((Equity - 50) / 950) × 0.09], strictly clamped between [0.01, 0.10].',
          '• Risk Visibility: Every open position and closed trade explicitly logs and displays the exact lots taken in the dashboard and active positions table, ensuring complete auditability.',
        ],
        table: {
          headers: ['Account Equity', 'Calculated Lot Size', 'Gold Contract Size', 'P&L per $1.00 Gold Move', 'Risk Tier'],
          rows: [
            ['$50.00 – $100.00', '0.01 Lots', '1.0 oz Gold', '$1.00', 'Micro-Shield (Max Safety)'],
            ['$250.00', '0.03 Lots', '3.0 oz Gold', '$3.00', 'Conservative Scaler'],
            ['$500.00', '0.05 Lots', '5.0 oz Gold', '$5.00', 'Balanced Growth'],
            ['$750.00', '0.08 Lots', '8.0 oz Gold', '$8.00', 'Dynamic Expansion'],
            ['$1,000.00+', '0.10 Lots (Hard Cap)', '10.0 oz Gold', '$10.00', 'Governed Ceiling Cap'],
          ],
        },
        callout: {
          type: 'info',
          title: 'Why Cap Lot Size at 0.10 Lots?',
          text: 'Even if your account equity grows to $5,000 or $10,000, capping standard bot positions at 0.10 lots ensures that no sudden 200-pip gold slippage or flash crash can consume more than 2% of equity. This guarantees perpetual mathematical survival over thousands of trades.',
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
    id: 'ch-8-ai-transparency',
    number: 8,
    title: 'Google Gemini AI Trade Transparency & Explanations',
    subtitle: 'Real-time trade rationales, multi-timeframe confluence, and quality grading',
    readTime: '7 min read',
    category: 'AI & ARCHITECTURE',
    summary: 'Learn how Quantara pairs high-speed quantitative algorithms with Google Gemini generative intelligence to audit trade quality, detect macro anomalies, and produce plain-English trade rationales.',
    actionTab: 'dashboard',
    actionLabel: 'Review AI Trade Logs',
    keyTakeaways: [
      'Gemini AI audits technical confluence, market structure, and macro news context.',
      'Every trade is assigned a Trade Quality Grade from A+ to REJECT.',
      'High-demand AI outages automatically fall back to deterministic quantitative heuristics with zero latency spike.',
      'Click any trade in your history or active positions to read its complete AI justification modal.',
    ],
    sections: [
      {
        heading: '1. Why Quantitative Logic + Generative AI?',
        paragraphs: [
          'Pure mathematical algorithms excel at sub-millisecond execution and rigid risk enforcement, but they lack contextual understanding of geopolitical events, structural macro shifts, and liquidity traps.',
          'Quantara integrates Google Gemini generative models to act as an objective Institutional Risk Auditor. When a signal is generated, the AI evaluates:',
          '• Multi-Timeframe Alignment: Does the 5-minute breakout align with the 1-hour and 4-hour trend?',
          '• Volume & Liquidity Quality: Was the move driven by genuine institutional volume or retail stop hunts?',
          '• Macro Anomaly Check: Are there upcoming central bank speeches or unexpected volatility spikes that warrant caution?',
        ],
      },
      {
        heading: '2. Trade Quality Grading System',
        paragraphs: [
          'Every executed trade and generated signal receives a formal Grade:',
          '• Grade A+: Perfect confluence across EMA trend ribbons, RSI momentum, low spread (< 1.2 pips), and positive risk-reward > 1:2.5.',
          '• Grade A: Strong technical setup with minor counter-trend pressure on higher timeframes.',
          '• Grade B: Viable momentum scalping opportunity with wider stop loss parameters.',
          '• Grade C / REJECT: Sub-optimal risk-reward or spread widening beyond safe boundaries.',
        ],
      },
      {
        heading: '3. Resilient Fallback Architecture',
        paragraphs: [
          'High-frequency trading cannot tolerate API latency or third-party service degradation. If the Gemini API experiences temporary cloud demand spikes (HTTP 503), Quantara\'s server-side engine automatically falls back to an offline deterministic quantitative heuristic analyzer.',
          'This guarantees that trade execution, trailing stops, and order placement never hang or freeze due to external cloud dependencies.',
        ],
      },
    ],
    quiz: {
      question: 'What happens if the Gemini AI service experiences high cloud demand or temporary unavailability?',
      options: [
        'The entire trading platform shuts down and orders are cancelled',
        'Quantara seamlessly falls back to deterministic quantitative heuristic analysis with zero disruption to execution',
        'The platform switches to manual discretionary mode permanently',
        'Your broker account is placed on security hold',
      ],
      correctIndex: 1,
      explanation: 'Quantara features an automatic fallback mechanism that transitions to internal deterministic logic if external AI APIs encounter demand spikes.',
    },
  },
  {
    id: 'ch-9-multi-account-management',
    number: 9,
    title: 'Multi-Broker Account Management & Custom Renaming',
    subtitle: 'Managing concurrent servers, custom account nicknames, and broker switching',
    readTime: '7 min read',
    category: 'BROKERS & MT5',
    summary: 'Learn how to manage multiple broker accounts simultaneously, assign custom nicknames, monitor server health, and toggle active trading custody across accounts.',
    actionTab: 'brokers',
    actionLabel: 'Manage All Accounts',
    keyTakeaways: [
      'Manage multiple Demo and Real accounts from different brokers simultaneously in a single interface.',
      'Assign personalized nicknames (e.g. "Apex Gold Scalper", "Titan ECN Vault") to easily distinguish accounts.',
      'Each account maintains its own 24/7 server process, balance tracking, and equity curve.',
      'Switch the active takeover target with a single click without disconnecting other servers.',
    ],
    sections: [
      {
        heading: '1. The Multi-Account Architecture',
        paragraphs: [
          'Institutional traders rarely rely on a single broker. Spreading capital across multiple brokers (such as Exness for raw-spread gold scalping, IC Markets for major currency swing trading, and FTMO for funded prop challenges) reduces counterparty risk and capital bottlenecks.',
          'Quantara\'s Account Broker Hub allows you to connect and supervise unlimited accounts concurrently. Each connected account runs its own background broker bridge process, updating live balances, margins, and open positions.',
        ],
      },
      {
        heading: '2. Custom Renaming & Nicknames',
        paragraphs: [
          'Remembering 8-digit MT5 account numbers (like 10849201 vs 29482103) is inefficient and error-prone. Quantara allows you to assign custom descriptive nicknames to every connected account:',
          '• Click the Edit (Pencil) icon on any account card in the Trade Control or Accounts tab.',
          '• Type a custom name or click one of the pre-configured suggestions ("Apex Gold Scalper", "Alpha Exness Pro", "Titan ECN Vault", "Prop Challenger #1").',
          '• You can also click the Randomize button to generate an institutional-grade alias instantly.',
          '• Click Save. The nickname is persisted to the database and appears across all trade history records, notifications, and telemetry views.',
        ],
      },
      {
        heading: '3. Individual Server States: Run, Pause, Stop',
        paragraphs: [
          'Each connected broker account card features independent server state controls:',
          '• RUNNING (Green): Server is connected to the broker terminal, receiving live ticks and actively executing algorithmic orders.',
          '• PAUSED (Yellow): Server maintains terminal connection but will not enter new positions. Existing positions remain managed with trailing stops.',
          '• STOPPED (Red): Server bridge is fully disengaged.',
        ],
      },
    ],
    quiz: {
      question: 'Can you run an Exness Demo account and an IC Markets Real account simultaneously in Quantara?',
      options: [
        'No, the platform only allows one account across the entire system',
        'Yes, Quantara supports concurrent multi-account connections with independent 24/7 server processes',
        'Only if both accounts use the exact same login credentials',
        'Only during the weekend when markets are closed',
      ],
      correctIndex: 1,
      explanation: 'Quantara was built from the ground up to support concurrent multi-account and multi-broker topologies with isolated server processes.',
    },
  },
  {
    id: 'ch-10-backtesting-simulation',
    number: 10,
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
      'Walk-forward validation prevents over-fitting to past market noise.',
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
    id: 'ch-11-telemetry-diagnostics',
    number: 11,
    title: 'Live Telemetry, Slippage & Immutable Audit Logging',
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
      'The real-time top ticker ribbon displays continuous multi-asset market prices across all tabs.',
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
    id: 'ch-12-sop-daily-routine',
    number: 12,
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
