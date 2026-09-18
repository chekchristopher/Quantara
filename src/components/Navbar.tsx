import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  Bell,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Cpu,
  Database,
  Layers,
  Menu,
  Play,
  Pause,
  Shield,
  Sliders,
  Sparkles,
  TrendingUp,
  User,
  X,
  Zap,
} from 'lucide-react';
import { BotState, NotificationItem, OfflineSessionStats, RiskSettings } from '../types';
import { QuantaraLogoMark } from './QuantaraLogo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  botState: BotState;
  riskSettings: RiskSettings;
  notifications: NotificationItem[];
  offlineSessionStats?: OfflineSessionStats;
  onToggleBot: () => void;
  onToggleTakeover?: () => void;
  onTriggerKillSwitch: () => void;
  onRequestLiveMode: () => void;
  onSwitchToPaper: () => void;
  onMarkNotificationsRead: () => void;
  onSelectSignalExplanation?: (id: string) => void;
  onOpenAuthModal?: () => void;
  onOpenOfflineReport?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  desc: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  botState,
  riskSettings,
  notifications,
  offlineSessionStats,
  onToggleBot,
  onToggleTakeover,
  onTriggerKillSwitch,
  onRequestLiveMode,
  onSwitchToPaper,
  onMarkNotificationsRead,
  onOpenAuthModal,
  onOpenOfflineReport,
}) => {
  const { user, profile, cloudSyncStatus } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close hamburger drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    ...(!user
      ? [
          {
            id: 'landing',
            label: 'Platform Overview',
            desc: 'System architecture, performance & strategy highlights',
            category: 'Platform',
            icon: Sparkles,
          },
        ]
      : []),
    {
      id: 'dashboard',
      label: 'Dashboard',
      desc: 'Live execution, order entry & real-time PnL chart',
      category: 'Core Terminal',
      icon: Activity,
    },
    {
      id: 'workbook',
      label: 'User Workbook',
      desc: 'Standard operating procedures, prompt guidelines & study modules',
      category: 'Core Terminal',
      icon: BookOpen,
    },
    {
      id: 'brokers',
      label: 'MT5 Servers & Reports',
      desc: 'Connected servers, automated trade reports & encrypted Firebase sync',
      category: 'Core Terminal',
      icon: Database,
    },
    {
      id: 'compounding',
      label: '$10 Wealth Engine',
      desc: 'Micro-capital geometric compounding matrix & risk tiers',
      category: 'Algorithms & Growth',
      icon: TrendingUp,
    },
    {
      id: 'engine',
      label: 'Trading Engine',
      desc: 'Multi-asset scanner, confluence triggers & autonomous logic',
      category: 'Algorithms & Growth',
      icon: Zap,
    },
    {
      id: 'strategies',
      label: 'Strategy Lab',
      desc: 'Regime shifter, scalping confluence & institutional momentum',
      category: 'Algorithms & Growth',
      icon: Layers,
    },
    {
      id: 'risk',
      label: 'Risk Controls',
      desc: 'Drawdown limits, dynamic lot sizing & instant kill switch',
      category: 'Risk & Safety',
      icon: Shield,
    },
    {
      id: 'backtesting',
      label: 'Backtesting',
      desc: 'Historical tick replay & Monte Carlo stress testing',
      category: 'Risk & Safety',
      icon: Cpu,
    },
    {
      id: 'testing',
      label: 'Test Suite',
      desc: 'Automated order dispatch & endpoint diagnostics',
      category: 'System & Telemetry',
      icon: CheckCircle,
    },
    {
      id: 'admin',
      label: 'Admin Telemetry',
      desc: 'System health, server metrics & Cloud Firestore sync',
      category: 'System & Telemetry',
      icon: Sliders,
    },
  ];

  const handleSelectNav = (tabId: string) => {
    onSelectTab(tabId);
    setMenuOpen(false);
  };

  const activeItem = navItems.find((n) => n.id === currentTab) || navItems[0];

  // Group items by category for clear hierarchical navigation
  const categories = Array.from(new Set(navItems.map((item) => item.category)));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0E0E11]/95 backdrop-blur-md">
        {/* Main Header Bar */}
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8 text-xs">
          {/* Left: Brand + Hamburger Menu Button */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {/* Primary Hamburger Menu Button */}
            <button
              id="navbar-hamburger-btn"
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all cursor-pointer select-none group ${
                menuOpen
                  ? 'bg-blue-600/25 border-blue-500/60 text-white ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'bg-[#141416] border-[#27272A] hover:border-blue-500/50 hover:bg-[#1B1D24] text-zinc-200 shadow-sm'
              }`}
              title="Open Navigation Menu (Dashboard, User Workbook, etc.)"
              aria-label="Navigation Menu"
            >
              {menuOpen ? (
                <X className="h-4 w-4 text-white shrink-0" />
              ) : (
                <Menu className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors shrink-0" />
              )}
              <span className="font-semibold text-xs text-white">Menu</span>
              {activeItem && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1C202E] text-blue-300 border border-[#2B3248] max-w-[130px] truncate">
                  {activeItem.label}
                </span>
              )}
            </button>

            {/* Brand Logo & Name */}
            <button
              onClick={() => onSelectTab(user ? 'dashboard' : currentTab === 'landing' ? 'dashboard' : 'landing')}
              className="flex items-center space-x-2 sm:space-x-3 text-left group transition-opacity hover:opacity-90 cursor-pointer"
              title={user ? 'Quantara Institutional Trading' : 'Click to toggle Platform Overview'}
            >
              <QuantaraLogoMark size="sm" />
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-brand text-base sm:text-lg font-extrabold tracking-[0.16em] sm:tracking-[0.18em] text-white flex items-center leading-none select-none group-hover:text-blue-300 transition-colors">
                    QUANT<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">ARA</span>
                  </span>
                  <span className="hidden xs:inline-flex rounded border border-blue-500/25 bg-blue-500/10 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-tech font-bold uppercase tracking-wider text-blue-400 leading-none">
                    INSTITUTIONAL
                  </span>
                </div>
                <p className="text-[10px] text-[#8E9299] tracking-wider uppercase font-medium font-tech hidden sm:flex items-center space-x-1.5 mt-1 leading-none">
                  <span>Intelligent Trading</span>
                  <span className="text-blue-500/70">•</span>
                  <span>Automated Execution</span>
                </p>
              </div>
            </button>

            {/* Engine Status & Time */}
            <div className="hidden lg:flex items-center pl-3 border-l border-[#1F1F23] space-x-2.5">
              <div className="flex items-center space-x-1.5 text-[#8E9299]">
                <div className={`w-1.5 h-1.5 rounded-full ${botState.isRunning ? 'bg-[#10B981]' : 'bg-yellow-400'}`} />
                <span className="text-[11px] font-mono">
                  {botState.isRunning ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8E9299]">{timeUtc}</span>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Paper / Live Switcher */}
            <div className="hidden md:flex items-center rounded-lg border border-[#1F1F23] bg-[#141416] p-0.5">
              <button
                onClick={onSwitchToPaper}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-all ${
                  botState.environment === 'paper'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 shadow-sm'
                    : 'text-[#8E9299] hover:text-white'
                }`}
              >
                PAPER
              </button>
              <button
                onClick={onRequestLiveMode}
                className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                  botState.environment === 'live'
                    ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 shadow-sm'
                    : 'text-[#8E9299] hover:text-[#EF4444]'
                }`}
              >
                <span>LIVE</span>
              </button>
            </div>

            {/* Autonomous Takeover Toggle */}
            {onToggleTakeover && (
              <button
                onClick={onToggleTakeover}
                className={`flex items-center space-x-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 sm:py-2 font-mono text-[11px] sm:text-xs font-semibold transition-all border ${
                  botState.autonomousTakeover
                    ? 'border-[#10B981]/50 bg-[#10B981]/15 text-[#10B981] shadow-sm shadow-[#10B981]/20'
                    : 'border-[#1F1F23] bg-[#141416] text-[#8E9299] hover:text-white'
                }`}
                title="Autonomous Software Takeover: Automatic trade execution directly on your connected broker"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${botState.autonomousTakeover ? 'bg-[#10B981] animate-pulse' : 'bg-zinc-600'}`} />
                <span className="hidden sm:inline">TAKEOVER:</span>
                <span className="font-bold">{botState.autonomousTakeover ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Quick Engine Resume/Pause Button */}
            <button
              onClick={onToggleBot}
              className={`hidden sm:flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition-all border ${
                botState.isRunning
                  ? 'border-[#1F1F23] bg-[#141416] text-[#E4E4E7] hover:bg-[#1F1F23]'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
              }`}
            >
              {botState.isRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>RESUME</span>
                </>
              )}
            </button>

            {/* Emergency Kill Switch */}
            <button
              onClick={onTriggerKillSwitch}
              className={`flex items-center space-x-1 sm:space-x-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                riskSettings.killSwitchActive
                  ? 'bg-[#DC2626] text-white animate-bounce ring-2 ring-red-400 shadow-red-900/40'
                  : 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-red-900/20'
              }`}
              title="Instant Kill Switch: Halts new executions and locks active positions"
            >
              <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xs:inline">{riskSettings.killSwitchActive ? 'LOCKED' : 'STOP'}</span>
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) onMarkNotificationsRead();
                }}
                className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[#1F1F23] bg-[#141416] text-[#8E9299] hover:border-[#3F3F46] hover:text-white transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white">
                        Notifications
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8E9299]">{notifications.length} events</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#1F1F23] mt-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#8E9299]">No recent notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-lg text-left transition-colors ${
                            !notif.read ? 'bg-[#1F1F23]/60' : 'hover:bg-[#1F1F23]/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                notif.severity === 'danger'
                                  ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                                  : notif.severity === 'warning'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : notif.severity === 'success'
                                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {notif.type}
                            </span>
                            <span className="text-[10px] text-[#8E9299] font-mono">
                              {new Date(notif.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-white">{notif.title}</p>
                          <p className="text-[11px] text-[#8E9299] mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise Auth & Account Profile Button */}
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className={`flex items-center space-x-2 rounded-lg border px-2 sm:px-3 py-1.5 text-xs font-medium transition-all ${
                  user
                    ? 'border-blue-500/40 bg-blue-950/25 hover:bg-blue-900/30 text-white shadow-sm'
                    : 'border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-200 hover:text-white'
                }`}
                title={user ? 'Account Profile & Preferred Picture' : 'Sign In'}
              >
                {user ? (
                  <>
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center font-mono text-[10px] font-bold text-blue-300 overflow-hidden shrink-0 shadow-sm ring-1 ring-blue-500/30">
                      {profile?.photoURL || user.photoURL ? (
                        <img
                          src={profile?.photoURL || user.photoURL}
                          alt={profile?.displayName || 'Profile'}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (profile?.displayName?.[0] || user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                      )}
                    </div>
                    <span className="hidden sm:inline font-mono text-[11px] font-semibold text-zinc-200 max-w-[110px] truncate">
                      {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {profile?.role || 'OPERATOR'}
                    </span>
                  </>
                ) : (
                  <>
                    {/* Google G Icon */}
                    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
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
                    <span className="font-medium hidden sm:inline">Sign In</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hamburger Navigation Drawer Modal (Covers all screen sizes seamlessly) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />

          {/* Left Slide-Out Navigation Panel */}
          <div
            id="hamburger-navigation-drawer"
            className="relative z-10 w-full max-w-sm sm:max-w-md bg-[#0D1017] border-r border-[#1E2330] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-200"
          >
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330] bg-[#090C12]/90">
              <div className="flex items-center space-x-3">
                <QuantaraLogoMark size="sm" />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-brand text-base font-extrabold tracking-wider text-white">
                      QUANT<span className="text-blue-400">ARA</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-blue-400 px-1.5 py-0.2 rounded bg-blue-500/10 border border-blue-500/20">
                      NAVIGATOR
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8E9299]">{timeUtc}</span>
                </div>
              </div>

              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg bg-[#151924] border border-[#232A3B] text-zinc-400 hover:text-white hover:bg-[#1E2538] transition-colors cursor-pointer"
                title="Close Navigation (Esc)"
                aria-label="Close Navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile & Database Snapshot */}
            <div className="p-4 border-b border-[#1E2330] bg-[#0E121E]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 border-2 border-blue-400/50 flex items-center justify-center font-mono text-xs font-bold text-blue-300 overflow-hidden shrink-0 shadow-md ring-1 ring-blue-500/30">
                    {profile?.photoURL || user?.photoURL ? (
                      <img
                        src={profile?.photoURL || user?.photoURL}
                        alt={profile?.displayName || 'Avatar'}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      (profile?.displayName?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {user ? profile?.displayName || user.displayName || user.email?.split('@')[0] : 'Guest Operator'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {user ? profile?.role || 'OPERATOR' : 'LOCAL'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8E9299] font-mono truncate max-w-[180px]">
                      {user ? user.email : 'DB: quantara-261d0'}
                    </p>
                  </div>
                </div>

                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/40 text-blue-200 transition-colors shrink-0 shadow-sm"
                  >
                    {user ? 'Account' : 'Sign In'}
                  </button>
                )}
              </div>

              {/* Quick Mode / State Toggles inside Drawer */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="rounded-lg bg-[#0A0D14] p-2 border border-[#1E2330] flex items-center justify-between">
                  <span className="text-[10px] text-[#8E9299] uppercase font-bold">Mode</span>
                  <div className="flex space-x-1">
                    <button
                      onClick={onSwitchToPaper}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        botState.environment === 'paper' ? 'bg-blue-600 text-white' : 'text-[#8E9299] hover:text-white'
                      }`}
                    >
                      PAPER
                    </button>
                    <button
                      onClick={onRequestLiveMode}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        botState.environment === 'live' ? 'bg-red-600 text-white' : 'text-[#8E9299] hover:text-white'
                      }`}
                    >
                      LIVE
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-[#0A0D14] p-2 border border-[#1E2330] flex items-center justify-between">
                  <span className="text-[10px] text-[#8E9299] uppercase font-bold">Engine</span>
                  <button
                    onClick={onToggleBot}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 ${
                      botState.isRunning
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}
                  >
                    {botState.isRunning ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                    <span>{botState.isRunning ? 'LIVE' : 'PAUSED'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Categorized Navigation Menu List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 divide-y divide-[#181C26]">
              {categories.map((category) => {
                const categoryItems = navItems.filter((i) => i.category === category);
                return (
                  <div key={category} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between px-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/80 font-mono">
                        {category}
                      </span>
                      <span className="text-[9px] text-[#6E727A] font-mono">
                        {categoryItems.length} items
                      </span>
                    </div>

                    <div className="space-y-1">
                      {categoryItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectNav(item.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600/25 to-blue-500/10 text-white font-semibold border border-blue-500/50 shadow-md shadow-blue-500/10'
                                : 'text-zinc-300 hover:bg-[#141824] hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-start space-x-3 min-w-0">
                              <div
                                className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                                  isActive
                                    ? 'bg-blue-500/30 text-blue-300 border border-blue-400/40'
                                    : 'bg-[#121622] text-[#8E9299] group-hover:text-blue-300 group-hover:bg-[#1A2030]'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs sm:text-sm font-semibold truncate text-white group-hover:text-blue-200 transition-colors">
                                    {item.label}
                                  </span>
                                  {isActive && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                                  )}
                                </div>
                                <p className="text-[11px] text-[#8E9299] font-sans truncate max-w-[220px] sm:max-w-[260px] leading-tight mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            <ChevronRight
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                isActive ? 'text-blue-400 translate-x-0.5' : 'text-zinc-600 group-hover:text-zinc-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Bottom Footer */}
            <div className="p-3 border-t border-[#1E2330] bg-[#090C12] flex items-center justify-between text-[11px] font-mono text-[#8E9299]">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Quantara v2.8 Core</span>
              </div>
              <span className="text-zinc-500">ESC to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E11]/95 backdrop-blur-xl border-t border-[#1F1F23] px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <Activity className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('workbook')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            currentTab === 'workbook' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <BookOpen className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">Workbook</span>
        </button>

        <button
          onClick={() => onSelectTab('compounding')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors relative ${
            currentTab === 'compounding' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <TrendingUp className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">$10 Wealth</span>
        </button>

        <button
          onClick={() => onSelectTab('brokers')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            currentTab === 'brokers' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <Database className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">Brokers</span>
        </button>

        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg text-blue-400 hover:text-white transition-colors"
        >
          <Menu className="h-4 w-4 mb-0.5" />
          <span className="text-[10px] font-semibold">All Tabs</span>
        </button>
      </nav>
    </>
  );
};
