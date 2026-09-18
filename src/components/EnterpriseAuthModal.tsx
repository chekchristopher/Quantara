import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Check,
  RefreshCw,
  Building,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuantaraLogoMark } from './QuantaraLogo';

interface EnterpriseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'reset' | 'profile';
  onLoginSuccess?: () => void;
  onSignOutSuccess?: () => void;
}

// Curated Institutional SVG-based Avatar Presets
const AVATAR_PRESETS = [
  {
    id: 'preset-quant',
    name: 'Apex Quant',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231E3A8A'/%3E%3Cstop offset='100%25' stop-color='%233B82F6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g1)'/%3E%3Cpath d='M50 20 L80 75 L20 75 Z' fill='none' stroke='%2393C5FD' stroke-width='6'/%3E%3Ccircle cx='50' cy='56' r='10' fill='%2360A5FA'/%3E%3Ccircle cx='50' cy='20' r='5' fill='%23FFFFFF'/%3E%3C/svg%3E",
  },
  {
    id: 'preset-gold',
    name: 'Gold Sniper',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2378350F'/%3E%3Cstop offset='100%25' stop-color='%23F59E0B'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g2)'/%3E%3Ccircle cx='50' cy='50' r='28' fill='none' stroke='%23FEF3C7' stroke-width='6'/%3E%3Cpath d='M50 26 L50 74 M26 50 L74 50' stroke='%23FDE68A' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='8' fill='%23F59E0B' stroke='%23FFFFFF' stroke-width='3'/%3E%3C/svg%3E",
  },
  {
    id: 'preset-bull',
    name: 'Apex Bull',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23064E3B'/%3E%3Cstop offset='100%25' stop-color='%2310B981'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g3)'/%3E%3Cpath d='M25 65 L45 42 L60 52 L80 30' fill='none' stroke='%23A7F3D0' stroke-width='6' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M68 30 L80 30 L80 42' fill='none' stroke='%23A7F3D0' stroke-width='6' stroke-linecap='round'/%3E%3Ccircle cx='80' cy='30' r='4' fill='%23FFFFFF'/%3E%3C/svg%3E",
  },
  {
    id: 'preset-falcon',
    name: 'Cyber Falcon',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23164E63'/%3E%3Cstop offset='100%25' stop-color='%2306B6D4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g4)'/%3E%3Cpath d='M20 40 Q50 20 80 40 Q50 70 20 40 Z' fill='none' stroke='%23CFFAFE' stroke-width='5'/%3E%3Ccircle cx='50' cy='42' r='8' fill='%2322D3EE'/%3E%3Cpath d='M35 60 L50 82 L65 60' stroke='%2367E8F9' stroke-width='4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  },
  {
    id: 'preset-shield',
    name: 'Alpha Sentinel',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234C1D95'/%3E%3Cstop offset='100%25' stop-color='%238B5CF6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g5)'/%3E%3Cpath d='M50 18 L76 30 V52 C76 68 50 82 50 82 C50 82 24 68 24 52 V30 Z' fill='none' stroke='%23DDD6FE' stroke-width='5'/%3E%3Cpath d='M42 50 L48 56 L60 42' fill='none' stroke='%23A78BFA' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  },
  {
    id: 'preset-core',
    name: 'Titan ECN',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23831843'/%3E%3Cstop offset='100%25' stop-color='%23EC4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100' height='100' rx='24' fill='url(%23g6)'/%3E%3Crect x='30' y='30' width='40' height='40' rx='8' transform='rotate(45 50 50)' fill='none' stroke='%23FBCFE8' stroke-width='5'/%3E%3Ccircle cx='50' cy='50' r='9' fill='%23F472B6'/%3E%3C/svg%3E",
  },
];

