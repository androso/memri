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
  const loginTimeRef = useRef<number | null>(null);

  const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before expiry

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
    
    if (!loginTimeRef.current) return;
    
    const timeElapsed = Date.now() - loginTimeRef.current;
    const timeRemaining = SESSION_DURATION - timeElapsed;
    
    if (timeRemaining <= 0) {
      handleSessionExpiry();
      return;
    }
    
    setSessionTimeRemaining(timeRemaining);
    
    // Start countdown timer
    const countdownInterval = setInterval(() => {
      const currentTimeElapsed = Date.now() - loginTimeRef.current!;
      const currentTimeRemaining = SESSION_DURATION - currentTimeElapsed;
      
      if (currentTimeRemaining <= 0) {
        clearInterval(countdownInterval);
        handleSessionExpiry();
        return;
      }
      
      setSessionTimeRemaining(currentTimeRemaining);
      
      // Show warning when 2 minutes remain
      if (currentTimeRemaining <= WARNING_TIME && !warningShownRef.current) {
        warningShownRef.current = true;
        const minutesLeft = Math.ceil(currentTimeRemaining / (60 * 1000));
        setShowExtensionDialog(true);
        playWarningSound(); // Play audio notification
        toast({
          title: "Session Expiring Soon",
          description: `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`,
          variant: "destructive",
        });
      }
    }, 1000);
    
    authCheckIntervalRef.current = countdownInterval;
  }, [toast, SESSION_DURATION, WARNING_TIME]);

  const handleSessionExpiry = useCallback(async () => {
    clearTimers();
    setSessionTimeRemaining(null);
    setUser(null);
    setShowExtensionDialog(false);
    loginTimeRef.current = null;
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
        
        // If we don't have a login time set, set it now (for existing sessions)
        if (!loginTimeRef.current) {
          loginTimeRef.current = Date.now();
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
          loginTimeRef.current = null;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setSessionTimeRemaining(null);
      setShowExtensionDialog(false);
      loginTimeRef.current = null;
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
        
        // Record login time and start session timer
        loginTimeRef.current = Date.now();
        warningShownRef.current = false;
        startSessionTimer();
        
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
      loginTimeRef.current = null;
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