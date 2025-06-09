import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useSessionTimeout() {
  const { sessionTimeRemaining, user } = useAuth();
  const [timeUntilWarning, setTimeUntilWarning] = useState<number | null>(null);
  
  const WARNING_THRESHOLD = 5 * 1000; // 5 seconds
  const CRITICAL_THRESHOLD = 2 * 1000; // 2 seconds

  useEffect(() => {
    if (!sessionTimeRemaining || !user) {
      setTimeUntilWarning(null);
      return;
    }

    const remaining = sessionTimeRemaining;
    
    if (remaining <= WARNING_THRESHOLD) {
      setTimeUntilWarning(remaining);
    } else {
      setTimeUntilWarning(remaining - WARNING_THRESHOLD);
    }
  }, [sessionTimeRemaining, user, WARNING_THRESHOLD]);

  const isWarningState = sessionTimeRemaining && sessionTimeRemaining <= WARNING_THRESHOLD;
  const isCriticalState = sessionTimeRemaining && sessionTimeRemaining <= CRITICAL_THRESHOLD;
  const isActiveSession = Boolean(user && sessionTimeRemaining);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (60 * 1000));
    const seconds = Math.floor((milliseconds % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    sessionTimeRemaining,
    timeUntilWarning,
    isWarningState,
    isCriticalState,
    isActiveSession,
    formatTime,
    formattedTimeRemaining: sessionTimeRemaining ? formatTime(sessionTimeRemaining) : null,
  };
}
