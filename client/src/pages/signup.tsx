import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { Camera, ArrowLeft, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, signup } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.displayName) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.length > 50) {
      newErrors.displayName = "Display name must be less than 50 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (formData.password.length > 100) {
      newErrors.password = "Password must be less than 100 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const success = await signup(
        formData.username,
        formData.displayName,
        formData.password,
        formData.confirmPassword
      );

      if (success) {
        toast({
          title: `Welcome to Memri, ${formData.displayName}!`,
          description: "Your account has been created successfully.",
        });
        
        // Navigate to the main app
        navigate("/");
      } else {
        // Try to get more specific error from the server
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
              setErrors({ username: "Username already exists" });
            } else {
              toast({
                title: "Signup Failed",
                description: errorData.message || "An error occurred during signup",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          toast({
            title: "Signup Failed",
            description: "An error occurred during signup. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: "An error occurred during signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/login");
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
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            onClick={handleBack}
            variant="ghost"
            className="mb-6 text-[#F4F1EA] hover:bg-[#F4F1EA]/10 p-2"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Login
          </Button>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <UserPlus className="h-12 w-12 text-[#F4F1EA]" />
            </div>
            <h1 className="text-4xl font-quicksand font-bold text-[#F4F1EA] mb-2">
              Join Memri
            </h1>
            <p className="text-[#F4F1EA] opacity-80 text-lg">
              Create your account to start capturing memories
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="w-full h-14 bg-[#F4F1EA]/90 border-none text-[#4A4A4A] placeholder:text-[#4A4A4A]/60 text-lg font-medium rounded-lg focus:ring-2 focus:ring-[#E6B89C] focus:bg-[#F4F1EA]"
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-red-300 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <Input
                type="text"
                placeholder="Display Name"
                value={formData.displayName}
                onChange={(e) => handleInputChange("displayName", e.target.value)}
                className="w-full h-14 bg-[#F4F1EA]/90 border-none text-[#4A4A4A] placeholder:text-[#4A4A4A]/60 text-lg font-medium rounded-lg focus:ring-2 focus:ring-[#E6B89C] focus:bg-[#F4F1EA]"
                disabled={isLoading}
              />
              {errors.displayName && (
                <p className="text-red-300 text-sm mt-1">{errors.displayName}</p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full h-14 bg-[#F4F1EA]/90 border-none text-[#4A4A4A] placeholder:text-[#4A4A4A]/60 text-lg font-medium rounded-lg focus:ring-2 focus:ring-[#E6B89C] focus:bg-[#F4F1EA] pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/60 hover:text-[#4A4A4A] transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.password && (
                <p className="text-red-300 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className="w-full h-14 bg-[#F4F1EA]/90 border-none text-[#4A4A4A] placeholder:text-[#4A4A4A]/60 text-lg font-medium rounded-lg focus:ring-2 focus:ring-[#E6B89C] focus:bg-[#F4F1EA] pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#4A4A4A]/60 hover:text-[#4A4A4A] transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-300 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#E6B89C] hover:bg-[#E6B89C]/90 text-[#4A4A4A] font-semibold text-lg rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-[#4A4A4A]/30 border-t-[#4A4A4A] rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-[#F4F1EA] opacity-80">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#E6B89C] hover:text-[#E6B89C]/80 font-medium underline transition-colors"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 