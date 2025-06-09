import React from 'react';
import { Clock, Shield, AlertTriangle } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function SessionStatus() {
  const { 
    sessionTimeRemaining, 
    isWarningState, 
    isCriticalState, 
    formattedTimeRemaining,
    isActiveSession 
  } = useSessionTimeout();
  const { setShowExtensionDialog } = useAuth();

  if (!isActiveSession || !sessionTimeRemaining) {
    return null;
  }

  const handleExtendClick = () => {
    setShowExtensionDialog(true);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
      isCriticalState 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : isWarningState 
        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
        : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      {/* Icon */}
      <div className="flex items-center">
        {isCriticalState ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : isWarningState ? (
          <Clock className="w-5 h-5" />
        ) : (
          <Shield className="w-5 h-5" />
        )}
      </div>

      {/* Time display */}
      <div className="flex flex-col min-w-0">
        <div className="text-sm font-medium">
          Session: {formattedTimeRemaining}
        </div>
        <div className="text-xs opacity-80">
          {isCriticalState 
            ? 'Session expiring soon!' 
            : isWarningState 
            ? 'Consider extending session'
            : 'Session active'
          }
        </div>
      </div>

      {/* Extend button for warning/critical states */}
      {(isWarningState || isCriticalState) && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleExtendClick}
          className={`text-xs px-2 py-1 h-auto ${
            isCriticalState 
              ? 'border-red-300 hover:bg-red-100' 
              : 'border-yellow-300 hover:bg-yellow-100'
          }`}
        >
          Extend
        </Button>
      )}
    </div>
  );
}
