import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Shield,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Download,
  Printer,
  X,
  Sparkles,
  Lock,
  ArrowRight,
  User,
  RefreshCw,
  FileText,
  KeyRound,
  Zap,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PaymentRecord } from '../types';
import { QuantaraLogoMark } from './QuantaraLogo';

interface PaymentsBillingViewProps {
  onOpenAuthModal?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const PaymentsBillingView: React.FC<PaymentsBillingViewProps> = ({
  onOpenAuthModal,
  onNavigateTab,
}) => {
  const { user, profile } = useAuth();
  const { isDark } = useTheme();
  const {
    subscription,
    isSubscribed,
    daysRemaining,
    hoursRemaining,
    paymentHistory,
    openPaywall,
    verifyPayment,
  } = useSubscription();

  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Manual payment verification state
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    status: 'idle' | 'success' | 'failed';
    message: string;
    detail?: string;
  }>({ status: 'idle', message: '' });

  const isAdmin = Boolean(profile?.role === 'admin' || user?.email === 'chekchris85@gmail.com');

  // Admin Audit & Manual Approval State
  const [adminAuditData, setAdminAuditData] = useState<{
    attempts: Array<{
      id: string;
      timestamp: string;
      reference: string;
      userEmail: string;
      status: 'SUCCESS' | 'REJECTED';
      reason: string;
    }>;
    verifiedPayments: Array<any>;
    webhookUrl: string;
    hasApiKey: boolean;
  } | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [manualApproveId, setManualApproveId] = useState('');
  const [manualApproveEmail, setManualApproveEmail] = useState('');
  const [manualApproveNotes, setManualApproveNotes] = useState('');
  const [manualApproveMsg, setManualApproveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const loadAdminAudit = async () => {
    if (!user?.email || user.email !== 'chekchris85@gmail.com') return;
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/subscription/admin/audit?userEmail=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminAuditData(data);
      }
    } catch (e) {
      console.warn('Failed to load admin audit:', e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isAdmin && user?.email === 'chekchris85@gmail.com') {
      loadAdminAudit();
    }
  }, [isAdmin, user?.email]);

  const handleCopyWebhook = () => {
    const url = `${window.location.origin}/api/subscription/nowpayments-webhook`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleManualApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualApproveId.trim() || !manualApproveEmail.trim()) {
      setManualApproveMsg({ type: 'error', text: 'Payment ID and user email are required.' });
      return;
    }
    setIsApproving(true);
    setManualApproveMsg(null);
    try {
      const res = await fetch('/api/subscription/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: user?.email,
          paymentId: manualApproveId.trim(),
          userEmail: manualApproveEmail.trim(),
          notes: manualApproveNotes.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManualApproveMsg({ type: 'success', text: data.message });
        setManualApproveId('');
        setManualApproveEmail('');
        setManualApproveNotes('');
        loadAdminAudit();
      } else {
        setManualApproveMsg({ type: 'error', text: data.message || 'Approval failed' });
      }
    } catch (err: any) {
      setManualApproveMsg({ type: 'error', text: err?.message || 'Approval failed' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText('5836437268');
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleCopyTx = (txRef: string) => {
    navigator.clipboard.writeText(txRef);
    setCopiedTxId(txRef);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setVerificationFeedback({
        status: 'failed',
        message: 'Not verified',
        detail: 'Sign-in required: You must first sign in to your Quantara account before verifying payments.',
      });
      onOpenAuthModal?.();
      return;
    }

    const trimmed = paymentRefInput.trim();
    if (!trimmed) {
      setVerificationFeedback({
        status: 'failed',
        message: 'Not verified',
        detail: 'Payment reference is mandatory. Please enter your NOWPayments Payment ID or Transaction Hash.',
      });
      return;
    }

    setIsVerifying(true);
    setVerificationFeedback({ status: 'idle', message: '' });

    try {
      const res = await verifyPayment(trimmed, 30);
      if (res.success) {
        setVerificationFeedback({
          status: 'success',
          message: 'Payment successful',
          detail: 'Your $100 monthly subscription has been verified and your 30-day Institutional Terminal access is now unlocked.',
        });
        setPaymentRefInput('');
      } else {
        setVerificationFeedback({
          status: 'failed',
          message: 'Not verified',
          detail: res.errorDetail || 'The payment reference could not be verified on NOWPayments.',
        });
      }
    } catch (err: any) {
      setVerificationFeedback({
        status: 'failed',
        message: 'Not verified',
        detail: err?.message || 'Connection to payment verification service failed.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const totalSpent = paymentHistory
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((sum, p) => sum + (p.amount || 100), 0);

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 transition-colors ${
        isDark
          ? 'bg-[#0A0D14] text-white'
          : 'bg-[#FFFFFF] text-[#0F172A]'
      }`}
    >
      {/* Top Banner & Header */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b ${
          isDark ? 'border-[#1F2433]' : 'border-slate-200'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isDark
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <CreditCard className="h-5 w-5" />
            </div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight font-brand ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Payments & Billing History
            </h1>
            <span
              className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              NOWPayments Gateway
            </span>
          </div>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-[#8E9299]' : 'text-slate-600'}`}>
            Manage your $100/month Quantara Institutional Software License, track crypto payment receipts, and verify transaction hashes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isSubscribed ? (
            <button
              onClick={() => openPaywall('payments_top_cta')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Subscribe ($100/mo)</span>
            </button>
          ) : (
            <button
              onClick={() => openPaywall('payments_renewal')}
              className={`px-4 py-2 rounded-xl border font-semibold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
                isDark
                  ? 'bg-[#141824] hover:bg-[#1C2234] border-[#273046] text-blue-300 hover:text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-blue-600 shadow-sm'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
              <span>Renew / Extend (+30 Days)</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab(isSubscribed ? 'dashboard' : 'landing')}
              className={`px-3.5 py-2 rounded-xl border font-medium text-xs transition-colors flex items-center space-x-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#141824] hover:bg-[#1E2538] border-[#232A3B] text-zinc-300 hover:text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <span>{isSubscribed ? 'Terminal' : 'Overview'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Auth Warning if Not Signed In */}
      {!user && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark
              ? 'border-amber-500/30 bg-amber-500/10'
              : 'border-amber-300 bg-amber-50 shadow-sm'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-200/60 text-amber-800'
              }`}
            >
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                Sign In Required to Track Your Payment History
              </h3>
              <p
                className={`text-xs mt-0.5 leading-relaxed ${
                  isDark ? 'text-amber-300/80' : 'text-amber-800/90'
                }`}
              >
                Payment history and software licenses are securely tied to your Quantara authenticated account. You must sign in first before subscribing so your payment and green verification badge are permanently preserved.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shrink-0 flex items-center space-x-2 cursor-pointer"
            >
              <User className="h-4 w-4" />
              <span>Sign In with Google / Email</span>
            </button>
          )}
        </div>
      )}

      {/* Grid: Active License Status + NOWPayments Checkout Embed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1 & 2: Active License Overview */}
        <div
          className={`lg:col-span-2 rounded-2xl border p-5 sm:p-6 space-y-5 ${
            isDark
              ? 'border-[#1E2433] bg-[#0E121E]'
              : 'border-slate-200 bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#8E9299]' : 'text-slate-500'
                }`}
              >
                Software License Status
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${
                isSubscribed
                  ? isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : isDark
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}
            >
              {isSubscribed ? 'ACTIVE LICENSE' : 'UNPAID / EXPIRED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div
              className={`p-4 rounded-xl border space-y-1 ${
                isDark
                  ? 'bg-[#141824] border-[#22293D]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                Monthly License Fee
              </span>
              <p className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                $100.00{' '}
                <span className={`text-xs font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  USD/mo
                </span>
              </p>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                NOWPayments Crypto Invoice
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-1 ${
                isDark
                  ? 'bg-[#141824] border-[#22293D]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                Access Remaining
              </span>
              <p className={`text-2xl font-bold font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {isSubscribed ? `${daysRemaining}d ${hoursRemaining}h` : '0 Days'}
              </p>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                30-day renewable access cycle
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border space-y-1 ${
                isDark
                  ? 'bg-[#141824] border-[#22293D]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-[11px] font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                Total Payments Tracked
              </span>
              <p className={`text-2xl font-bold font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {paymentHistory.length}{' '}
                <span className={`text-xs font-normal ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  (${totalSpent.toFixed(2)})
                </span>
              </p>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Encrypted in Firestore ledger
              </p>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDark
                ? 'bg-[#121622] border-[#1E2538]'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className={`font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                Current Plan:
              </span>
              <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {subscription.plan}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className={`font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                NOWPayments Invoice ID:
              </span>
              <div className="flex items-center space-x-2 font-mono">
                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  #5836437268
                </span>
                <button
                  onClick={handleCopyInvoice}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#1B2234] hover:bg-[#252E46] text-blue-300'
                      : 'bg-white hover:bg-slate-200 text-blue-600 border border-slate-300'
                  }`}
                  title="Copy Invoice ID"
                >
                  {copiedInvoice ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {subscription.expiresAt && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className={`font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                  Renewal / Expiration Date:
                </span>
                <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(subscription.expiresAt).toUTCString()}
                </span>
              </div>
            )}

            {subscription.transactionRef && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className={`font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                  Active Reference / Hash:
                </span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-mono max-w-[220px] truncate text-[11px] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {subscription.transactionRef}
                  </span>
                  <button
                    onClick={() => handleCopyTx(subscription.transactionRef!)}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#1B2234] hover:bg-[#252E46] text-blue-300'
                        : 'bg-white hover:bg-slate-200 text-blue-600 border border-slate-300'
                    }`}
                    title="Copy Transaction Reference"
                  >
                    {copiedTxId === subscription.transactionRef ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Pay with NOWPayments Button Code */}
        <div
          className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-5 ${
            isDark
              ? 'border-blue-500/30 bg-gradient-to-b from-[#10162A] to-[#0D111E]'
              : 'border-blue-200 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isDark ? 'text-blue-400' : 'text-blue-700'
                }`}
              >
                Crypto Checkout
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                $100 / Month
              </span>
            </div>

            <h2
              className={`text-base font-bold leading-snug ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Pay via Official NOWPayments Portal
            </h2>

            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Pay with BTC, USDT, ETH, LTC, SOL, or 100+ accepted cryptocurrencies. Once your payment confirms, enter your Payment ID or Transaction Hash below to unlock your terminal.
            </p>

            {/* Official Button Code Embed */}
            <div
              className={`pt-2 flex flex-col items-center justify-center p-3 rounded-xl border ${
                isDark
                  ? 'bg-[#090C14] border-[#1E2538]'
                  : 'bg-white border-slate-200 shadow-inner'
              }`}
            >
              <a
                href="https://nowpayments.io/payment/?iid=5836437268&source=button"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <img
                  src="https://nowpayments.io/images/embeds/payments-button-white.svg"
                  alt="Cryptocurrency & Bitcoin payment button by NOWPayments"
                  className="h-10 sm:h-11 w-auto"
                />
              </a>
              <span
                className={`text-[10px] mt-2 font-mono ${
                  isDark ? 'text-zinc-500' : 'text-slate-500'
                }`}
              >
                Invoice #5836437268 • Instant Settlement
              </span>
            </div>
          </div>

          {/* Verification Form */}
          <form
            onSubmit={handleVerify}
            className={`space-y-3 pt-3 border-t ${
              isDark ? 'border-[#1E2538]' : 'border-slate-200'
            }`}
          >
            <div>
              <label
                className={`block text-[11px] font-mono mb-1 font-semibold ${
                  isDark ? 'text-zinc-300' : 'text-slate-700'
                }`}
              >
                Verify Payment Reference <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="Paste NOWPayments ID or Tx Hash"
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-[#141824] border border-[#273046] text-white placeholder-zinc-500 focus:border-blue-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  {isVerifying ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              </div>
            </div>

            {/* Feedback alert */}
            {verificationFeedback.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs space-y-1 ${
                  verificationFeedback.status === 'success'
                    ? isDark
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : isDark
                    ? 'bg-red-500/15 border border-red-500/40 text-red-300'
                    : 'bg-red-50 border border-red-300 text-red-800'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold">
                  {verificationFeedback.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span>{verificationFeedback.message}</span>
                </div>
                {verificationFeedback.detail && (
                  <p className="text-[11px] leading-relaxed opacity-90 pl-5">
                    {verificationFeedback.detail}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Payment History Section */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDark
            ? 'border-[#1E2433] bg-[#0E121E]'
            : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        <div
          className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'border-[#1E2433]' : 'border-slate-200'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <FileText className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2
                className={`text-base font-bold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Payment History & Receipts Ledger
              </h2>
            </div>
            <p className={`text-xs ${isDark ? 'text-[#8E9299]' : 'text-slate-600'}`}>
              Permanent audit records of every subscription payment processed through NOWPayments.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>Records:</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {paymentHistory.length}
            </span>
            <span className={`ml-2 ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
              Total Paid:
            </span>
            <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ${totalSpent.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Table or Empty State */}
        {paymentHistory.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div
              className={`h-12 w-12 rounded-2xl border flex items-center justify-center mx-auto ${
                isDark
                  ? 'bg-[#141824] border-[#232A3B] text-[#8E9299]'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3
                className={`text-sm font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                No Payment Records Yet
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? 'text-[#8E9299]' : 'text-slate-600'
                }`}
              >
                {user
                  ? 'Once your first $100 monthly subscription payment is confirmed through NOWPayments invoice #5836437268, your payment receipt and transaction hash will be permanently stored here.'
                  : 'Please sign in to view your historical payment records and receipts.'}
              </p>
            </div>
            {!user ? (
              onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Sign In to View History
                </button>
              )
            ) : (
              <button
                onClick={() => openPaywall('empty_history_cta')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs transition-colors shadow-md cursor-pointer"
              >
                Pay $100 / Month via NOWPayments
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b font-mono text-[11px] uppercase tracking-wider ${
                    isDark
                      ? 'border-[#1E2433] bg-[#0A0D14]/70 text-[#8E9299]'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Receipt #</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Transaction Ref / Hash</th>
                  <th className="py-3.5 px-4 font-semibold">Access Validity</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y font-mono ${
                  isDark ? 'divide-[#181D2A]' : 'divide-slate-200'
                }`}
              >
                {paymentHistory.map((record) => (
                  <tr
                    key={record.id}
                    className={`transition-colors ${
                      isDark
                        ? 'hover:bg-[#131724]/60 text-zinc-300'
                        : 'hover:bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {new Date(record.timestamp).toLocaleDateString()}
                        </span>
                        <p className={`text-[10px] ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                        </p>
                      </div>
                    </td>

                    <td
                      className={`py-3.5 px-4 font-semibold ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}
                    >
                      {record.receiptNumber || `RCP-${record.id.slice(0, 8)}`}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ${record.amount.toFixed(2)}
                      </span>{' '}
                      <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {record.currency}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`max-w-[120px] sm:max-w-[160px] truncate ${
                            isDark ? 'text-zinc-300' : 'text-slate-800'
                          }`}
                        >
                          {record.transactionRef}
                        </span>
                        <button
                          onClick={() => handleCopyTx(record.transactionRef)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-[#1B2234] hover:bg-[#252E46] text-blue-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200'
                          }`}
                          title="Copy Transaction Hash"
                        >
                          {copiedTxId === record.transactionRef ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className={`py-3.5 px-4 text-[11px] ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                      <div>
                        <span>{new Date(record.validFrom).toLocaleDateString()}</span>
                        <span className={`mx-1 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>→</span>
                        <span
                          className={`font-semibold ${
                            isDark ? 'text-blue-300' : 'text-blue-700'
                          }`}
                        >
                          {new Date(record.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        30-day institutional access
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          record.status === 'CONFIRMED'
                            ? isDark
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : record.status === 'PENDING'
                            ? isDark
                              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                            : isDark
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(record)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-[11px] cursor-pointer border ${
                          isDark
                            ? 'bg-[#182032] hover:bg-[#202B44] text-blue-300 hover:text-white border-[#2A3654]'
                            : 'bg-white hover:bg-slate-100 text-blue-700 border-slate-300 shadow-sm'
                        }`}
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Payment Tracking & Verification Audit (Owner chekchris85@gmail.com only) */}
      {isAdmin && user?.email === 'chekchris85@gmail.com' && (
        <div
          className={`rounded-2xl border p-5 sm:p-6 space-y-6 ${
            isDark
              ? 'border-purple-500/30 bg-[#0F101A]'
              : 'border-purple-200 bg-purple-50/50 shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-500/20">
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isDark
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                    : 'bg-purple-100 border-purple-300 text-purple-800'
                }`}
              >
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2
                  className={`text-base font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Admin Payment Tracking & Audit Control
                </h2>
                <p className={`text-xs ${isDark ? 'text-purple-300/80' : 'text-purple-900/80'}`}>
                  Authorized platform operator view • Verified tracking on NOWPayments invoice #5836437268
                </p>
              </div>
            </div>

            <button
              onClick={loadAdminAudit}
              disabled={isLoadingAudit}
              className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#181A2B] hover:bg-[#22253D] border-purple-500/30 text-purple-300'
                  : 'bg-white hover:bg-purple-100 border-purple-300 text-purple-800 shadow-sm'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
              <span>Refresh Audit Log</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Box 1: IPN Webhook Integration */}
            <div
              className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
                isDark
                  ? 'bg-[#141626] border-purple-500/20'
                  : 'bg-white border-purple-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-purple-300' : 'text-purple-900'
                  }`}
                >
                  NOWPayments IPN Webhook URL
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  Ready & Listening
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Add this callback URL in your NOWPayments Dashboard (under <strong>Store Settings → Instant Payment Notifications (IPN)</strong>) to receive automatic blockchain confirmations:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/subscription/nowpayments-webhook`}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border select-all ${
                    isDark
                      ? 'bg-[#0B0D18] border-[#252844] text-purple-300'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm'
                  }`}
                >
                  {copiedWebhook ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Status: All arbitrary / fake IDs without confirmed payment are strictly blocked.
              </p>
            </div>

            {/* Box 2: Manual On-Chain Confirmation Tool */}
            <div
              className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
                isDark
                  ? 'bg-[#141626] border-purple-500/20'
                  : 'bg-white border-purple-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold uppercase tracking-wider ${
                    isDark ? 'text-purple-300' : 'text-purple-900'
                  }`}
                >
                  Manual Payment Approval (Admin)
                </span>
                <span className="text-[10px] font-mono text-purple-400">
                  Direct Blockchain Verification
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                If a customer sent crypto directly and sent you their transaction hash, you can manually credit and unlock their 30-day terminal:
              </p>

              <form onSubmit={handleManualApproveSubmit} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Payment ID or Tx Hash"
                    value={manualApproveId}
                    onChange={(e) => setManualApproveId(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border ${
                      isDark
                        ? 'bg-[#0B0D18] border-[#252844] text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <input
                    type="email"
                    placeholder="User Email (e.g. client@example.com)"
                    value={manualApproveEmail}
                    onChange={(e) => setManualApproveEmail(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border ${
                      isDark
                        ? 'bg-[#0B0D18] border-[#252844] text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Notes (optional, e.g. Verified on Etherscan)"
                    value={manualApproveNotes}
                    onChange={(e) => setManualApproveNotes(e.target.value)}
                    className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-mono border ${
                      isDark
                        ? 'bg-[#0B0D18] border-[#252844] text-white placeholder-zinc-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isApproving}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                  >
                    {isApproving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <span>Approve</span>}
                  </button>
                </div>

                {manualApproveMsg && (
                  <div
                    className={`p-2 rounded-lg text-xs font-mono ${
                      manualApproveMsg.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-600 border border-red-500/30'
                    }`}
                  >
                    {manualApproveMsg.text}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Verification Attempts Table */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isDark ? 'border-[#22253D] bg-[#0B0D18]' : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            <div className="p-3.5 border-b border-inherit flex items-center justify-between">
              <span className={`text-xs font-mono font-bold ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                Recent Verification Attempts Audit Log
              </span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Total logged: {adminAuditData?.attempts.length || 0}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
              {(!adminAuditData?.attempts || adminAuditData.attempts.length === 0) ? (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                  No verification attempts recorded yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead
                    className={`border-b text-[10px] uppercase ${
                      isDark ? 'bg-[#121422] text-zinc-400' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    <tr>
                      <th className="py-2 px-3">Time</th>
                      <th className="py-2 px-3">User</th>
                      <th className="py-2 px-3">Reference / Hash</th>
                      <th className="py-2 px-3">Result</th>
                      <th className="py-2 px-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#1A1D30]' : 'divide-slate-200'}`}>
                    {adminAuditData.attempts.slice(0, 15).map((att) => (
                      <tr key={att.id} className={isDark ? 'text-zinc-300' : 'text-slate-800'}>
                        <td className="py-2 px-3 text-[11px] whitespace-nowrap">
                          {new Date(att.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 font-medium whitespace-nowrap">
                          {att.userEmail}
                        </td>
                        <td className="py-2 px-3 max-w-[140px] truncate" title={att.reference}>
                          {att.reference}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.status === 'SUCCESS'
                                ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-600 border border-red-500/40'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-zinc-400">
                          {att.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Institutional Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border ${
              isDark
                ? 'bg-[#0D1017] border-[#1E2330] text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-start justify-between border-b pb-5 ${
                isDark ? 'border-[#1E2330]' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <QuantaraLogoMark size="sm" />
                <div>
                  <h3
                    className={`font-brand text-lg font-bold tracking-wider ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    QUANT<span className="text-blue-500">ARA</span>
                  </h3>
                  <p className={`text-[11px] font-mono ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                    Institutional Software License Receipt
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#141824] border-[#22293D] text-zinc-400 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Details Grid */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border text-xs font-mono ${
                isDark
                  ? 'bg-[#121622] border-[#1E2538]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>Receipt No:</span>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedReceipt.receiptNumber}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>Payment Date:</span>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {new Date(selectedReceipt.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>Provider:</span>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedReceipt.paymentProvider}
                </p>
              </div>
              <div>
                <span className={isDark ? 'text-[#8E9299]' : 'text-slate-500'}>Invoice ID:</span>
                <p className={`font-bold mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  #{selectedReceipt.invoiceId}
                </p>
              </div>
            </div>

            {/* User & Billed Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isDark
                    ? 'bg-[#121622] border-[#1E2538]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                  Licensed Operator
                </span>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedReceipt.userEmail}
                </p>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  UID: {selectedReceipt.userId}
                </p>
              </div>
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isDark
                    ? 'bg-[#121622] border-[#1E2538]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                  License Duration
                </span>
                <p className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  30 Days (Renewable)
                </p>
                <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {new Date(selectedReceipt.validFrom).toLocaleDateString()} — {new Date(selectedReceipt.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div
              className={`rounded-xl border overflow-hidden ${
                isDark ? 'border-[#1E2538]' : 'border-slate-200'
              }`}
            >
              <table className="w-full text-left text-xs font-mono">
                <thead
                  className={`border-b text-[10px] uppercase ${
                    isDark
                      ? 'bg-[#121622] border-[#1E2538] text-[#8E9299]'
                      : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Item Description</th>
                    <th className="py-2.5 px-4 text-right font-bold">Cycle</th>
                    <th className="py-2.5 px-4 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-[#1A2030]' : 'divide-slate-200'
                  }`}
                >
                  <tr>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedReceipt.plan}
                      </span>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Autonomous MetaTrader 5 execution engine, risk controls & compounding matrix
                      </p>
                    </td>
                    <td className={`py-3 px-4 text-right ${isDark ? 'text-zinc-300' : 'text-slate-800'}`}>
                      1 Month
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      ${selectedReceipt.amount.toFixed(2)} USD
                    </td>
                  </tr>
                </tbody>
                <tfoot
                  className={`border-t ${
                    isDark
                      ? 'bg-[#121622] border-[#1E2538]'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <tr>
                    <td
                      colSpan={2}
                      className={`py-2.5 px-4 font-bold text-right ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Total Paid:
                    </td>
                    <td
                      className={`py-2.5 px-4 font-bold text-right text-sm ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    >
                      ${selectedReceipt.amount.toFixed(2)} USD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cryptographic Transaction Hash */}
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono space-y-1 ${
                isDark
                  ? 'bg-[#090C14] border-[#1A2030]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
                Transaction Reference / Hash
              </span>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] break-all ${
                    isDark ? 'text-zinc-300' : 'text-slate-900 font-medium'
                  }`}
                >
                  {selectedReceipt.transactionRef}
                </span>
                <button
                  onClick={() => handleCopyTx(selectedReceipt.transactionRef)}
                  className={`p-1 rounded transition-colors shrink-0 ml-2 cursor-pointer ${
                    isDark
                      ? 'bg-[#1B2234] hover:bg-[#252E46] text-blue-300'
                      : 'bg-white hover:bg-slate-200 text-blue-700 border border-slate-300'
                  }`}
                >
                  {copiedTxId === selectedReceipt.transactionRef ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div
              className={`flex items-center justify-between pt-2 border-t ${
                isDark ? 'border-[#1E2330]' : 'border-slate-200'
              }`}
            >
              <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Verified Cryptographic Settlement • Quantara Intelligent Systems
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className={`px-3.5 py-2 rounded-xl border font-medium text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#141824] hover:bg-[#1C2234] border-[#273046] text-white'
                      : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
