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
  RefreshCw,
  Shield,
  Sliders,
  TrendingUp,
  User,
  X,
  Zap,
  Terminal,
} from 'lucide-react';
import { BotState, EnvironmentMode, NotificationItem, RiskSettings, TradingMode } from '../types';
import { QuantaraLogoMark } from './QuantaraLogo';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  botState: BotState;
  riskSettings: RiskSettings;
  notifications: NotificationItem[];
  onToggleBot: () => void;
  onToggleTakeover?: () => void;
  onTriggerKillSwitch: () => void;
  onRequestLiveMode: () => void;
  onSwitchToPaper: () => void;
  onMarkNotificationsRead: () => void;
  onSelectSignalExplanation?: (id: string) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  botState,
  riskSettings,
  notifications,
  onToggleBot,
  onToggleTakeover,
  onTriggerKillSwitch,
  onRequestLiveMode,
  onSwitchToPaper,
  onMarkNotificationsRead,
  onOpenAuthModal,
}) => {
  const { user, profile, cloudSyncStatus } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeUtc(now.toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'workbook', label: 'User Workbook', icon: BookOpen },
    { id: 'compounding', label: '$10 Wealth Engine', icon: TrendingUp },
    { id: 'engine', label: 'Trading Engine', icon: Zap },
    { id: 'brokers', label: 'MT5 & Broker Login', icon: Database },
    { id: 'risk', label: 'Risk Controls', icon: Shield },
    { id: 'strategies', label: 'Strategy Lab', icon: Layers },
    { id: 'backtesting', label: 'Backtesting', icon: Cpu },
    { id: 'testing', label: 'Test Suite', icon: CheckCircle },
    { id: 'admin', label: 'Admin Telemetry', icon: Sliders },
  ];

  const handleSelectNav = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0E0E11]/95 backdrop-blur-md">
        {/* Top Utility Bar */}
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 lg:px-8 border-b border-[#1F1F23] text-xs">
          {/* Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <div className="flex items-center space-x-2.5 sm:space-x-3.5">
              <QuantaraLogoMark size="sm" />
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                  <span className="font-brand text-base sm:text-lg font-extrabold tracking-[0.18em] sm:tracking-[0.2em] text-white flex items-center leading-none select-none">
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
            </div>

            {/* Desktop Engine Status */}
            <div className="hidden lg:flex items-center pl-4 border-l border-[#1F1F23] space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                <span className="text-xs font-medium text-[#10B981]">
                  {botState.isRunning ? 'ENGINE LIVE' : 'ENGINE PAUSED'}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8E9299]">{timeUtc}</span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Desktop Environment Mode Switcher */}
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

            {/* Desktop Bot State Quick Toggle */}
            <button
              onClick={onToggleBot}
              className={`hidden sm:flex items-center space-x-1.5 rounded-lg px-3 py-2 font-mono text-xs font-semibold transition-all border ${
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

            {/* Emergency Kill Switch Button */}
            <button
              onClick={onTriggerKillSwitch}
              className={`flex items-center space-x-1 sm:space-x-1.5 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
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
                <div className="absolute right-0 mt-2 w-72 sm:w-96 rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-2xl z-50">
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
                              {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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

            {/* Enterprise Cloud DB Indicator */}
            <div
              className="hidden xl:flex items-center space-x-1.5 rounded-lg border border-[#1F2330] bg-[#12151F] px-2.5 py-1.5 text-[11px] font-mono text-[#8E9299]"
              title="Cloud Database: quantara-261d0 (Firestore Enterprise)"
            >
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-zinc-300">quantara-261d0</span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-400 animate-pulse'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-cyan-400 animate-spin'
                    : 'bg-amber-400'
                }`}
              />
            </div>

            {/* Enterprise Auth & Account Profile Button */}
            {onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className={`flex items-center space-x-2 rounded-lg border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all ${
                  user
                    ? 'border-blue-500/40 bg-blue-950/25 hover:bg-blue-900/30 text-white shadow-sm'
                    : 'border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-200 hover:text-white'
                }`}
              >
                {user ? (
                  <>
                    <div className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center font-mono text-[10px] font-bold text-blue-300 overflow-hidden shrink-0">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        user.email?.[0].toUpperCase() || 'U'
                      )}
                    </div>
                    <span className="hidden sm:inline font-mono text-[11px] font-semibold text-zinc-200 max-w-[110px] truncate">
                      {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
                    <span className="font-medium">Sign In / Gmail</span>
                  </>
                )}
              </button>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#1F1F23] bg-[#141416] text-[#8E9299] hover:text-white"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs Bar */}
        <div className="hidden md:flex items-center space-x-1 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none py-2 bg-[#0E0E11]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs lg:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1F1F23] text-white font-semibold shadow-sm'
                    : 'text-[#8E9299] hover:bg-[#141416] hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-[#8E9299]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full bg-[#141416] border-t border-[#2E2E33] rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <div className="flex items-center space-x-2.5">
                <QuantaraLogoMark size="sm" />
                <span className="font-brand text-base font-extrabold tracking-wider text-white">
                  QUANT<span className="text-blue-400">ARA</span>
                </span>
                <span className="text-[10px] font-mono text-[#8E9299] px-2 py-0.5 rounded bg-[#0E0E11] border border-[#1F1F23]">
                  {timeUtc}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-[#1F1F23] text-[#8E9299] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile User Profile & Cloud DB Header Card */}
            <div className="rounded-xl border border-blue-500/30 bg-[#0E121E] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-mono text-xs font-bold text-blue-300 overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      user?.email?.[0].toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white">
                        {user ? (profile?.displayName || user.displayName || user.email?.split('@')[0]) : 'Guest Operator'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {user ? (profile?.role || 'OPERATOR') : 'LOCAL'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8E9299] font-mono truncate max-w-[180px]">
                      {user ? user.email : 'DB: quantara-261d0'}
                    </p>
                  </div>
                </div>

                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition-colors"
                  >
                    {user ? 'Account' : 'Sign In'}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Controls Grid in Drawer */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {/* Paper / Live toggle */}
              <div className="rounded-lg bg-[#0E0E11] p-2.5 border border-[#1F1F23] space-y-1.5">
                <span className="text-[10px] text-[#8E9299] uppercase font-bold block">Trading Mode</span>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => { onSwitchToPaper(); setMobileMenuOpen(false); }}
                    className={`py-1 rounded text-center text-[11px] font-bold ${
                      botState.environment === 'paper' ? 'bg-blue-600 text-white' : 'text-[#8E9299] bg-[#1F1F23]'
                    }`}
                  >
                    PAPER
                  </button>
                  <button
                    onClick={() => { onRequestLiveMode(); setMobileMenuOpen(false); }}
                    className={`py-1 rounded text-center text-[11px] font-bold ${
                      botState.environment === 'live' ? 'bg-[#EF4444] text-white' : 'text-[#8E9299] bg-[#1F1F23]'
                    }`}
                  >
                    LIVE
                  </button>
                </div>
              </div>

              {/* Bot Engine Run/Pause */}
              <div className="rounded-lg bg-[#0E0E11] p-2.5 border border-[#1F1F23] space-y-1.5">
                <span className="text-[10px] text-[#8E9299] uppercase font-bold block">Engine State</span>
                <button
                  onClick={onToggleBot}
                  className={`w-full py-1.5 rounded flex items-center justify-center space-x-1.5 text-[11px] font-bold ${
                    botState.isRunning
                      ? 'bg-[#1F1F23] text-white border border-[#2E2E33]'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  {botState.isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 fill-current" />}
                  <span>{botState.isRunning ? 'PAUSE BOT' : 'RESUME BOT'}</span>
                </button>
              </div>
            </div>

            {/* Takeover & Kill Switch Banner */}
            <div className="space-y-2">
              {onToggleTakeover && (
                <button
                  onClick={onToggleTakeover}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-tech font-bold uppercase tracking-wider flex items-center justify-between border ${
                    botState.autonomousTakeover
                      ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                      : 'bg-[#1F1F23] border-[#2E2E33] text-[#8E9299]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${botState.autonomousTakeover ? 'bg-[#10B981] animate-pulse' : 'bg-zinc-600'}`} />
                    <span>Autonomous Software Takeover</span>
                  </div>
                  <span className="font-bold">{botState.autonomousTakeover ? 'ACTIVE' : 'OFF'}</span>
                </button>
              )}

              <button
                onClick={() => { onTriggerKillSwitch(); setMobileMenuOpen(false); }}
                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 ${
                  riskSettings.killSwitchActive
                    ? 'bg-[#DC2626] text-white ring-2 ring-red-400'
                    : 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                }`}
              >
                <AlertOctagon className="h-4 w-4" />
                <span>{riskSettings.killSwitchActive ? 'RESET EMERGENCY LOCK' : 'EMERGENCY STOP (KILL SWITCH)'}</span>
              </button>
            </div>

            {/* Navigation Modules List */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] uppercase font-bold text-[#8E9299] tracking-wider block px-1 mb-1">
                Trading Platform Modules
              </span>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-white font-semibold border border-blue-500/40'
                        : 'text-[#8E9299] hover:bg-[#1F1F23] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-[#0E0E11] text-[#8E9299]'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-zinc-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E11]/95 backdrop-blur-xl border-t border-[#1F1F23] px-2 py-1.5 flex items-center justify-around shadow-2xl">
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
          onClick={() => onSelectTab('compounding')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors relative ${
            currentTab === 'compounding' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <TrendingUp className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">$10 Wealth</span>
          <span className="absolute -top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        </button>

        <button
          onClick={() => onSelectTab('engine')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
            currentTab === 'engine' ? 'text-blue-400 font-bold' : 'text-[#8E9299]'
          }`}
        >
          <Zap className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">Engine</span>
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
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[#8E9299] hover:text-white"
        >
          <Menu className="h-4 w-4 mb-0.5" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
};
