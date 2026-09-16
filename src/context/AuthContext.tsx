import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, validateFirestoreConnection } from '../lib/firebase';
import { firestoreSync, UserProfileDoc } from '../services/firestoreSync';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfileDoc | null;
  loading: boolean;
  authError: string | null;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'guest';
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string; role?: any; bio?: string; desk?: string }) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to retrieve cached profile
const getCachedProfile = (): UserProfileDoc | null => {
  try {
    const raw = localStorage.getItem('quantara_custom_profile');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfileDoc | null>(getCachedProfile);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'guest'>('guest');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setCloudSyncStatus('syncing');
        try {
          // Probe connection
          await validateFirestoreConnection();
          // Sync profile
          const cached = getCachedProfile();
          const userProf = await firestoreSync.syncUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: cached?.displayName || currentUser.displayName,
            photoURL: cached?.photoURL || currentUser.photoURL,
            emailVerified: currentUser.emailVerified,
          });
          setProfile(userProf);
          try {
            localStorage.setItem('quantara_custom_profile', JSON.stringify(userProf));
          } catch (e) {}
          setCloudSyncStatus('synced');
        } catch (err: any) {
          console.warn('Profile sync / Firestore notice:', err?.message || err);
          // Still logged in, but operating in offline-cached mode
          setCloudSyncStatus('offline');
        }
      } else {
        const cached = getCachedProfile();
        setProfile(cached);
        setCloudSyncStatus('guest');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setAuthError(null);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        setCloudSyncStatus('syncing');
        const prof = await firestoreSync.syncUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          emailVerified: cred.user.emailVerified,
        });
        setProfile(prof);
        setCloudSyncStatus('synced');
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in popup was closed. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setAuthError('Network error connecting to Google Authentication service.');
      } else {
        setAuthError(err.message || 'Failed to authenticate with Google.');
      }
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        setCloudSyncStatus('syncing');
        const prof = await firestoreSync.syncUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          emailVerified: cred.user.emailVerified,
        });
        setProfile(prof);
        setCloudSyncStatus('synced');
      }
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      let msg = 'Failed to sign in. Please verify your email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Access temporarily locked for security. Please try again later or reset password.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
        // Send verification email
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Email verification send note:', e);
        }

        setCloudSyncStatus('syncing');
        const prof = await firestoreSync.syncUserProfile({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: name || cred.user.email?.split('@')[0] || 'Enterprise Operator',
          photoURL: null,
          emailVerified: cred.user.emailVerified,
        });
        setProfile(prof);
        setCloudSyncStatus('synced');
      }
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      let msg = 'Failed to create enterprise operator account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters with numbers and letters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please provide a valid enterprise or institutional email address.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await fbSignOut(auth);
      setUser(null);
      setProfile(null);
      setCloudSyncStatus('guest');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign out.');
    }
  };

  const sendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No enterprise account found with this email.';
      }
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
      } catch (err: any) {
        setAuthError(err.message || 'Could not send verification email at this moment.');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        cloudSyncStatus,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        sendPasswordReset,
        resendVerification,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
