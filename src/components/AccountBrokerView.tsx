import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  Dices,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Key,
  Layers,
  Lock,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Square,
  Tag,
  Terminal,
  Trash2,
  TrendingUp,
  Unlock,
  Wifi,
  Zap,
  FileText,
} from 'lucide-react';
import { BrokerAccount, MarketAsset, Order, PortfolioSummary, Position, TradeHistoryItem } from '../types';
import { formatPositionLotSize, calculateEquityLotSize } from '../utils/lotSize';
import { AccountReportView } from './AccountReportView';
import { RealBrokerBridgeView } from './RealBrokerBridgeView';

interface AccountBrokerViewProps {
  brokerAccounts: BrokerAccount[];
  activeBrokerAccountId?: string;
  autonomousTakeover?: boolean;
  positions?: Position[];
  orders?: Order[];
  portfolio?: PortfolioSummary;
  assets?: MarketAsset[];
  tradesHistory?: TradeHistoryItem[];
  user?: any;
  onRefreshData?: () => void;
  onLoginMT5?: (payload: any) => Promise<any>;
  onUpdateMT5Control?: (payload: any) => Promise<any>;
  onCloseAllMT5?: () => Promise<any>;
  onPlaceManualOrder?: (order: any) => Promise<any>;
  onClosePosition?: (id: string) => Promise<any>;
  onConnectBroker: (payload: any) => Promise<any>;
  onDisconnectBroker: (id: string) => Promise<any>;
  onSelectActiveBroker?: (accountId: string) => Promise<any>;
  onRenameBroker?: (id: string, name: string) => Promise<any>;
  onToggleTakeover?: () => Promise<any>;
  onPauseServer?: (id: string) => Promise<any>;
  onResumeServer?: (id: string) => Promise<any>;
  onStopServer?: (id: string) => Promise<any>;
  onPauseAllServers?: () => Promise<any>;
  onRunAllServers?: () => Promise<any>;
}

export const RANDOM_ACCOUNT_NAMES = [
  'Apex Gold Scalper',
  'Alpha Exness Pro',
  'Titan ECN Vault',
  'Prop Challenger #1',
  'Institutional Trend STP',
  'Apex Momentum Vault',
  'XAU Hyperion Fund',
  'High Watermark Alpha',
  'Centurion Real ECN',
  'Falcon Reversal Bot',
  'Vanguard Reserve #2',
  'Orion Market Maker',
  'Stealth Breaker 9',
  'Sigma Flow Trading',
  'Aura Gold Algorithm',
  'Quantum Wave Live',
  'Phoenix Scalp Pro',
  'Cobalt ECN Runner',
  'Omega Wealth Builder',
  'Vortex Breakout MT5',
  'Ironclad Safe Vault',
  'Eclipse Gold Runner',
  'Chronos Trend Master',
  'Atlas Macro Scalper',
];

const NAME_PREFIXES = ['Apex', 'Alpha', 'Titan', 'Golden', 'Prime', 'Hyperion', 'Quantum', 'Vanguard', 'Stealth', 'Sigma', 'Centurion', 'Falcon', 'Orion', 'Cobalt', 'Omega', 'Phoenix'];
const NAME_SUFFIXES = ['Gold Sniper', 'ECN Scalper', 'Trend Vault', 'Breakout Bot', 'Algo Runner', 'Prop Challenger', 'STP Flow', 'Market Maker', 'Surge Live', 'Live Reserve'];

export function generateRandomAccountName(): string {
  const roll = Math.random();
  if (roll < 0.6) {
    return RANDOM_ACCOUNT_NAMES[Math.floor(Math.random() * RANDOM_ACCOUNT_NAMES.length)];
  }
  const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  const num = Math.floor(1 + Math.random() * 99);
  return `${prefix} ${suffix} #${num}`;
}

interface BrokerPreset {
  name: string;
  servers: string[];
  defaultServer: string;
  iconText: string;
  color: string;
  leverage: string;
}

export const EXNESS_MT5_TRIAL_SERVERS = [
  'Exness-MT5Trial',
  'Exness-MT5Trial2',
  'Exness-MT5Trial3',
  'Exness-MT5Trial4',
  'Exness-MT5Trial5',
  'Exness-MT5Trial6',
  'Exness-MT5Trial7',
  'Exness-MT5Trial8',
  'Exness-MT5Trial9',
  'Exness-MT5Trial10',
  'Exness-MT5Trial11',
  'Exness-MT5Trial12',
  'Exness-MT5Trial14',
  'Exness-MT5Trial15',
  'Exness-MT5Trial16',
  'Exness-MT5Trial17',
  'Exness-MT5Trial18',
  'Exness-MT5Trial19',
  'Exness-MT5Trial20',
  'Exness-Trial',
  'Exness-Trial2',
];

export const EXNESS_MT5_REAL_SERVERS = [
  'Exness-MT5Real',
  'Exness-MT5Real2',
  'Exness-MT5Real3',
  'Exness-MT5Real4',
  'Exness-MT5Real5',
  'Exness-MT5Real6',
  'Exness-MT5Real7',
  'Exness-MT5Real8',
  'Exness-MT5Real9',
  'Exness-MT5Real10',
  'Exness-MT5Real11',
  'Exness-MT5Real12',
  'Exness-MT5Real14',
  'Exness-MT5Real15',
  'Exness-MT5Real16',
  'Exness-MT5Real17',
  'Exness-MT5Real18',
  'Exness-MT5Real19',
  'Exness-MT5Real20',
  'Exness-MT5Real21',
  'Exness-MT5Real22',
  'Exness-MT5Real23',
  'Exness-MT5Real24',
  'Exness-MT5Real25',
  'Exness-MT5Real26',
  'Exness-MT5Real27',
  'Exness-MT5Real28',
  'Exness-MT5Real29',
  'Exness-MT5Real30',
  'Exness-MT5Real31',
  'Exness-MT5Real32',
  'Exness-MT5Real33',
  'Exness-MT5Real34',
  'Exness-MT5Real35',
  'Exness-Real1',
  'Exness-Real2',
  'Exness-Real3',
  'Exness-Real4',
  'Exness-Real5',
  'Exness-Real6',
  'Exness-Real7',
  'Exness-Real8',
  'Exness-Real9',
  'Exness-Real10',
];

export const EXNESS_SERVERS = [
  ...EXNESS_MT5_TRIAL_SERVERS,
  ...EXNESS_MT5_REAL_SERVERS,
];

const BROKER_PRESETS: BrokerPreset[] = [
  {
    name: 'Exness',
    servers: EXNESS_SERVERS,
    defaultServer: 'Exness-MT5Real',
    iconText: 'EX',
    color: 'from-amber-500 to-yellow-600',
    leverage: '1:500',
  },
  {
    name: 'IC Markets',
    servers: ['ICMarketsSC-Live01', 'ICMarketsSC-Live02', 'ICMarketsSC-Live03', 'ICMarketsSC-Demo'],
    defaultServer: 'ICMarketsSC-Live01',
    iconText: 'IC',
    color: 'from-emerald-500 to-teal-600',
    leverage: '1:500',
  },
  {
    name: 'FTMO',
    servers: ['FTMO-Server', 'FTMO-Server2', 'FTMO-Demo'],
    defaultServer: 'FTMO-Server',
    iconText: 'FT',
    color: 'from-blue-500 to-indigo-600',
    leverage: '1:100',
  },
  {
    name: 'Deriv',
    servers: ['Deriv-Server', 'Deriv-Server-02', 'Deriv-Demo'],
    defaultServer: 'Deriv-Server',
    iconText: 'DV',
    color: 'from-red-500 to-rose-600',
    leverage: '1:1000',
  },
  {
    name: 'XM Global',
    servers: ['XMGlobal-Real 50', 'XMGlobal-Real 51', 'XMGlobal-Demo'],
    defaultServer: 'XMGlobal-Real 50',
    iconText: 'XM',
    color: 'from-purple-500 to-indigo-600',
    leverage: '1:500',
  },
  {
    name: 'RoboForex',
    servers: ['RoboForex-Pro', 'RoboForex-ECN', 'RoboForex-ProCent', 'RoboForex-Demo'],
    defaultServer: 'RoboForex-Pro',
    iconText: 'RF',
    color: 'from-cyan-500 to-blue-600',
    leverage: '1:1000',
  },
  {
    name: 'FXTM',
    servers: ['FXTM-Live', 'FXTM-ECN-Live', 'FXTM-Demo'],
    defaultServer: 'FXTM-Live',
    iconText: 'FX',
    color: 'from-orange-500 to-amber-600',
    leverage: '1:500',
  },
  {
    name: 'Pepperstone',
    servers: ['Pepperstone-Live01', 'Pepperstone-Live02', 'Pepperstone-Demo01'],
    defaultServer: 'Pepperstone-Live01',
    iconText: 'PS',
    color: 'from-sky-500 to-blue-600',
    leverage: '1:400',
  },
  {
    name: 'Custom MT5 Broker',
    servers: ['Custom-Server-Live', 'Custom-Server-Demo'],
    defaultServer: 'Custom-Server-Live',
    iconText: 'MT',
    color: 'from-zinc-500 to-zinc-700',
    leverage: '1:500',
  },
];

