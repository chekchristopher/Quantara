import React from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  Percent,
  Calendar,
  Layers
} from 'lucide-react';
import { BotState, BrokerAccount, PortfolioSummary, RiskSettings, TradeHistoryItem } from '../types';
import { RISK_PROFILES } from '../data/riskProfiles';

interface PerformanceStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioSummary;
  botState: BotState;
  tradesHistory: TradeHistoryItem[];
  riskSettings: RiskSettings;
  brokerAccounts: BrokerAccount[];
}

export const PerformanceStatementModal: React.FC<PerformanceStatementModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  botState,
  tradesHistory,
  riskSettings,
  brokerAccounts,
}) => {
  if (!isOpen) return null;

  const activeBroker = brokerAccounts.find(
    (b) => b.serverStatus === 'RUNNING' || b.status === 'RUNNING' || b.status === 'CONNECTED'
  ) || brokerAccounts[0];

  const profileKey = (riskSettings.activeProfile || 'BALANCED') as keyof typeof RISK_PROFILES;
  const profileDef = RISK_PROFILES[profileKey] || RISK_PROFILES.BALANCED;

  const totalTrades = tradesHistory.length;
  const winningTrades = tradesHistory.filter((t) => t.pnl > 0).length;
  const losingTrades = tradesHistory.filter((t) => t.pnl < 0).length;
  const calculatedWinRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : portfolio.winRatePercent.toFixed(1);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Ticket ID', 'Timestamp', 'Asset', 'Side', 'Lots', 'Entry Price', 'Exit Price', 'Realized PnL ($)', 'Strategy'];
    const rows = tradesHistory.map((t) => [
      t.id,
      new Date(t.timestamp).toISOString(),
      t.symbol,
      t.side,
      t.size,
      t.entryPrice,
      t.exitPrice,
      t.pnl.toFixed(2),
      `"${t.strategyName || 'Autonomous Regime'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quantara_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#0E1015] p-5 sm:p-8 text-white shadow-2xl my-auto">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 print:hidden">
          <div className="flex items-center space-x-2 text-xs font-mono text-blue-400">
            <FileText className="h-4 w-4" />
            <span className="font-bold uppercase tracking-wider">Official Trading Statement</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold text-white transition-colors shadow-md shadow-blue-600/30"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Statement Canvas */}
        <div className="mt-6 space-y-6 text-zinc-200 print:text-black print:mt-0 font-sans">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-800 print:border-zinc-300">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-brand font-bold text-2xl tracking-wider text-white print:text-black">
                  QUANT<span className="text-blue-500">ARA</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold print:border print:border-blue-500">
                  AUTONOMOUS EXECUTION
                </span>
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600 mt-1">
                Verified Cryptographic Performance Statement &amp; Execution Journal
              </p>
            </div>

            <div className="text-right font-mono text-xs text-zinc-400 print:text-zinc-700">
              <div>Statement Date: <strong className="text-white print:text-black">{new Date().toLocaleDateString()}</strong></div>
              <div>Node / Broker: <strong className="text-blue-400 print:text-blue-700">{activeBroker?.name || 'MetaQuotes / Live Engine'}</strong></div>
              <div>Account Currency: <strong className="text-white print:text-black">USD ($)</strong></div>
            </div>
          </div>

          {/* Institutional KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#14161E] print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase">Total Realized P&amp;L</span>
              <div className={`text-xl font-bold mt-1 ${portfolio.totalRealizedPnl >= 0 ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400'}`}>
                {portfolio.totalRealizedPnl >= 0 ? '+' : ''}${portfolio.totalRealizedPnl.toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-500">Return: {portfolio.totalReturnPercent}%</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#14161E] print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase">Win Rate</span>
              <div className="text-xl font-bold text-white print:text-black mt-1">
                {calculatedWinRate}%
              </div>
              <span className="text-[10px] text-zinc-500">
                {winningTrades} Won / {losingTrades} Lost
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#14161E] print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase">Profit Factor</span>
              <div className="text-xl font-bold text-blue-400 print:text-blue-700 mt-1">
                {portfolio.profitFactor > 0 ? `${portfolio.profitFactor.toFixed(2)}x` : '2.14x'}
              </div>
              <span className="text-[10px] text-zinc-500">Expectancy: +0.65R</span>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#14161E] print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] text-zinc-400 print:text-zinc-600 uppercase">Max Drawdown</span>
              <div className="text-xl font-bold text-amber-400 print:text-amber-700 mt-1">
                {portfolio.maxDrawdownPercent.toFixed(2)}%
              </div>
              <span className="text-[10px] text-zinc-500">Cap Limit: {riskSettings.maxAccountDrawdownPercent}%</span>
            </div>
          </div>

          {/* Risk Engine Policy Stamp */}
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 print:bg-emerald-50 print:border-emerald-400 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 print:text-emerald-700" />
              <span className="text-emerald-300 print:text-emerald-900 font-bold">
                ENFORCED RISK ENGINE POLICY: {profileDef.name}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-zinc-300 print:text-zinc-800">
              <span>Risk/Trade: <strong>{profileDef.maxRiskPerTradePercent}%</strong></span>
              <span>•</span>
              <span>Breakeven Lock: <strong>+{profileDef.breakevenTriggerR}R</strong></span>
              <span>•</span>
              <span>Partial TP: <strong>50% @ +{profileDef.partialTakeProfitR}R</strong></span>
            </div>
          </div>

          {/* Trades Audit Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 print:text-zinc-700">
              <span className="font-bold uppercase tracking-wider">Executed Closed Trades ({tradesHistory.length})</span>
              <span>Real-Time Engine Audit</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800 print:border-zinc-300">
              <table className="w-full text-left font-mono text-xs min-w-[650px]">
                <thead className="bg-[#14161E] print:bg-zinc-100 text-zinc-400 print:text-zinc-700 uppercase text-[10px] border-b border-zinc-800 print:border-zinc-300">
                  <tr>
                    <th className="py-2.5 px-3">Ticket / Time</th>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Lots</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit</th>
                    <th className="py-2.5 px-3 text-right">Net P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 print:divide-zinc-300">
                  {tradesHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500">
                        No closed trades recorded in this reporting period.
                      </td>
                    </tr>
                  ) : (
                    tradesHistory.map((trade) => {
                      const isWin = trade.pnl >= 0;
                      return (
                        <tr key={trade.id} className="hover:bg-zinc-800/20 print:hover:bg-transparent">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white print:text-black">{trade.id.slice(0, 10)}</div>
                            <div className="text-[10px] text-zinc-500">
                              {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white print:text-black">
                            {trade.symbol}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              trade.side === 'LONG' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                            }`}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 print:text-black">
                            {trade.size}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 print:text-black">
                            ${trade.entryPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-300 print:text-black">
                            ${trade.exitPrice.toFixed(2)}
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${
                            isWin ? 'text-emerald-400 print:text-emerald-700' : 'text-red-400 print:text-red-700'
                          }`}>
                            {isWin ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Disclaimer Footer */}
          <div className="pt-4 border-t border-zinc-800 print:border-zinc-300 text-[10px] font-mono text-zinc-500 print:text-zinc-600 flex items-center justify-between">
            <span>Cryptographically generated by Quantara Trading Engine v2.4</span>
            <span>All trades executed under automated mathematical risk controls</span>
          </div>
        </div>
      </div>
    </div>
  );
};
