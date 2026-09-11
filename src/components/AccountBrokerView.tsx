import React, { useState } from 'react';
import {
  Check,
  CheckCircle,
  Database,
  Eye,
  EyeOff,
  Key,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import { BrokerAccount } from '../types';

interface AccountBrokerViewProps {
  brokerAccounts: BrokerAccount[];
  onConnectBroker: (payload: { broker: string; apiKey: string; isPaper: boolean; simulatedBalance?: number }) => Promise<any>;
  onDisconnectBroker: (id: string) => Promise<any>;
}

export const AccountBrokerView: React.FC<AccountBrokerViewProps> = ({
  brokerAccounts,
  onConnectBroker,
  onDisconnectBroker,
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [brokerName, setBrokerName] = useState('Binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isPaper, setIsPaper] = useState(true);
  const [simulatedBalance, setSimulatedBalance] = useState(25000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConnectBroker({
        broker: brokerName,
        apiKey,
        isPaper,
        simulatedBalance,
      });
      setShowConnectModal(false);
      setApiKey('');
      setApiSecret('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Security Header */}
      <div className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
          <div className="flex items-center space-x-3">
            <Lock className="h-5 w-5 text-blue-400" />
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Broker & Exchange Connectors
              </h2>
              <p className="text-xs text-[#8E9299]">
                Multi-exchange institutional routing with scoped non-withdrawal permissions and secret masking
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="rounded-lg bg-blue-600 px-3.5 py-2 font-semibold text-white hover:bg-blue-500 transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Link Broker Account</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-blue-300 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
          <Shield className="h-4 w-4 shrink-0 text-blue-400" />
          <span>
            <strong className="text-blue-200">Zero-Leakage Security Policy:</strong> API secrets are cryptographically masked in memory and strictly prohibited from withdrawal permissions.
          </span>
        </div>
      </div>

      {/* Connected Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brokerAccounts.map((acc) => {
          return (
            <div
              key={acc.id}
              className="rounded-xl border border-[#1F1F23] bg-[#141416] p-5 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-sm text-white">{acc.name}</span>
                  <span className="block text-xs font-mono text-[#8E9299] mt-0.5">{acc.accountNumber}</span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    acc.isPaper
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                  }`}
                >
                  {acc.isPaper ? 'PAPER / TESTNET' : 'LIVE BROKER'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono rounded-lg bg-[#0E0E11] p-3 border border-[#1F1F23]">
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">API Key Mask:</span>
                  <span className="text-[#E4E4E7] font-semibold">{acc.apiKeyMasked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Status:</span>
                  <span className="text-[#10B981] font-bold flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
                    {acc.status}
                  </span>
                </div>
                {acc.isPaper && (
                  <div className="flex justify-between">
                    <span className="text-[#8E9299]">Paper Balance:</span>
                    <span className="text-white font-bold">${acc.simulatedBalance.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Scoped permissions */}
              <div>
                <span className="text-[10px] text-[#8E9299] uppercase tracking-wider block mb-1.5 font-semibold">Assigned Scopes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {acc.permissions.map((p) => (
                    <span key={p} className="rounded bg-[#1F1F23] px-2 py-0.5 text-[10px] text-[#8E9299] border border-[#2E2E33]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F1F23] flex justify-between items-center text-xs">
                <span className="text-[#8E9299]">
                  Last verified: {new Date(acc.lastConnected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onDisconnectBroker(acc.id)}
                  className="text-[#EF4444] hover:text-red-400 hover:underline flex items-center font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 inline" /> Disconnect
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-[#1F1F23] bg-[#141416] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F23]">
              <span className="font-semibold text-sm text-white uppercase tracking-wider">Connect Broker / Exchange</span>
              <button onClick={() => setShowConnectModal(false)} className="text-[#8E9299] hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8E9299] mb-1 font-medium">Exchange Platform</label>
                <select
                  value={brokerName}
                  onChange={(e) => setBrokerName(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Binance">Binance (Spot / Margin)</option>
                  <option value="Coinbase Pro">Coinbase Advanced Trade</option>
                  <option value="Alpaca">Alpaca Markets (US Equities)</option>
                  <option value="Kraken">Kraken Pro</option>
                  <option value="Interactive Brokers">Interactive Brokers (TWS / Gateway)</option>
                  <option value="Bybit">Bybit Derivatives</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#8E9299] mb-1 font-medium">API Key</label>
                <input
                  type="text"
                  placeholder="Enter exchange API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8E9299] mb-1 font-medium">API Secret</label>
                <input
                  type="password"
                  placeholder="Enter exchange API secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="rounded-lg border border-[#1F1F23] bg-[#0E0E11] p-3.5 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaper}
                    onChange={(e) => setIsPaper(e.target.checked)}
                    className="rounded accent-blue-500 h-3.5 w-3.5"
                  />
                  <span className="font-semibold text-white">Connect in Paper / Sandbox Simulation Mode</span>
                </label>

                {isPaper && (
                  <div className="pt-2">
                    <label className="block text-xs text-[#8E9299] mb-1">Initial Paper Balance ($)</label>
                    <input
                      type="number"
                      value={simulatedBalance}
                      onChange={(e) => setSimulatedBalance(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-[#1F1F23] bg-[#0A0A0B] px-3 py-1.5 text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1F1F23]">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="rounded-lg px-4 py-2 text-[#8E9299] hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Verifying...' : 'Establish Secure Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
