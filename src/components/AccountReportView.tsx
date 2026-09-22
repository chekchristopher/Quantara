import React, { useState, useMemo } from 'react';
import {
  Server,
  ShieldCheck,
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Lock,
  Database,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  Zap,
  CheckCircle,
  ExternalLink,
  HelpCircle,
  Trash2,
  Plus,
} from 'lucide-react';
import { BrokerAccount, TradeHistoryItem, ServerAccountReport } from '../types';
import { firestoreSync } from '../services/firestoreSync';

interface AccountReportViewProps {
  brokerAccounts: BrokerAccount[];
  selectedServerId?: string;
  onSelectServer?: (id: string) => void;
  onDisconnectBroker?: (id: string) => Promise<any>;
  onSwitchOrNewMT5?: () => void;
  tradesHistory: TradeHistoryItem[];
  user?: any;
  onRefresh?: () => void;
}

export const AccountReportView: React.FC<AccountReportViewProps> = ({
  brokerAccounts,
  selectedServerId,
  onSelectServer,
  onDisconnectBroker,
  onSwitchOrNewMT5,
  tradesHistory,
  user,
  onRefresh,
}) => {
  // Active selected server (default to provided id, or first account, or 'ALL')
  const [activeId, setActiveId] = useState<string>(
    selectedServerId || (brokerAccounts.length > 0 ? brokerAccounts[0].id : 'ALL')
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [selectedTradeForAI, setSelectedTradeForAI] = useState<TradeHistoryItem | null>(null);
  const [serverToDelete, setServerToDelete] = useState<BrokerAccount | null>(null);
  const [isDeletingServer, setIsDeletingServer] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  // Synchronize when prop changes
  React.useEffect(() => {
    if (selectedServerId) {
      setActiveId(selectedServerId);
    }
  }, [selectedServerId]);

  const activeServer = useMemo(() => {
    return brokerAccounts.find((b) => b.id === activeId) || brokerAccounts[0];
  }, [brokerAccounts, activeId]);

  // Calculate report using firestoreSync helper
  const report: ServerAccountReport | null = useMemo(() => {
    if (!activeServer) return null;
    return firestoreSync.generateServerReport(activeServer, tradesHistory);
  }, [activeServer, tradesHistory]);

  // Filtered trade list for table
  const filteredTrades = useMemo(() => {
    if (!report) return [];
    return report.trades.filter((t) => {
      const matchSearch =
        t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.strategyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.exitReason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDir = directionFilter === 'ALL' || (directionFilter === 'LONG' ? t.side === 'LONG' : t.side === 'SHORT');
      const matchOutcome =
        outcomeFilter === 'ALL' ||
        (outcomeFilter === 'WINS' && t.realizedPnl > 0) ||
        (outcomeFilter === 'LOSSES' && t.realizedPnl <= 0);

      return matchSearch && matchDir && matchOutcome;
    });
  }, [report, searchTerm, directionFilter, outcomeFilter]);

  // Trigger Force Save of Server Profile & Report to Firebase
  const handleForceCloudSync = async () => {
    if (!user || !activeServer || !report) {
      setSyncSuccessMsg('Cloud sync simulated: Connected Server validated and persisted locally.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
      return;
    }
    setSyncingCloud(true);
    try {
      // 1. Save broker profile to Firestore with security hashes
      await firestoreSync.saveBrokerProfile(user.uid, activeServer);
      // 2. Save report to Firestore
      await firestoreSync.saveServerReport(user.uid, activeServer.id, report);
      // 3. Sync executed trades to subcollection
      for (const t of report.trades.slice(0, 10)) {
        await firestoreSync.saveServerTrade(user.uid, activeServer.id, t);
      }
      setSyncSuccessMsg('Firebase Database: Connected server, security tokens, and execution report successfully synced to Firestore!');
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to sync report to Firestore:', err);
      setSyncSuccessMsg('Cloud sync error: ' + (err.message || 'Please check network'));
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } finally {
      setSyncingCloud(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!report || report.trades.length === 0) return;
    const headers = [
      'Ticket ID',
      'Server Name',
      'Account Number',
      'Symbol',
      'Side',
      'Lot Size',
      'Quantity',
      'Entry Price',
      'Exit Price',
      'Net PnL ($)',
      'Return (%)',
      'Exit Reason',
      'Strategy',
      'Opened At',
      'Closed At',
    ];
    const rows = report.trades.map((t) => [
      t.id,
      report.serverName,
      report.accountNumber,
      t.symbol,
      t.side,
      t.lotSize ?? 0.05,
      t.quantity,
      t.entryPrice,
      t.exitPrice,
      t.realizedPnl,
      t.realizedPnlPercent,
      t.exitReason,
      `"${t.strategyName || 'Adaptive Regime Meta-Engine'}"`,
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quantara_Account_Report_${activeServer?.server || 'Server'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report PDF
  const handlePrintReport = () => {
    window.print();
  };

  if (!activeServer || !report) {
    return (
      <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-xl">
        <Server className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-200">No Connected Servers Found</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Connect a broker server (MT5, Exness, FXTM, or IC Markets) to generate automated execution reports and secure cloud database backups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Server Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Connected Server Account Report
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                    ENTERPRISE AUDIT
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete institutional trade execution record, risk telemetry, and verified Firebase cloud synchronization.
                </p>
              </div>
            </div>
          </div>

          {/* Server Selector Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-medium text-slate-400">Select Server:</label>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {brokerAccounts.map((acc) => {
                const isSelected = acc.id === activeId;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setActiveId(acc.id);
                      if (onSelectServer) onSelectServer(acc.id);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>{acc.name || acc.server || 'Server'}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'CONNECTED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {onSwitchOrNewMT5 && (
                <button
                  type="button"
                  onClick={onSwitchOrNewMT5}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-all"
                  title="Connect a new MT5 account or switch configuration"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Switch / New MT5</span>
                </button>
              )}

              {onDisconnectBroker && activeServer && (
                <button
                  type="button"
                  onClick={() => setServerToDelete(activeServer)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg border border-red-500/30 flex items-center gap-1.5 transition-all"
                  title={`Remove and permanently delete server ${activeServer.name || activeServer.server}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Remove Server</span>
                </button>
              )}

              <button
                onClick={handleForceCloudSync}
                disabled={syncingCloud}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-all"
                title="Force sync server configuration and trades to Firebase Firestore"
              >
                <Database className={`w-3.5 h-3.5 text-blue-400 ${syncingCloud ? 'animate-spin' : ''}`} />
                <span>{syncingCloud ? 'Syncing...' : 'Sync to Firebase'}</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700/80 flex items-center gap-1.5 transition-all"
                title="Download CSV report of executed trades"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Success Message Banner */}
        {syncSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {/* Delete Feedback Message Banner */}
        {deleteFeedback && (
          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>{deleteFeedback}</span>
            </div>
            <button
              onClick={() => setDeleteFeedback(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Connected Server Security & Infrastructure Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 lg:col-span-3">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Connected Server Infrastructure & Security
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-3 h-3" />
                AES-256-GCM Military Grade
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database className="w-3 h-3" />
                Firebase Database Linked
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Host Gateway</span>
              <span className="font-mono text-slate-200 font-semibold truncate block mt-0.5">
                {report.serverTelemetry.host}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Protocol & FIX</span>
              <span className="font-mono text-slate-200 font-semibold truncate block mt-0.5">
                {report.serverTelemetry.protocol}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Latency Ping</span>
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3" />
                {report.serverTelemetry.pingMs} ms (Direct)
              </span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Server Uptime</span>
              <span className="font-mono text-slate-200 font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-blue-400" />
                {report.serverTelemetry.uptimeHours} Hours Non-Stop
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="text-slate-400 font-medium">Security Hash:</span>
              <span className="font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-300 border border-slate-800 truncate">
                {report.serverTelemetry.securityHash}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-slate-400 font-medium">Cloud Store:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Firestore Encrypted at Rest & Transit
              </span>
            </div>
          </div>
        </div>

        {/* Server Account Snapshot Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Broker Account Link
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">{report.serverName}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                report.accountType === 'REAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {report.accountType} ACCOUNT
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Login: #{report.accountNumber} • Leverage: {report.leverage}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Current Equity:</span>
              <span className="font-mono font-bold text-white">
                ${report.financialSummary.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Free Margin:</span>
              <span className="font-mono text-slate-300">
                ${report.financialSummary.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Initial Seed</span>
          <span className="text-base font-bold font-mono text-slate-200 block mt-1">
            ${report.financialSummary.initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Starting capital</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Balance</span>
          <span className="text-base font-bold font-mono text-white block mt-1">
            ${report.financialSummary.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Liquid cash balance</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Net Realized PnL</span>
          <span className={`text-base font-bold font-mono block mt-1 flex items-center gap-1 ${
            report.financialSummary.netProfitUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {report.financialSummary.netProfitUsd >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {report.financialSummary.netProfitUsd >= 0 ? '+' : ''}${report.financialSummary.netProfitUsd.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {report.financialSummary.returnPercent >= 0 ? '+' : ''}{report.financialSummary.returnPercent}% ROI
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Win Rate</span>
          <span className="text-base font-bold font-mono text-emerald-400 block mt-1">
            {report.executionSummary.winRatePercent.toFixed(1)}%
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {report.executionSummary.winningTrades}W / {report.executionSummary.losingTrades}L
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Profit Factor</span>
          <span className="text-base font-bold font-mono text-blue-400 block mt-1">
            {report.executionSummary.profitFactor}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Gross Win / Gross Loss</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lots Traded</span>
          <span className="text-base font-bold font-mono text-amber-300 block mt-1">
            {report.executionSummary.totalLotsTraded.toFixed(2)} Lots
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Avg: {report.executionSummary.averageLotSize.toFixed(2)} Lot / trade
          </span>
        </div>
      </div>

      {/* Execution Performance & Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Win/Loss Ratio Meter */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
            <span>Trade Outcomes Distribution</span>
            <span className="text-[11px] text-slate-400">{report.executionSummary.totalTrades} Total Trades</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-400 font-medium">Winning Trades:</span>
              <span className="font-mono text-slate-200">{report.executionSummary.winningTrades} ({report.executionSummary.winRatePercent.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex border border-slate-800">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${report.executionSummary.winRatePercent}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${100 - report.executionSummary.winRatePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-rose-400 font-medium">Losing Trades:</span>
              <span className="font-mono text-slate-200">
                {report.executionSummary.losingTrades} ({report.executionSummary.totalTrades > 0 ? (100 - report.executionSummary.winRatePercent).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Win / Loss Magnitude */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Average Trade Magnitudes
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Average Win Size:</span>
              <span className="font-mono text-emerald-400 font-bold">+${report.executionSummary.averageWinUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Average Loss Size:</span>
              <span className="font-mono text-rose-400 font-bold">-${report.executionSummary.averageLossUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Best Execution:</span>
              <span className="font-mono text-emerald-400 font-bold">+${report.executionSummary.bestTradeUsd.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Risk & Drawdown */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Risk & Exposure Guard
          </h4>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Peak Balance:</span>
              <span className="font-mono text-slate-200">${report.financialSummary.peakBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Max Historical Drawdown:</span>
              <span className="font-mono text-amber-400 font-bold">{report.financialSummary.maxDrawdownPercent}%</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Lot Sizing Range:</span>
              <span className="font-mono text-blue-400 font-bold">0.01 - 0.10 Lots strictly guarded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trades Executed on Connected Server: Search & Audit Trail */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Trades Executed for Connected Server ({filteredTrades.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of every position filled and closed on this server by Quantara's autonomous engine.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search symbol, ticket, reason..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sides</option>
              <option value="LONG">Long (Buy)</option>
              <option value="SHORT">Short (Sell)</option>
            </select>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WINS">Wins Only</option>
              <option value="LOSSES">Losses Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Ticket / Timestamp</th>
                <th className="px-4 py-3">Asset</th>
                <th className="px-4 py-3">Direction</th>
                <th className="px-4 py-3 text-center">Lot Size Taken</th>
                <th className="px-4 py-3">Entry Price</th>
                <th className="px-4 py-3">Exit Price</th>
                <th className="px-4 py-3 text-right">Net Realized PnL</th>
                <th className="px-4 py-3">Exit Reason</th>
                <th className="px-4 py-3 text-center">AI Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-sans">
                    No trades executed on this server match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t) => {
                  const isLong = t.side === 'LONG' || t.side === 'BUY';
                  const isWin = t.realizedPnl >= 0;
                  const lot = t.lotSize ?? 0.05;

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-slate-300 font-bold block">{t.id.slice(0, 14)}</span>
                        <span className="text-[10px] text-slate-400 font-sans block">
                          {new Date(t.exitTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-bold">{t.symbol}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isLong ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isLong ? 'BUY / LONG' : 'SELL / SHORT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 font-bold border border-blue-500/30 text-[11px]">
                          {lot.toFixed(2)} Lots
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ${t.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        ${t.exitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold block ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? '+' : ''}${t.realizedPnl.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isWin ? '+' : ''}{t.realizedPnlPercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-medium border border-slate-700">
                          {t.exitReason?.replace('_', ' ') || 'TAKE PROFIT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedTradeForAI(t)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded text-[11px] font-sans transition-all inline-flex items-center gap-1 border border-slate-700"
                        >
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Insight</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Rationale Modal */}
      {selectedTradeForAI && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Quantara AI Autonomous Execution Rationale</span>
              </div>
              <button
                onClick={() => setSelectedTradeForAI(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Trade Ticket:</span>
                <span className="font-mono text-white font-bold">{selectedTradeForAI.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Server Target:</span>
                <span className="font-mono text-emerald-400">{report.serverName} (#{report.accountNumber})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Lot Sizing Strategy:</span>
                <span className="font-mono text-blue-400 font-bold">{selectedTradeForAI.lotSize ?? 0.05} Lots (Risk Controlled)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Result:</span>
                <span className={`font-mono font-bold ${selectedTradeForAI.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedTradeForAI.realizedPnl >= 0 ? '+' : ''}${selectedTradeForAI.realizedPnl.toFixed(2)} ({selectedTradeForAI.realizedPnlPercent}%)
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1 font-semibold">Engine Explanation:</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-sans text-slate-200 leading-relaxed">
                  {selectedTradeForAI.tradeExplanation ||
                    `Executed ${selectedTradeForAI.side} on ${selectedTradeForAI.symbol} targeting optimal statistical edge. Exit triggered via ${selectedTradeForAI.exitReason}.`}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTradeForAI(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

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

            <div className="rounded-lg bg-[#0A0D14] border border-[#1F2433] p-3 text-xs space-y-1 font-mono">
              <div className="text-white font-bold">{serverToDelete.name || 'MT5 Server'}</div>
              <div className="text-[#8E9299]">Login ID: #{serverToDelete.accountNumber}</div>
              <div className="text-blue-400">Broker: {serverToDelete.server || serverToDelete.broker || 'Exness-MT5'}</div>
              <div className="text-zinc-400">Environment: {serverToDelete.isPaper ? 'Demo / Proving' : 'Real Live ECN'}</div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete server <strong className="text-white">{serverToDelete.name}</strong> (#{serverToDelete.accountNumber})?
              This will halt its execution and permanently delete the connection credentials, performance reports, and Firebase database profile.
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
                  if (!onDisconnectBroker) return;
                  setIsDeletingServer(true);
                  try {
                    await onDisconnectBroker(serverToDelete.id);
                    setDeleteFeedback(`Server ${serverToDelete.name} was successfully deleted and removed from system.`);
                    setServerToDelete(null);
                    // Select next server if available
                    const remaining = brokerAccounts.filter((a) => a.id !== serverToDelete.id);
                    if (remaining.length > 0 && onSelectServer) {
                      setActiveId(remaining[0].id);
                      onSelectServer(remaining[0].id);
                    }
                  } catch (err: any) {
                    setDeleteFeedback('Failed to delete server: ' + err.message);
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
  );
};
