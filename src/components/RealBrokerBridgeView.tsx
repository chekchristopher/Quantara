import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Play,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react';
import { BrokerAccount, Position, RealBrokerBridgeStatus, RealExecutionEvent } from '../types';

interface RealBrokerBridgeViewProps {
  activeAccount?: BrokerAccount;
  accounts: BrokerAccount[];
  positions?: Position[];
  onRefresh?: () => void;
}

export const RealBrokerBridgeView: React.FC<RealBrokerBridgeViewProps> = ({
  activeAccount,
  accounts,
  positions = [],
  onRefresh,
}) => {
  const [bridgeStatus, setBridgeStatus] = useState<RealBrokerBridgeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string; success: boolean } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('XAU/USD');
  const [selectedAction, setSelectedAction] = useState<'BUY' | 'SELL'>('BUY');

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const bridgeUrl = `${currentHost}/api/bridge`;
  const targetAccount = activeAccount || accounts[0];
  const bridgeToken = targetAccount?.bridgeToken || 'qnt_live_token';

  const fetchBridgeStatus = async () => {
    try {
      const res = await fetch('/api/bridge/status');
      if (res.ok) {
        const data = await res.json();
        setBridgeStatus(data);
      }
    } catch (err) {
      console.warn('Unable to load bridge status:', err);
    }
  };

  const fetchCodeSnippet = async () => {
    try {
      const token = targetAccount?.bridgeToken || '';
      const res = await fetch(`/api/bridge/script/code?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setCodeSnippet(data.code || '');
      }
    } catch (err) {
      console.warn('Unable to load MQL5 code:', err);
    }
  };

  useEffect(() => {
    fetchBridgeStatus();
    fetchCodeSnippet();
    const interval = setInterval(fetchBridgeStatus, 3000);
    return () => clearInterval(interval);
  }, [targetAccount?.id]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleToggleMode = async (mode: 'SIMULATED' | 'REAL_BROKER') => {
    setIsTogglingMode(true);
    try {
      const res = await fetch('/api/bridge/toggle-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) {
        await fetchBridgeStatus();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Mode toggle failed:', err);
    } finally {
      setIsTogglingMode(false);
    }
  };

  const handleSendTestDispatch = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/bridge/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset,
          action: selectedAction,
          lotSize: 0.01,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Order enqueued: ${selectedAction} 0.01 Lots on ${selectedAsset}. Method: ${data.method || 'MQL5 EA Bridge'}. Check your MT5 Experts tab!`,
        });
        await fetchBridgeStatus();
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Failed to dispatch test order.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Dispatch error.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const isRealBrokerActive = bridgeStatus?.activeMode === 'REAL_BROKER' || targetAccount?.executionMode === 'REAL_BROKER';
  const isTerminalOnline = Boolean(
    targetAccount?.isTerminalConnected ||
    (bridgeStatus?.terminals && bridgeStatus.terminals.some((t) => t.isOnline))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Real Broker Order Execution Toggle */}
      <div
        id="bridge-mode-card"
        className={`relative overflow-hidden rounded-2xl border p-6 transition-all shadow-xl ${
          isRealBrokerActive
            ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/40 via-zinc-900/90 to-zinc-950'
            : 'border-zinc-800 bg-zinc-900/70'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isRealBrokerActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRealBrokerActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                  }`}
                />
                {isRealBrokerActive ? 'Real Broker Live Routing' : 'Simulated STP Sandbox'}
              </span>

              <span className="text-xs text-zinc-400">
                Target: <strong className="text-white">{targetAccount?.name || 'Primary Server'}</strong> (#{targetAccount?.accountNumber || '10849201'})
              </span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className={isRealBrokerActive ? 'w-5 h-5 text-emerald-400' : 'w-5 h-5 text-zinc-400'} />
              {isRealBrokerActive ? 'Real Broker Orders Active' : 'Simulated Order Sandbox'}
            </h2>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {isRealBrokerActive
                ? 'All autonomous strategy decisions and manual orders are routed directly into your live MetaTrader 5 terminal through native OrderSend() and cloud bridges. Real broker fills, slippage, and tickets are recorded.'
                : 'System is currently operating in safe STP simulation mode. Switch to Real Broker Execution below to place real orders directly into your broker account.'}
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 p-1.5 bg-zinc-950/80 rounded-xl border border-zinc-800 self-start lg:self-center">
            <button
              id="btn-mode-simulated"
              onClick={() => handleToggleMode('SIMULATED')}
              disabled={isTogglingMode}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                !isRealBrokerActive
                  ? 'bg-zinc-800 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Simulated Sandbox
            </button>

            <button
              id="btn-mode-real"
              onClick={() => handleToggleMode('REAL_BROKER')}
              disabled={isTogglingMode}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                isRealBrokerActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Real Broker Live Orders
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Terminal Health */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>MT5 Terminal Status</span>
            <Terminal className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isTerminalOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span className="text-base font-bold text-white">
                {isTerminalOnline ? 'Terminal Connected' : 'Waiting for EA Ping'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 truncate">
              {targetAccount?.terminalVersion || 'MetaTrader 5 x64 Build 4450'}
            </p>
          </div>
        </div>

        {/* Latency / Ping */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Execution Latency</span>
            <Wifi className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 flex items-baseline gap-1">
              {targetAccount?.pingMs || 11}
              <span className="text-xs text-zinc-400 font-normal">ms (STP Fiber)</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">High-frequency polling cycle</p>
          </div>
        </div>

        {/* Real Orders Executed */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Real Broker Tickets</span>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {bridgeStatus?.realOrdersExecutedCount || targetAccount?.realOrdersExecutedCount || 0}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Confirmed on MT5 terminal</p>
          </div>
        </div>

        {/* Live Broker Equity */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Broker Equity Mirror</span>
            <Globe className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              ${(targetAccount?.equity || targetAccount?.simulatedBalance || 5000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {targetAccount?.broker || 'Exness'} • {targetAccount?.server || 'MT5Real'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Bridge Setup & Download Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Step-by-Step Setup Guide */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                MetaTrader 5 EA Bridge Setup (Zero Third-Party Cost)
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 font-mono">
                MQL5 Build 4450+
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              To route trades from this Quantara AI engine straight into your real Exness or broker MT5 terminal, attach our lightweight Expert Advisor. It communicates securely with this server via MT5's native <code className="text-amber-300 font-mono">WebRequest()</code> and executes orders at market with native <code className="text-emerald-300 font-mono">OrderSend()</code>.
            </p>

            {/* Credentials to Copy */}
            <div className="space-y-3 pt-2">
              {/* WebRequest URL */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>1. Allowed WebRequest Base URL (Paste in MT5 Options):</span>
                  <span className="text-[11px] text-zinc-500">Tools → Options → Expert Advisors</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-amber-300 truncate">
                    {currentHost}
                  </div>
                  <button
                    id="btn-copy-url"
                    onClick={() => handleCopy(currentHost, 'url')}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'url' ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </div>

              {/* Bridge Token */}
              <div>
                <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
                  <span>2. Unique Account Bridge Token:</span>
                  <span className="text-[11px] text-zinc-500">Auto-authenticates terminal #{targetAccount?.accountNumber || '10849201'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-400 truncate">
                    {bridgeToken}
                  </div>
                  <button
                    id="btn-copy-token"
                    onClick={() => handleCopy(bridgeToken, 'token')}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedField === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'token' ? 'Copied' : 'Copy Token'}
                  </button>
                </div>
              </div>
            </div>

            {/* Download & Copy Action Buttons */}
            <div className="pt-3 border-t border-zinc-800 flex flex-wrap gap-3">
              <a
                id="btn-download-ea"
                href={`/api/bridge/script/download?token=${encodeURIComponent(bridgeToken)}`}
                download="Quantara_MT5_AutoBridge.mq5"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Quantara_MT5_AutoBridge.mq5
              </a>

              <button
                id="btn-copy-mql5"
                onClick={() => handleCopy(codeSnippet, 'mql5')}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
              >
                {copiedField === 'mql5' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4" />}
                {copiedField === 'mql5' ? 'Code Copied to Clipboard!' : 'Copy Full MQL5 Source Code'}
              </button>
            </div>

            {/* 3 Step Walkthrough */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-amber-400">Step 1</span>
                <p className="text-zinc-400 mt-1">
                  In MT5, open <strong className="text-white">Tools → Options → Expert Advisors</strong>. Check "Allow WebRequest for listed URL" and paste the URL above.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-amber-400">Step 2</span>
                <p className="text-zinc-400 mt-1">
                  Save <strong className="text-white">Quantara_MT5_AutoBridge.mq5</strong> in <code className="text-zinc-300">MQL5/Experts</code>, open MetaEditor, and click <strong className="text-white">Compile</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-amber-400">Step 3</span>
                <p className="text-zinc-400 mt-1">
                  Drag the EA onto your chart (e.g. XAU/USD), turn ON <strong className="text-emerald-400">Algo Trading</strong> in MT5, and orders will execute in real-time!
                </p>
              </div>
            </div>
          </div>

          {/* Test Order Dispatch Box */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Live Order Dispatch Test (Verify Terminal Connection)
            </h4>
            <p className="text-xs text-zinc-400">
              Send a microscopic test order (0.01 Lots) through the execution pipeline to confirm that your MT5 terminal receives and fills it.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
              >
                <option value="XAU/USD">XAU/USD (Gold Spot)</option>
                <option value="EUR/USD">EUR/USD</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="USD/JPY">USD/JPY</option>
              </select>

              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as 'BUY' | 'SELL')}
                className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
              >
                <option value="BUY">BUY 0.01 Lots</option>
                <option value="SELL">SELL 0.01 Lots</option>
              </select>

              <button
                id="btn-send-test-dispatch"
                onClick={handleSendTestDispatch}
                disabled={isSendingTest}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-2"
              >
                {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {isSendingTest ? 'Dispatching...' : 'Dispatch Test Order to MT5'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs border ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Right: Real Execution Event Stream & Active Positions with Tickets */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real Execution Stream */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Execution Event Log
              </h4>
              <button
                onClick={fetchBridgeStatus}
                className="p-1 rounded text-zinc-400 hover:text-white"
                title="Refresh logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {bridgeStatus?.recentEvents && bridgeStatus.recentEvents.length > 0 ? (
                bridgeStatus.recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold uppercase ${
                          evt.type === 'FILL'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : evt.type === 'DISPATCH'
                            ? 'bg-blue-500/20 text-blue-400'
                            : evt.type === 'CLOSE'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {evt.type}
                      </span>
                    </div>

                    <p className="text-zinc-200 text-xs leading-relaxed">{evt.message}</p>

                    {evt.ticket && (
                      <div className="text-[11px] font-mono text-amber-400">
                        MT5 Ticket: #{evt.ticket}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No orders dispatched yet. Run a strategy or click "Dispatch Test Order" to view live broker execution events.
                </div>
              )}
            </div>
          </div>

          {/* Active Positions with Real Ticket Numbers */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Live MT5 Positions ({positions.length})
              </span>
              <span className="text-xs text-zinc-400 font-normal">Active on Broker</span>
            </h4>

            {positions.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{pos.symbol}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {pos.side} {pos.lotSize ? pos.lotSize.toFixed(2) + ' Lots' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Entry: ${pos.entryPrice.toFixed(2)} • Now: ${pos.currentPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono font-bold ${
                          pos.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-amber-400">
                        {pos.ticketNumber ? `Ticket #${pos.ticketNumber}` : 'Broker STP'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 text-center py-4">
                No active broker positions currently open.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
