import React, { useState } from 'react';
import {
  X,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
  Lock,
  Sparkles,
  Cpu,
  Layers,
  Clock,
  ArrowRight,
  Wallet,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { QuantaraLogoMark } from './QuantaraLogo';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';

export const SubscriptionPaymentModal: React.FC = () => {
  const {
    subscription,
    isSubscribed,
    daysRemaining,
    hoursRemaining,
    isPaywallOpen,
    paywallSource,
    closePaywall,
    activateSubscription,
  } = useSubscription();

  const { user, profile } = useAuth();
  const isAdmin = Boolean(profile?.role === 'admin' || user?.email === 'chekchris85@gmail.com');

  const [txInput, setTxInput] = useState<string>('');
  const [copiedInvoice, setCopiedInvoice] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationSuccess, setActivationSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isPaywallOpen) return null;

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText('5836437268');
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleConfirmPayment = async () => {
    setErrorMsg(null);
    setIsActivating(true);

    try {
      await activateSubscription(txInput.trim() || undefined, 30);
      setActivationSuccess(true);
      setTimeout(() => {
        setActivationSuccess(false);
        closePaywall();
      }, 1800);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to verify activation. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleAdminBypass = async () => {
    setIsActivating(true);
    await activateSubscription('ADMIN_VIP_OVERRIDE_30_DAYS', 30);
    setIsActivating(false);
    closePaywall();
  };

  const features = [
    {
      title: 'Full Trading Terminal Access',
      desc: 'Deploy live execution, multi-asset order routing & real-time PnL analytics.',
    },
    {
      title: 'MetaTrader 5 Multi-Broker Bridge',
      desc: 'Connect real or demo MT5 accounts with 24/7 non-stop cloud execution.',
    },
    {
      title: 'Adaptive Strategy Meta-Engine',
      desc: 'Institutional strategies: Regime Meta-Engine, Trend Surfer, Mean Reversion & Liquidity Hunter.',
    },
    {
      title: 'Deterministic Risk Circuit Breakers',
      desc: 'Dynamic ATR lot sizing, trailing stops, daily loss locks & emergency kill switch.',
    },
    {
      title: 'Cloud Trade Journal & Psychology Audit',
      desc: 'Encrypted trade logging with emotional discipline scoring and trade replay.',
    },
    {
      title: '$10 Wealth Accelerator',
      desc: 'Micro-account geometric compounding matrices with anti-martingale protection.',
    },
  ];

  const acceptedCryptos = [
    { sym: 'BTC', name: 'Bitcoin', color: 'text-amber-400' },
    { sym: 'USDT', name: 'Tether (TRC20/ERC20/BEP20)', color: 'text-emerald-400' },
    { sym: 'ETH', name: 'Ethereum', color: 'text-blue-400' },
    { sym: 'USDC', name: 'USD Coin', color: 'text-blue-300' },
    { sym: 'SOL', name: 'Solana', color: 'text-purple-400' },
    { sym: 'LTC', name: 'Litecoin', color: 'text-slate-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-blue-500/30 bg-[#0E1015] shadow-2xl text-[#E4E4E7] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-[#1E2330]">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 shadow-inner">
              <QuantaraLogoMark size="sm" showGlow={false} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Quantara Institutional License
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  30-Day Pass
                </span>
              </div>
              <p className="text-xs text-[#8E9299] mt-0.5">
                Full-featured autonomous execution gateway & trading terminal
              </p>
            </div>
          </div>

          <button
            onClick={closePaywall}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1A2030] transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Alert if coming from terminal launch attempt */}
          {paywallSource === 'terminal_launch' && (
            <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Subscription Required:</strong> The Quantara Trading Terminal is restricted to active subscribers. Complete payment below to unlock instant terminal access.
              </span>
            </div>
          )}

          {subscription.status === 'expired' && (
            <div className="flex items-center space-x-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-xs">
              <Clock className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                <strong>Subscription Expired:</strong> Your 1-month terminal license has concluded. Please renew using the NOWPayments button to continue trading.
              </span>
            </div>
          )}

          {/* Pricing Highlight Card */}
          <div className="rounded-xl border border-blue-500/30 bg-[#121624] p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-400 font-semibold">
                  Monthly Subscription
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    $100
                  </span>
                  <span className="text-sm font-mono text-[#8E9299]">USD / Month</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  30 days of non-stop autonomous trading software execution.
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center space-y-1 text-xs font-mono text-zinc-300 border-t sm:border-t-0 sm:border-l border-[#1F2638] pt-3 sm:pt-0 sm:pl-5">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Instant Crypto Checkout</span>
                </div>
                <div className="text-[#8E9299]">NOWPayments Verified</div>
                <div className="text-[11px] text-blue-300">Invoice: #5836437268</div>
              </div>
            </div>
          </div>

          {/* NOWPayments Primary Action Area */}
          <div className="rounded-xl border border-[#232A3B] bg-[#141824] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Step 1: Complete $100 Payment via NOWPayments
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Crypto Gateway
              </span>
            </div>

            <p className="text-xs text-[#8E9299] leading-relaxed">
              Click the official NOWPayments button below to securely transmit $100 in your preferred cryptocurrency (BTC, USDT, ETH, USDC, SOL, etc.).
            </p>

            {/* Official NOWPayments Button Embed (As provided by user) */}
            <div className="flex flex-col sm:flex-row items-center justify-center p-4 rounded-xl bg-[#0A0D14] border border-[#1E2330] gap-4">
              <a
                href="https://nowpayments.io/payment/?iid=5836437268&source=button"
                target="_blank"
                rel="noreferrer noopener"
                className="transition-transform hover:scale-105 active:scale-95 shadow-xl rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 inline-block"
                title="Pay with Cryptocurrency on NOWPayments"
              >
                <img
                  src="https://nowpayments.io/images/embeds/payments-button-white.svg"
                  alt="Cryptocurrency & Bitcoin payment button by NOWPayments"
                  className="h-11 sm:h-12 w-auto object-contain"
                />
              </a>

              <a
                href="https://nowpayments.io/payment/?iid=5836437268&source=button"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 underline font-mono"
              >
                <span>Direct NOWPayments Link</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Supported Cryptos Pills */}
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#8E9299] block mb-2">
                Accepted Cryptocurrencies:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {acceptedCryptos.map((c) => (
                  <span
                    key={c.sym}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#0E121B] border border-[#1C2232] text-[11px] font-mono text-zinc-300"
                  >
                    <span className={`font-bold ${c.color}`}>{c.sym}</span>
                    <span className="text-zinc-500 text-[10px] hidden sm:inline">• {c.name}</span>
                  </span>
                ))}
                <span className="inline-flex items-center px-2 py-1 rounded bg-[#0E121B] border border-[#1C2232] text-[10px] font-mono text-zinc-400">
                  + 300 more
                </span>
              </div>
            </div>

            {/* Invoice Reference Info */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A0D14] border border-[#1C2232] text-xs font-mono">
              <span className="text-[#8E9299]">NOWPayments Invoice ID:</span>
              <div className="flex items-center space-x-2">
                <code className="text-zinc-200 font-bold">5836437268</code>
                <button
                  type="button"
                  onClick={handleCopyInvoice}
                  className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                  title="Copy Invoice ID"
                >
                  {copiedInvoice ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Activation Step */}
          <div className="rounded-xl border border-[#232A3B] bg-[#141824] p-5 space-y-3.5">
            <div className="flex items-center space-x-2">
              <KeyRound className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Step 2: Activate 30-Day Terminal Access
              </h4>
            </div>

            <p className="text-xs text-[#8E9299] leading-relaxed">
              Once you have submitted your crypto payment on NOWPayments, enter your payment reference, transaction hash, or click below to activate your 30-day license.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={txInput}
                onChange={(e) => setTxInput(e.target.value)}
                placeholder="Optional: Enter NOWPayments Payment ID / TX Hash"
                className="w-full rounded-xl bg-[#0A0D14] border border-[#1E2536] px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:border-blue-500 focus:outline-none transition-colors"
              />

              {errorMsg && (
                <div className="text-xs text-red-400 font-mono flex items-center space-x-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activationSuccess ? (
                <div className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Subscription Active! Launching Terminal...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isActivating}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isActivating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Payment & Provisioning Access...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>I Have Completed Payment — Activate Terminal</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Included Features List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider block">
              What's Included in Your $100/mo Subscription:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[#0E121B] border border-[#1C2130] flex items-start space-x-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-white">{f.title}</h5>
                    <p className="text-[11px] text-[#8E9299] mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Override Area (Visible only to authorized admin) */}
          {isAdmin && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 font-mono flex items-center space-x-1.5">
                  <Shield className="h-3.5 w-3.5 text-purple-400" />
                  <span>Admin Clearance Control</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono">chekchris85@gmail.com</span>
              </div>
              <p className="text-[#8E9299] text-[11px]">
                As an authenticated administrator, you have full authority to bypass or grant 30-day passes for platform verification.
              </p>
              <button
                type="button"
                onClick={handleAdminBypass}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono font-semibold text-xs transition-colors"
              >
                Grant / Refresh 30-Day Admin License
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[#1E2330] bg-[#0A0D14] text-xs font-mono text-[#8E9299]">
          <div className="flex items-center space-x-1.5">
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span>256-Bit Encrypted Gateway</span>
          </div>
          <button
            type="button"
            onClick={closePaywall}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Cancel & Return
          </button>
        </div>
      </div>
    </div>
  );
};
