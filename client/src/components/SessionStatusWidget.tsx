import React from 'react';
import { Clock, Shield, AlertTriangle } from 'lucide-react';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SessionStatusWidgetProps {
  compact?: boolean;
  showExtendButton?: boolean;
}

export function SessionStatusWidget({ compact = false, showExtendButton = true }: SessionStatusWidgetProps) {
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

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
        isCriticalState 
          ? 'bg-red-100 text-red-700' 
          : isWarningState 
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-blue-100 text-blue-700'
      }`}>
        {isCriticalState ? (
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        ) : isWarningState ? (
          <Clock className="w-4 h-4" />
        ) : (
          <Shield className="w-4 h-4" />
        )}
        <span className="font-medium">{formattedTimeRemaining}</span>
        {showExtendButton && (isWarningState || isCriticalState) && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleExtendClick}
            className="h-auto p-1 text-xs hover:bg-transparent hover:underline"
          >
            Extend
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
      isCriticalState 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : isWarningState 
        ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
        : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <div className="flex items-center gap-2">
        {isCriticalState ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : isWarningState ? (
          <Clock className="w-5 h-5" />
        ) : (
          <Shield className="w-5 h-5" />
        )}
        <div>
          <div className="font-medium">{formattedTimeRemaining}</div>
          <div className="text-xs opacity-80">
            {isCriticalState 
              ? 'Session expiring!' 
              : isWarningState 
              ? 'Consider extending'
              : 'Session active'
            }
          </div>
        </div>
      </div>
      
      {showExtendButton && (isWarningState || isCriticalState) && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleExtendClick}
          className={`text-xs ${
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
