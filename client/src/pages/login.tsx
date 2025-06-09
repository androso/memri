import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { Camera, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  profilePicture?: string;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [userProfiles, setUserProfiles] = useState<User[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Generate avatar and color for a user
  const generateUserAvatar = (displayName: string, username: string) => {
    // Use first letter of display name, fallback to username
    const avatar = (displayName || username).charAt(0).toUpperCase();
    
    // Generate a consistent color based on username
    const colors = [
      "#E6B89C", "#88B9B0", "#9C7178", "#B89CC2", "#C2B89C", 
      "#9CB8C2", "#C29CB8", "#B8C29C", "#C2A89C", "#9CA8C2"
    ];
    
    // Simple hash function to get consistent color for each username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    
    return {
      avatar,
      color: colors[colorIndex]
    };
  };

  // Fetch user profiles with profile pictures
  useEffect(() => {
    const fetchUserProfiles = async () => {
      try {
        setLoadingProfiles(true);
        const response = await fetch('/api/users/profiles');
        if (response.ok) {
          const profiles = await response.json();
          
          // Convert profiles to User format
          const users: User[] = profiles.map((profile: any) => {
            const { avatar, color } = generateUserAvatar(profile.displayName, profile.username);
            
            return {
              id: profile.username,
              name: profile.displayName,
              avatar,
              color,
              profilePicture: profile.profilePicture ? `/api/images/${profile.profilePicture}` : undefined
            };
          });
          
          setUserProfiles(users);
        }
      } catch (error) {
        console.error('Failed to fetch user profiles:', error);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchUserProfiles();
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPassword("");
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !password) return;

    setIsLoading(true);
    
    try {
      const success = await login(selectedUser.id, password);

      if (success) {
        toast({
          title: `Welcome back, ${selectedUser.name}!`,
          description: "You have successfully signed in to Memri.",
        });
        
        // Navigate to the main app
        navigate("/");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPassword("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4A4A4A] via-[#9C7178] to-[#E6B89C] relative font-lato">
      <WatercolorOverlay opacity={0.15} />
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="flex items-center">
          <Camera className="h-8 w-8 text-[#F4F1EA] mr-3" />
          <h1 className="text-2xl font-quicksand font-bold text-[#F4F1EA]">
            Memri
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
        {!selectedUser ? (
          <>
            <div className="text-center mb-4">
              <h1 className="text-5xl md:text-6xl font-quicksand font-bold text-[#F4F1EA] mb-2">
                Who's capturing memories?
              </h1>
            </div>

            {/* Loading State */}
            {loadingProfiles && (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F4F1EA]/30 border-t-[#F4F1EA] rounded-full animate-spin"></div>
                <span className="ml-3 text-[#F4F1EA] text-lg">Loading users...</span>
              </div>
            )}

            {/* No Users State */}
            {!loadingProfiles && userProfiles.length === 0 && (
              <div className="text-center">
                <p className="text-[#F4F1EA] text-xl mb-2">
                  No users found. Please contact your administrator.
                </p>
              </div>
            )}

            {/* Demo User Instruction */}
            {!loadingProfiles && userProfiles.length > 0 && (
              <div className="text-center mb-8">
                <p className="text-[#F4F1EA] text-lg opacity-90">
                  Select Demo User to access this project
                </p>
              </div>
            )}

            {/* User Profiles */}
            {!loadingProfiles && userProfiles.length > 0 && (
              <div className="flex gap-8 md:gap-12 flex-wrap justify-center">
                {userProfiles.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleUserSelect(user)}
                  onMouseEnter={() => setHoveredUser(user.id)}
                  onMouseLeave={() => setHoveredUser(null)}
                >
                  {/* Avatar */}
                  <div 
                    className={`w-32 h-32 md:w-40 md:h-40 rounded-lg flex items-center justify-center text-white text-4xl md:text-5xl font-quicksand font-bold transition-all duration-300 shadow-lg overflow-hidden ${
                      hoveredUser === user.id 
                        ? 'scale-110 shadow-2xl' 
                        : 'group-hover:scale-105'
                    }`}
                    style={{ backgroundColor: user.profilePicture ? 'transparent' : user.color }}
                  >
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initial if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.style.backgroundColor = user.color;
                          e.currentTarget.parentElement!.innerHTML = user.avatar;
                        }}
                      />
                    ) : (
                      user.avatar
                    )}
                  </div>
                  
                  {/* Name */}
                  <h2 className={`mt-4 text-xl md:text-2xl font-quicksand font-medium transition-colors duration-300 ${
                    hoveredUser === user.id 
                      ? 'text-[#F4F1EA]' 
                      : 'text-[#F4F1EA] opacity-80'
                  }`}>
                    {user.name}
                  </h2>
                </div>
              ))}
              </div>
            )}
          </>
        ) : (
          /* Password Input Screen */
          <div className="w-full max-w-lg mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-8 text-[#F4F1EA] hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back
            </Button>

            {/* User Avatar */}
            <div className="text-center mb-2">
              <div 
                className="w-24 h-24 rounded-lg flex items-center justify-center text-white text-3xl font-quicksand font-bold mx-auto mb-4 shadow-lg overflow-hidden"
                style={{ backgroundColor: selectedUser.profilePicture ? 'transparent' : selectedUser.color }}
              >
                {selectedUser.profilePicture ? (
                  <img 
                    src={selectedUser.profilePicture} 
                    alt={selectedUser.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initial if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.style.backgroundColor = selectedUser.color;
                      e.currentTarget.parentElement!.innerHTML = selectedUser.avatar;
                    }}
                  />
                ) : (
                  selectedUser.avatar
                )}
              </div>
              <h2 className="text-2xl font-quicksand font-medium text-[#F4F1EA]">
                {selectedUser.name}
              </h2>
            </div>

            {/* Typeform-style Password Input */}
            <form onSubmit={handlePasswordSubmit} className="space-y-8">
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-3xl md:text-4xl font-quicksand font-medium text-[#F4F1EA] mb-2">
                    Enter your password
                  </h3>
                  <p className="text-[#F4F1EA] opacity-80 text-lg mb-2">
                    Please enter your password to continue
                  </p>
                  <p className="text-[#F4F1EA] opacity-70 text-sm mb-1">
                    Use "demo123" as password
                  </p>
                  <p className="text-[#F4F1EA] opacity-60 text-xs">
                    ⚠️ Sessions last 15 seconds for security
                  </p>
                </div>
                
                <div className="relative max-w-md mx-auto">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type your password..."
                    className="h-16 text-xl bg-white/10 border-2 border-white/20 focus:border-white/40 focus:ring-0 text-[#F4F1EA] placeholder:text-[#F4F1EA]/60 rounded-xl backdrop-blur-sm"
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#F4F1EA]/60 hover:text-[#F4F1EA] hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button
                  type="submit"
                  disabled={!password || isLoading}
                  className="h-14 px-12 text-lg font-quicksand font-medium bg-[#F4F1EA] text-[#4A4A4A] hover:bg-white transition-all duration-200 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Continue"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-6 space-y-3">
        <p className="text-[#F4F1EA] text-sm opacity-80">
          Capture and cherish your most precious moments
        </p>
      </div>
    </div>
  );
} 