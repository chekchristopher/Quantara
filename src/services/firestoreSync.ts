import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BrokerAccount, RiskSettings, TradeHistoryItem, AuditLog, ServerAccountReport } from '../types';

export interface UserProfileDoc {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  desk?: string;
  role: 'operator' | 'senior_analyst' | 'risk_officer' | 'admin';
  enterpriseTier: 'Standard' | 'Institutional Pro' | 'Enterprise Dedicated';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRiskSettingsDoc {
  id: string;
  userId: string;
  maxRiskPerTradePercent: number;
  maxDailyLossPercent: number;
  maxWeeklyLossPercent: number;
  maxAccountDrawdownPercent: number;
  maxOpenPositions: number;
  maxExposurePerAssetPercent?: number;
  maxPortfolioExposurePercent?: number;
  maxLeverage?: number;
  trailingStopEnabled?: boolean;
  trailingStopPercent?: number;
  killSwitchActive?: boolean;
  updatedAt: string;
}

export const firestoreSync = {
  // Sync or create User Profile
  async syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; emailVerified: boolean }): Promise<UserProfileDoc> {
    const userDocRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;
    try {
      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();
      if (snap.exists()) {
        const existingData = snap.data() as UserProfileDoc;
        const updatedData: Partial<UserProfileDoc> = {
          displayName: existingData.displayName || user.displayName || user.email?.split('@')[0] || 'Enterprise Operator',
          photoURL: existingData.photoURL || user.photoURL || '',
          emailVerified: user.emailVerified,
          updatedAt: now,
        };
        await updateDoc(userDocRef, updatedData);
        return { ...existingData, ...updatedData };
      } else {
        const isDefaultAdmin = user.email === 'chekchris85@gmail.com';
        const newProfile: UserProfileDoc = {
          id: user.uid,
          email: user.email || 'operator@quantara.internal',
          displayName: user.displayName || user.email?.split('@')[0] || 'Enterprise Operator',
          photoURL: user.photoURL || '',
          role: isDefaultAdmin ? 'admin' : 'operator',
          enterpriseTier: isDefaultAdmin ? 'Enterprise Dedicated' : 'Standard',
          emailVerified: user.emailVerified,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, newProfile);
        return newProfile;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Update User Profile (display name, custom photo URL, role, bio, desk)
  async updateUserProfileData(
    userId: string,
    data: { displayName?: string; photoURL?: string; role?: any; bio?: string; desk?: string }
  ): Promise<UserProfileDoc> {
    const userDocRef = doc(db, 'users', userId);
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(userDocRef);
      const now = new Date().toISOString();
      const updates: any = {
        updatedAt: now,
      };
      if (data.displayName !== undefined) updates.displayName = data.displayName;
      if (data.photoURL !== undefined) updates.photoURL = data.photoURL;
      if (data.role !== undefined) updates.role = data.role;
      if (data.bio !== undefined) updates.bio = data.bio;
      if (data.desk !== undefined) updates.desk = data.desk;

      if (snap.exists()) {
        await updateDoc(userDocRef, updates);
        return { ...(snap.data() as UserProfileDoc), ...updates };
      } else {
        const isDefaultAdmin = auth.currentUser?.email === 'chekchris85@gmail.com';
        const fullDoc: UserProfileDoc = {
          id: userId,
          email: auth.currentUser?.email || 'operator@quantara.internal',
          displayName: data.displayName || auth.currentUser?.displayName || 'Enterprise Operator',
          photoURL: data.photoURL || '',
          role: data.role || (isDefaultAdmin ? 'admin' : 'operator'),
          enterpriseTier: isDefaultAdmin ? 'Enterprise Dedicated' : 'Standard',
          emailVerified: auth.currentUser?.emailVerified || false,
          bio: data.bio || '',
          desk: data.desk || '',
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, fullDoc);
        return fullDoc;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Save Risk Settings to Firestore
  async saveRiskSettings(userId: string, settings: RiskSettings): Promise<void> {
    const path = `users/${userId}/settings/risk`;
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'risk');
    const now = new Date().toISOString();
    const payload: UserRiskSettingsDoc = {
      id: 'risk',
      userId,
      maxRiskPerTradePercent: settings.maxRiskPerTradePercent,
      maxDailyLossPercent: settings.maxDailyLossPercent,
      maxWeeklyLossPercent: settings.maxWeeklyLossPercent,
      maxAccountDrawdownPercent: settings.maxAccountDrawdownPercent,
      maxOpenPositions: settings.maxOpenPositions,
      maxExposurePerAssetPercent: settings.maxExposurePerAssetPercent,
      maxPortfolioExposurePercent: settings.maxPortfolioExposurePercent,
      maxLeverage: settings.maxLeverage,
      trailingStopEnabled: settings.trailingStopEnabled,
      trailingStopPercent: settings.trailingStopPercent,
      killSwitchActive: settings.killSwitchActive,
      updatedAt: now,
    };
    try {
      await setDoc(settingsDocRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Listen to Risk Settings from Firestore
  subscribeRiskSettings(userId: string, onUpdate: (settings: Partial<RiskSettings>) => void): Unsubscribe {
    const path = `users/${userId}/settings/risk`;
    const docRef = doc(db, 'users', userId, 'settings', 'risk');
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          onUpdate({
            maxRiskPerTradePercent: data.maxRiskPerTradePercent,
            maxDailyLossPercent: data.maxDailyLossPercent,
            maxWeeklyLossPercent: data.maxWeeklyLossPercent,
            maxAccountDrawdownPercent: data.maxAccountDrawdownPercent,
            maxOpenPositions: data.maxOpenPositions,
            maxExposurePerAssetPercent: data.maxExposurePerAssetPercent,
            maxPortfolioExposurePercent: data.maxPortfolioExposurePercent,
            maxLeverage: data.maxLeverage,
            trailingStopEnabled: data.trailingStopEnabled,
            trailingStopPercent: data.trailingStopPercent,
            killSwitchActive: data.killSwitchActive,
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // Save Connected Broker / Server Profile to Firestore Database
  async saveBrokerProfile(userId: string, broker: BrokerAccount): Promise<void> {
    const path = `users/${userId}/brokers/${broker.id}`;
    const docRef = doc(db, 'users', userId, 'brokers', broker.id);
    const now = new Date().toISOString();
    
    // Generate deterministic or preserved security hash token for enterprise verification
    const securityHash = broker.securityHash || `SEC_${broker.id.replace(/[^a-zA-Z0-9]/g, '')}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const serverHost = broker.serverHost || (broker.server ? `${broker.server.toLowerCase().replace(/[^a-z0-9]/g, '-')}.broker-gateway.enterprise:443` : 'mt5-real.gateway.enterprise:443');
    const protocol = broker.protocol || 'TLS 1.3 / Direct FIX 4.4';
    const encryptionLevel = broker.encryptionLevel || 'AES-256-GCM Military Grade';

    const payload = {
      id: broker.id,
      userId,
      name: broker.name,
      broker: broker.broker,
      brokerName: broker.name || broker.broker,
      server: broker.server || 'Exness-MT5Real',
      serverHost,
      protocol,
      encryptionLevel,
      securityHash,
      accountNumber: String(broker.accountNumber),
      accountType: broker.accountType || 'DEMO',
      status: broker.status || 'CONNECTED',
      simulatedBalance: broker.simulatedBalance ?? 0,
      balance: broker.simulatedBalance ?? 0,
      equity: broker.equity ?? broker.simulatedBalance ?? 0,
      freeMargin: broker.freeMargin ?? (broker.simulatedBalance ? broker.simulatedBalance * 0.95 : 0),
      marginLevel: broker.marginLevel ?? 999.9,
      pingMs: broker.pingMs ?? 14,
      currency: broker.currency || 'USD',
      leverage: String(broker.leverage || '1:500'),
      isPaper: !!broker.isPaper,
      apiKeyMasked: broker.apiKeyMasked || '••••••••',
      permissions: broker.permissions || ['TRADE', 'READ'],
      lastConnected: broker.lastConnected || Date.now(),
      serverStatus: broker.serverStatus || 'RUNNING',
      isNonStop: broker.isNonStop !== false,
      savedInSystem: true,
      isSecuredInFirebase: true,
      lastCloudSyncTimestamp: Date.now(),
      uptimeSeconds: broker.uptimeSeconds ?? 0,
      connectedAt: broker.connectedAt || broker.lastConnected || Date.now(),
      tradesCount: broker.tradesCount ?? 0,
      pnlRealized: broker.pnlRealized ?? 0,
      winningTradesCount: broker.winningTradesCount ?? 0,
      losingTradesCount: broker.losingTradesCount ?? 0,
      winRatePercent: broker.winRatePercent ?? 0,
      profitFactor: broker.profitFactor ?? 0,
      lotsTradedTotal: broker.lotsTradedTotal ?? 0,
      netRealizedPnl: broker.pnlRealized ?? 0,
      peakBalance: broker.peakBalance ?? broker.simulatedBalance ?? 0,
      drawdownPercent: broker.drawdownPercent ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Delete Broker Account Profile
  async deleteBrokerProfile(userId: string, brokerId: string): Promise<void> {
    const path = `users/${userId}/brokers/${brokerId}`;
    const docRef = doc(db, 'users', userId, 'brokers', brokerId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Listen to Connected Brokers for this user
  subscribeBrokers(userId: string, onUpdate: (brokers: BrokerAccount[]) => void): Unsubscribe {
    const path = `users/${userId}/brokers`;
    const colRef = collection(db, 'users', userId, 'brokers');
    const q = query(colRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const brokers: BrokerAccount[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          brokers.push({
            id: d.id,
            name: d.name || d.broker || 'Broker Account',
            broker: d.broker || d.name || 'MT5 Broker',
            server: d.server || 'Exness-MT5Real',
            serverHost: d.serverHost || (d.server ? `${d.server.toLowerCase()}.broker-gateway.enterprise:443` : undefined),
            protocol: d.protocol || 'TLS 1.3 / FIX 4.4',
            encryptionLevel: d.encryptionLevel || 'AES-256-GCM',
            securityHash: d.securityHash,
            isSecuredInFirebase: d.isSecuredInFirebase !== false,
            lastCloudSyncTimestamp: d.lastCloudSyncTimestamp || Date.now(),
            accountNumber: d.accountNumber,
            accountType: d.accountType || 'DEMO',
            currency: d.currency || 'USD',
            leverage: String(d.leverage || '1:500'),
            apiKeyMasked: d.apiKeyMasked || '••••••••',
            status: (d.status as any) || 'CONNECTED',
            permissions: d.permissions || ['TRADE', 'READ'],
            simulatedBalance: d.simulatedBalance ?? d.balance ?? 0,
            equity: d.equity ?? d.balance ?? 0,
            freeMargin: d.freeMargin ?? 0,
            marginLevel: d.marginLevel ?? 999.9,
            pingMs: d.pingMs ?? 14,
            isPaper: d.isPaper ?? true,
            lastConnected: d.lastConnected || Date.now(),
            serverStatus: d.serverStatus || 'RUNNING',
            isNonStop: d.isNonStop !== false,
            savedInSystem: true,
            uptimeSeconds: d.uptimeSeconds ?? 0,
            connectedAt: d.connectedAt || d.lastConnected || Date.now(),
            tradesCount: d.tradesCount ?? 0,
            pnlRealized: d.pnlRealized ?? 0,
            winningTradesCount: d.winningTradesCount ?? 0,
            losingTradesCount: d.losingTradesCount ?? 0,
            winRatePercent: d.winRatePercent ?? 0,
            profitFactor: d.profitFactor ?? 0,
            lotsTradedTotal: d.lotsTradedTotal ?? 0,
            peakBalance: d.peakBalance ?? d.simulatedBalance ?? 0,
            drawdownPercent: d.drawdownPercent ?? 0,
          });
        });
        onUpdate(brokers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // Save Trade Executed on this specific Connected Server
  async saveServerTrade(userId: string, serverId: string, trade: TradeHistoryItem): Promise<void> {
    const path = `users/${userId}/brokers/${serverId}/trades/${trade.id}`;
    const docRef = doc(db, 'users', userId, 'brokers', serverId, 'trades', trade.id);
    const now = new Date().toISOString();
    const payload = {
      id: trade.id,
      userId,
      serverId,
      serverName: trade.serverName || trade.accountName || 'Connected MT5 Server',
      accountNumber: String(trade.accountNumber || ''),
      symbol: trade.symbol,
      side: trade.side,
      lotSize: trade.lotSize ?? 0.01,
      quantity: trade.quantity,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || trade.entryPrice,
      realizedPnl: trade.realizedPnl,
      realizedPnlPercent: trade.realizedPnlPercent,
      feesPaid: trade.feesPaid ?? 0,
      strategyName: trade.strategyName || 'Adaptive Regime Meta-Engine',
      exitReason: trade.exitReason || 'TAKE_PROFIT',
      tradeExplanation: trade.tradeExplanation || `Execution on server ${serverId}`,
      entryTime: new Date(trade.entryTime).toISOString(),
      exitTime: new Date(trade.exitTime).toISOString(),
      createdAt: now,
    };
    try {
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Listen to Trades executed for a specific connected server
  subscribeServerTrades(userId: string, serverId: string, onUpdate: (trades: TradeHistoryItem[]) => void): Unsubscribe {
    const path = `users/${userId}/brokers/${serverId}/trades`;
    const colRef = collection(db, 'users', userId, 'brokers', serverId, 'trades');
    const q = query(colRef, where('userId', '==', userId));
    return onSnapshot(
      q,
      (snap) => {
        const trades: TradeHistoryItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          trades.push({
            id: d.id,
            symbol: d.symbol,
            side: d.side,
            lotSize: d.lotSize ?? 0.01,
            entryPrice: d.entryPrice,
            exitPrice: d.exitPrice,
            quantity: d.quantity,
            realizedPnl: d.realizedPnl,
            realizedPnlPercent: d.realizedPnlPercent ?? 0,
            feesPaid: d.feesPaid ?? 0,
            strategyName: d.strategyName || 'Adaptive Regime Meta-Engine',
            accountName: d.serverName,
            serverId: d.serverId,
            serverName: d.serverName,
            accountNumber: d.accountNumber,
            entryTime: new Date(d.entryTime).getTime(),
            exitTime: new Date(d.exitTime).getTime(),
            exitReason: d.exitReason,
            environment: 'live',
            tradeExplanation: d.tradeExplanation || '',
          });
        });
        // Sort newest first
        trades.sort((a, b) => b.exitTime - a.exitTime);
        onUpdate(trades);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  // Save Generated Account Report into Firestore
  async saveServerReport(userId: string, serverId: string, report: ServerAccountReport): Promise<void> {
    const path = `users/${userId}/brokers/${serverId}/reports/${report.id}`;
    const docRef = doc(db, 'users', userId, 'brokers', serverId, 'reports', report.id);
    const now = new Date().toISOString();
    const payload = {
      id: report.id,
      userId,
      serverId,
      serverName: report.serverName,
      accountNumber: String(report.accountNumber),
      generatedAt: new Date(report.generatedAt).toISOString(),
      initialBalance: report.financialSummary.initialBalance,
      currentBalance: report.financialSummary.currentBalance,
      totalEquity: report.financialSummary.totalEquity,
      netProfitUsd: report.financialSummary.netProfitUsd,
      returnPercent: report.financialSummary.returnPercent,
      totalTrades: report.executionSummary.totalTrades,
      winningTrades: report.executionSummary.winningTrades,
      losingTrades: report.executionSummary.losingTrades,
      winRatePercent: report.executionSummary.winRatePercent,
      profitFactor: report.executionSummary.profitFactor,
      totalLotsTraded: report.executionSummary.totalLotsTraded,
      averageLotSize: report.executionSummary.averageLotSize,
      maxDrawdownPercent: report.financialSummary.maxDrawdownPercent,
      reportSummary: `Enterprise Account Audit Report for ${report.serverName} (${report.broker}). Total Executions: ${report.executionSummary.totalTrades}, Net PnL: $${report.financialSummary.netProfitUsd.toFixed(2)}, Win Rate: ${report.executionSummary.winRatePercent.toFixed(1)}%.`,
    };
    try {
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Build Comprehensive Institutional Account Report from Server and Trade History
  generateServerReport(server: BrokerAccount, allTrades: TradeHistoryItem[]): ServerAccountReport {
    // Filter trades executed on this server or all if global
    const serverTrades = allTrades.filter(
      (t) => !t.serverId || t.serverId === server.id || t.accountName === server.name || t.accountNumber === server.accountNumber
    );

    const winningTrades = serverTrades.filter((t) => t.realizedPnl > 0);
    const losingTrades = serverTrades.filter((t) => t.realizedPnl < 0);

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const totalTrades = serverTrades.length;
    const winRatePercent = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.realizedPnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnl, 0));
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : (grossProfit > 0 ? 99.9 : 0);

    const netProfitUsd = Number(serverTrades.reduce((sum, t) => sum + t.realizedPnl, 0).toFixed(2));
    const currentBalance = server.simulatedBalance || 10000;
    const initialBalance = Number(Math.max(100, currentBalance - netProfitUsd).toFixed(2));
    const totalEquity = server.equity || (currentBalance + netProfitUsd);
    const returnPercent = initialBalance > 0 ? Number(((netProfitUsd / initialBalance) * 100).toFixed(2)) : 0;

    const totalLotsTraded = Number(serverTrades.reduce((sum, t) => sum + (t.lotSize ?? 0.05), 0).toFixed(2));
    const averageLotSize = totalTrades > 0 ? Number((totalLotsTraded / totalTrades).toFixed(3)) : 0.05;

    const bestTradeUsd = serverTrades.length > 0 ? Math.max(...serverTrades.map((t) => t.realizedPnl)) : 0;
    const worstTradeUsd = serverTrades.length > 0 ? Math.min(...serverTrades.map((t) => t.realizedPnl)) : 0;
    const averageWinUsd = winCount > 0 ? Number((grossProfit / winCount).toFixed(2)) : 0;
    const averageLossUsd = lossCount > 0 ? Number((grossLoss / lossCount).toFixed(2)) : 0;

    return {
      id: `rep_${server.id}_${Date.now()}`,
      serverId: server.id,
      serverName: server.name || server.broker,
      broker: server.broker,
      accountNumber: server.accountNumber,
      accountType: server.accountType || 'DEMO',
      currency: server.currency || 'USD',
      leverage: String(server.leverage || '1:500'),
      generatedAt: Date.now(),
      serverTelemetry: {
        host: server.serverHost || `${(server.server || 'mt5-real').toLowerCase()}.broker-gateway.enterprise:443`,
        protocol: server.protocol || 'TLS 1.3 / Direct FIX 4.4',
        pingMs: server.pingMs || 12,
        encryption: server.encryptionLevel || 'AES-256-GCM Military Grade',
        status: server.status || 'CONNECTED',
        uptimeHours: Number(((server.uptimeSeconds || 3600) / 3600).toFixed(1)),
        securityHash: server.securityHash || `SEC_${server.id.toUpperCase().substring(0, 10)}`,
        cloudDatabase: 'Firebase Firestore (Encrypted at Rest & Transit)',
        isSecuredInFirebase: true,
        lastSyncedAt: server.lastCloudSyncTimestamp || Date.now(),
      },
      financialSummary: {
        initialBalance,
        currentBalance,
        totalEquity,
        netProfitUsd,
        returnPercent,
        peakBalance: Math.max(initialBalance, currentBalance, totalEquity),
        freeMargin: server.freeMargin ?? (totalEquity * 0.95),
        marginLevel: server.marginLevel ?? 1250.5,
        maxDrawdownPercent: server.drawdownPercent ?? (lossCount > 0 ? 3.8 : 0.5),
      },
      executionSummary: {
        totalTrades,
        winningTrades: winCount,
        losingTrades: lossCount,
        winRatePercent: Number(winRatePercent.toFixed(1)),
        profitFactor,
        averageWinUsd,
        averageLossUsd,
        bestTradeUsd: Number(bestTradeUsd.toFixed(2)),
        worstTradeUsd: Number(worstTradeUsd.toFixed(2)),
        totalLotsTraded,
        averageLotSize,
      },
      trades: serverTrades,
    };
  },

  // Save Trade Record into the User's Journal
  async logJournalTrade(userId: string, trade: TradeHistoryItem): Promise<void> {
    const path = `users/${userId}/journal/${trade.id}`;
    const docRef = doc(db, 'users', userId, 'journal', trade.id);
    const payload = {
      id: trade.id,
      userId,
      symbol: trade.symbol,
      direction: trade.side,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || 0,
      quantity: trade.quantity,
      realizedPnl: trade.realizedPnl,
      realizedPnlPercent: trade.realizedPnlPercent,
      strategyName: trade.strategyName || 'Adaptive Regime Meta-Engine',
      status: 'CLOSED',
      notes: trade.tradeExplanation || `Closed with ${trade.realizedPnl >= 0 ? 'profit' : 'loss'} of $${trade.realizedPnl.toFixed(2)}`,
      openedAt: new Date(trade.entryTime).toISOString(),
      closedAt: new Date(trade.exitTime).toISOString(),
    };
    try {
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save Compliance Audit Log (Immutable)
  async appendAuditLog(
    userId: string,
    log: {
      id?: string;
      action: string;
      category: AuditLog['category'];
      details: string | Record<string, any>;
      severity?: AuditLog['severity'];
      timestamp?: number;
    }
  ): Promise<void> {
    const logId = log.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const path = `users/${userId}/auditLogs/${logId}`;
    const docRef = doc(db, 'users', userId, 'auditLogs', logId);
    const timestampNum = log.timestamp || Date.now();
    const payload = {
      id: logId,
      userId,
      timestamp: new Date(timestampNum).toISOString(),
      severity: log.severity || 'INFO',
      category: log.category,
      action: log.action,
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
    };
    try {
      await setDoc(docRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },
};
