import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Download,
  Filter,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  Sliders,
  Terminal,
} from 'lucide-react';
import { AuditLog, BotState, PortfolioSummary } from '../types';

interface AdminDashboardViewProps {
  auditLogs: AuditLog[];
  botState: BotState;
  portfolio: PortfolioSummary;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ auditLogs, botState, portfolio }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredLogs = selectedCategory === 'ALL'
    ? auditLogs
    : auditLogs.filter((log) => log.category === selectedCategory);

  const categories = ['ALL', 'RISK', 'TRADE', 'CONFIG', 'KILL_SWITCH', 'SYSTEM', 'BROKER'];

  return (
    <div className="space-y-6 text-xs">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Engine Tick Loop</span>
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">1,500 ms</div>
          <span className="text-[11px] text-[#10B981] font-medium">Status: Running Nominal</span>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Node Process Heap</span>
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">~64 MB</div>
          <span className="text-[11px] text-[#8E9299]">Peak threshold: 512 MB</span>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase font-semibold tracking-wider">SSE Client Streams</span>
            <Server className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">Active (Realtime)</div>
          <span className="text-[11px] text-[#8E9299]">Auto-reconnect enabled</span>
        </div>

        <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-4 space-y-1">
          <div className="flex items-center justify-between text-[#8E9299]">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Audit Records</span>
            <Database className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{auditLogs.length} Events</div>
          <span className="text-[11px] text-[#8E9299]">Ring buffer retention</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <Terminal className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              System Audit Trail & Security Ledger
            </h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                    : 'bg-[#1F1F23] text-[#8E9299] hover:text-white border border-[#2E2E33]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1F1F23] text-[#8E9299] uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#1C1C1F]/60 transition-colors">
                  <td className="py-2.5 px-3 text-[#8E9299] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] text-[#E4E4E7] border border-[#2E2E33]">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#8E9299] font-medium">{log.actor}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 text-[#8E9299] max-w-xs truncate">{log.details}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        log.severity === 'CRITICAL'
                          ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                          : log.severity === 'WARN'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
