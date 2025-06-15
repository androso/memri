import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Camera, User, Lock, Save, ArrowLeft, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from '@/lib/utils';
import PartnershipCard from "@/components/PartnershipCard";
import { SessionStatusWidget } from "@/components/SessionStatusWidget";

interface User {
  id: number;
  username: string;
  displayName: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Check if current user is demo user
  const isDemoUser = user?.username === 'demo';

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPreviewUrl(getImageUrl(user.profilePicture) || null);
    }
  }, [user]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Demo user cannot change password
    if (!isDemoUser && password && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      
      if (displayName !== user?.displayName) {
        formData.append('displayName', displayName);
      }
      
      // Only include password for non-demo users
      if (!isDemoUser && password) {
        formData.append('password', password);
      }
      
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh user data from the auth context
        await refreshUser();
        if (!isDemoUser) {
          setPassword("");
          setConfirmPassword("");
        }
        setProfilePicture(null);
        
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] relative overflow-hidden">
      <WatercolorOverlay />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-[#4A4A4A] hover:text-[#9C7178]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Memories
          </Button>
          
          {/* Session Status in top right */}
          <div className="ml-auto">
            <SessionStatusWidget compact={true} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <HandDrawn>
            <h1 className="text-4xl font-quicksand font-bold text-[#4A4A4A] mb-2 text-center">
              Profile Settings
            </h1>
          </HandDrawn>
          
          <p className="text-[#4A4A4A] text-center mb-8 opacity-80">
            Manage your account information and preferences
          </p>

          <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#4A4A4A]">
                <User className="w-5 h-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                {isDemoUser 
                  ? "Update your display name and profile picture" 
                  : "Update your display name, password, and profile picture"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#E6B89C]/20 flex items-center justify-center overflow-hidden">
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-[#9C7178]" />
                      )}
                    </div>
                    <div>
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profilePicture')?.click()}
                        className="border-[#9C7178] text-[#9C7178] hover:bg-[#9C7178] hover:text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Photo
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-[#E6B89C]/50 focus:border-[#9C7178]"
                    required
                  />
                </div>

                {/* Username (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={user.username}
                    disabled
                    className="bg-gray-50 border-[#E6B89C]/30"
                  />
                  <p className="text-sm text-gray-500">Username cannot be changed</p>
                </div>

                {/* Password - Hidden for demo user */}
                {!isDemoUser && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#9C7178]" />
                      <Label className="text-base font-medium">Change Password</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-[#E6B89C]/50 focus:border-[#9C7178]"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    
                    {password && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-[#E6B89C]/50 focus:border-[#9C7178]"
                          placeholder="Confirm your new password"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
                >
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Partnership Management */}
          <PartnershipCard />
        </div>
      </div>
    </div>
  );
} 