import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SessionExtensionDialog } from "@/components/SessionExtensionDialog";
import { SessionWarningBanner } from "@/components/SessionWarningBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ViewPhoto from "@/pages/view-photo";
import ViewDateMemory from "@/pages/view-date-memory";
import LoginPage from "@/pages/login";
import ProfilePage from "@/pages/profile";
import PartnershipInvitationPage from "@/pages/partnership-invitation";
import { useState } from "react";

function AppContent() {
  const { sessionTimeRemaining, showExtensionDialog, setShowExtensionDialog } = useAuth();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <>
      {/* Session Warning Banner */}
      {!bannerDismissed && (
        <SessionWarningBanner onDismiss={() => setBannerDismissed(true)} />
      )}
      
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/partnership/invite/:token" component={PartnershipInvitationPage} />
        <Route path="/">
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Route>
        <Route path="/photo/:id">
          <ProtectedRoute>
            <ViewPhoto />
          </ProtectedRoute>
        </Route>
        <Route path="/date-memory/:id">
          <ProtectedRoute>
            <ViewDateMemory />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
      
      {/* Session Extension Dialog */}
      {sessionTimeRemaining && (
        <SessionExtensionDialog 
          open={showExtensionDialog}
          onOpenChange={setShowExtensionDialog}
          timeRemaining={sessionTimeRemaining}
        />
      )}
      
      <Toaster />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
