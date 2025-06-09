import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useToast } from '@/hooks/use-toast';

interface SessionExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeRemaining: number;
}

export function SessionExtensionDialog({ open, onOpenChange, timeRemaining }: SessionExtensionDialogProps) {
  const { logout } = useAuth();
  const { formattedTimeRemaining, isCriticalState } = useSessionTimeout();
  const { toast } = useToast();
  const [isExtending, setIsExtending] = useState(false);

  const handleExtendSession = async () => {
    setIsExtending(true);
    
    try {
      // Make a request to refresh the session
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Session refreshed successfully
        toast({
          title: "Session Extended",
          description: "Your session has been extended for another 10 minutes.",
        });
        onOpenChange(false);
        // The auth context will handle updating the timer
        window.location.reload(); // Simple way to reset the session timer
      } else {
        throw new Error('Failed to extend session');
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast({
        title: "Extension Failed",
        description: "Could not extend your session. Please log in again.",
        variant: "destructive",
      });
      onOpenChange(false);
      await logout();
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    onOpenChange(false);
    await logout();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isCriticalState ? 'text-red-600' : ''}`}>
            <Clock className={`w-5 h-5 ${isCriticalState ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session will expire in{' '}
            <span className={`font-semibold ${isCriticalState ? 'text-red-600' : 'text-yellow-600'}`}>
              {formattedTimeRemaining}
            </span>
            . Would you like to extend your session for another 10 minutes?
          </DialogDescription>
        </DialogHeader>
        
        <div className={`p-4 rounded-lg ${isCriticalState ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <p className="text-sm text-gray-600">
            ⚠️ For security purposes, sessions automatically expire after 10 minutes of activity.
          </p>
        </div>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex-1"
          >
            Log Out
          </Button>
          <Button 
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 bg-[#9C7178] hover:bg-[#9C7178]/90"
          >
            {isExtending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Extending...
              </>
            ) : (
              'Extend Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