export const EnterpriseAuthModal: React.FC<EnterpriseAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onLoginSuccess,
  onSignOutSuccess,
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
    updateUserProfile,
    authError,
    clearError,
    cloudSyncStatus,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'profile'>(initialMode);
  const [profileTab, setProfileTab] = useState<'edit' | 'session'>('edit');
  const [guestView, setGuestView] = useState<'profile' | 'auth'>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Profile Editor Form State
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [customDisplayName, setCustomDisplayName] = useState<string>('');
  const [customDesk, setCustomDesk] = useState<string>('');
  const [customBio, setCustomBio] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isPhotoUrlInputOpen, setIsPhotoUrlInputOpen] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Populate state from profile or user when available
  useEffect(() => {
    if (user) {
      setCustomPhotoUrl(profile?.photoURL || user.photoURL || '');
      setCustomDisplayName(profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Operator');
      setCustomDesk(profile?.desk || 'XAU/USD Gold Spot Desk');
      setCustomBio(profile?.bio || 'Autonomous algorithmic trader specializing in micro-compounding and strict risk management.');
    } else if (profile) {
      setCustomPhotoUrl(profile.photoURL || '');
      setCustomDisplayName(profile.displayName || 'Guest Operator');
      setCustomDesk(profile.desk || 'XAU/USD Gold Spot Desk');
      setCustomBio(profile.bio || 'Autonomous algorithmic trader specializing in micro-compounding and strict risk management.');
    } else {
      try {
        const cached = localStorage.getItem('quantara_custom_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.photoURL) setCustomPhotoUrl(parsed.photoURL);
          if (parsed.displayName) setCustomDisplayName(parsed.displayName);
          if (parsed.desk) setCustomDesk(parsed.desk);
          if (parsed.bio) setCustomBio(parsed.bio);
        }
      } catch (e) {}
    }
  }, [user, profile]);

  if (!isOpen) return null;

  // Process any image file (from file picker, camera, or drag-and-drop)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image (JPG, PNG, WebP, or SVG).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setImageUploadError('Selected image is too large (>12MB). Please choose a smaller image.');
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string;
      // If svg, can use data-url directly
      if (file.type.includes('svg')) {
        setCustomPhotoUrl(src);
        return;
      }

      // Draw onto canvas to resize to crisp 240x240 square
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 240;
        const w = img.width;
        const h = img.height;
        // Determine square crop from center
        const size = Math.min(w, h);
        const startX = (w - size) / 2;
        const startY = (h - size) / 2;

        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE);
          // Compress to WebP or JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setCustomPhotoUrl(dataUrl);
        }
      };
      img.onerror = () => {
        setImageUploadError('Could not process this image file. Please try another format.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Handle local image file upload with downsampling & compression
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    // Reset file input so re-selecting same file triggers onChange
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Handle direct image URL input
  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setCustomPhotoUrl(urlInput.trim());
    setUrlInput('');
    setIsPhotoUrlInputOpen(false);
  };

  // Save changes to profile & photo in Firestore and AuthContext
  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      await updateUserProfile({
        displayName: customDisplayName.trim(),
        photoURL: customPhotoUrl.trim(),
        desk: customDesk.trim(),
        bio: customBio.trim(),
      });
      setProfileFeedback({
        type: 'success',
        text: 'Profile and picture successfully updated across your trading workspace!',
      });
      setTimeout(() => {
        setProfileFeedback(null);
      }, 4000);
    } catch (err: any) {
      setProfileFeedback({
        type: 'error',
        text: err.message || 'Failed to save profile changes.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    clearError();
    try {
      await signInWithGoogle();
      setSuccessMessage('Successfully authenticated via Google.');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 900);
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
        setSuccessMessage('Authenticated. Launching trading terminal...');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 900);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMessage('Account provisioned. Verification email dispatched.');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 1100);
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
    if (onSignOutSuccess) {
      onSignOutSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#262A36] bg-[#0E1017] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Gradient Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-[#1A1D27] shrink-0">
          <div className="flex items-center space-x-2.5">
            <QuantaraLogoMark size="sm" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-brand text-sm font-extrabold tracking-wider text-white">
                  QUANTARA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {user ? 'Operator Profile' : 'Cloud DB'}
                </span>
              </div>
              <p className="text-[10px] text-[#8E9299] font-mono">
                {user ? user.email : 'Project: quantara-261d0'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8E9299] hover:bg-[#1A1D27] hover:text-white transition-colors"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Top Tabs: Switcher for Authenticated User or Guest */}
          {user ? (
            <div className="flex rounded-lg bg-[#141722] p-1 border border-[#202534]">
              <button
                type="button"
                onClick={() => setProfileTab('edit')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  profileTab === 'edit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Profile & Custom Picture</span>
              </button>
              <button
                type="button"
                onClick={() => setProfileTab('session')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  profileTab === 'session'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Account & Cloud Status</span>
              </button>
            </div>
          ) : (
            <div className="flex rounded-lg bg-[#141722] p-1 border border-[#202534]">
              <button
                type="button"
                onClick={() => setGuestView('profile')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  guestView === 'profile'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Profile & Custom Picture</span>
              </button>
              <button
                type="button"
                onClick={() => setGuestView('auth')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center space-x-1.5 ${
                  guestView === 'auth'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Cloud Sign In / Gmail</span>
              </button>
            </div>
          )}

          {/* Profile & Custom Picture Editor Form */}
          {((user && profileTab === 'edit') || (!user && guestView === 'profile')) && (
            <form onSubmit={handleSaveProfileChanges} className="space-y-4 text-left">
                  {/* Avatar Showcase & Uploader Container */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`rounded-xl border p-4 space-y-3.5 transition-all relative ${
                      isDragging
                        ? 'border-blue-400 bg-blue-500/15 border-dashed ring-2 ring-blue-500/30'
                        : 'border-[#222838] bg-[#121520]'
                    }`}
                  >
                    {isDragging && (
                      <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center z-10 text-white space-y-1">
                        <Upload className="h-8 w-8 animate-bounce" />
                        <p className="font-tech font-bold uppercase tracking-wider text-xs">Drop Image to Set Profile Picture</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar Circle with live preview */}
                      <div className="relative group shrink-0 mx-auto sm:mx-0">
                        <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-full ring-2 ring-blue-500/50 ring-offset-2 ring-offset-[#0E1017] bg-[#171B28] flex items-center justify-center overflow-hidden shadow-lg transition-transform group-hover:scale-105">
                          {customPhotoUrl ? (
                            <img
                              src={customPhotoUrl}
                              alt="Profile Avatar"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                              onError={() => {
                                setImageUploadError('Image URL failed to load. Please verify link.');
                              }}
                            />
                          ) : (
                            <span className="font-mono text-2xl font-bold text-blue-400">
                              {(customDisplayName || user?.email || 'O')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Quick Camera button trigger */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500 transition-all border border-[#0E1017]"
                          title="Upload image file from device"
                        >
                          <Camera className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Photo Actions & Explanations */}
                      <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                        <div>
                          <p className="text-xs font-bold text-white font-tech uppercase tracking-wide">
                            Preferred Profile Picture
                          </p>
                          <p className="text-[11px] text-[#8E9299] mt-0.5 leading-relaxed">
                            Upload your personal picture from your device, snap a photo with your camera, enter any photo URL, or select an institutional avatar preset.
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          {/* Hidden File Input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />
                          {/* Hidden Camera Input */}
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            onChange={handleImageFileUpload}
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-mono font-semibold transition-colors"
                          >
                            <Upload className="h-3 w-3" />
                            <span>Upload File</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-semibold transition-colors"
                            title="Snap picture directly using your device camera"
                          >
                            <Camera className="h-3 w-3" />
                            <span>Camera</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsPhotoUrlInputOpen(!isPhotoUrlInputOpen)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181C28] hover:bg-[#202636] text-zinc-300 hover:text-white border border-[#2B3245] text-[11px] font-mono font-medium transition-colors"
                          >
                            <LinkIcon className="h-3 w-3 text-blue-400" />
                            <span>Link URL</span>
                          </button>

                          {customPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomPhotoUrl('');
                                setImageUploadError(null);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-[11px] font-mono transition-colors"
                              title="Remove custom picture and use initials"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <p className="text-[10px] text-[#6E7382] font-mono">
                          Tip: Drag & drop any image file directly onto this box
                        </p>
                      </div>
                    </div>

                    {/* Optional URL Input Popover */}
                    {isPhotoUrlInputOpen && (
                      <div className="p-2.5 rounded-lg bg-[#0A0D14] border border-blue-500/30 space-y-2 animate-in fade-in">
                        <label className="block text-[10px] font-mono text-[#8E9299]">
                          Paste Image URL (Gravatar, GitHub, Discord, WebP/PNG):
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="flex-1 rounded-lg border border-[#222838] bg-[#141724] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyUrl}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Image Upload / Parsing Error */}
                    {imageUploadError && (
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center space-x-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{imageUploadError}</span>
                      </div>
                    )}

                    {/* Curated Institutional Avatars Preset Strip */}
                    <div className="pt-2 border-t border-[#1C2130]">
                      <span className="block text-[10px] font-mono text-[#8E9299] mb-1.5 uppercase tracking-wider">
                        Or select an Institutional Emblem:
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {AVATAR_PRESETS.map((p) => {
                          const isSelected = customPhotoUrl === p.url;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setCustomPhotoUrl(p.url);
                                setImageUploadError(null);
                              }}
                              className={`flex flex-col items-center p-1.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-600/20 ring-1 ring-blue-500'
                                  : 'border-[#222838] bg-[#0E111A] hover:border-zinc-600 hover:bg-[#151926]'
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full overflow-hidden shrink-0">
                                <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
                              </div>
                              <span className="text-[9px] font-mono text-zinc-300 mt-1 truncate max-w-full text-center">
                                {p.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Profile Detail Fields */}
                  <div className="space-y-3">
                    {/* Operator Name */}
                    <div>
                      <label className="block text-[11px] font-mono text-[#8E9299] mb-1">
                        Operator Display Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6E7382]" />
                        <input
                          type="text"
                          required
                          value={customDisplayName}
                          onChange={(e) => setCustomDisplayName(e.target.value)}
                          placeholder="e.g. Chris Chek"
                          className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Trading Desk */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-mono text-[#8E9299]">
                          Assigned Trading Desk
                        </label>
                        <span className="text-[9px] font-mono text-blue-400">Institutional Unit</span>
                      </div>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6E7382]" />
                        <input
                          type="text"
                          value={customDesk}
                          onChange={(e) => setCustomDesk(e.target.value)}
                          placeholder="e.g. XAU/USD Gold Spot Desk"
                          className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none font-mono"
                        />
                      </div>
                      {/* Quick Desk Chips */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['XAU/USD Gold Desk', 'FX Spot Liquidity', 'Prop Challenge', 'Autonomous Algo'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setCustomDesk(d)}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141724] text-[#8E9299] hover:text-white border border-[#222838] transition-colors"
                          >
                            + {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Operator Bio */}
                    <div>
                      <label className="block text-[11px] font-mono text-[#8E9299] mb-1">
                        Operator Notes / Philosophy
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#6E7382]" />
                        <textarea
                          rows={2}
                          value={customBio}
                          onChange={(e) => setCustomBio(e.target.value)}
                          placeholder="Trading philosophy, asymmetric goals, risk limits..."
                          className="w-full rounded-lg border border-[#262B3B] bg-[#141724] pl-9 pr-3 py-2 text-xs text-white placeholder-[#5A5F70] focus:border-blue-500 focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {profileFeedback && (
                    <div
                      className={`p-2.5 rounded-lg border flex items-center space-x-2 text-xs animate-in fade-in ${
                        profileFeedback.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/40 border-red-500/40 text-red-200'
                      }`}
                    >
                      {profileFeedback.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  {/* Save Profile Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="w-full sm:flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 py-2.5 px-4 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving to Cloud Database...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Save Profile & Picture</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onLoginSuccess) onLoginSuccess();
                        onClose();
                      }}
                      className="w-full sm:w-auto rounded-xl border border-[#262A36] bg-[#141722] hover:bg-[#1A1E2C] py-2.5 px-4 text-xs font-semibold text-zinc-300 hover:text-white transition-colors text-center"
                    >
                      Return to Terminal
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Account & Cloud Status */}
              {user && profileTab === 'session' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-300 text-sm overflow-hidden shrink-0">
                        {customPhotoUrl ? (
                          <img
                            src={customPhotoUrl}
                            alt="Avatar"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.email?.[0].toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-bold text-white truncate">
                            {customDisplayName || profile?.displayName || user.displayName || user.email}
                          </p>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {profile?.role || 'OPERATOR'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8E9299] truncate font-mono mt-0.5">
                          {user.email}
                        </p>
                        <p className="text-[10px] text-cyan-300 font-mono mt-0.5">
                          Desk: {customDesk || profile?.desk || 'Institutional FX & Gold'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-[#8E9299]">Database Tier:</span>
                        <p className="text-emerald-300 font-semibold">{profile?.enterpriseTier || 'Dedicated Cloud'}</p>
                      </div>
                      <div>
                        <span className="text-[#8E9299]">Email Verification:</span>
                        <p className="flex items-center space-x-1 text-white">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>{user.emailVerified ? 'Verified' : 'Active Account'}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[#8E9299]">Cloud DB Sync:</span>
                        <p className="text-cyan-300 font-semibold uppercase">{cloudSyncStatus}</p>
                      </div>
                      <div>
                        <span className="text-[#8E9299]">Security Protocol:</span>
                        <p className="text-emerald-400 font-semibold">TLS 1.3 / ABAC Rules</p>
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
                        type="button"
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
                      onClick={() => {
                        if (onLoginSuccess) onLoginSuccess();
                        onClose();
                      }}
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
              )}

          {/* Cloud Sign In / Institutional Auth for Guests */}
          {!user && guestView === 'auth' && (
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
                      placeholder="operator@quantara.internal"
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
                      ? 'Sign In & Enter Dashboard'
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

