import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  Bell,
  CheckCircle,
  Cpu,
  Database,
  Layers,
  Play,
  Pause,
  RefreshCw,
  Shield,
  Sliders,
  TrendingUp,
  User,
  Zap,
  Terminal,
} from 'lucide-react';
import { BotState, EnvironmentMode, NotificationItem, RiskSettings, TradingMode } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  botState: BotState;
  riskSettings: RiskSettings;
  notifications: NotificationItem[];
  onToggleBot: () => void;
  onTriggerKillSwitch: () => void;
  onRequestLiveMode: () => void;
  onSwitchToPaper: () => void;
  onMarkNotificationsRead: () => void;
  onSelectSignalExplanation?: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  botState,
  riskSettings,
  notifications,
  onToggleBot,
  onTriggerKillSwitch,
  onRequestLiveMode,
  onSwitchToPaper,
  onMarkNotificationsRead,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
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
    { id: 'engine', label: 'Trading Engine', icon: Zap },
    { id: 'backtesting', label: 'Backtesting', icon: TrendingUp },
    { id: 'strategies', label: 'Strategy Lab', icon: Layers },
    { id: 'risk', label: 'Risk Controls', icon: Shield },
    { id: 'brokers', label: 'Account Connections', icon: Database },
    { id: 'testing', label: 'Test Suite', icon: CheckCircle },
    { id: 'admin', label: 'Admin Telemetry', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0E0E11]/90 backdrop-blur-md">
      {/* Top Utility Bar */}
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 border-b border-[#1F1F23] text-xs">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-blue-600/20">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold tracking-tight text-white">
                  QUANT<span className="text-blue-500">ARA</span>
                </span>
                <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-400">
                  INSTITUTIONAL
                </span>
              </div>
              <p className="text-[10px] text-[#8E9299] hidden sm:block tracking-normal font-sans font-medium">
                Intelligent Trading. Automated Execution.
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center pl-4 border-l border-[#1F1F23] space-x-3">
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
        <div className="flex items-center space-x-3">
          {/* Environment Mode Switcher */}
          <div className="flex items-center rounded-lg border border-[#1F1F23] bg-[#141416] p-0.5">
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

          {/* Bot State Quick Toggle */}
          <button
            onClick={onToggleBot}
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 font-mono text-xs font-semibold transition-all border ${
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
            className={`flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-900/20 ${
              riskSettings.killSwitchActive
                ? 'bg-[#DC2626] text-white animate-bounce ring-2 ring-red-400'
                : 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
            }`}
            title="Instant Kill Switch: Halts new executions and locks active positions"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>{riskSettings.killSwitchActive ? 'LOCKED' : 'EMERGENCY STOP'}</span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) onMarkNotificationsRead();
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#1F1F23] bg-[#141416] text-[#8E9299] hover:border-[#3F3F46] hover:text-white transition-colors"
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#1F1F23] bg-[#141416] p-4 shadow-2xl z-50">
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
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-1 px-4 sm:px-8 overflow-x-auto scrollbar-none py-2 bg-[#0E0E11]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${
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
  );
};
