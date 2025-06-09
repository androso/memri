import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useInvitationDetails, useAcceptInvitation, useRejectInvitation } from "@/hooks/usePartnerships";
import { getImageUrl } from '@/lib/utils';
import { Heart, Users, Camera, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PartnershipInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data: invitationData, isLoading, error } = useInvitationDetails(token);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  const invitation = invitationData?.invitation;

  const handleAccept = async () => {
    if (!token) return;
    
    try {
      await acceptInvitation.mutateAsync(token);
      
      toast({
        title: "Partnership Accepted! 🎉",
        description: "You're now sharing memories together. Welcome to your partnership!",
      });
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Failed to Accept Invitation",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!token) return;
    
    try {
      await rejectInvitation.mutateAsync(token);
      
      toast({
        title: "Invitation Declined",
        description: "The partnership invitation has been declined.",
      });
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Failed to Decline Invitation",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
        <WatercolorOverlay />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-[#9C7178] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">Partnership Invitation</h2>
                <p className="text-gray-600 mb-4">
                  Please log in to view and respond to this partnership invitation.
                </p>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
                >
                  Log In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
        <WatercolorOverlay />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    let errorTitle = "Invitation Not Found";
    let errorDescription = "This invitation link may be invalid or expired.";
    let errorIcon = <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />;
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorTitle = "Invitation Expired";
        errorDescription = "This invitation has expired. Please ask for a new invitation link.";
        errorIcon = <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />;
      } else if (error.message.includes('accepted') || error.message.includes('rejected')) {
        errorTitle = "Invitation Already Processed";
        errorDescription = "This invitation has already been accepted or declined.";
        errorIcon = <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />;
      }
    }

    return (
      <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
        <WatercolorOverlay />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
              <CardContent className="p-8 text-center">
                {errorIcon}
                <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">{errorTitle}</h2>
                <p className="text-gray-600 mb-4">{errorDescription}</p>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-[#9C7178] text-[#9C7178] hover:bg-[#9C7178] hover:text-white"
                >
                  Go to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is trying to accept their own invitation
  if (invitation.fromUser.id === user.id) {
    return (
      <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
        <WatercolorOverlay />
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">Invalid Invitation</h2>
                <p className="text-gray-600 mb-4">
                  You cannot accept your own partnership invitation. Share this link with someone else!
                </p>
                <Button 
                  onClick={() => navigate('/profile')}
                  className="bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
                >
                  Go to Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const expiresIn = formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true });

  return (
    <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
      <WatercolorOverlay />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <HandDrawn>
            <h1 className="text-4xl font-quicksand font-bold text-[#4A4A4A] mb-2 text-center">
              Partnership Invitation
            </h1>
          </HandDrawn>
          
          <p className="text-[#4A4A4A] text-center mb-8 opacity-80">
            You've been invited to share memories together!
          </p>

          <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#4A4A4A] justify-center">
                <Heart className="w-6 h-6 text-[#9C7178]" />
                Partnership Invitation
              </CardTitle>
              <CardDescription className="text-center">
                Someone special wants to share their memories with you
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* From User */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Invitation from:</p>
                <div className="flex items-center justify-center gap-3 p-4 bg-[#E6B89C]/10 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-[#E6B89C]/20 flex items-center justify-center overflow-hidden">
                    {invitation.fromUser.profilePicture ? (
                      <img 
                        src={getImageUrl(invitation.fromUser.profilePicture)} 
                        alt={invitation.fromUser.displayName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-[#9C7178]" />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-[#4A4A4A]">{invitation.fromUser.displayName}</h3>
                    <p className="text-gray-600">@{invitation.fromUser.username}</p>
                  </div>
                </div>
              </div>

              {/* Partnership Benefits */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800 mb-3 text-center">✨ What partnership means:</p>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    You'll become co-owners of all their existing collections
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    Future collections will automatically include both of you
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    You can both view, comment, and manage shared memories
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                    Your collections will also be shared with them
                  </li>
                </ul>
              </div>

              {/* Expiry Warning */}
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-200">
                <Clock className="w-4 h-4" />
                <span>This invitation expires {expiresIn}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50"
                  disabled={rejectInvitation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {rejectInvitation.isPending ? "Declining..." : "Decline"}
                </Button>
                
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
                  disabled={acceptInvitation.isPending}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {acceptInvitation.isPending ? "Accepting..." : "Accept Partnership"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 