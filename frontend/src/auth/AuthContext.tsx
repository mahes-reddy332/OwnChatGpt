import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, UserPreferences, AuthStatus } from '../types/auth';
import {
  getMeApi,
  loginApi,
  signupApi,
  logoutApi,
  logoutAllApi,
  updateProfileApi,
  getPreferencesApi,
  updatePreferencesApi,
  touchSessionApi,
} from '../services/api';

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences | null;
  status: AuthStatus;
  isIdleWarningOpen: boolean;
  idleSecondsRemaining: number;
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (displayName?: string, avatarUrl?: string) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  staySignedIn: () => Promise<void>;
  triggerMeaningfulActivity: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minutes
const IDLE_WARN_THRESHOLD_SECONDS = 25 * 60; // 25 minutes (5-minute warning)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState<boolean>(false);
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(300);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());
  const isStreamingRef = useRef<boolean>(false);
  isStreamingRef.current = isStreaming;

  // Initial user check on mount
  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getMeApi();
      setUser(currentUser);
      setStatus('authenticated');
      lastActivityRef.current = Date.now();
      try {
        const prefs = await getPreferencesApi();
        setPreferences(prefs);
      } catch {
        // Use default preferences
      }
    } catch {
      setUser(null);
      setPreferences(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Meaningful activity trigger (debounced touch-session)
  const lastTouchApiRef = useRef<number>(0);
  const triggerMeaningfulActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdleWarningOpen(false);

    // Throttle calling touch-session endpoint to once every 60s
    const now = Date.now();
    if (now - lastTouchApiRef.current > 60000 && status === 'authenticated') {
      lastTouchApiRef.current = now;
      touchSessionApi().catch(() => {});
    }
  }, [status]);

  // Login handler
  const login = async (email: string, password: string) => {
    const loggedInUser = await loginApi(email, password);
    setUser(loggedInUser);
    setStatus('authenticated');
    lastActivityRef.current = Date.now();
    setIsIdleWarningOpen(false);
    try {
      const prefs = await getPreferencesApi();
      setPreferences(prefs);
    } catch {
      // default
    }
  };

  // Signup handler
  const signup = async (email: string, password: string, displayName: string) => {
    const newUser = await signupApi(email, password, displayName);
    setUser(newUser);
    setStatus('authenticated');
    lastActivityRef.current = Date.now();
    setIsIdleWarningOpen(false);
    try {
      const prefs = await getPreferencesApi();
      setPreferences(prefs);
    } catch {
      // default
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    setUser(null);
    setPreferences(null);
    setStatus('unauthenticated');
    setIsIdleWarningOpen(false);
  };

  // Logout all sessions handler
  const logoutAll = async () => {
    try {
      await logoutAllApi();
    } catch {
      // ignore
    }
    setUser(null);
    setPreferences(null);
    setStatus('unauthenticated');
    setIsIdleWarningOpen(false);
  };

  // Update profile
  const updateProfile = async (displayName?: string, avatarUrl?: string) => {
    const updated = await updateProfileApi(displayName, avatarUrl);
    setUser(updated);
    triggerMeaningfulActivity();
  };

  // Update preferences
  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    const updated = await updatePreferencesApi(prefs);
    setPreferences(updated);
    triggerMeaningfulActivity();
  };

  // Stay signed in click
  const staySignedIn = async () => {
    await touchSessionApi().catch(() => {});
    lastActivityRef.current = Date.now();
    lastTouchApiRef.current = Date.now();
    setIsIdleWarningOpen(false);
  };

  // Idle timer check loop
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(() => {
      // If streaming, pause idle timer count
      if (isStreamingRef.current) {
        lastActivityRef.current = Date.now();
        return;
      }

      const idleDurationSeconds = (Date.now() - lastActivityRef.current) / 1000;

      if (idleDurationSeconds >= IDLE_TIMEOUT_SECONDS) {
        // Session expired
        setIsIdleWarningOpen(false);
        setUser(null);
        setPreferences(null);
        setStatus('expired');
        logoutApi().catch(() => {});
      } else if (idleDurationSeconds >= IDLE_WARN_THRESHOLD_SECONDS) {
        // Show 5-minute warning modal
        const remaining = Math.max(0, Math.floor(IDLE_TIMEOUT_SECONDS - idleDurationSeconds));
        setIdleSecondsRemaining(remaining);
        setIsIdleWarningOpen(true);
      } else {
        setIsIdleWarningOpen(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        status,
        isIdleWarningOpen,
        idleSecondsRemaining,
        isStreaming,
        setIsStreaming,
        login,
        signup,
        logout,
        logoutAll,
        updateProfile,
        updatePreferences,
        staySignedIn,
        triggerMeaningfulActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
