import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';

interface User {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionTimeRemaining: number | null;
  showExtensionDialog: boolean;
  setShowExtensionDialog: (show: boolean) => void;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, displayName: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playWarningSound } = useNotificationSound();
  
  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const sessionExpiresAtRef = useRef<number | null>(null);

  const SESSION_DURATION = 15 * 1000; // 15 seconds (testing)
  const WARNING_TIME = 5 * 1000; // Show warning 5 seconds before expiry

  const clearTimers = useCallback(() => {
    if (authCheckIntervalRef.current) {
      clearInterval(authCheckIntervalRef.current);
      authCheckIntervalRef.current = null;
    }
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const startSessionTimer = useCallback(() => {
    clearTimers();
    
    if (!sessionExpiresAtRef.current) return;
    
    const timeRemaining = sessionExpiresAtRef.current - Date.now();
    
    if (timeRemaining <= 0) {
      handleSessionExpiry();
      return;
    }
    
    setSessionTimeRemaining(timeRemaining);
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      const currentTimeRemaining = sessionExpiresAtRef.current! - Date.now();
      
      if (currentTimeRemaining <= 0) {
        clearInterval(countdownInterval);
        handleSessionExpiry();
        return;
      }
      
      setSessionTimeRemaining(currentTimeRemaining);
      
      // Show warning when 5 seconds remain
      if (currentTimeRemaining <= WARNING_TIME && !warningShownRef.current) {
        warningShownRef.current = true;
        const secondsLeft = Math.ceil(currentTimeRemaining / 1000);
        setShowExtensionDialog(true);
        playWarningSound(); // Play audio notification
        // toast({
        //   title: "Session Expiring Soon",
        //   description: `Your session will expire in ${secondsLeft} second${secondsLeft !== 1 ? 's' : ''}. Please save your work.`,
        //   variant: "destructive",
        // });
      }
    }, 1000);
    
    authCheckIntervalRef.current = countdownInterval;
  }, [toast, WARNING_TIME]);

  const handleSessionExpiry = useCallback(async () => {
    clearTimers();
    setSessionTimeRemaining(null);
    setUser(null);
    setShowExtensionDialog(false);
    sessionExpiresAtRef.current = null;
    warningShownRef.current = false;
    
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please sign in again.",
      variant: "destructive",
    });
    
    navigate('/login');
  }, [toast, navigate, clearTimers]);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        console.log('Auth check successful:', data.user.username);
        
        // Set session expiration time from server
        if (data.sessionExpiresAt) {
          sessionExpiresAtRef.current = new Date(data.sessionExpiresAt).getTime();
          warningShownRef.current = false; // Reset warning state
          startSessionTimer();
        }
      } else {
        console.log('Auth check failed:', response.status, response.statusText);
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          console.log('Auth error details:', errorData);
          handleSessionExpiry();
        } else {
          setUser(null);
          setSessionTimeRemaining(null);
          setShowExtensionDialog(false);
          sessionExpiresAtRef.current = null;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setSessionTimeRemaining(null);
      setShowExtensionDialog(false);
      sessionExpiresAtRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [startSessionTimer, handleSessionExpiry]);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    
    return () => {
      clearTimers();
    };
  }, [checkAuth, clearTimers]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Set session expiration time from server
        if (data.sessionExpiresAt) {
          sessionExpiresAtRef.current = new Date(data.sessionExpiresAt).getTime();
          warningShownRef.current = false;
          startSessionTimer();
        }
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const signup = async (username: string, displayName: string, password: string, confirmPassword: string): Promise<boolean> => {
    // User creation is disabled
    console.warn('User creation is disabled');
    return false;
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTimers();
      setUser(null);
      setSessionTimeRemaining(null);
      setShowExtensionDialog(false);
      sessionExpiresAtRef.current = null;
      warningShownRef.current = false;
      navigate('/login');
    }
  };

  const refreshUser = async (): Promise<void> => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    loading,
    sessionTimeRemaining,
    showExtensionDialog,
    setShowExtensionDialog,
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 