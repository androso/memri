import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePartner, useCreateInvitation, useRemovePartnership, usePendingInvitations, useCancelInvitation } from "@/hooks/usePartnerships";
import { getImageUrl } from '@/lib/utils';
import { Heart, Users, Copy, Share, UserMinus, Plus, Camera, Clock, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PartnershipCard() {
  const { toast } = useToast();
  const { data: partnerData, isLoading } = usePartner();
  const { data: pendingData, isLoading: loadingPending } = usePendingInvitations();
  const createInvitation = useCreateInvitation();
  const removePartnership = useRemovePartnership();
  const cancelInvitation = useCancelInvitation();
  
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const partner = partnerData?.partner;
  const pendingInvitations = pendingData?.invitations || [];

  const handleCreateInvitation = async () => {
    try {
      const result = await createInvitation.mutateAsync();
      setInviteUrl(result.inviteUrl);
      setShowInviteDialog(true);
      
      toast({
        title: "Invitation Created",
        description: "Share this link with your partner to invite them!",
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast({
        title: "Failed to Create Invitation",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link Copied",
        description: "Invitation link copied to clipboard!",
      });
    }
  };

  const handleCancelInvitation = async (token: string) => {
    try {
      await cancelInvitation.mutateAsync(token);
      toast({
        title: "Invitation Cancelled",
        description: "The partnership invitation has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Failed to Cancel Invitation",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleRemovePartnership = async () => {
    try {
      await removePartnership.mutateAsync();
      setShowRemoveDialog(false);
      
      toast({
        title: "Partnership Removed",
        description: "Your partnership has been ended. Collections are no longer shared.",
      });
    } catch (error) {
      console.error('Error removing partnership:', error);
      toast({
        title: "Failed to Remove Partnership",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const copyInvitationUrl = (token: string) => {
    const url = `${window.location.origin}/partnership/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Invitation link copied to clipboard!",
    });
  };

  if (isLoading || loadingPending) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#4A4A4A]">
            <Heart className="w-5 h-5 text-[#9C7178]" />
            Partnership
          </CardTitle>
          <CardDescription>
            {partner 
              ? "You're sharing your memories with a partner" 
              : "Invite someone special to share your memories"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {partner ? (
            // Show current partner
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-[#E6B89C]/10 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#E6B89C]/20 flex items-center justify-center overflow-hidden">
                  {partner.profilePicture ? (
                    <img 
                      src={getImageUrl(partner.profilePicture)} 
                      alt={partner.displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-6 h-6 text-[#9C7178]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#4A4A4A]">{partner.displayName}</h3>
                    <Badge 
                      variant="secondary" 
                      className="bg-[#9C7178]/10 text-[#9C7178] border-[#9C7178]/20"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Partner
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">@{partner.username}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800 mb-1">✨ Partnership Benefits:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• All your collections are automatically shared</li>
                  <li>• New collections will include both of you as owners</li>
                  <li>• You can both view and manage shared memories</li>
                </ul>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowRemoveDialog(true)}
                className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                disabled={removePartnership.isPending}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                End Partnership
              </Button>
            </div>
          ) : (
            // Show invitation creation and pending invitations
            <div className="space-y-4">
              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-[#4A4A4A] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Pending Invitations ({pendingInvitations.length})
                  </h4>
                  
                  {pendingInvitations.map((invitation) => {
                    const isExpired = new Date() > new Date(invitation.expiresAt);
                    const expiresIn = formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true });
                    
                    return (
                      <div key={invitation.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant={isExpired ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {isExpired ? "Expired" : "Pending"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {isExpired ? `Expired ${expiresIn}` : `Expires ${expiresIn}`}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 font-mono break-all">
                              {invitation.inviteToken.substring(0, 16)}...
                            </p>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationUrl(invitation.inviteToken)}
                              className="h-8 w-8 p-0"
                              title="Copy invitation link"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/partnership/invite/${invitation.inviteToken}`, '_blank')}
                              className="h-8 w-8 p-0"
                              title="Open invitation page"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvitation(invitation.inviteToken)}
                              disabled={cancelInvitation.isPending}
                              className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                              title="Cancel invitation"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create new invitation */}
              <div className="text-center p-6 bg-[#E6B89C]/10 rounded-lg">
                <Users className="w-8 h-8 text-[#9C7178] mx-auto mb-2" />
                <p className="text-[#4A4A4A] mb-1">
                  {pendingInvitations.length > 0 ? "Create another invitation" : "No partner yet"}
                </p>
                <p className="text-sm text-gray-600">
                  {pendingInvitations.length > 0 
                    ? "You can create multiple invitations if needed"
                    : "Create an invitation link to share your memories with someone special"
                  }
                </p>
              </div>

              <Button
                onClick={handleCreateInvitation}
                disabled={createInvitation.isPending}
                className="w-full bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
              >
                {createInvitation.isPending ? (
                  "Creating Invitation..."
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Partnership Invitation
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite URL Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="w-5 h-5 text-[#9C7178]" />
              Partnership Invitation Created
            </DialogTitle>
            <DialogDescription>
              Share this link with your partner. The invitation expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-mono break-all text-gray-700">{inviteUrl}</p>
            </div>
            
            <Button
              onClick={handleCopyInviteUrl}
              className="w-full bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Invitation Link
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowInviteDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Partnership Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-500" />
              End Partnership
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to end your partnership with {partner?.displayName}? 
              This will stop sharing collections and cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowRemoveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemovePartnership}
              disabled={removePartnership.isPending}
            >
              {removePartnership.isPending ? "Removing..." : "End Partnership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 