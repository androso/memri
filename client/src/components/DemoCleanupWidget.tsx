import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ContentSummary {
  totalCollections: number;
  protectedCollections: number;
  nonProtectedCollections: number;
  totalPhotos: number;
}

interface CleanupResponse {
  message: string;
  before: ContentSummary;
  after: ContentSummary;
}

export function DemoCleanupWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ContentSummary | null>(null);
  const [lastCleanup, setLastCleanup] = useState<CleanupResponse | null>(null);

  // Only show for demo user
  if (!user || user.username !== 'demo') {
    return null;
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/demo/summary', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const triggerCleanup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/demo/cleanup', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setLastCleanup(data);
        setSummary(data.after);
        toast({
          title: "Cleanup Completed",
          description: `Removed ${data.before.nonProtectedCollections} collections and ${data.before.totalPhotos} photos`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: data.message || "Failed to cleanup content",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      toast({
        title: "Cleanup Failed",
        description: "An error occurred during cleanup",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-[#E6B89C]/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#4A4A4A]">
          <Trash2 className="w-5 h-5" />
          Demo Content Management
        </CardTitle>
        <CardDescription>
          Manage your demo content. Protected collections (1, 2, 3, 4, 6) are preserved.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            className="border-[#9C7178] text-[#9C7178] hover:bg-[#9C7178] hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          
          {summary && (
            <div className="flex gap-2">
              <Badge variant="outline" className="border-[#E6B89C] text-[#4A4A4A]">
                <Shield className="w-3 h-3 mr-1" />
                {summary.protectedCollections} Protected
              </Badge>
              <Badge variant="outline" className="border-[#9C7178] text-[#4A4A4A]">
                {summary.nonProtectedCollections} Cleanup-able
              </Badge>
            </div>
          )}
        </div>

        {/* Summary Display */}
        {summary && (
          <div className="bg-[#F4F1EA]/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-[#4A4A4A]">Total Collections</p>
                <p className="text-lg font-bold text-[#9C7178]">{summary.totalCollections}</p>
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Total Photos</p>
                <p className="text-lg font-bold text-[#9C7178]">{summary.totalPhotos}</p>
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Protected</p>
                <p className="text-lg font-bold text-green-600">{summary.protectedCollections}</p>
              </div>
              <div>
                <p className="font-medium text-[#4A4A4A]">Can Remove</p>
                <p className="text-lg font-bold text-orange-600">{summary.nonProtectedCollections}</p>
              </div>
            </div>
          </div>
        )}

        {/* Last Cleanup Results */}
        {lastCleanup && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-green-600" />
              <p className="font-medium text-green-800">Last Cleanup Results</p>
            </div>
            <p className="text-sm text-green-700">
              Removed {lastCleanup.before.nonProtectedCollections} collections and {lastCleanup.before.totalPhotos} photos
            </p>
          </div>
        )}

        {/* Cleanup Action */}
        <div className="pt-2 border-t border-[#E6B89C]/20">
          <Button
            onClick={triggerCleanup}
            disabled={loading || (summary?.nonProtectedCollections === 0)}
            className="w-full bg-[#9C7178] hover:bg-[#9C7178]/90 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Cleaning up...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Clean Up Non-Protected Content
              </>
            )}
          </Button>
          
          <p className="text-xs text-[#4A4A4A]/70 mt-2 text-center">
            This will remove all collections and photos except the protected ones (1, 2, 3, 4, 6)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}