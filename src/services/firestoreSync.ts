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
import { BrokerAccount, RiskSettings, TradeHistoryItem, AuditLog } from '../types';

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

  // Save Broker Account Profile to Firestore
  async saveBrokerProfile(userId: string, broker: BrokerAccount): Promise<void> {
    const path = `users/${userId}/brokers/${broker.id}`;
    const docRef = doc(db, 'users', userId, 'brokers', broker.id);
    const now = new Date().toISOString();
    const payload = {
      id: broker.id,
      userId,
      name: broker.name,
      broker: broker.broker,
      brokerName: broker.name || broker.broker,
      server: broker.server || 'Exness-MT5Real',
      accountNumber: String(broker.accountNumber),
      accountType: broker.accountType || 'DEMO',
      status: broker.status || 'CONNECTED',
      simulatedBalance: broker.simulatedBalance ?? 0,
      equity: broker.equity ?? 0,
      currency: broker.currency || 'USD',
      leverage: broker.leverage || '1:500',
      isPaper: !!broker.isPaper,
      apiKeyMasked: broker.apiKeyMasked || '••••••••',
      permissions: broker.permissions || ['TRADE', 'READ'],
      lastConnected: broker.lastConnected || Date.now(),
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
            accountNumber: d.accountNumber,
            accountType: d.accountType || 'DEMO',
            currency: d.currency || 'USD',
            leverage: d.leverage || '1:500',
            apiKeyMasked: d.apiKeyMasked || '••••••••',
            status: (d.status as any) || 'CONNECTED',
            permissions: d.permissions || ['TRADE', 'READ'],
            simulatedBalance: d.simulatedBalance ?? 0,
            equity: d.equity ?? 0,
            isPaper: d.isPaper ?? true,
            lastConnected: d.lastConnected || Date.now(),
          });
        });
        onUpdate(brokers);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
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
