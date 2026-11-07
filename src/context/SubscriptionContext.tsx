import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSubscription, SubscriptionStatus } from '../types';
import { useAuth } from './AuthContext';
import { firestoreSync } from '../services/firestoreSync';

interface SubscriptionContextType {
  subscription: UserSubscription;
  isSubscribed: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  isPaywallOpen: boolean;
  paywallSource: string;
  openPaywall: (source?: string) => void;
  closePaywall: () => void;
  activateSubscription: (txRef?: string, durationDays?: number) => Promise<void>;
  renewSubscription: () => void;
  expireSubscription: () => void;
}

const STORAGE_KEY = 'quantara_user_subscription_v1';
const NOWPAYMENTS_INVOICE_ID = '5836437268';
const NOWPAYMENTS_PAYMENT_URL = 'https://nowpayments.io/payment/?iid=5836437268&source=button';
const MONTHLY_FEE_USD = 100;
const DURATION_DAYS = 30;

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  status: 'unpaid',
  plan: 'Quantara Institutional Software License',
  monthlyFeeUsd: MONTHLY_FEE_USD,
  startDate: '',
  expiresAt: '',
  paymentProvider: 'NOWPayments',
  invoiceId: NOWPAYMENTS_INVOICE_ID,
  paymentUrl: NOWPAYMENTS_PAYMENT_URL,
  isAutoRenew: false,
};

const getStoredSubscription = (): UserSubscription => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate structure
      if (parsed && typeof parsed.status === 'string') {
        // Check if expired
        if (parsed.status === 'active' && parsed.expiresAt) {
          const expiresTime = new Date(parsed.expiresAt).getTime();
          if (Date.now() > expiresTime) {
            return {
              ...parsed,
              status: 'expired',
            };
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse cached subscription:', e);
  }
  return DEFAULT_SUBSCRIPTION;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription>(getStoredSubscription);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallSource, setPaywallSource] = useState<string>('general');

  // Admin users (e.g. platform owner) have permanent system access
  const isAdmin = Boolean(profile?.role === 'admin' || user?.email === 'chekchris85@gmail.com');

  // Compute active state based on timestamp and status
  const isTimeValid = Boolean(
    subscription.status === 'active' &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt).getTime() > Date.now()
  );

  const isSubscribed = isAdmin || isTimeValid;

  // Compute days and hours remaining
  const calculateRemaining = () => {
    if (!subscription.expiresAt) return { days: 0, hours: 0 };
    const diffMs = new Date(subscription.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return { days: 0, hours: 0 };
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  };

  const { days: daysRemaining, hours: hoursRemaining } = calculateRemaining();

  // Save to localStorage when subscription changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
    } catch (e) {
      console.warn('Failed to save subscription:', e);
    }
  }, [subscription]);

  // Periodic expiration checker (every 30 seconds)
  useEffect(() => {
    const checkExpiration = () => {
      if (subscription.status === 'active' && subscription.expiresAt) {
        if (Date.now() > new Date(subscription.expiresAt).getTime()) {
          setSubscription((prev) => ({
            ...prev,
            status: 'expired',
          }));
        }
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 30000);
    return () => clearInterval(interval);
  }, [subscription.status, subscription.expiresAt]);

  // Sync with Firestore profile if user is authenticated
  useEffect(() => {
    if (profile?.subscriptionStatus) {
      if (profile.subscriptionStatus === 'active' && profile.subscriptionExpiresAt) {
        const cloudExpiry = new Date(profile.subscriptionExpiresAt).getTime();
        if (cloudExpiry > Date.now()) {
          setSubscription((prev) => ({
            ...prev,
            status: 'active',
            expiresAt: profile.subscriptionExpiresAt!,
            subscriptionPaymentId: profile.subscriptionPaymentId,
          }));
        } else {
          setSubscription((prev) => ({
            ...prev,
            status: 'expired',
          }));
        }
      }
    }
  }, [profile?.subscriptionStatus, profile?.subscriptionExpiresAt]);

  const openPaywall = (source: string = 'general') => {
    setPaywallSource(source);
    setIsPaywallOpen(true);
  };

  const closePaywall = () => {
    setIsPaywallOpen(false);
  };

  const activateSubscription = async (txRef?: string, durationDays: number = DURATION_DAYS) => {
    const now = Date.now();
    const expiresAt = new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const startDate = new Date(now).toISOString();

    const updatedSub: UserSubscription = {
      status: 'active',
      plan: 'Quantara Institutional Software License',
      monthlyFeeUsd: MONTHLY_FEE_USD,
      startDate,
      expiresAt,
      paymentProvider: 'NOWPayments',
      invoiceId: NOWPAYMENTS_INVOICE_ID,
      paymentUrl: NOWPAYMENTS_PAYMENT_URL,
      transactionRef: txRef || `nowpay_${Math.floor(Math.random() * 899999 + 100000)}`,
      isAutoRenew: false,
      activatedBy: user?.email || 'authenticated_operator',
    };

    setSubscription(updatedSub);
    setIsPaywallOpen(false);

    // Sync with Firestore if logged in
    if (user?.uid) {
      try {
        await firestoreSync.updateSubscription(user.uid, {
          subscriptionStatus: 'active',
          subscriptionPlan: updatedSub.plan,
          subscriptionExpiresAt: updatedSub.expiresAt,
          subscriptionPaymentId: updatedSub.transactionRef,
        });
      } catch (err) {
        console.warn('Could not sync subscription to Firestore:', err);
      }
    }

    // Inform server
    try {
      await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSub),
      });
    } catch (e) {
      // Non-critical local state already active
    }
  };

  const renewSubscription = () => {
    openPaywall('renewal');
  };

  const expireSubscription = () => {
    setSubscription((prev) => ({
      ...prev,
      status: 'expired',
    }));
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isSubscribed,
        daysRemaining,
        hoursRemaining,
        isPaywallOpen,
        paywallSource,
        openPaywall,
        closePaywall,
        activateSubscription,
        renewSubscription,
        expireSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
