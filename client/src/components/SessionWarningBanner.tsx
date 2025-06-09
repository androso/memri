import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useAuth } from '@/contexts/AuthContext';

interface SessionWarningBannerProps {
  onDismiss?: () => void;
}

export function SessionWarningBanner({ onDismiss }: SessionWarningBannerProps) {
  const { 
    sessionTimeRemaining, 
    isWarningState, 
    isCriticalState, 
    formattedTimeRemaining,
    isActiveSession 
  } = useSessionTimeout();
  const { setShowExtensionDialog } = useAuth();

  // Only show during warning or critical states
  if (!isActiveSession || !sessionTimeRemaining || (!isWarningState && !isCriticalState)) {
    return null;
  }

  const handleExtendClick = () => {
    setShowExtensionDialog(true);
    onDismiss?.();
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isCriticalState 
        ? 'bg-red-500 border-red-600' 
        : 'bg-yellow-500 border-yellow-600'
    } border-b-2 shadow-lg`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            {isCriticalState ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            <div>
              <div className="font-medium">
                {isCriticalState 
                  ? `Session expires in ${formattedTimeRemaining}!` 
                  : `Session warning: ${formattedTimeRemaining} remaining`
                }
              </div>
              <div className="text-sm opacity-90">
                {isCriticalState 
                  ? 'Your session will expire soon. Extend now to avoid losing your work.' 
                  : 'Consider extending your session to continue working.'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExtendClick}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            >
              Extend Session
            </Button>
            {onDismiss && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-white hover:bg-white/10 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
