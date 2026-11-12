import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Key,
  Award,
  Server,
  Database,
  Activity,
  HardDrive,
  Terminal,
  CreditCard,
  ChevronRight,
  Eye,
  UserCheck,
  UserX,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ExternalLink,
  ShieldAlert,
  Check,
  X,
  ArrowUpRight,
  Zap,
  Copy,
  FileText,
  Sliders,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { AuditLog, BotState, PortfolioSummary, BrokerAccount, PaymentRecord } from '../types';
import { firestoreSync, UserProfileDoc } from '../services/firestoreSync';
import { api } from '../services/api';

interface AdminDashboardViewProps {
  auditLogs: AuditLog[];
  botState: BotState;
  portfolio: PortfolioSummary;
  isDark?: boolean;
  currentUser?: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
  onPurgeAllBrokers?: () => Promise<any>;
}

type AdminTab = 'users' | 'payments' | 'telemetry' | 'audit';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  auditLogs,
  botState,
  portfolio,
  isDark = true,
  currentUser,
  onPurgeAllBrokers,
}) => {
  // Navigation sub-tab
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Users State
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'UNPAID' | 'EXPIRED' | 'ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<UserProfileDoc | null>(null);

  // User Deep Dive Inspection Data
  const [inspectBrokers, setInspectBrokers] = useState<BrokerAccount[]>([]);
  const [inspectPayments, setInspectPayments] = useState<PaymentRecord[]>([]);
  const [inspectAuditLogs, setInspectAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingInspection, setIsLoadingInspection] = useState<boolean>(false);
  const [inspectionTab, setInspectionTab] = useState<'overview' | 'brokers' | 'payments' | 'audit'>('overview');

  // Modals State
  const [grantModalUser, setGrantModalUser] = useState<UserProfileDoc | null>(null);
  const [grantDurationDays, setGrantDurationDays] = useState<number>(30);
  const [grantPlanName, setGrantPlanName] = useState<string>('Quantara Institutional License');
  const [grantNotes, setGrantNotes] = useState<string>('');
  const [isSubmittingGrant, setIsSubmittingGrant] = useState<boolean>(false);

  const [revokeModalUser, setRevokeModalUser] = useState<UserProfileDoc | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState<boolean>(false);

  const [roleModalUser, setRoleModalUser] = useState<UserProfileDoc | null>(null);
  const [newRole, setNewRole] = useState<UserProfileDoc['role']>('operator');
  const [newTier, setNewTier] = useState<UserProfileDoc['enterpriseTier']>('Standard');
  const [isSubmittingRole, setIsSubmittingRole] = useState<boolean>(false);

  // Telemetry & Payment Approvals
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [adminAuditData, setAdminAuditData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audit Logs Filter
  const [selectedAuditCategory, setSelectedAuditCategory] = useState<string>('ALL');

  const adminEmail = currentUser?.email || 'chekchris85@gmail.com';

  // Flash message notification
  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionErrorMessage(msg);
      setTimeout(() => setActionErrorMessage(null), 5000);
    } else {
      setActionSuccessMessage(msg);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Subscribe to Firestore Users in Real-Time
  useEffect(() => {
    setIsLoadingUsers(true);
    let unsubUsers: (() => void) | null = null;
    try {
      unsubUsers = firestoreSync.subscribeAllUsers((cloudUsers) => {
        if (Array.isArray(cloudUsers)) {
          setUsers(cloudUsers);
        }
        setIsLoadingUsers(false);
      });
    } catch (err) {
      console.warn('Real-time users subscription error, falling back to one-time fetch:', err);
      firestoreSync.getAllUsersOnce().then((cloudUsers) => {
        setUsers(cloudUsers);
        setIsLoadingUsers(false);
      }).catch((e) => {
        console.error('Failed to load users:', e);
        setIsLoadingUsers(false);
      });
    }

    return () => {
      if (unsubUsers) unsubUsers();
    };
  }, []);

  // 2. Fetch System Telemetry & Admin Audit Data
  const refreshTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [tel, audit] = await Promise.all([
        api.getAdminTelemetry(adminEmail).catch(() => null),
        fetch(`/api/subscription/admin/audit?userEmail=${encodeURIComponent(adminEmail)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      if (tel) setTelemetryData(tel);
      if (audit) setAdminAuditData(audit);
    } catch (err) {
      console.warn('Telemetry refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [refreshTelemetry]);

  // 3. Load Deep Dive Data when a User is Selected
  const handleInspectUser = async (user: UserProfileDoc) => {
    setSelectedUser(user);
    setInspectionTab('overview');
    setIsLoadingInspection(true);
    try {
      const [brokers, payments, userAudit] = await Promise.all([
        firestoreSync.adminGetUserBrokers(user.id).catch(() => []),
        firestoreSync.adminGetUserPayments(user.id).catch(() => []),
        firestoreSync.adminGetUserAuditLogs(user.id).catch(() => []),
      ]);
      setInspectBrokers(brokers);
      setInspectPayments(payments);
      setInspectAuditLogs(userAudit);
    } catch (err) {
      console.warn('Inspection fetch error:', err);
    } finally {
      setIsLoadingInspection(false);
    }
  };

  // 4. Handle Grant License Submission
  const handleExecuteGrantLicense = async () => {
    if (!grantModalUser) return;
    setIsSubmittingGrant(true);
    try {
      // 1. Update in Firestore
      const res = await firestoreSync.adminGrantLicense(
        grantModalUser.id,
        grantModalUser.email,
        grantPlanName,
        grantDurationDays,
        grantNotes || `Authorized by Administrator (${adminEmail})`
      );

      // 2. Sync to Backend Engine
      await api.adminGrantLicense({
        adminEmail,
        targetUserId: grantModalUser.id,
        targetEmail: grantModalUser.email,
        plan: grantPlanName,
        durationDays: grantDurationDays,
        notes: grantNotes,
      }).catch(console.warn);

      showToast(`Successfully granted ${grantDurationDays}-day license to ${grantModalUser.email}!`);
      
      // Update local state if currently inspecting this user
      if (selectedUser?.id === grantModalUser.id) {
        setSelectedUser((prev) => (prev ? {
          ...prev,
          subscriptionStatus: 'active',
          subscriptionPlan: grantPlanName,
          subscriptionExpiresAt: res.expiresAt,
          subscriptionPaymentId: res.paymentId,
        } : null));
        // Refresh subcollections
        firestoreSync.adminGetUserPayments(grantModalUser.id).then(setInspectPayments).catch(console.warn);
      }

      setGrantModalUser(null);
      setGrantNotes('');
      refreshTelemetry();
    } catch (err: any) {
      console.error('License grant error:', err);
      showToast(`Failed to grant license: ${err.message || 'Firestore error'}`, true);
    } finally {
      setIsSubmittingGrant(false);
    }
  };

  // 5. Handle Revoke License Submission
  const handleExecuteRevokeLicense = async () => {
    if (!revokeModalUser) return;
    setIsSubmittingRevoke(true);
    try {
      await firestoreSync.adminRevokeLicense(
        revokeModalUser.id,
        revokeModalUser.email,
        revokeReason || 'Manual administrative policy revocation'
      );

      await api.adminRevokeLicense({
        adminEmail,
        targetUserId: revokeModalUser.id,
        targetEmail: revokeModalUser.email,
        reason: revokeReason,
      }).catch(console.warn);

      showToast(`License for ${revokeModalUser.email} has been revoked.`);

      if (selectedUser?.id === revokeModalUser.id) {
        setSelectedUser((prev) => (prev ? {
          ...prev,
          subscriptionStatus: 'expired',
          subscriptionExpiresAt: new Date().toISOString(),
          subscriptionPlan: 'Revoked by Administrator',
        } : null));
      }

      setRevokeModalUser(null);
      setRevokeReason('');
      refreshTelemetry();
    } catch (err: any) {
      console.error('License revoke error:', err);
      showToast(`Failed to revoke license: ${err.message || 'Operation failed'}`, true);
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  // 6. Handle Role & Tier Update
  const handleExecuteRoleUpdate = async () => {
    if (!roleModalUser) return;
    setIsSubmittingRole(true);
    try {
      await firestoreSync.adminUpdateUserRoleAndTier(
        roleModalUser.id,
        roleModalUser.email,
        newRole,
        newTier
      );
      showToast(`Updated permissions for ${roleModalUser.email} to ${newRole.toUpperCase()} (${newTier}).`);

      if (selectedUser?.id === roleModalUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole, enterpriseTier: newTier } : null));
      }

      setRoleModalUser(null);
    } catch (err: any) {
      console.error('Role update error:', err);
      showToast(`Failed to update role: ${err.message || 'Update rejected'}`, true);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // 7. Manual Payment Verification Approval (NOWPayments / Crypto reference)
  const handleApproveAttempt = async (attempt: any) => {
    try {
      const res = await fetch('/api/subscription/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail,
          paymentId: attempt.reference || attempt.id,
          userEmail: attempt.userEmail,
          uid: attempt.uid || 'admin_verified',
          notes: `Verified via Admin Telemetry Portal by ${adminEmail}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Payment approved for ${attempt.userEmail}. 30-Day License activated.`);
        refreshTelemetry();
      } else {
        showToast(data.message || 'Approval failed', true);
      }
    } catch (e: any) {
      showToast('Network error during payment approval', true);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search Match
      const search = searchQuery.toLowerCase();
      const matchSearch =
        !search ||
        u.email?.toLowerCase().includes(search) ||
        u.displayName?.toLowerCase().includes(search) ||
        u.id?.toLowerCase().includes(search) ||
        u.role?.toLowerCase().includes(search);

      // Status Match
      let matchStatus = true;
      const isOwner = u.email === 'chekchris85@gmail.com';
      const isTimeActive = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).getTime() > Date.now() : false;
      const isStatusActive = isOwner || u.subscriptionStatus === 'active' || isTimeActive;

      if (statusFilter === 'ACTIVE') {
        matchStatus = isStatusActive;
      } else if (statusFilter === 'UNPAID') {
        matchStatus = !isStatusActive && (!u.subscriptionStatus || u.subscriptionStatus === 'unpaid');
      } else if (statusFilter === 'EXPIRED') {
        matchStatus = !isStatusActive && u.subscriptionStatus === 'expired';
      } else if (statusFilter === 'ADMIN') {
        matchStatus = u.role === 'admin' || isOwner;
      }

      return matchSearch && matchStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const activeLicensed = users.filter((u) => {
      if (u.email === 'chekchris85@gmail.com') return true;
      if (u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() > Date.now()) return true;
      return u.subscriptionStatus === 'active';
    }).length;
    const expiredCount = users.filter((u) => u.subscriptionStatus === 'expired').length;
    const unpaidCount = Math.max(0, totalUsers - activeLicensed - expiredCount);
    const adminCount = users.filter((u) => u.role === 'admin' || u.email === 'chekchris85@gmail.com').length;
    const totalBrokers = telemetryData?.brokers?.total ?? 0;
    const totalCapital = telemetryData?.brokers?.totalCapitalUsd ?? portfolio.totalEquity ?? 0;

    return {
      totalUsers,
      activeLicensed,
      expiredCount,
      unpaidCount,
      adminCount,
      totalBrokers,
      totalCapital,
      licensedPercent: totalUsers > 0 ? Math.round((activeLicensed / totalUsers) * 100) : 0,
    };
  }, [users, telemetryData, portfolio.totalEquity]);

  // Dynamic Theme Colors
  const themeClasses = {
    cardBg: isDark ? 'bg-[#141416] border-[#1F1F23]' : 'bg-white border-slate-200 shadow-sm',
    subCardBg: isDark ? 'bg-[#0E0E10] border-[#1F1F23]' : 'bg-slate-50 border-slate-200',
    headerText: isDark ? 'text-white' : 'text-slate-900',
    bodyText: isDark ? 'text-[#8E9299]' : 'text-slate-600',
    mutedText: isDark ? 'text-[#606368]' : 'text-slate-500',
    divider: isDark ? 'border-[#1F1F23]' : 'border-slate-200',
    tableRowHover: isDark ? 'hover:bg-[#1C1C20]/80' : 'hover:bg-slate-50',
    tableHead: isDark ? 'bg-[#18181B] text-[#A1A1AA] border-[#27272A]' : 'bg-slate-100 text-slate-700 border-slate-200',
    inputBg: isDark ? 'bg-[#18181B] border-[#2E2E33] text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600',
  };

  return (
    <div className={`space-y-6 text-xs transition-colors duration-200 pb-16 font-sans ${isDark ? 'text-[#E4E4E7]' : 'text-slate-800'}`}>
      {/* Toast Notification Banner */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-400 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="ml-2 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center space-x-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-400 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">{actionErrorMessage}</span>
          <button onClick={() => setActionErrorMessage(null)} className="ml-2 hover:opacity-80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header & Telemetry Cockpit */}
      <div className={`rounded-2xl border ${themeClasses.cardBg} p-5 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 font-mono">
                Institutional Authority Mode Active
              </span>
              <span className={themeClasses.mutedText}>·</span>
              <span className="text-[10px] font-mono text-blue-500 font-semibold">
                Cloud Firestore Live Sync
              </span>
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${themeClasses.headerText}`}>
              Master Telemetry & Operator Control Portal
            </h1>
            <p className={`text-xs ${themeClasses.bodyText}`}>
              Direct multi-tenant user inspection, instant software license provisioning, and real-time algorithmic telemetry.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border ${themeClasses.subCardBg}`}>
              <Shield className="h-4 w-4 text-emerald-400" />
              <div className="text-left font-mono">
                <div className={`text-[10px] font-bold ${themeClasses.headerText} truncate max-w-[160px]`}>
                  {adminEmail}
                </div>
                <div className="text-[9px] text-emerald-500 font-semibold uppercase">Super Administrator</div>
              </div>
            </div>

            {onPurgeAllBrokers && (
              <button
                onClick={async () => {
                  if (!confirm('EMERGENCY ACTION: Are you sure you want to permanently delete EVERY connected broker account across all users and system storage?')) return;
                  try {
                    await onPurgeAllBrokers();
                    setInspectBrokers([]);
                    showToast('Every connected broker has been permanently purged from the database.');
                    refreshTelemetry();
                  } catch (e: any) {
                    showToast('Purge failed: ' + (e.message || 'Unknown error'), true);
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/40 bg-red-600/15 hover:bg-red-600/25 text-red-400 hover:text-red-300 transition-all shadow-md shadow-red-600/10 active:scale-95"
                title="Permanently wipe every broker in database"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                <span>Purge All System Brokers</span>
              </button>
            )}

            <button
              onClick={refreshTelemetry}
              disabled={isRefreshing}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isRefreshing
                  ? 'opacity-60 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* High-Level Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Registered Operators</span>
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className={`text-xl font-bold font-mono ${themeClasses.headerText}`}>{metrics.totalUsers}</div>
            <div className="text-[10px] text-blue-500 font-medium">{metrics.adminCount} Admin Clearance</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Licensed Access</span>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className={`text-xl font-bold font-mono text-emerald-500`}>{metrics.activeLicensed}</div>
            <div className="text-[10px] text-[#8E9299] font-medium">{metrics.licensedPercent}% Adoption Rate</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Pending / Unpaid</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className={`text-xl font-bold font-mono text-amber-500`}>{metrics.unpaidCount}</div>
            <div className="text-[10px] text-[#8E9299] font-medium">Require License Pass</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">MT5 Gateways Linked</span>
              <Server className="h-4 w-4 text-indigo-400" />
            </div>
            <div className={`text-xl font-bold font-mono text-indigo-400`}>{metrics.totalBrokers}</div>
            <div className="text-[10px] text-[#8E9299] font-medium">Active Broker Instances</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Capital Under Mgmt</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className={`text-xl font-bold font-mono ${themeClasses.headerText}`}>
              ${metrics.totalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-emerald-500 font-medium">Aggregated Portfolio</div>
          </div>

          <div className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
            <div className="flex items-center justify-between text-[#8E9299]">
              <span className="text-[10px] uppercase font-semibold tracking-wider">Tick Engine Loop</span>
              <Activity className="h-4 w-4 text-cyan-400" />
            </div>
            <div className={`text-xl font-bold font-mono text-cyan-400`}>1,500 ms</div>
            <div className="text-[10px] text-[#8E9299] font-medium">Autonomous 24/7</div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${themeClasses.divider}`}>
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/5">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : `${themeClasses.bodyText} hover:${themeClasses.headerText}`
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Operator Directory & Licenses ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : `${themeClasses.bodyText} hover:${themeClasses.headerText}`
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment Approvals & Audits</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : `${themeClasses.bodyText} hover:${themeClasses.headerText}`
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Server Hardware & Diagnostics</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : `${themeClasses.bodyText} hover:${themeClasses.headerText}`
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Immutable System Audit Trail ({auditLogs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPERATOR DIRECTORY & LICENSES (PRIMARY USER MANAGEMENT)            */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter, Count */}
          <div className={`rounded-xl border ${themeClasses.cardBg} p-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E9299]" />
              <input
                type="text"
                placeholder="Search by name, email, or user UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-colors ${themeClasses.inputBg}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E9299] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              {(['ALL', 'ACTIVE', 'UNPAID', 'EXPIRED', 'ADMIN'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setStatusFilter(filterKey)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === filterKey
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : `${themeClasses.subCardBg} ${themeClasses.bodyText} hover:${themeClasses.headerText}`
                  }`}
                >
                  {filterKey === 'ALL' && 'All Operators'}
                  {filterKey === 'ACTIVE' && 'Active Licenses'}
                  {filterKey === 'UNPAID' && 'Unpaid / Pending'}
                  {filterKey === 'EXPIRED' && 'Expired'}
                  {filterKey === 'ADMIN' && 'Administrators'}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          <div className={`rounded-2xl border ${themeClasses.cardBg} overflow-hidden shadow-lg`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-mono tracking-wider ${themeClasses.tableHead}`}>
                    <th className="py-3 px-4">Operator / Identity</th>
                    <th className="py-3 px-3">Role & Tier</th>
                    <th className="py-3 px-3">License Clearance</th>
                    <th className="py-3 px-3">Expiration Date</th>
                    <th className="py-3 px-3">Registration</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${themeClasses.divider}`}>
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8E9299]">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                        <span>Synchronizing registered users from Cloud Firestore...</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8E9299]">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold">No operators matching current filters</p>
                        <p className="text-[11px] opacity-70 mt-1">Try clearing search parameters or status filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOwner = u.email === 'chekchris85@gmail.com';
                      const isTimeActive = u.subscriptionExpiresAt
                        ? new Date(u.subscriptionExpiresAt).getTime() > Date.now()
                        : false;
                      const isLicensed = isOwner || u.subscriptionStatus === 'active' || isTimeActive;
                      const daysRemaining = u.subscriptionExpiresAt
                        ? Math.max(0, Math.ceil((new Date(u.subscriptionExpiresAt).getTime() - Date.now()) / 86400000))
                        : 0;

                      return (
                        <tr key={u.id} className={`transition-colors ${themeClasses.tableRowHover}`}>
                          {/* Operator Identity */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              {u.photoURL ? (
                                <img
                                  src={u.photoURL}
                                  alt=""
                                  className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-zinc-700"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                                  {(u.displayName || u.email || 'OP').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5">
                                  <span className={`font-semibold text-xs ${themeClasses.headerText}`}>
                                    {u.displayName || 'Operator'}
                                  </span>
                                  {isLicensed && (
                                    <span title="Licensed Verified Operator" className="text-emerald-500 flex items-center">
                                      <CheckCircle className="h-3.5 w-3.5 fill-emerald-500/20" />
                                    </span>
                                  )}
                                  {isOwner && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      OWNER
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1 text-[11px] text-[#8E9299]">
                                  <span>{u.email}</span>
                                  <span>·</span>
                                  <button
                                    onClick={() => copyToClipboard(u.id, u.id)}
                                    title="Click to copy UID"
                                    className="font-mono text-[10px] hover:text-blue-400 flex items-center space-x-0.5"
                                  >
                                    <span>{u.id.slice(0, 8)}...</span>
                                    {copiedId === u.id ? (
                                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-2.5 w-2.5 opacity-60" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Tier */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <span
                                className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                    : u.role === 'senior_analyst'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : u.role === 'risk_officer'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}
                              >
                                {u.role || 'operator'}
                              </span>
                              <div className="text-[10px] text-[#8E9299]">
                                {u.enterpriseTier || 'Standard'}
                              </div>
                            </div>
                          </td>

                          {/* License Clearance */}
                          <td className="py-3.5 px-3 font-mono">
                            {isLicensed ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5 text-emerald-500 font-bold text-[11px]">
                                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span>ACTIVE LICENSE</span>
                                </div>
                                <div className="text-[10px] text-[#8E9299] truncate max-w-[140px]">
                                  {u.subscriptionPlan || 'Institutional Pro ($100/mo)'}
                                </div>
                              </div>
                            ) : u.subscriptionStatus === 'expired' ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5 text-rose-500 font-bold text-[11px]">
                                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                                  <span>EXPIRED</span>
                                </div>
                                <div className="text-[10px] text-rose-400/80">Access Paused</div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-1.5 text-amber-500 font-bold text-[11px]">
                                  <Clock className="h-3.5 w-3.5 shrink-0" />
                                  <span>UNPAID / TRIAL</span>
                                </div>
                                <div className="text-[10px] text-amber-400/80">Pending Subscription</div>
                              </div>
                            )}
                          </td>

                          {/* Expiration Date */}
                          <td className="py-3.5 px-3 font-mono text-[11px]">
                            {isOwner ? (
                              <div className="text-amber-400 font-semibold">Permanent (Owner Pass)</div>
                            ) : u.subscriptionExpiresAt ? (
                              <div className="space-y-0.5">
                                <div className={themeClasses.headerText}>
                                  {new Date(u.subscriptionExpiresAt).toLocaleDateString([], {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </div>
                                <div className={`text-[10px] ${daysRemaining > 5 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining
                                </div>
                              </div>
                            ) : (
                              <span className={themeClasses.mutedText}>None Recorded</span>
                            )}
                          </td>

                          {/* Registration Date */}
                          <td className="py-3.5 px-3 text-[11px] font-mono text-[#8E9299]">
                            {u.createdAt ? (
                              <div>{new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            ) : (
                              'Recently'
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Deep Inspect Button */}
                              <button
                                onClick={() => handleInspectUser(u)}
                                title="Inspect Complete User Dossier (Brokers, Payments, Audits)"
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                                  isDark
                                    ? 'bg-[#1F1F24] hover:bg-[#2A2A30] text-[#E4E4E7] border-[#2E2E34]'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                                }`}
                              >
                                <Eye className="h-3 w-3 text-blue-400" />
                                <span>Inspect</span>
                              </button>

                              {/* Grant / Extend License Button */}
                              <button
                                onClick={() => {
                                  setGrantModalUser(u);
                                  setGrantDurationDays(30);
                                  setGrantPlanName('Quantara Institutional License');
                                }}
                                title="Grant or Extend Software License"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1 transition-colors"
                              >
                                <Key className="h-3 w-3" />
                                <span>{isLicensed ? 'Extend' : 'Grant'}</span>
                              </button>

                              {/* Revoke Button (only if licensed) */}
                              {isLicensed && !isOwner && (
                                <button
                                  onClick={() => {
                                    setRevokeModalUser(u);
                                    setRevokeReason('');
                                  }}
                                  title="Revoke License Access"
                                  className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
                                >
                                  <UserX className="h-3 w-3" />
                                </button>
                              )}

                              {/* Role Button */}
                              <button
                                onClick={() => {
                                  setRoleModalUser(u);
                                  setNewRole(u.role || 'operator');
                                  setNewTier(u.enterpriseTier || 'Standard');
                                }}
                                title="Change User Role or Enterprise Tier"
                                className="p-1.5 rounded-lg text-[#8E9299] hover:text-white hover:bg-black/10 transition-colors"
                              >
                                <Sliders className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYMENT TRACKING & NOWPAYMENTS APPROVAL HUB                       */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className={`rounded-xl border ${themeClasses.cardBg} p-5 space-y-4`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeClasses.headerText} flex items-center space-x-2`}>
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>NOWPayments Verification Ledger & Manual Approvals</span>
                </h3>
                <p className={`text-xs ${themeClasses.bodyText} mt-0.5`}>
                  All payment reference verification attempts submitted by users via $100/mo crypto invoices.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Fixed Fee: $100.00 USD
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Invoice ID: {adminAuditData?.invoiceId || '5836437268'}
                </span>
              </div>
            </div>

            {/* Attempts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase ${themeClasses.tableHead}`}>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User Email</th>
                    <th className="py-2.5 px-3">Reference / TxHash</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Verification Details</th>
                    <th className="py-2.5 px-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${themeClasses.divider}`}>
                  {(!adminAuditData?.attempts || adminAuditData.attempts.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#8E9299]">
                        No payment verification attempts logged yet.
                      </td>
                    </tr>
                  ) : (
                    adminAuditData.attempts.map((att: any) => (
                      <tr key={att.id} className={themeClasses.tableRowHover}>
                        <td className="py-2.5 px-3 text-[#8E9299] whitespace-nowrap">
                          {new Date(att.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className={`py-2.5 px-3 font-semibold ${themeClasses.headerText}`}>{att.userEmail}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/10 font-bold">
                            {att.reference}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              att.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#8E9299] max-w-sm truncate">{att.reason}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleApproveAttempt(att)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Approve 30 Days
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SERVER HARDWARE & DIAGNOSTIC TELEMETRY                             */}
      {/* ========================================================================= */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${themeClasses.cardBg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8E9299]">Node.js Process Heap</span>
                <HardDrive className="h-4 w-4 text-cyan-400" />
              </div>
              <div className={`text-2xl font-bold font-mono ${themeClasses.headerText}`}>
                {telemetryData?.memory?.heapUsedMb || 64} MB
              </div>
              <div className="text-[11px] text-[#8E9299]">
                Total Allocated: {telemetryData?.memory?.heapTotalMb || 96} MB · RSS: {telemetryData?.memory?.rssMb || 120} MB
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${themeClasses.cardBg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8E9299]">Engine Tick Loop Uptime</span>
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-500">
                {Math.floor((telemetryData?.uptimeSeconds || 3600) / 60)} mins
              </div>
              <div className="text-[11px] text-[#8E9299]">
                Frequency: 1,500ms · State: {telemetryData?.engineStatus || 'RUNNING'}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${themeClasses.cardBg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#8E9299]">Emergency Kill Switch</span>
                <ShieldAlert className="h-4 w-4 text-rose-400" />
              </div>
              <div className={`text-2xl font-bold font-mono ${telemetryData?.killSwitchActive ? 'text-rose-500' : 'text-emerald-500'}`}>
                {telemetryData?.killSwitchActive ? 'ENGAGED (HALTED)' : 'DISARMED (NORMAL)'}
              </div>
              <div className="text-[11px] text-[#8E9299]">
                Dynamic lot sizing & automated capital floor active
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: IMMUTABLE AUDIT TRAIL                                              */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className={`rounded-2xl border ${themeClasses.cardBg} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5 dark:border-white/5">
            <div className="flex items-center space-x-2">
              <Terminal className="h-4 w-4 text-blue-400" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${themeClasses.headerText}`}>
                System Security & Execution Audit Trail
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
              {['ALL', 'AUTH', 'RISK', 'TRADE', 'BROKER', 'SYSTEM'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedAuditCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    selectedAuditCategory === cat
                      ? 'bg-blue-600 text-white font-bold'
                      : `${themeClasses.subCardBg} ${themeClasses.bodyText} hover:${themeClasses.headerText}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className={`border-b text-[10px] uppercase ${themeClasses.tableHead}`}>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                  <th className="py-2.5 px-3 text-right">Severity</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${themeClasses.divider}`}>
                {auditLogs
                  .filter((log) => selectedAuditCategory === 'ALL' || log.category === selectedAuditCategory)
                  .map((log) => (
                    <tr key={log.id} className={themeClasses.tableRowHover}>
                      <td className="py-2.5 px-3 text-[#8E9299] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/10 text-[10px]">
                          {log.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-medium ${themeClasses.headerText}`}>{log.actor}</td>
                      <td className="py-2.5 px-3 font-semibold text-blue-500">{log.action}</td>
                      <td className="py-2.5 px-3 text-[#8E9299] max-w-md truncate">{log.details}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            log.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : log.severity === 'WARN'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
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
      )}

      {/* ========================================================================= */}
      {/* USER DEEP DIVE MODAL / DRAWER ("VIEW EVERYTHING ABOUT THEM")             */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border ${themeClasses.cardBg} shadow-2xl overflow-hidden`}>
            {/* Modal Header */}
            <div className={`p-5 border-b ${themeClasses.divider} flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                {selectedUser.photoURL ? (
                  <img
                    src={selectedUser.photoURL}
                    alt=""
                    className="h-11 w-11 rounded-full object-cover border border-slate-300 dark:border-zinc-700"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base">
                    {(selectedUser.displayName || selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className={`text-base font-bold ${themeClasses.headerText}`}>
                      {selectedUser.displayName || 'Operator'}
                    </h2>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                      {selectedUser.role || 'operator'}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                      {selectedUser.enterpriseTier || 'Standard'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-[#8E9299]">
                    <span>{selectedUser.email}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px]">UID: {selectedUser.id}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setGrantModalUser(selectedUser);
                    setGrantDurationDays(30);
                    setGrantPlanName('Quantara Institutional License');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>Grant / Extend License</span>
                </button>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg text-[#8E9299] hover:text-white hover:bg-black/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Inspection Sub-Navigation */}
            <div className={`px-5 py-2.5 border-b ${themeClasses.divider} flex items-center space-x-2 font-mono text-xs`}>
              {(['overview', 'brokers', 'payments', 'audit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setInspectionTab(tab)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                    inspectionTab === tab
                      ? 'bg-blue-600 text-white'
                      : `${themeClasses.bodyText} hover:${themeClasses.headerText}`
                  }`}
                >
                  {tab === 'overview' && 'Account Dossier'}
                  {tab === 'brokers' && `Linked MT5 Servers (${inspectBrokers.length})`}
                  {tab === 'payments' && `Payment Invoices (${inspectPayments.length})`}
                  {tab === 'audit' && `Security Logs (${inspectAuditLogs.length})`}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {isLoadingInspection ? (
                <div className="py-16 text-center text-[#8E9299]">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                  <span>Querying private user records from Cloud Firestore...</span>
                </div>
              ) : (
                <>
                  {/* Sub-Tab 1: Account Dossier Overview */}
                  {inspectionTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${themeClasses.subCardBg} space-y-2`}>
                          <span className="text-[10px] uppercase font-bold text-[#8E9299] font-mono">Software License Status</span>
                          <div className="flex items-center space-x-2">
                            {selectedUser.subscriptionStatus === 'active' || selectedUser.email === 'chekchris85@gmail.com' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4" />
                                <span>LICENSED & ACTIVE</span>
                              </span>
                            ) : selectedUser.subscriptionStatus === 'expired' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold flex items-center space-x-1">
                                <XCircle className="h-4 w-4" />
                                <span>EXPIRED</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>UNPAID / TRIAL</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#8E9299] pt-1">
                            Plan: <span className={themeClasses.headerText}>{selectedUser.subscriptionPlan || 'Institutional Pass ($100/mo)'}</span>
                          </div>
                          <div className="text-xs text-[#8E9299]">
                            Expires:{' '}
                            <span className={themeClasses.headerText}>
                              {selectedUser.subscriptionExpiresAt
                                ? new Date(selectedUser.subscriptionExpiresAt).toLocaleString()
                                : selectedUser.email === 'chekchris85@gmail.com'
                                ? 'Infinite (Platform Owner)'
                                : 'No Expiry Recorded'}
                            </span>
                          </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${themeClasses.subCardBg} space-y-2`}>
                          <span className="text-[10px] uppercase font-bold text-[#8E9299] font-mono">Profile Details</span>
                          <div className="text-xs space-y-1">
                            <div>
                              <span className="text-[#8E9299]">Trading Desk:</span>{' '}
                              <span className={themeClasses.headerText}>{selectedUser.desk || 'Not Specified'}</span>
                            </div>
                            <div>
                              <span className="text-[#8E9299]">Email Verified:</span>{' '}
                              <span className={selectedUser.emailVerified ? 'text-emerald-400' : 'text-amber-400'}>
                                {selectedUser.emailVerified ? 'Yes (Verified)' : 'Pending Verification'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8E9299]">Registered At:</span>{' '}
                              <span className={themeClasses.headerText}>
                                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#8E9299]">Last Cloud Sync:</span>{' '}
                              <span className={themeClasses.headerText}>
                                {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio / Operator Notes */}
                      {selectedUser.bio && (
                        <div className={`p-4 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
                          <span className="text-[10px] uppercase font-bold text-[#8E9299] font-mono">Operator Bio</span>
                          <p className={`text-xs ${themeClasses.bodyText}`}>{selectedUser.bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Tab 2: Linked MT5 Servers */}
                  {inspectionTab === 'brokers' && (
                    <div className="space-y-3">
                      {inspectBrokers.length === 0 ? (
                        <div className="py-12 text-center text-[#8E9299]">
                          <Server className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No MetaTrader 5 broker accounts connected</p>
                          <p className="text-[11px] opacity-70 mt-1">This operator has not linked an MT5 server instance.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {inspectBrokers.map((broker) => (
                            <div key={broker.id} className={`p-4 rounded-xl border ${themeClasses.subCardBg} space-y-2`}>
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${themeClasses.headerText}`}>{broker.name || broker.broker}</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    broker.status === 'CONNECTED' || broker.serverStatus === 'RUNNING'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                  }`}
                                >
                                  {broker.serverStatus || broker.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                <div>
                                  <span className="text-[#8E9299]">Server:</span> {broker.server}
                                </div>
                                <div>
                                  <span className="text-[#8E9299]">Account #:</span> {broker.accountNumber}
                                </div>
                                <div>
                                  <span className="text-[#8E9299]">Balance:</span> ${broker.simulatedBalance?.toLocaleString()}
                                </div>
                                <div>
                                  <span className="text-[#8E9299]">Equity:</span> ${broker.equity?.toLocaleString()}
                                </div>
                                <div>
                                  <span className="text-[#8E9299]">Leverage:</span> {broker.leverage}
                                </div>
                                <div>
                                  <span className="text-[#8E9299]">Latency:</span> {broker.pingMs} ms
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Tab 3: Payment History */}
                  {inspectionTab === 'payments' && (
                    <div className="space-y-3">
                      {inspectPayments.length === 0 ? (
                        <div className="py-12 text-center text-[#8E9299]">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No payment records found for this operator</p>
                          <p className="text-[11px] opacity-70 mt-1">
                            Click "Grant / Extend License" above to provision a license and generate a confirmed invoice.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 font-mono text-xs">
                          {inspectPayments.map((p) => (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border ${themeClasses.subCardBg} flex items-center justify-between gap-4`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={`font-bold ${themeClasses.headerText}`}>{p.plan}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                                    {p.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#8E9299]">
                                  Receipt: {p.receiptNumber} · Ref: {p.transactionRef}
                                </div>
                                {p.note && <div className="text-[10px] text-[#8E9299] italic">{p.note}</div>}
                              </div>

                              <div className="text-right">
                                <div className="font-bold text-sm text-emerald-500">${p.amount} {p.currency}</div>
                                <div className="text-[10px] text-[#8E9299]">
                                  {new Date(p.timestamp).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub-Tab 4: User Security Audit Logs */}
                  {inspectionTab === 'audit' && (
                    <div className="space-y-2">
                      {inspectAuditLogs.length === 0 ? (
                        <div className="py-12 text-center text-[#8E9299]">
                          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">No audit logs recorded for this operator yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto">
                          {inspectAuditLogs.map((log) => (
                            <div key={log.id} className={`p-2.5 rounded-lg border ${themeClasses.subCardBg} flex items-center justify-between`}>
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-blue-400">{log.action}</span>
                                  <span className="text-[10px] text-[#8E9299]">[{log.category}]</span>
                                </div>
                                <div className="text-[11px] text-[#8E9299]">{log.details}</div>
                              </div>
                              <div className="text-right text-[10px] text-[#8E9299]">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GRANT / EXTEND LICENSE                                             */}
      {/* ========================================================================= */}
      {grantModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border ${themeClasses.cardBg} shadow-2xl overflow-hidden p-6 space-y-5`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${themeClasses.headerText}`}>Grant Software License</h3>
                  <p className="text-xs text-[#8E9299]">Institutional Clearance Provisioning</p>
                </div>
              </div>
              <button onClick={() => setGrantModalUser(null)} className="text-[#8E9299] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`p-3 rounded-xl border ${themeClasses.subCardBg} space-y-1`}>
              <div className="text-[10px] uppercase font-bold text-[#8E9299]">Target Operator</div>
              <div className={`font-semibold text-xs ${themeClasses.headerText}`}>{grantModalUser.displayName || 'Operator'}</div>
              <div className="text-xs font-mono text-[#8E9299]">{grantModalUser.email}</div>
            </div>

            {/* Duration Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                Clearance Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '7 Days', days: 7, desc: 'Trial Pass' },
                  { label: '30 Days', days: 30, desc: '1 Month' },
                  { label: '90 Days', days: 90, desc: 'Quarter' },
                  { label: '180 Days', days: 180, desc: '6 Months' },
                  { label: '365 Days', days: 365, desc: '1 Year' },
                  { label: 'Lifetime', days: 3650, desc: '10 Years' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setGrantDurationDays(item.days)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      grantDurationDays === item.days
                        ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-600/20'
                        : `${themeClasses.subCardBg} ${themeClasses.bodyText} hover:${themeClasses.headerText}`
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[9px] opacity-75">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                Subscription Plan Tier
              </label>
              <select
                value={grantPlanName}
                onChange={(e) => setGrantPlanName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${themeClasses.inputBg}`}
              >
                <option value="Quantara Institutional License">Quantara Institutional License ($100/mo)</option>
                <option value="Enterprise Pro Dedicated">Enterprise Pro Dedicated ($250/mo)</option>
                <option value="VIP Partner Access">VIP Partner Access (Comped)</option>
                <option value="7-Day Algorithmic Trial">7-Day Algorithmic Trial</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                Internal Administrative Note
              </label>
              <input
                type="text"
                placeholder="e.g. VIP clearance granted by Chek Chris"
                value={grantNotes}
                onChange={(e) => setGrantNotes(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${themeClasses.inputBg}`}
              />
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setGrantModalUser(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border ${themeClasses.subCardBg} hover:opacity-80 transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingGrant}
                onClick={handleExecuteGrantLicense}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                {isSubmittingGrant ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <>
                    <Key className="h-3.5 w-3.5" />
                    <span>Confirm & Authorize</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVOKE LICENSE                                                     */}
      {/* ========================================================================= */}
      {revokeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border ${themeClasses.cardBg} shadow-2xl overflow-hidden p-6 space-y-4`}>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${themeClasses.headerText}`}>Revoke Software License</h3>
                <p className="text-xs text-[#8E9299]">Immediate Terminal Lockout</p>
              </div>
            </div>

            <p className={`text-xs ${themeClasses.bodyText} leading-relaxed`}>
              Are you sure you want to revoke software license access for{' '}
              <strong className={themeClasses.headerText}>{revokeModalUser.email}</strong>? The user will immediately be locked out of autonomous trading features and prompted to subscribe.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                Revocation Reason (Logged to Audit)
              </label>
              <input
                type="text"
                placeholder="e.g. Terms violation, chargeback, or operator request"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${themeClasses.inputBg}`}
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokeModalUser(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border ${themeClasses.subCardBg} hover:opacity-80 transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRevoke}
                onClick={handleExecuteRevokeLicense}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                {isSubmittingRevoke ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Revoking...</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-3.5 w-3.5" />
                    <span>Revoke License Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE ROLE & TIER                                                 */}
      {/* ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border ${themeClasses.cardBg} shadow-2xl overflow-hidden p-6 space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center space-x-2.5">
                <Sliders className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className={`text-sm font-bold ${themeClasses.headerText}`}>Assign Role & Enterprise Tier</h3>
                  <p className="text-xs text-[#8E9299]">{roleModalUser.email}</p>
                </div>
              </div>
              <button onClick={() => setRoleModalUser(null)} className="text-[#8E9299] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                  Access Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${themeClasses.inputBg}`}
                >
                  <option value="operator">Operator (Standard User)</option>
                  <option value="senior_analyst">Senior Analyst</option>
                  <option value="risk_officer">Risk Officer</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8E9299] font-mono">
                  Enterprise Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${themeClasses.inputBg}`}
                >
                  <option value="Standard">Standard</option>
                  <option value="Institutional Pro">Institutional Pro</option>
                  <option value="Enterprise Dedicated">Enterprise Dedicated</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border ${themeClasses.subCardBg} hover:opacity-80 transition-colors`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRole}
                onClick={handleExecuteRoleUpdate}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5"
              >
                {isSubmittingRole ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Permissions</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
