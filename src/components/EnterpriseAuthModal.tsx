import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuantaraLogoMark } from './QuantaraLogo';

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset';
}

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    user,
    profile,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendPasswordReset,
    resendVerification,
    authError,
    clearError,
    cloudSyncStatus,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError();
    try {
      await signInWithGoogle();
      setSuccessMessage('Successfully authenticated via Google.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError();

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
        setSuccessMessage('Authenticated. Connecting enterprise workspace...');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMessage('Account provisioned. Verification email dispatched.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'reset') {
        await sendPasswordReset(email);
        setSuccessMessage('Password reset link sent to your email.');
      }
    } catch (err: any) {
      // Error surfaced in authError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    await signOut();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[#262A36] bg-[#0E1017] shadow-2xl overflow-hidden">
        {/* Top Gradient Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1A1D27]">
          <div className="flex items-center space-x-2.5">
            <QuantaraLogoMark size="sm" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-brand text-sm font-extrabold tracking-wider text-white">
                  QUANTARA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Cloud DB
                </span>
              </div>
              <p className="text-[10px] text-[#8E9299] font-mono">
                Project ID: quantara-261d0
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#8E9299] hover:bg-[#1A1D27] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* If already authenticated, show user info & session controls */}
          {user ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-300 text-sm overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      user.email?.[0].toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-white truncate">
                        {profile?.displayName || user.displayName || user.email}
                      </p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {profile?.role || 'OPERATOR'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E9299] truncate font-mono mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div>
                    <span className="text-[#8E9299]">Database Tier:</span>
                    <p className="text-emerald-300 font-semibold">{profile?.enterpriseTier || 'Standard'}</p>
                  </div>
                  <div>
                    <span className="text-[#8E9299]">Gmail / Email:</span>
                    <p className="flex items-center space-x-1 text-white">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>{user.emailVerified ? 'Verified' : 'Active'}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[#8E9299]">Sync Status:</span>
                    <p className="text-cyan-300 font-semibold uppercase">{cloudSyncStatus}</p>
                  </div>
                  <div>
                    <span className="text-[#8E9299]">Encryption:</span>
                    <p className="text-emerald-400 font-semibold">AES-256 Cloud</p>
                  </div>
                </div>
              </div>

              {!user.emailVerified && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-yellow-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Email verification pending.</span>
                  </div>
                  <button
                    onClick={() => resendVerification()}
                    className="px-2.5 py-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 text-[11px] font-mono font-semibold"
                  >
                    Resend
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-[#262A36] bg-[#141722] hover:bg-[#1A1E2C] py-2 text-xs font-semibold text-white transition-colors"
                >
                  Return to Terminal
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSubmitting}
                  className="rounded-lg border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 px-4 py-2 text-xs font-semibold text-red-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Google / Gmail Single Click Authentication */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-3 rounded-xl border border-[#2C3142] bg-[#151926] hover:bg-[#1C2234] hover:border-blue-500/50 py-2.5 px-4 text-xs font-semibold text-white transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                {/* Official Google G SVG */}
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Gmail / Google Account</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#1F2330]" />
                <span className="absolute bg-[#0E1017] px-2 text-[10px] uppercase font-mono tracking-widest text-[#6E7382]">
                  Or Institutional Email
                </span>
              </div>

              {/* Tab Selector */}
              <div className="flex rounded-lg bg-[#141722] p-1 border border-[#202534]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    clearError();
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    mode === 'signin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    clearError();
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    mode === 'signup'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    clearError();
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    mode === 'reset'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Reset
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3 text-left">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E9299] mb-1">
                      Operator Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-[#6E7382]" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-[#8E9299] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#6E7382]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@hedgefund.com"
                      className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-[#8E9299]">Password</label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setMode('reset')}
                          className="text-[10px] font-mono text-blue-400 hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#6E7382]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-9 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[#6E7382] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-mono text-[#8E9299] mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#6E7382]" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {authError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 flex items-start space-x-2 text-red-300 text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMessage && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center space-x-2 text-emerald-300 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <span>
                    {mode === 'signin'
                      ? 'Sign In to Quantara'
                      : mode === 'signup'
                      ? 'Create Operator Account'
                      : 'Send Reset Instructions'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          )}

          {/* Enterprise Compliance Notice */}
          <div className="pt-2 border-t border-[#181B26] flex items-center justify-between text-[10px] font-mono text-[#6E7382]">
            <div className="flex items-center space-x-1">
              <Database className="h-3 w-3 text-blue-400" />
              <span>DB: quantara-261d0</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>TLS 1.3 / ABAC Rules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
