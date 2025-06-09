import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from "@/lib/utils";

export default function UserAccountMenu() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of Memri.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out.",
        variant: "destructive",
      });
    }
  };

  const handleAccountSettings = () => {
    navigate('/profile');
  };

  // Don't render anything if no user (loading is handled by ProtectedRoute)
  if (!user) {
    return null;
  }

  // Get user initials for fallback
  const userInitials = user.displayName
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full border-2 border-[#9C7178]/20 hover:border-[#9C7178]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9C7178]/50 focus:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={getImageUrl(user.profilePicture) || undefined}
              alt={user.displayName || user.username}
            />
            <AvatarFallback className="bg-[#E6B89C] text-white">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56 bg-white/95 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg" 
        align="end"
        sideOffset={5}
      >
        <DropdownMenuLabel className="font-quicksand">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-[#4A4A4A]">
              {user.displayName}
            </p>
            <p className="text-xs leading-none text-[#4A4A4A]/70">
              @{user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-[#E6B89C]/20" />
        
        <DropdownMenuItem 
          onClick={handleAccountSettings}
          className="cursor-pointer hover:bg-[#E6B89C]/10 focus:bg-[#E6B89C]/10 text-[#4A4A4A]"
        >
          <User className="mr-2 h-4 w-4" />
          <span className="font-lato">Account Settings</span>
        </DropdownMenuItem>
        
        
        <DropdownMenuSeparator className="bg-[#E6B89C]/20" />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer hover:bg-red-50 focus:bg-red-50 text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-lato">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 