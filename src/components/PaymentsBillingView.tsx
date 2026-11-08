import React, { useState } from 'react';
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
    <div className="min-h-screen bg-[#0A0D14] text-white p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1F2433]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-brand">
              Payments & Billing History
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
              NOWPayments Gateway
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8E9299]">
            Manage your $100/month Quantara Institutional Software License, track crypto payment receipts, and verify transaction hashes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {!isSubscribed ? (
            <button
              onClick={() => openPaywall('payments_top_cta')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center space-x-2"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Subscribe ($100/mo)</span>
            </button>
          ) : (
            <button
              onClick={() => openPaywall('payments_renewal')}
              className="px-4 py-2 rounded-xl bg-[#141824] hover:bg-[#1C2234] border border-[#273046] text-blue-300 hover:text-white font-semibold text-xs transition-all flex items-center space-x-2"
            >
              <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
              <span>Renew / Extend (+30 Days)</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab(isSubscribed ? 'dashboard' : 'landing')}
              className="px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1E2538] border border-[#232A3B] text-zinc-300 hover:text-white font-medium text-xs transition-colors flex items-center space-x-1.5"
            >
              <span>{isSubscribed ? 'Terminal' : 'Overview'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Auth Warning if Not Signed In */}
      {!user && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                Sign In Required to Track Your Payment History
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                Payment history and software licenses are securely tied to your Quantara authenticated account. You must sign in first before subscribing so your payment and green verification badge are permanently preserved.
              </p>
            </div>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shrink-0 flex items-center space-x-2"
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
        <div className="lg:col-span-2 rounded-2xl border border-[#1E2433] bg-[#0E121E] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  isSubscribed ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8E9299]">
                Software License Status
              </span>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${
                isSubscribed
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isSubscribed ? 'ACTIVE LICENSE' : 'UNPAID / EXPIRED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#141824] border border-[#22293D] space-y-1">
              <span className="text-[11px] font-mono text-[#8E9299]">Monthly License Fee</span>
              <p className="text-2xl font-bold font-mono text-white">$100.00 <span className="text-xs font-normal text-zinc-400">USD/mo</span></p>
              <p className="text-[10px] text-zinc-500">NOWPayments Crypto Invoice</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141824] border border-[#22293D] space-y-1">
              <span className="text-[11px] font-mono text-[#8E9299]">Access Remaining</span>
              <p className="text-2xl font-bold font-mono text-blue-400">
                {isSubscribed ? `${daysRemaining}d ${hoursRemaining}h` : '0 Days'}
              </p>
              <p className="text-[10px] text-zinc-500">30-day renewable access cycle</p>
            </div>

            <div className="p-4 rounded-xl bg-[#141824] border border-[#22293D] space-y-1">
              <span className="text-[11px] font-mono text-[#8E9299]">Total Payments Tracked</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">
                {paymentHistory.length} <span className="text-xs font-normal text-zinc-400">(${totalSpent.toFixed(2)})</span>
              </p>
              <p className="text-[10px] text-zinc-500">Encrypted in Firestore ledger</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121622] border border-[#1E2538] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="text-[#8E9299] font-mono">Current Plan:</span>
              <span className="text-white font-semibold font-mono">{subscription.plan}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="text-[#8E9299] font-mono">NOWPayments Invoice ID:</span>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-white">#5836437268</span>
                <button
                  onClick={handleCopyInvoice}
                  className="p-1 rounded bg-[#1B2234] hover:bg-[#252E46] text-blue-300 transition-colors"
                  title="Copy Invoice ID"
                >
                  {copiedInvoice ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {subscription.expiresAt && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className="text-[#8E9299] font-mono">Renewal / Expiration Date:</span>
                <span className="text-white font-mono font-medium">
                  {new Date(subscription.expiresAt).toUTCString()}
                </span>
              </div>
            )}

            {subscription.transactionRef && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <span className="text-[#8E9299] font-mono">Active Reference / Hash:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-mono max-w-[220px] truncate text-[11px]">
                    {subscription.transactionRef}
                  </span>
                  <button
                    onClick={() => handleCopyTx(subscription.transactionRef!)}
                    className="p-1 rounded bg-[#1B2234] hover:bg-[#252E46] text-blue-300 transition-colors"
                    title="Copy Transaction Reference"
                  >
                    {copiedTxId === subscription.transactionRef ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
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
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-b from-[#10162A] to-[#0D111E] p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                Crypto Checkout
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                $100 / Month
              </span>
            </div>

            <h2 className="text-base font-bold text-white leading-snug">
              Pay via Official NOWPayments Portal
            </h2>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Pay with BTC, USDT, ETH, LTC, SOL, or 100+ accepted cryptocurrencies. Once your payment confirms, enter your Payment ID or Transaction Hash below to unlock your terminal.
            </p>

            {/* Official Button Code Embed */}
            <div className="pt-2 flex flex-col items-center justify-center p-3 rounded-xl bg-[#090C14] border border-[#1E2538]">
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
              <span className="text-[10px] text-zinc-500 mt-2 font-mono">Invoice #5836437268 • Instant Settlement</span>
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-3 pt-3 border-t border-[#1E2538]">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Verify Payment Reference <span className="text-red-400">*</span>
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  placeholder="Paste NOWPayments ID or Tx Hash"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#141824] border border-[#273046] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold text-xs transition-colors shrink-0 flex items-center space-x-1"
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
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/40 text-red-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold">
                  {verificationFeedback.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
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
      <div className="rounded-2xl border border-[#1E2433] bg-[#0E121E] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#1E2433] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <h2 className="text-base font-bold text-white">Payment History & Receipts Ledger</h2>
            </div>
            <p className="text-xs text-[#8E9299]">
              Permanent audit records of every subscription payment processed through NOWPayments.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="text-[#8E9299]">Records:</span>
            <span className="text-white font-bold">{paymentHistory.length}</span>
            <span className="text-[#8E9299] ml-2">Total Paid:</span>
            <span className="text-emerald-400 font-bold">${totalSpent.toFixed(2)} USD</span>
          </div>
        </div>

        {/* Table or Empty State */}
        {paymentHistory.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-[#141824] border border-[#232A3B] flex items-center justify-center mx-auto text-[#8E9299]">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-semibold text-white">No Payment Records Yet</h3>
              <p className="text-xs text-[#8E9299] leading-relaxed">
                {user
                  ? 'Once your first $100 monthly subscription payment is confirmed through NOWPayments invoice #5836437268, your payment receipt and transaction hash will be permanently stored here.'
                  : 'Please sign in to view your historical payment records and receipts.'}
              </p>
            </div>
            {!user ? (
              onOpenAuthModal && (
                <button
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                >
                  Sign In to View History
                </button>
              )
            ) : (
              <button
                onClick={() => openPaywall('empty_history_cta')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs transition-colors shadow-md"
              >
                Pay $100 / Month via NOWPayments
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2433] bg-[#0A0D14]/70 font-mono text-[11px] text-[#8E9299] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Receipt #</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Transaction Ref / Hash</th>
                  <th className="py-3.5 px-4 font-semibold">Access Validity</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181D2A] font-mono">
                {paymentHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-[#131724]/60 transition-colors">
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div>
                        <span className="font-semibold text-white">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </span>
                        <p className="text-[10px] text-[#8E9299]">
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-blue-300 font-semibold">
                      {record.receiptNumber || `RCP-${record.id.slice(0, 8)}`}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-bold">${record.amount.toFixed(2)}</span>{' '}
                      <span className="text-[10px] text-zinc-400">{record.currency}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-zinc-300 max-w-[120px] sm:max-w-[160px] truncate">
                          {record.transactionRef}
                        </span>
                        <button
                          onClick={() => handleCopyTx(record.transactionRef)}
                          className="p-1 rounded bg-[#1B2234] hover:bg-[#252E46] text-blue-300 transition-colors"
                          title="Copy Transaction Hash"
                        >
                          {copiedTxId === record.transactionRef ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-zinc-300">
                      <div>
                        <span>{new Date(record.validFrom).toLocaleDateString()}</span>
                        <span className="text-zinc-500 mx-1">→</span>
                        <span className="text-blue-300 font-semibold">{new Date(record.validUntil).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">30-day institutional access</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          record.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : record.status === 'PENDING'
                            ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(record)}
                        className="px-2.5 py-1 rounded-lg bg-[#182032] hover:bg-[#202B44] text-blue-300 hover:text-white border border-[#2A3654] font-medium transition-colors text-[11px]"
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

      {/* Institutional Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-[#0D1017] border border-[#1E2330] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1E2330] pb-5">
              <div className="flex items-center space-x-3">
                <QuantaraLogoMark size="sm" />
                <div>
                  <h3 className="font-brand text-lg font-bold tracking-wider text-white">
                    QUANT<span className="text-blue-400">ARA</span>
                  </h3>
                  <p className="text-[11px] font-mono text-[#8E9299]">Institutional Software License Receipt</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 rounded-lg bg-[#141824] border border-[#22293D] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#121622] border border-[#1E2538] text-xs font-mono">
              <div>
                <span className="text-[#8E9299]">Receipt No:</span>
                <p className="font-bold text-white mt-0.5">{selectedReceipt.receiptNumber}</p>
              </div>
              <div>
                <span className="text-[#8E9299]">Payment Date:</span>
                <p className="font-bold text-white mt-0.5">{new Date(selectedReceipt.timestamp).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-[#8E9299]">Provider:</span>
                <p className="font-bold text-white mt-0.5">{selectedReceipt.paymentProvider}</p>
              </div>
              <div>
                <span className="text-[#8E9299]">Invoice ID:</span>
                <p className="font-bold text-blue-400 mt-0.5">#{selectedReceipt.invoiceId}</p>
              </div>
            </div>

            {/* User & Billed Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#121622] border border-[#1E2538] space-y-1">
                <span className="text-[#8E9299] text-[10px] uppercase font-bold">Licensed Operator</span>
                <p className="text-white font-semibold">{selectedReceipt.userEmail}</p>
                <p className="text-[10px] text-zinc-500">UID: {selectedReceipt.userId}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#121622] border border-[#1E2538] space-y-1">
                <span className="text-[#8E9299] text-[10px] uppercase font-bold">License Duration</span>
                <p className="text-emerald-400 font-semibold">30 Days (Renewable)</p>
                <p className="text-[10px] text-zinc-400">
                  {new Date(selectedReceipt.validFrom).toLocaleDateString()} — {new Date(selectedReceipt.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-xl border border-[#1E2538] overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#121622] border-b border-[#1E2538] text-[10px] text-[#8E9299] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-right">Cycle</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2030]">
                  <tr>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">{selectedReceipt.plan}</span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Autonomous MetaTrader 5 execution engine, risk controls & compounding matrix
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300">1 Month</td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ${selectedReceipt.amount.toFixed(2)} USD
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-[#121622] border-t border-[#1E2538]">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-4 font-bold text-white text-right">Total Paid:</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-400 text-right text-sm">
                      ${selectedReceipt.amount.toFixed(2)} USD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cryptographic Transaction Hash */}
            <div className="p-3.5 rounded-xl bg-[#090C14] border border-[#1A2030] text-xs font-mono space-y-1">
              <span className="text-[10px] text-[#8E9299] uppercase font-bold">Transaction Reference / Hash</span>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 text-[11px] break-all">{selectedReceipt.transactionRef}</span>
                <button
                  onClick={() => handleCopyTx(selectedReceipt.transactionRef)}
                  className="p-1 rounded bg-[#1B2234] hover:bg-[#252E46] text-blue-300 shrink-0 ml-2"
                >
                  {copiedTxId === selectedReceipt.transactionRef ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E2330]">
              <span className="text-[11px] font-mono text-zinc-500">
                Verified Cryptographic Settlement • Quantara Intelligent Systems
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1C2234] border border-[#273046] text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
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
