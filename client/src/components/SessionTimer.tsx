import React from 'react';
import { Clock } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export function SessionTimer() {
  const { 
    sessionTimeRemaining, 
    isWarningState, 
    isCriticalState, 
    formattedTimeRemaining 
  } = useSessionTimeout();

  if (!sessionTimeRemaining) {
    return null;
  }

  // Only show timer when less than 3 minutes remain
  if (sessionTimeRemaining > 3 * 60 * 1000) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isCriticalState 
        ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse' 
        : isWarningState 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        : 'bg-blue-100 text-blue-800 border border-blue-200'
    }`}>
      <Clock className={`w-4 h-4 ${isCriticalState ? 'animate-pulse' : ''}`} />
      <span>
        Session expires in {formattedTimeRemaining}
      </span>
    </div>
  );
}