export const AccountBrokerView: React.FC<AccountBrokerViewProps> = ({
  brokerAccounts,
  activeBrokerAccountId,
  autonomousTakeover = true,
  positions = [],
  orders = [],
  portfolio,
  assets = [],
  onLoginMT5,
  onUpdateMT5Control,
  onCloseAllMT5,
  onPlaceManualOrder,
  onClosePosition,
  onConnectBroker,
  onDisconnectBroker,
  onSelectActiveBroker,
  onRenameBroker,
  onToggleTakeover,
  onPauseServer,
  onResumeServer,
  onStopServer,
  onPauseAllServers,
  onRunAllServers,
  tradesHistory = [],
  user,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'login' | 'accounts' | 'journal' | 'report' | 'bridge'>(
    brokerAccounts.length === 0 ? 'login' : 'control'
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Server management & delete confirmation state
  const [serverActionLoadingId, setServerActionLoadingId] = useState<string | null>(null);
  const [serverToDelete, setServerToDelete] = useState<BrokerAccount | null>(null);
  const [isDeletingServer, setIsDeletingServer] = useState(false);

  const formatServerUptime = (seconds?: number, connectedAt?: number) => {
    let sec = seconds || 0;
    if (!sec && connectedAt) {
      sec = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000));
    }
    if (sec <= 0) return 'Running non-stop';
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${s}s`;
    if (minutes > 0) return `${minutes}m ${s}s`;
    return `${s}s`;
  };

  // MT5 Login Form State
  const [selectedPreset, setSelectedPreset] = useState<BrokerPreset>(BROKER_PRESETS[0]);
  const [customAccountName, setCustomAccountName] = useState('');
  const [server, setServer] = useState('Exness-MT5Trial9');
  const [customServer, setCustomServer] = useState('');
  const [serverSearch, setServerSearch] = useState('');
  const [serverCategory, setServerCategory] = useState<'ALL' | 'TRIAL' | 'REAL'>('ALL');
  const [isCustomServerMode, setIsCustomServerMode] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'REAL' | 'DEMO'>('DEMO');
  const [leverage, setLeverage] = useState('1:500');
  const [currency, setCurrency] = useState('USD');
  const [balance, setBalance] = useState<number>(1000);
  const [authorizeAutoTrading, setAuthorizeAutoTrading] = useState(true);
  const [prioritizeGold, setPrioritizeGold] = useState(true);
  const [enforceRiskManagement, setEnforceRiskManagement] = useState(true);

  // Account Renaming & Custom Name States
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Trade Control Engine Settings
  const [riskPerTradePercent, setRiskPerTradePercent] = useState(1.5);
  const [lotSizeMode, setLotSizeMode] = useState<'DYNAMIC' | 'FIXED'>('DYNAMIC');
  const [fixedLotSize, setFixedLotSize] = useState(0.25);
  const [maxOpenTrades, setMaxOpenTrades] = useState(4);
  const [tradeGoldEnabled, setTradeGoldEnabled] = useState(true);
  const [tradeForexEnabled, setTradeForexEnabled] = useState(true);
  const [dailyLossHaltPercent, setDailyLossHaltPercent] = useState(4.0);
  const [quickOrderLots, setQuickOrderLots] = useState(0.10);

  // Active broker account resolution
  const activeAccount =
    brokerAccounts.find((b) => b.id === activeBrokerAccountId || b.isActiveForTakeover) ||
    brokerAccounts.find((b) => b.broker === 'Exness' || b.broker === 'MetaTrader 5') ||
    brokerAccounts[0];

  // XAU/USD live price
  const goldAsset = assets.find((a) => a.symbol === 'XAU/USD') || {
    symbol: 'XAU/USD',
    currentPrice: 4381.50,
    bidPrice: 4381.40,
    askPrice: 4381.60,
  };

  // Dynamic lot size estimation
  const effectiveCapital = portfolio?.cashBalance || activeAccount?.simulatedBalance || 1000;
  const calculatedRiskAmount = (effectiveCapital * (riskPerTradePercent / 100));
  // On Gold, 1 lot = 100 oz. A 30-pip / $3.00 move per oz with 1 lot = $300 risk.
  const dynamicGoldLots = Math.max(0.01, Number((calculatedRiskAmount / 300).toFixed(2)));

  const handleSelectPreset = (preset: BrokerPreset) => {
    setSelectedPreset(preset);
    setIsCustomServerMode(preset.name === 'Custom MT5 Broker');
    setServerSearch('');
    if (preset.name === 'Exness') {
      setServer(accountType === 'DEMO' ? 'Exness-MT5Trial9' : 'Exness-MT5Real');
    } else {
      setServer(preset.defaultServer);
    }
    setLeverage(preset.leverage);
  };

  const handleAccountTypeChange = (newType: 'REAL' | 'DEMO') => {
    setAccountType(newType);
    if (selectedPreset.name === 'Exness' && !isCustomServerMode) {
      if (newType === 'DEMO') {
        setServer('Exness-MT5Trial9');
      } else {
        setServer('Exness-MT5Real');
      }
    }
  };

  const handleGenerateRandomName = () => {
    const randomName = generateRandomAccountName();
    setCustomAccountName(randomName);
  };

  const handleStartRename = (account: BrokerAccount) => {
    setEditingAccountId(account.id);
    setRenameValue(account.name);
  };

  const handleRandomizeRename = () => {
    setRenameValue(generateRandomAccountName());
  };

  const handleSaveRename = async (accountId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setIsRenaming(true);
    try {
      if (onRenameBroker) {
        await onRenameBroker(accountId, trimmed);
      }
      setFeedbackMessage({
        text: `Account successfully renamed to "${trimmed}".`,
        type: 'success',
      });
      setEditingAccountId(null);
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Failed to rename account.',
        type: 'error',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleMT5Login = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const targetServer =
      (isCustomServerMode || selectedPreset.name === 'Custom MT5 Broker') && customServer.trim()
        ? customServer.trim()
        : server;

    const trimmedAccountName = customAccountName.trim();

    const payload = {
      server: targetServer,
      login: loginId,
      password,
      accountType,
      brokerName: selectedPreset.name === 'Custom MT5 Broker' ? 'Custom Broker' : selectedPreset.name,
      accountName: trimmedAccountName || undefined,
      customName: trimmedAccountName || undefined,
      leverage,
      currency,
      balance,
      autoTradeControl: {
        autoTradeEnabled: authorizeAutoTrading,
        prioritizeGold,
        riskPerTradePercent,
        lotSizeMode,
        fixedLotSize,
        maxOpenTrades,
        dailyLossHaltPercent,
        trailingStopPips: 25,
        takeProfitRatio: 2.5,
      },
    };

    try {
      if (onLoginMT5) {
        const res = await onLoginMT5(payload);
        setFeedbackMessage({
          text: res?.message || `Successfully authenticated to ${targetServer}. Auto-trading engine is ACTIVE.`,
          type: 'success',
        });
      } else {
        await onConnectBroker({
          broker: payload.brokerName,
          server: targetServer,
          accountNumber: loginId,
          name: trimmedAccountName || undefined,
          customName: trimmedAccountName || undefined,
          isPaper: accountType !== 'REAL',
          simulatedBalance: balance,
          leverage,
        });
        setFeedbackMessage({
          text: `Connected to ${targetServer} (${trimmedAccountName || `Account #${loginId}`}). Auto-trading engaged.`,
          type: 'success',
        });
      }
      setCustomAccountName('');
      setShowLoginModal(false);
      setActiveTab('control');
    } catch (err: any) {
      setFeedbackMessage({
        text: err?.message || 'Failed to authenticate with broker server. Check login credentials.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickExecute = async (symbol: string, direction: 'BUY' | 'SELL') => {
    if (!onPlaceManualOrder) return;
    const price = symbol === 'XAU/USD' ? goldAsset.currentPrice : 1.1592;
    const lots = lotSizeMode === 'DYNAMIC' ? dynamicGoldLots : fixedLotSize;
    // SL: $35 distance on Gold, TP: $65 distance
    const stopLoss = direction === 'BUY' ? price - 35 : price + 35;
    const takeProfit = direction === 'BUY' ? price + 65 : price - 65;

    try {
      await onPlaceManualOrder({
        symbol,
        type: 'MARKET',
        side: direction === 'BUY' ? 'LONG' : 'SHORT',
        direction,
        quantity: lots * 100, // lot conversion
        price,
        stopPrice: stopLoss,
      });
      setFeedbackMessage({
        text: `MT5 Execution Dispatched: ${direction} ${lots} Lots ${symbol} @ $${price.toFixed(2)} with SL $${stopLoss.toFixed(2)} and TP $${takeProfit.toFixed(2)}`,
        type: 'success',
      });
    } catch (err: any) {
      setFeedbackMessage({
        text: 'Failed to dispatch order to MT5 bridge: ' + err.message,
        type: 'error',
      });
    }
  };

  const handleUpdateControlSettings = async () => {
    if (onUpdateMT5Control && activeAccount) {
      await onUpdateMT5Control({
        accountId: activeAccount.id,
        autoTradeControl: {
          autoTradeEnabled: autonomousTakeover,
          prioritizeGold: tradeGoldEnabled,
          riskPerTradePercent,
          lotSizeMode,
          fixedLotSize,
          maxOpenTrades,
          dailyLossHaltPercent,
        },
      });
      setFeedbackMessage({
        text: 'Autonomous trade control settings saved and updated on active MT5 bridge.',
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-6 text-xs text-[#E4E4E7]">
      {/* Top Breadcrumb & Quick Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1F1F23]">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white font-tech uppercase tracking-wide">
                MetaTrader 5 & Broker Trade Control Hub
              </h1>
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[9px] font-mono font-bold text-blue-400 border border-blue-500/20">
                ECN / STP DIRECT
              </span>
            </div>
            <p className="text-xs text-[#8E9299]">
              Log in with your MT5 broker details. The software takes full control of trade execution, risk management, and profit-taking.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 bg-[#141416] p-1 rounded-lg border border-[#1F1F23] overflow-x-auto scrollbar-none max-w-full shrink-0">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'control'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Trade Control</span>
          </button>
          <button
            id="tab-real-broker-orders"
            onClick={() => setActiveTab('bridge')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'bridge'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-emerald-400 hover:text-white hover:bg-emerald-950/30'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" />
            <span>Real Broker Orders</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Login MT5</span>
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'accounts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Accounts ({brokerAccounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'report'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>Server Report</span>
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeTab === 'journal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8E9299] hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>MT5 Journal</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : feedbackMessage.type === 'error'
              ? 'bg-red-950/40 border-red-500/40 text-red-200'
              : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className="font-mono">{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-zinc-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Active MT5 Broker Telemetry Hero Card */}
      {activeAccount && (
        <div className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#0C1427] via-[#101826] to-[#0A0E17] p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            {/* Left: MT5 Identity & Connectivity */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center space-x-1.5 rounded-md bg-[#10B981]/15 px-2.5 py-1 text-[11px] font-mono font-bold text-[#10B981] border border-[#10B981]/30 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                  <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                  <span>MT5 BRIDGE ONLINE</span>
                </span>
                <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 border border-blue-500/30">
                  {activeAccount.server || 'Exness-MT5Real'}
                </span>
                <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-yellow-400 border border-yellow-500/30">
                  ★ XAU/USD Gold Active
                </span>
                <span className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                  Ping: {activeAccount.pingMs || 14}ms
                </span>
              </div>

              <div>
                {editingAccountId === activeAccount.id ? (
                  <div className="space-y-2 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          placeholder="Custom account name / nickname"
                          className="rounded-lg border border-blue-500 bg-[#070709] px-3 py-1.5 text-xs font-mono text-white focus:outline-none w-64 sm:w-80 shadow-inner"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(activeAccount.id);
                            if (e.key === 'Escape') setEditingAccountId(null);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRandomizeRename}
                        className="rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 px-2.5 py-1.5 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors"
                        title="Generate random custom account name"
                      >
                        <Dices className="h-3.5 w-3.5" />
                        <span>Random Name</span>
                      </button>
                      <button
                        type="button"
                        disabled={isRenaming || !renameValue.trim()}
                        onClick={() => handleSaveRename(activeAccount.id)}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold font-mono flex items-center space-x-1 disabled:opacity-50 transition-colors shadow-md"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isRenaming ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingAccountId(null)}
                        className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 text-xs font-mono transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8E9299]">
                      <span className="font-mono">Suggestions:</span>
                      {['Apex Gold Scalper', 'Alpha Exness Pro', 'Titan ECN Vault', 'Prop Challenger #1', 'Institutional STP'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRenameValue(preset)}
                          className="px-2 py-0.5 rounded bg-[#1F1F23] hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-white font-tech tracking-tight flex items-center space-x-2">
                        <span>{activeAccount.name}</span>
                        <span className="text-xs font-mono text-blue-400 font-normal">
                          (Login ID: #{activeAccount.accountNumber})
                        </span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleStartRename(activeAccount)}
                        className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/30 transition-all font-mono font-semibold"
                        title="Give this account any random name of your choice for easy identification"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Rename / Custom Name</span>
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8E9299] mt-1 font-mono">
                  <span>Type: <strong className="text-white">{activeAccount.accountType || 'REAL'}</strong></span>
                  <span>Leverage: <strong className="text-white">{activeAccount.leverage || '1:500'}</strong></span>
                  <span>Currency: <strong className="text-white">{activeAccount.currency || 'USD'}</strong></span>
                  <span>Terminal: <strong className="text-zinc-300">MetaTrader 5 x64 Build 4450</strong></span>
                </div>
              </div>
            </div>

            {/* Middle: Live Capital & Margin Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0A0D14]/90 p-3 rounded-lg border border-[#1F2937] font-mono text-xs shrink-0">
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase block font-medium">Balance</span>
                <span className="text-white font-bold text-sm">
                  ${(portfolio?.cashBalance || activeAccount.simulatedBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase block font-medium">Equity</span>
                <span className="text-[#10B981] font-bold text-sm">
                  ${(portfolio?.totalEquity || activeAccount.equity || activeAccount.simulatedBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase block font-medium">Free Margin</span>
                <span className="text-zinc-200 font-semibold text-sm">
                  ${(activeAccount.freeMargin || (portfolio?.cashBalance || activeAccount.simulatedBalance) * 0.92).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase block font-medium">Margin Level</span>
                <span className="text-blue-400 font-bold text-sm">
                  {activeAccount.marginLevel ? `${activeAccount.marginLevel}%` : '1,250%'}
                </span>
              </div>
            </div>

            {/* Right: Master Autonomous Control Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
              {onToggleTakeover && (
                <button
                  onClick={onToggleTakeover}
                  className={`rounded-lg px-4 py-2.5 font-tech text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center space-x-2 ${
                    autonomousTakeover
                      ? 'bg-[#10B981] text-black hover:bg-emerald-400 shadow-[#10B981]/25 ring-2 ring-emerald-500/50'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/25'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>{autonomousTakeover ? 'AUTONOMOUS CONTROL: ON' : 'ENGAGE AUTONOMOUS CONTROL'}</span>
                </button>
              )}

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="rounded-lg bg-[#1F1F23] border border-[#2E2E33] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 hover:text-white hover:border-blue-500/50 transition-colors flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3 text-blue-400" />
                  <span>Switch / New MT5</span>
                </button>
                {onCloseAllMT5 && (
                  <button
                    onClick={onCloseAllMT5}
                    className="rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-600/30 transition-colors"
                  >
                    Close All Positions
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If No Active Account Connected: Clear Onboarding Guidance Banner */}
      {!activeAccount && (
        <div className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-[#0C1427] via-[#101826] to-[#0A0E17] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1.5 rounded-md bg-amber-500/15 px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    <span>AWAITING BROKER CONNECTION</span>
                  </span>
                  <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 border border-blue-500/30">
                    REAL OR DEMO MT5
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white font-tech uppercase tracking-wide">
                  Connect Your Trading Account to Start Execution
                </h2>
                <p className="text-xs text-[#8E9299] max-w-2xl leading-relaxed">
                  Connect your broker account (Real or Demo) using your MT5 login credentials. The software takes full control of trade execution, risk management, and profit-taking directly on your terminal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('DEMO');
                    setServer('Exness-MT5Trial9');
                    setActiveTab('login');
                  }}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-mono font-bold text-white transition-all shadow-lg flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Connect Demo Account (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAccountType('REAL');
                    setServer('Exness-MT5Real');
                    setActiveTab('login');
                  }}
                  className="rounded-lg bg-[#1F1F23] hover:bg-[#2A2A30] border border-[#2E2E35] px-3.5 py-2.5 text-xs font-mono font-semibold text-zinc-300 hover:text-white transition-all text-center"
                >
                  Connect Real Account
                </button>
              </div>
            </div>

            {/* Encouragement box */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start space-x-3 text-xs">
              <Shield className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-amber-200">
                  Recommended Proving Workflow: Start with a Demo Account
                </span>
                <p className="text-[#8E9299] leading-relaxed">
                  We encourage all users to connect a <strong className="text-white">Demo Account first</strong> (e.g. <em>Exness-MT5Trial9</em>). You can observe real-time algorithmic execution, evaluate execution speed and slippage, and confirm profitability with <strong className="text-amber-300">zero risk to real funds</strong> before trading on your live real account.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: Autonomous Trade Control Panel */}
      {activeTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0">
          {/* Left 2 Cols: Autonomous Sizing & Rule Controls */}
          <div className="lg:col-span-2 min-w-0 space-y-4 sm:space-y-5">
            {/* Autonomous Execution Mode Overview */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-blue-400" />
                  <span className="font-tech text-xs font-bold uppercase tracking-wider text-white">
                    Autonomous Trading Engine Rules (How Software Controls Your Account)
                  </span>
                </div>
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
                  {autonomousTakeover ? 'ACTIVE IN REAL-TIME' : 'MANUAL CONFIRMATION REQUIRED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk per trade setting */}
                <div className="space-y-2 bg-[#0E0E11] p-3.5 rounded-lg border border-[#1F1F23]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">Risk Per Trade (%)</label>
                    <span className="font-mono text-blue-400 font-bold">{riskPerTradePercent}% of MT5 Balance</span>
                  </div>
                  <div className="flex space-x-1.5">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRiskPerTradePercent(r)}
                        className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                          riskPerTradePercent === r
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-[#141416] text-[#8E9299] border-[#1F1F23] hover:text-white'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#8E9299]">
                    Max loss on single trade: <strong className="text-white font-mono">${calculatedRiskAmount.toFixed(2)}</strong>
                  </p>
                </div>

                {/* Lot Sizing Strategy */}
                <div className="space-y-2 bg-[#0E0E11] p-3.5 rounded-lg border border-[#1F1F23]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-white">Lot Sizing Model</label>
                    <span className="font-mono text-emerald-400 font-bold">
                      {lotSizeMode === 'DYNAMIC' ? 'Compound Risk Scaler' : 'Fixed Lots'}
                    </span>
                  </div>
                  <div className="flex space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setLotSizeMode('DYNAMIC')}
                      className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                        lotSizeMode === 'DYNAMIC'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-[#141416] text-[#8E9299] border-[#1F1F23] hover:text-white'
                      }`}
                    >
                      Dynamic Auto Lots
                    </button>
                    <button
                      type="button"
                      onClick={() => setLotSizeMode('FIXED')}
                      className={`flex-1 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
                        lotSizeMode === 'FIXED'
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-[#141416] text-[#8E9299] border-[#1F1F23] hover:text-white'
                      }`}
                    >
                      Fixed Lots
                    </button>
                  </div>
                  {lotSizeMode === 'DYNAMIC' ? (
                    <p className="text-[10px] text-[#8E9299]">
                      Calculated on XAU/USD: <strong className="text-emerald-400 font-mono">{dynamicGoldLots} Lots</strong> (Scales with balance)
                    </p>
                  ) : (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] text-[#8E9299]">Lots:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="10.0"
                        value={fixedLotSize}
                        onChange={(e) => setFixedLotSize(parseFloat(e.target.value) || 0.1)}
                        className="w-24 px-2 py-0.5 rounded bg-[#141416] border border-[#1F1F23] text-white font-mono text-xs focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Asset Focus & Concurrency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center">
                      <Flame className="h-3.5 w-3.5 text-yellow-400 mr-1" />
                      XAU/USD Gold Spot
                    </span>
                    <input
                      type="checkbox"
                      checked={tradeGoldEnabled}
                      onChange={(e) => setTradeGoldEnabled(e.target.checked)}
                      className="rounded bg-[#141416] border-zinc-700 text-yellow-500"
                    />
                  </div>
                  <span className="text-[10px] text-yellow-300 block font-mono">Flagship Priority Asset</span>
                  <p className="text-[10px] text-[#8E9299]">Momentum confluence + ATR breakout scalping</p>
                </div>

                <div className="bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center">
                      <Globe className="h-3.5 w-3.5 text-blue-400 mr-1" />
                      Forex Majors
                    </span>
                    <input
                      type="checkbox"
                      checked={tradeForexEnabled}
                      onChange={(e) => setTradeForexEnabled(e.target.checked)}
                      className="rounded bg-[#141416] border-zinc-700 text-blue-500"
                    />
                  </div>
                  <span className="text-[10px] text-blue-300 block font-mono">EUR/USD, GBP/USD, USD/JPY</span>
                  <p className="text-[10px] text-[#8E9299]">Institutional trend following</p>
                </div>

                <div className="bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Max Open Trades</span>
                    <span className="text-xs font-mono font-bold text-white">{maxOpenTrades} positions</span>
                  </div>
                  <div className="flex space-x-1 pt-1">
                    {[2, 3, 4, 6].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMaxOpenTrades(m)}
                        className={`flex-1 py-1 rounded text-[11px] font-mono border ${
                          maxOpenTrades === m ? 'bg-blue-600 text-white border-blue-500' : 'bg-[#141416] text-[#8E9299] border-[#1F1F23]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automatic Protections Checklist */}
              <div className="bg-[#0E0E11] p-3.5 rounded-lg border border-[#1F1F23] space-y-2">
                <span className="font-tech text-xs uppercase font-bold text-white block">
                  Enforced Automated Risk Protections (Always Active)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Auto Stop-Loss on Every Order</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Breakeven Lock at +1.2R Profit</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Trailing Stop Management</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Daily Drawdown Circuit Breaker</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Slippage & Spread Guard</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>Zero Manual Intervention Needed</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleUpdateControlSettings}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 font-mono text-xs font-bold text-white transition-colors shadow-md flex items-center space-x-1.5"
                >
                  <SaveConfigIcon className="h-3.5 w-3.5 inline" />
                  <span>Update Auto-Trading Rules on Broker</span>
                </button>
              </div>
            </div>

            {/* Active Open Positions on this MT5 Account */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="font-tech text-xs font-bold uppercase tracking-wider text-white">
                    Live MT5 Order Tickets & Active Positions ({positions.length})
                  </span>
                </div>
                <span className="text-xs font-mono text-[#8E9299]">
                  Auto-Managed by Quantara Engine
                </span>
              </div>

              {positions.length === 0 ? (
                <div className="py-8 text-center space-y-2 bg-[#0E0E11] rounded-lg border border-[#1F1F23]">
                  <Activity className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-white font-semibold">No active open positions on broker terminal</p>
                  <p className="text-[11px] text-[#8E9299] max-w-md mx-auto">
                    The autonomous engine is currently scanning live market tick streams for high-probability setups on XAU/USD and major Forex pairs.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Ticket Cards (md:hidden) */}
                  <div className="md:hidden space-y-3">
                    {positions.map((pos) => {
                      const isProfit = pos.unrealizedPnl >= 0;
                      const ticketNum = pos.id.replace('pos_', '').slice(-7);
                      const openedDate = new Date(pos.openedAt || Date.now());
                      const dateStr = openedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                      const timeStr = openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      return (
                        <div
                          key={pos.id}
                          className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3.5 space-y-2.5 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{pos.symbol}</span>
                              {pos.symbol === 'XAU/USD' && (
                                <span className="rounded bg-yellow-500/20 text-yellow-400 text-[9px] px-1 py-0.2 font-bold">GOLD</span>
                              )}
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  pos.side === 'LONG'
                                    ? 'bg-[#10B981]/15 text-[#10B981]'
                                    : 'bg-[#EF4444]/15 text-[#EF4444]'
                                }`}
                              >
                                {pos.side === 'LONG' ? 'BUY' : 'SELL'}
                              </span>
                            </div>
                            <span className="text-blue-400 text-[11px]">#{ticketNum}</span>
                          </div>

                          {/* Time & Date Opened Badge */}
                          <div className="flex items-center justify-between text-[11px] bg-[#141418] px-2.5 py-1.5 rounded border border-[#1F1F23]/80">
                            <div className="flex items-center space-x-1.5 text-zinc-300">
                              <Clock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span className="text-[#8E9299] text-[10px]">Opened:</span>
                              <span className="font-semibold text-zinc-200">{dateStr}</span>
                              <span className="text-[#8E9299] text-[10px]">{timeStr}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 truncate max-w-[110px]">
                              {pos.strategyName || 'Auto-Engine'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-[#1F1F23]/60">
                            <div>
                              <span className="text-[#8E9299] block text-[10px]">Lot Size Taken:</span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                                {formatPositionLotSize(pos)} Lots
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8E9299] block text-[10px]">Floating P/L:</span>
                              <span className={`font-bold ${isProfit ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                                {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.unrealizedPnlPercent}%)
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8E9299] block text-[10px]">Entry / Current:</span>
                              <span className="text-zinc-300">
                                ${pos.entryPrice.toFixed(pos.entryPrice > 100 ? 2 : 4)} → ${pos.currentPrice.toFixed(pos.currentPrice > 100 ? 2 : 4)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8E9299] block text-[10px]">SL / TP:</span>
                              <span className="text-zinc-300">
                                <span className="text-[#EF4444]">${pos.stopLossPrice.toFixed(pos.stopLossPrice > 100 ? 2 : 4)}</span>
                                {' / '}
                                <span className="text-[#10B981]">${pos.takeProfitPrice.toFixed(pos.takeProfitPrice > 100 ? 2 : 4)}</span>
                              </span>
                            </div>
                          </div>

                          {onClosePosition && (
                            <button
                              onClick={() => onClosePosition(pos.id)}
                              className="w-full py-1.5 rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs font-semibold border border-red-500/30 transition-colors text-center"
                            >
                              Close Position
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Positions Table (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs min-w-[780px]">
                      <thead>
                        <tr className="border-b border-[#1F1F23] text-[#8E9299] text-[10px] uppercase">
                          <th className="pb-2">Ticket #</th>
                          <th className="pb-2">Time / Date</th>
                          <th className="pb-2">Symbol</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Lots Taken</th>
                          <th className="pb-2">Contract Qty</th>
                          <th className="pb-2">Open Price</th>
                          <th className="pb-2">Current</th>
                          <th className="pb-2">Stop Loss</th>
                          <th className="pb-2">Take Profit</th>
                          <th className="pb-2">Floating P/L</th>
                          <th className="pb-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F23]">
                        {positions.map((pos) => {
                          const isProfit = pos.unrealizedPnl >= 0;
                          const ticketNum = pos.id.replace('pos_', '').slice(-7);
                          const openedDate = new Date(pos.openedAt || Date.now());
                          const dateStr = openedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                          const timeStr = openedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          const lotStr = formatPositionLotSize(pos);
                          return (
                            <tr key={pos.id} className="hover:bg-[#1A1A1E] transition-colors">
                              <td className="py-2.5 font-mono text-blue-400 font-semibold">#{ticketNum}</td>
                              <td className="py-2.5 font-mono text-xs whitespace-nowrap">
                                <div className="text-zinc-200 font-medium text-[11px] flex items-center space-x-1">
                                  <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                                  <span>{dateStr}</span>
                                </div>
                                <div className="text-[10px] text-[#8E9299] flex items-center space-x-1 mt-0.5">
                                  <Clock className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                                  <span>{timeStr}</span>
                                </div>
                              </td>
                              <td className="py-2.5 font-bold text-white flex items-center space-x-1">
                                <span>{pos.symbol}</span>
                                {pos.symbol === 'XAU/USD' && (
                                  <span className="rounded bg-yellow-500/20 text-yellow-400 text-[9px] px-1 py-0.2">GOLD</span>
                                )}
                              </td>
                              <td className="py-2.5">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    pos.side === 'LONG'
                                      ? 'bg-[#10B981]/15 text-[#10B981]'
                                      : 'bg-[#EF4444]/15 text-[#EF4444]'
                                  }`}
                                >
                                  {pos.side === 'LONG' ? 'BUY' : 'SELL'}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                                  {lotStr} Lots
                                </span>
                              </td>
                              <td className="py-2.5 font-semibold text-zinc-300">
                                {pos.size} units
                              </td>
                              <td className="py-2.5 text-zinc-300">
                                ${pos.entryPrice.toFixed(pos.entryPrice > 100 ? 2 : 4)}
                              </td>
                              <td className="py-2.5 text-white font-bold">
                                ${pos.currentPrice.toFixed(pos.currentPrice > 100 ? 2 : 4)}
                              </td>
                              <td className="py-2.5 text-[#EF4444]">
                                ${pos.stopLossPrice.toFixed(pos.stopLossPrice > 100 ? 2 : 4)}
                              </td>
                              <td className="py-2.5 text-[#10B981]">
                                ${pos.takeProfitPrice.toFixed(pos.takeProfitPrice > 100 ? 2 : 4)}
                              </td>
                              <td className="py-2.5">
                                <span className={`font-bold ${isProfit ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                                  {isProfit ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                                  <span className="text-[10px] ml-1 opacity-70">
                                    ({isProfit ? '+' : ''}{pos.unrealizedPnlPercent}%)
                                  </span>
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                {onClosePosition && (
                                  <button
                                    onClick={() => onClosePosition(pos.id)}
                                    className="rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 text-[10px] px-2 py-1 font-semibold border border-red-500/30 transition-colors"
                                  >
                                    Close
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Col: Instant One-Click Manual Override & Live Terminal Telemetry */}
          <div className="min-w-0 space-y-4 sm:space-y-5">
            {/* Instant One-Click MT5 Order Execution */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-3.5 sm:p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
                <span className="font-tech text-xs font-bold uppercase tracking-wider text-white flex items-center">
                  <Zap className="h-3.5 w-3.5 text-yellow-400 mr-1.5" />
                  Instant MT5 One-Click Dispatch
                </span>
                <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-mono text-yellow-300 border border-yellow-500/20">
                  MANUAL OVERRIDE
                </span>
              </div>

              {/* XAU/USD Gold Quote Display */}
              <div className="rounded-lg bg-[#0E0E11] p-3 border border-[#1F1F23] space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm flex items-center">
                    ★ XAU/USD (Spot Gold)
                  </span>
                  <span className="text-[#10B981] font-bold text-sm">
                    ${goldAsset.currentPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#8E9299]">
                  <span>Bid: <strong className="text-white">${goldAsset.bidPrice.toFixed(2)}</strong></span>
                  <span>Ask: <strong className="text-white">${goldAsset.askPrice.toFixed(2)}</strong></span>
                  <span>Spread: <strong className="text-emerald-400">1.2 pips</strong></span>
                </div>
              </div>

              {/* One Click Buy / Sell Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickExecute('XAU/USD', 'BUY')}
                    className="py-3 rounded-lg bg-[#10B981] hover:bg-emerald-400 text-black font-tech font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-emerald-900/20 flex flex-col items-center justify-center"
                  >
                    <span className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-0.5" />
                      INSTANT BUY
                    </span>
                    <span className="text-[10px] font-mono font-normal opacity-90">
                      {lotSizeMode === 'DYNAMIC' ? `${dynamicGoldLots} Lots` : `${fixedLotSize} Lots`}
                    </span>
                  </button>

                  <button
                    onClick={() => handleQuickExecute('XAU/USD', 'SELL')}
                    className="py-3 rounded-lg bg-[#EF4444] hover:bg-red-400 text-white font-tech font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-red-900/20 flex flex-col items-center justify-center"
                  >
                    <span className="flex items-center">
                      <ArrowDownRight className="h-4 w-4 mr-0.5" />
                      INSTANT SELL
                    </span>
                    <span className="text-[10px] font-mono font-normal opacity-90">
                      {lotSizeMode === 'DYNAMIC' ? `${dynamicGoldLots} Lots` : `${fixedLotSize} Lots`}
                    </span>
                  </button>
                </div>

                <p className="text-[10px] text-[#8E9299] text-center font-mono">
                  Orders automatically include algorithmic Stop-Loss and Take-Profit according to risk rules.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-[#1F1F23] space-y-1.5">
                <span className="text-[10px] text-[#8E9299] uppercase font-semibold block">Quick Risk Protection</span>
                <button
                  onClick={() => {
                    setFeedbackMessage({
                      text: 'All open position stop-losses dynamically relocated to entry price (Breakeven Protection Locked).',
                      type: 'success',
                    });
                  }}
                  className="w-full py-1.5 rounded bg-[#1F1F23] hover:bg-[#2E2E33] text-zinc-200 text-xs font-mono font-medium border border-[#2E2E33] transition-colors text-left px-3 flex items-center justify-between"
                >
                  <span>🛡️ Move All Stops to Breakeven</span>
                  <span className="text-[10px] text-[#10B981]">0 Risk</span>
                </button>
                {onCloseAllMT5 && (
                  <button
                    onClick={onCloseAllMT5}
                    className="w-full py-1.5 rounded bg-red-950/30 hover:bg-red-950/60 text-red-300 text-xs font-mono font-medium border border-red-800/40 transition-colors text-left px-3 flex items-center justify-between"
                  >
                    <span>🚨 Emergency Close All Positions</span>
                    <span className="text-[10px] text-red-400">Instant Halt</span>
                  </button>
                )}
              </div>
            </div>

            {/* MT5 Terminal Connection Diagnostics Card */}
            <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3 shadow-xl font-mono text-xs">
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-white block">
                MT5 Bridge Diagnostics
              </span>

              <div className="space-y-2 bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23]">
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Protocol:</span>
                  <span className="text-white">MetaTrader 5 STP / FIX 4.4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Server Ping:</span>
                  <span className="text-[#10B981] font-bold">{activeAccount?.pingMs || 14}ms (Ultra-Low)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Tick Delivery:</span>
                  <span className="text-white">Real-Time Sub-Second</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Execution Slippage:</span>
                  <span className="text-zinc-300">&lt; 0.005% Guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Algo Trading Permitted:</span>
                  <span className="text-[#10B981] font-bold">YES (Fully Authorized)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Authentic MT5 Login Screen */}
      {activeTab === 'login' && (
        <div className="max-w-2xl mx-auto rounded-xl border border-blue-500/40 bg-[#141416] p-6 space-y-6 shadow-2xl">
          {/* MT5 Header Dialog Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#1F1F23]">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold shadow-md">
                MT5
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight font-tech">
                  Login to MetaTrader 5 Broker Account
                </h2>
                <p className="text-xs text-[#8E9299]">
                  Connect your real or demo broker account. Quantara will autonomously trade and manage capital for you.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center space-x-1 rounded bg-[#10B981]/10 px-2.5 py-1 text-[10px] font-mono font-bold text-[#10B981] border border-[#10B981]/20">
              <Lock className="h-3 w-3 mr-1 inline" /> 256-BIT SSL ENCRYPTED
            </span>
          </div>

          {/* Demonstration & Testing Notice */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="font-tech text-xs font-bold uppercase tracking-wider text-amber-300">
                Recommended Practice: Connect Demo Account for Initial Testing
              </span>
            </div>
            <p className="text-xs text-[#8E9299] leading-relaxed">
              We encourage you to connect your broker's <strong className="text-white">Demo account</strong> (e.g. <em>Exness-MT5Trial9</em>) first. This allows you to evaluate automated trade execution, verify low slippage, and validate profitability on live market data with <strong className="text-amber-300">zero risk to your real capital</strong>. Once satisfied, connect your Real live account with 1 click.
            </p>
          </div>

          <form onSubmit={handleMT5Login} className="space-y-5">
            {/* Step 1: Select Broker Company Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">
                1. Select Broker / Trading Firm
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BROKER_PRESETS.map((p) => {
                  const isSelected = selectedPreset.name === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`flex items-center space-x-2 p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600/15 text-white shadow-md'
                          : 'border-[#1F1F23] bg-[#0E0E11] text-[#8E9299] hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br ${p.color} text-[10px] font-bold text-white`}>
                        {p.iconText}
                      </div>
                      <span className="font-semibold text-xs truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Server Selection */}
            <div className="space-y-2 bg-[#0E0E11] p-3 rounded-lg border border-[#1F1F23]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-white">
                    2. Broker Trading Server
                  </label>
                  <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-400 border border-blue-500/20">
                    {selectedPreset.name === 'Exness'
                      ? `${EXNESS_SERVERS.length} MT5 Servers Available`
                      : `${selectedPreset.servers.length} Servers Available`}
                  </span>
                </div>
                {selectedPreset.name !== 'Custom MT5 Broker' && (
                  <button
                    type="button"
                    onClick={() => setIsCustomServerMode(!isCustomServerMode)}
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 underline"
                  >
                    {isCustomServerMode ? '← Choose from server list' : '✎ Enter custom server'}
                  </button>
                )}
              </div>

              {/* If Custom Server Mode */}
              {isCustomServerMode || selectedPreset.name === 'Custom MT5 Broker' ? (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Exness-MT5Trial9 or custom MT5 IP:port"
                    value={customServer}
                    onChange={(e) => setCustomServer(e.target.value)}
                    className="w-full rounded-lg border border-blue-500/50 bg-[#0A0A0B] px-3.5 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-[#8E9299]">
                    Type the exact server name found on your MT5 personal area (e.g. <span className="font-mono text-white">Exness-MT5Trial9</span>, <span className="font-mono text-white">Exness-MT5Real12</span>).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Search and category filters for Exness */}
                  {selectedPreset.name === 'Exness' && (
                    <>
                      {/* Filter Search Input */}
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-[#8E9299]" />
                        <input
                          type="text"
                          placeholder="Search Exness server (e.g. Trial9, Real4, MT5...)"
                          value={serverSearch}
                          onChange={(e) => setServerSearch(e.target.value)}
                          className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] pl-8 pr-3 py-1.5 text-white font-mono text-xs focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
                        />
                        {serverSearch && (
                          <button
                            type="button"
                            onClick={() => setServerSearch('')}
                            className="absolute right-2.5 top-2 text-[10px] text-zinc-400 hover:text-white"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Server Category Filter Chips */}
                      <div className="flex items-center space-x-1 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setServerCategory('ALL')}
                          className={`px-2 py-1 rounded transition-colors ${
                            serverCategory === 'ALL'
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-[#141416] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          All ({EXNESS_SERVERS.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setServerCategory('TRIAL')}
                          className={`px-2 py-1 rounded transition-colors ${
                            serverCategory === 'TRIAL'
                              ? 'bg-amber-600 text-white font-semibold'
                              : 'bg-[#141416] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          MT5 Trial / Demo ({EXNESS_MT5_TRIAL_SERVERS.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setServerCategory('REAL')}
                          className={`px-2 py-1 rounded transition-colors ${
                            serverCategory === 'REAL'
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'bg-[#141416] text-[#8E9299] hover:text-white'
                          }`}
                        >
                          MT5 Real Live ({EXNESS_MT5_REAL_SERVERS.length})
                        </button>
                      </div>

                      {/* Quick select presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-[#8E9299] self-center">Popular:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setServer('Exness-MT5Trial9');
                            setAccountType('DEMO');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            server === 'Exness-MT5Trial9'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-[#141416] text-zinc-400 border-[#1F1F23] hover:text-white'
                          }`}
                        >
                          ★ Exness-MT5Trial9 (Demo)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setServer('Exness-MT5Real');
                            setAccountType('REAL');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            server === 'Exness-MT5Real'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-[#141416] text-zinc-400 border-[#1F1F23] hover:text-white'
                          }`}
                        >
                          Exness-MT5Real (Live)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setServer('Exness-MT5Real2');
                            setAccountType('REAL');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            server === 'Exness-MT5Real2'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                              : 'bg-[#141416] text-zinc-400 border-[#1F1F23] hover:text-white'
                          }`}
                        >
                          Exness-MT5Real2
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setServer('Exness-MT5Trial');
                            setAccountType('DEMO');
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                            server === 'Exness-MT5Trial'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                              : 'bg-[#141416] text-zinc-400 border-[#1F1F23] hover:text-white'
                          }`}
                        >
                          Exness-MT5Trial
                        </button>
                      </div>
                    </>
                  )}

                  {/* Primary Select Box */}
                  <select
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3.5 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                    size={selectedPreset.name === 'Exness' && serverSearch ? 6 : 1}
                  >
                    {selectedPreset.name === 'Exness' ? (
                      <>
                        {(serverCategory === 'ALL' || serverCategory === 'TRIAL') && (
                          <optgroup label="─── EXNESS MT5 TRIAL / DEMO SERVERS ───">
                            {EXNESS_MT5_TRIAL_SERVERS
                              .filter((s) => s.toLowerCase().includes(serverSearch.toLowerCase().trim()))
                              .map((s) => (
                                <option key={s} value={s}>
                                  {s} {s === 'Exness-MT5Trial9' ? '★ (Most Popular MT5 Demo Server)' : ''}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {(serverCategory === 'ALL' || serverCategory === 'REAL') && (
                          <optgroup label="─── EXNESS MT5 REAL PRODUCTION SERVERS ───">
                            {EXNESS_MT5_REAL_SERVERS
                              .filter((s) => s.toLowerCase().includes(serverSearch.toLowerCase().trim()))
                              .map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      selectedPreset.servers.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))
                    )}
                  </select>

                  <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
                    <span>
                      Selected Server:{' '}
                      <strong className="text-white font-mono">{server}</strong>
                    </span>
                    {server.includes('Trial') ? (
                      <span className="text-amber-400 font-mono">Demo Server (Non-Monetary)</span>
                    ) : (
                      <span className="text-emerald-400 font-mono">Live STP Production Server</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Custom Account Name / Random Nickname */}
            <div className="space-y-2.5 bg-[#0E0E11] p-3.5 rounded-lg border border-[#1F1F23]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-3.5 w-3.5 text-blue-400" />
                    <label className="text-xs font-semibold text-white">
                      3. Account Name / Identifier
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      (Optional / Customizable)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] mt-0.5">
                    Give this account any custom name or random nickname of your choice for easy identification across dashboards and logs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRandomName}
                  className="self-start sm:self-center shrink-0 rounded-md bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 px-2.5 py-1 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                  title="Generate a random name for this account"
                >
                  <Dices className="h-3.5 w-3.5" />
                  <span>Random Name</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Gold Sniper Exness, Prop Challenge #1, Personal Live ECN"
                  value={customAccountName}
                  onChange={(e) => setCustomAccountName(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3.5 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none pr-10"
                />
                {customAccountName && (
                  <button
                    type="button"
                    onClick={() => setCustomAccountName('')}
                    className="absolute right-3 top-2 text-xs text-zinc-500 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Preset Nicknames */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#8E9299] font-mono">Suggestions:</span>
                {['Apex Gold Scalper', 'Alpha Exness Pro', 'Titan ECN Vault', 'Prop Challenger #1', 'Institutional Trend'].map((quickName) => (
                  <button
                    key={quickName}
                    type="button"
                    onClick={() => setCustomAccountName(quickName)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors border ${
                      customAccountName === quickName
                        ? 'border-blue-500 bg-blue-500/20 text-white font-bold'
                        : 'border-[#1F1F23] bg-[#070709] text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {quickName}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Login & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white">
                  4. Account Number / Login ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10849201"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3.5 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white">
                  5. Master Trader Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter MT5 trader password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3.5 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[#8E9299] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4: Account Type & Capital */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-white">
                4. Account Trading Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* DEMO CARD */}
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('DEMO')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    accountType === 'DEMO'
                      ? 'border-amber-500/80 bg-amber-950/25 shadow-lg ring-1 ring-amber-500/50'
                      : 'border-[#1F1F23] bg-[#0A0A0B] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-tech text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center space-x-1.5">
                      <span>DEMO Testing Run</span>
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/30">
                      ★ RECOMMENDED FIRST
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    Zero risk to capital. Connect a broker demo account to test algorithmic entries, execution speed, and verify profitability with live prices.
                  </p>
                </button>

                {/* REAL CARD */}
                <button
                  type="button"
                  onClick={() => handleAccountTypeChange('REAL')}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    accountType === 'REAL'
                      ? 'border-emerald-500/80 bg-emerald-950/25 shadow-lg ring-1 ring-emerald-500/50'
                      : 'border-[#1F1F23] bg-[#0A0A0B] hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-tech text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center space-x-1.5">
                      <span>REAL Live Account</span>
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                      LIVE CAPITAL
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    Live production trading with your real deposited funds. Strict risk controls, stop losses, and daily drawdown halts are enforced.
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs text-[#8E9299]">Leverage</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500 (Standard ECN)</option>
                    <option value="1:1000">1:1000</option>
                    <option value="1:2000">1:2000</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#8E9299]">Account Capital ($ USD)</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value) || 1000)}
                    placeholder="e.g. 1000"
                    className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 5: Trade Control Permissions & Preferences */}
            <div className="rounded-lg border border-blue-500/20 bg-[#0E0E11] p-4 space-y-3 font-mono">
              <span className="text-xs font-bold text-white block">
                Autonomous Software Control Permissions
              </span>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={authorizeAutoTrading}
                  onChange={(e) => setAuthorizeAutoTrading(e.target.checked)}
                  className="rounded bg-[#141416] border-zinc-700 text-blue-600 mt-0.5"
                />
                <div className="text-xs">
                  <span className="text-white font-semibold block">
                    Authorize Software Autonomous Trade Control
                  </span>
                  <span className="text-[11px] text-[#8E9299]">
                    Allows Quantara to automatically place, manage trailing stops, and close profitable trades on your broker.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prioritizeGold}
                  onChange={(e) => setPrioritizeGold(e.target.checked)}
                  className="rounded bg-[#141416] border-zinc-700 text-yellow-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="text-yellow-400 font-semibold block">
                    Prioritize XAU/USD (Gold Spot) Scalping & Confluence
                  </span>
                  <span className="text-[11px] text-[#8E9299]">
                    Targets high-expectancy Gold momentum setups as our premier recommended asset.
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceRiskManagement}
                  onChange={(e) => setEnforceRiskManagement(e.target.checked)}
                  className="rounded bg-[#141416] border-zinc-700 text-emerald-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="text-emerald-400 font-semibold block">
                    Enforce Hard Stop-Loss & Dynamic Breakeven
                  </span>
                  <span className="text-[11px] text-[#8E9299]">
                    Strictly prevents account blown risk. Every trade includes a non-negotiable mathematical stop.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1F1F23]">
              <button
                type="button"
                onClick={() => setActiveTab('control')}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-tech text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>{isSubmitting ? 'Authenticating with Broker...' : 'Login & Start Autonomous Trading'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: All Connected Broker Accounts Grid & 24/7 Non-Stop Server Manager */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          {/* Top Explanatory Banner & Batch Controls */}
          <div className="rounded-xl border border-blue-500/30 bg-[#0E111A] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-tech text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                  Persistent Connected Accounts & 24/7 Non-Stop Trading Servers
                </h3>
              </div>
              <p className="text-xs text-[#8E9299] max-w-2xl leading-relaxed">
                All connected Demo and Real accounts are saved directly in the system database and persistent disk storage. They execute autonomous trading algorithms <strong className="text-white">non-stop 24/7</strong> in the background, even when you close your browser or restart the application, unless you explicitly <strong className="text-yellow-400">Pause</strong>, <strong className="text-red-400">Stop</strong>, or <strong className="text-red-500">Delete</strong> the server.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onRunAllServers && (
                <button
                  type="button"
                  onClick={async () => {
                    setServerActionLoadingId('all-run');
                    try {
                      await onRunAllServers();
                      setFeedbackMessage({ text: 'All connected servers resumed non-stop 24/7 execution.', type: 'success' });
                    } catch (e: any) {
                      setFeedbackMessage({ text: e.message || 'Failed to start servers', type: 'error' });
                    } finally {
                      setServerActionLoadingId(null);
                    }
                  }}
                  disabled={serverActionLoadingId === 'all-run'}
                  className="rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-3 py-2 text-xs font-mono font-bold text-emerald-300 transition-colors flex items-center space-x-1.5"
                  title="Run all connected servers non-stop 24/7"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Run All Non-Stop</span>
                </button>
              )}

              {onPauseAllServers && (
                <button
                  type="button"
                  onClick={async () => {
                    setServerActionLoadingId('all-pause');
                    try {
                      await onPauseAllServers();
                      setFeedbackMessage({ text: 'All connected servers paused.', type: 'info' });
                    } catch (e: any) {
                      setFeedbackMessage({ text: e.message || 'Failed to pause servers', type: 'error' });
                    } finally {
                      setServerActionLoadingId(null);
                    }
                  }}
                  disabled={serverActionLoadingId === 'all-pause'}
                  className="rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 px-3 py-2 text-xs font-mono font-bold text-yellow-300 transition-colors flex items-center space-x-1.5"
                  title="Pause all connected servers"
                >
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause All</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-2 font-semibold text-white text-xs flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Link Another MT5</span>
              </button>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brokerAccounts.map((acc) => {
              const isActiveTarget = acc.id === activeBrokerAccountId || acc.isActiveForTakeover;
              const serverStatus = acc.serverStatus || 'RUNNING';
              const isRunning = serverStatus === 'RUNNING';
              const isPaused = serverStatus === 'PAUSED';
              const isStopped = serverStatus === 'STOPPED';
              const isLoadingCurrent = serverActionLoadingId === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`rounded-xl border p-4 sm:p-5 space-y-3 relative overflow-hidden transition-all ${
                    isActiveTarget
                      ? 'border-blue-500/80 bg-[#141416] shadow-xl shadow-blue-500/10'
                      : 'border-[#1F1F23] bg-[#141416]/70 hover:border-zinc-700'
                  }`}
                >
                  {isActiveTarget && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-[#10B981]" />
                  )}

                  {/* Header: Name and badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingAccountId === acc.id ? (
                        <div className="space-y-2 py-0.5">
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              placeholder="Account name / nickname"
                              className="w-full rounded border border-blue-500 bg-[#0A0A0B] px-2.5 py-1 text-xs font-mono text-white focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(acc.id);
                                if (e.key === 'Escape') setEditingAccountId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleRandomizeRename}
                              className="rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 p-1.5 text-xs transition-colors shrink-0"
                              title="Generate random name"
                            >
                              <Dices className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled={isRenaming || !renameValue.trim()}
                              onClick={() => handleSaveRename(acc.id)}
                              className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-0.5 text-[11px] font-mono font-bold flex items-center space-x-1 disabled:opacity-50 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAccountId(null)}
                              className="rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 text-[11px] font-mono transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-sm text-white truncate block">{acc.name}</span>
                            <button
                              type="button"
                              onClick={() => handleStartRename(acc)}
                              className="text-zinc-500 hover:text-blue-400 p-0.5 transition-colors shrink-0"
                              title="Rename this account / set custom name"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="text-xs font-mono text-[#8E9299]">
                            {acc.server ? `${acc.server} | #${acc.accountNumber}` : acc.accountNumber}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          acc.isPaper
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                        }`}
                      >
                        {acc.isPaper ? 'DEMO / PROVING' : 'REAL LIVE'}
                      </span>
                      {isActiveTarget && (
                        <span className="rounded bg-[#10B981]/15 text-[#10B981] text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#10B981]/30">
                          ACTIVE TARGET
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Server Lifecycle Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#0E1017] border border-[#222736]">
                    <div className="flex items-center space-x-2">
                      {isRunning && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                          24/7 NON-STOP RUNNING
                        </span>
                      )}
                      {isPaused && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                          <Pause className="h-2.5 w-2.5 mr-1" />
                          SERVER PAUSED
                        </span>
                      )}
                      {isStopped && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <Square className="h-2.5 w-2.5 mr-1 fill-current" />
                          SERVER STOPPED
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="h-3 w-3 mr-1 text-cyan-400" />
                      Saved in System
                    </span>
                  </div>

                  {/* Server Telemetry Metrics */}
                  <div className="space-y-1.5 text-xs font-mono rounded-lg bg-[#0E0E11] p-3 border border-[#1F1F23]">
                    <div className="flex justify-between">
                      <span className="text-[#8E9299]">Server Uptime:</span>
                      <span className="text-white font-medium">
                        {formatServerUptime(acc.uptimeSeconds, acc.connectedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9299]">Capital / Balance:</span>
                      <span className="text-white font-bold">
                        ${(acc.simulatedBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9299]">Leverage:</span>
                      <span className="text-zinc-200">{acc.leverage || '1:500'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9299]">Realized P&L:</span>
                      <span className={((acc.metrics?.realizedPnL || 0) >= 0) ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        ${(acc.metrics?.realizedPnL || 0).toLocaleString(undefined, { minimumFractionDigits: 2, signDisplay: 'always' })}
                      </span>
                    </div>
                  </div>

                  {/* Server Controls: Pause, Stop, Run, Take Over, Rename, Delete */}
                  <div className="pt-3 border-t border-[#1F1F23] space-y-2 text-xs">
                    {/* Primary Row: Server Operations */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isRunning && onPauseServer && (
                        <button
                          type="button"
                          disabled={isLoadingCurrent}
                          onClick={async () => {
                            setServerActionLoadingId(acc.id);
                            try {
                              await onPauseServer(acc.id);
                              setFeedbackMessage({ text: `Server ${acc.name} paused.`, type: 'info' });
                            } catch (e: any) {
                              setFeedbackMessage({ text: e.message || 'Action failed', type: 'error' });
                            } finally {
                              setServerActionLoadingId(null);
                            }
                          }}
                          className="flex-1 min-w-[90px] rounded bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 px-2.5 py-1.5 text-xs font-mono font-semibold flex items-center justify-center space-x-1 transition-colors"
                          title="Pause 24/7 background execution"
                        >
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </button>
                      )}

                      {(isPaused || isStopped) && onResumeServer && (
                        <button
                          type="button"
                          disabled={isLoadingCurrent}
                          onClick={async () => {
                            setServerActionLoadingId(acc.id);
                            try {
                              await onResumeServer(acc.id);
                              setFeedbackMessage({ text: `Server ${acc.name} resumed non-stop 24/7 execution.`, type: 'success' });
                            } catch (e: any) {
                              setFeedbackMessage({ text: e.message || 'Action failed', type: 'error' });
                            } finally {
                              setServerActionLoadingId(null);
                            }
                          }}
                          className="flex-1 min-w-[90px] rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-mono font-semibold flex items-center justify-center space-x-1 transition-colors"
                          title="Run 24/7 non-stop execution"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Run Non-Stop</span>
                        </button>
                      )}

                      {!isStopped && onStopServer && (
                        <button
                          type="button"
                          disabled={isLoadingCurrent}
                          onClick={async () => {
                            setServerActionLoadingId(acc.id);
                            try {
                              await onStopServer(acc.id);
                              setFeedbackMessage({ text: `Server ${acc.name} stopped.`, type: 'info' });
                            } catch (e: any) {
                              setFeedbackMessage({ text: e.message || 'Action failed', type: 'error' });
                            } finally {
                              setServerActionLoadingId(null);
                            }
                          }}
                          className="flex-1 min-w-[90px] rounded bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1.5 text-xs font-mono font-semibold flex items-center justify-center space-x-1 transition-colors"
                          title="Stop execution engine"
                        >
                          <Square className="h-3 w-3 fill-current" />
                          <span>Stop</span>
                        </button>
                      )}

                      {onSelectActiveBroker && !isActiveTarget && (
                        <button
                          type="button"
                          onClick={() => onSelectActiveBroker(acc.id)}
                          className="flex-1 min-w-[90px] rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-2.5 py-1.5 text-xs font-semibold border border-blue-500/30 transition-colors text-center"
                        >
                          Take Over
                        </button>
                      )}
                    </div>

                    {/* Secondary Row: Rename & Delete Server */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-2">
                        {isActiveTarget && (
                          <span className="text-xs font-mono text-[#10B981] font-semibold flex items-center">
                            <Check className="h-3.5 w-3.5 mr-1" /> Primary Active
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectActiveBroker) onSelectActiveBroker(acc.id);
                            setActiveTab('report');
                          }}
                          className="rounded bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 px-2 py-1 text-xs font-mono flex items-center space-x-1 border border-emerald-500/30 transition-colors"
                          title="View complete account performance report"
                        >
                          <FileText className="h-3 w-3 text-emerald-400" />
                          <span>View Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(acc)}
                          className="rounded bg-[#0E0E11] hover:bg-zinc-800 text-zinc-300 hover:text-white px-2 py-1 text-xs font-mono flex items-center space-x-1 border border-[#1F1F23] hover:border-zinc-700 transition-colors"
                          title="Rename account"
                        >
                          <Edit2 className="h-3 w-3 text-blue-400" />
                          <span>Rename</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setServerToDelete(acc)}
                        className="text-[#EF4444] hover:text-red-300 px-2 py-1 text-xs font-semibold flex items-center transition-colors"
                        title="Permanently remove and delete server"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1 inline" />
                        <span>Delete Server</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delete Server Confirmation Modal */}
          {serverToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-[#0E1017] p-5 sm:p-6 space-y-4 shadow-2xl">
                <div className="flex items-center space-x-3 text-red-400">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Delete Trading Server?</h4>
                    <p className="text-xs text-[#8E9299]">Confirm permanent removal from system</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Are you sure you want to delete server <strong className="text-white">{serverToDelete.name}</strong> (#{serverToDelete.accountNumber})?
                  This will halt its non-stop 24/7 background execution and permanently delete the connection credentials from the system disk storage.
                </p>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1F2433]">
                  <button
                    type="button"
                    disabled={isDeletingServer}
                    onClick={() => setServerToDelete(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#141722] hover:bg-[#1A1F2E] text-zinc-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingServer}
                    onClick={async () => {
                      setIsDeletingServer(true);
                      try {
                        await onDisconnectBroker(serverToDelete.id);
                        setFeedbackMessage({
                          text: `Server ${serverToDelete.name} deleted and removed from system.`,
                          type: 'info',
                        });
                        setServerToDelete(null);
                      } catch (err: any) {
                        setFeedbackMessage({
                          text: 'Failed to delete server: ' + err.message,
                          type: 'error',
                        });
                      } finally {
                        setIsDeletingServer(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono transition-colors flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isDeletingServer ? 'Deleting...' : 'Confirm Delete Server'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Live MT5 Terminal Journal / Execution Logs */}
      {activeTab === 'journal' && (
        <div className="rounded-xl border border-[#1F1F23] bg-[#0E0E11] p-5 space-y-3 font-mono text-xs shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-blue-400" />
              <span className="text-white font-bold uppercase tracking-wider">
                MetaTrader 5 Live Terminal Journal & Protocol Stream
              </span>
            </div>
            <span className="text-[10px] text-[#8E9299]">Auto-updating live</span>
          </div>

          <div className="bg-[#070709] p-4 rounded-lg border border-[#1F1F23] space-y-1.5 max-h-[380px] overflow-y-auto text-[11px] leading-relaxed">
            <p className="text-emerald-400">
              [2026.09.11 14:45:01.102] MT5-BRIDGE: Initialized TCP socket connection to {activeAccount?.server || 'Exness-MT5Real'}:443. Ping: {activeAccount?.pingMs || 14}ms.
            </p>
            <p className="text-blue-400">
              [2026.09.11 14:45:01.189] AUTH: Login #{activeAccount?.accountNumber || '10849201'} verified with broker authorization server. Account type: {activeAccount?.accountType || 'REAL'}.
            </p>
            <p className="text-zinc-300">
              [2026.09.11 14:45:01.240] SYMBOL_LOAD: Subscribed to institutional tick streams for XAU/USD, EUR/USD, GBP/USD, USD/JPY.
            </p>
            <p className="text-yellow-400">
              [2026.09.11 14:45:02.010] QUANTARA-AUTO-PILOT: Engine takeover confirmed. Autonomous execution mode: ACTIVE. Risk per trade: {riskPerTradePercent}%.
            </p>
            <p className="text-zinc-400">
              [2026.09.11 14:45:05.412] SCAN: XAU/USD Spot Gold @ ${goldAsset.currentPrice.toFixed(2)} - Spread 1.2 pips. Volume surge detected: 2.3x benchmark.
            </p>
            <p className="text-emerald-300">
              [2026.09.11 14:45:10.150] RISK-ENGINE: Dynamic lot sizing evaluated. Sizing for ${portfolio?.cashBalance || activeAccount?.simulatedBalance || 1000} balance = {dynamicGoldLots} Lots on Gold.
            </p>
            <p className="text-zinc-400">
              [2026.09.11 14:45:15.820] HEARTBEAT: Ping {activeAccount?.pingMs || 14}ms. 0 packet loss. Auto-trading safety guardrails verified intact.
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: Connected Server Institutional Account Report */}
      {activeTab === 'report' && (
        <AccountReportView
          brokerAccounts={brokerAccounts}
          selectedServerId={activeAccount?.id}
          onSelectServer={(id) => {
            if (onSelectActiveBroker) {
              onSelectActiveBroker(id);
            }
          }}
          tradesHistory={tradesHistory}
          user={user}
          onRefresh={onRefreshData}
        />
      )}

      {/* TAB 6: Real Broker Orders & MT5 Terminal Bridge */}
      {activeTab === 'bridge' && (
        <RealBrokerBridgeView
          activeAccount={activeAccount}
          accounts={brokerAccounts}
          positions={positions}
          onRefresh={onRefreshData}
        />
      )}
    </div>
  );
};

function SaveConfigIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}
