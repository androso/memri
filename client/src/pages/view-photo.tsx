import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { Collection, Photo } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient"; 
import { useState } from "react";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { formatDate } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, Share2, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import EditPhotoModal from "@/components/modals/EditPhotoModal";
import { getImageUrl } from "@/lib/utils";
import CommentsSidebar from "@/components/CommentsSidebar";
import { SessionStatusWidget } from "@/components/SessionStatusWidget";

export default function ViewPhoto() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch photo details
  const { 
    data: photo, 
    isLoading, 
    error 
  } = useQuery<Photo>({
    queryKey: [API_ENDPOINTS.photo(id || '')],
  });

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", API_ENDPOINTS.likePhoto(id || ''), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photo(id || '')] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
    }
  });

  // Fetch collections for the edit modal
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: [API_ENDPOINTS.collections],
    enabled: isEditModalOpen,
  });
  
  // Delete photo mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", API_ENDPOINTS.photo(id || ''), {}),
    onSuccess: () => {
      toast({
        title: "Photo deleted",
        description: "The photo has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete photo",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  });

  const handleDelete = () => {
    if (isDeleting) {
      deleteMutation.mutate();
    } else {
      setIsDeleting(true);
    }
  };

  const handleLike = () => {
    likeMutation.mutate();
  };
  
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="bg-[#F4F1EA] min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Button>
            <SessionStatusWidget compact={true} />
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            <Skeleton className="w-full h-[60vh]" />
            <div className="p-6">
              <Skeleton className="h-8 w-2/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="bg-[#F4F1EA] min-h-screen p-4 flex items-center justify-center">
        <HandDrawn className="bg-white p-8 max-w-md">
          <h1 className="text-2xl font-quicksand font-bold text-[#9C7178] mb-4">Photo Not Found</h1>
          <p className="mb-6">We couldn't find the photo you're looking for.</p>
          <Button onClick={() => navigate("/")}>Return to Gallery</Button>
        </HandDrawn>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F1EA] min-h-screen p-4 md:p-8 relative font-lato text-[#4A4A4A]">
      <WatercolorOverlay />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            className="font-quicksand" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Button>
          
          <SessionStatusWidget compact={true} />
        </div>
        
        <div className="lg:col-span-2">
          <HandDrawn className="bg-white overflow-hidden shadow-lg mb-6">
            <div className="relative">
              <img 
                src={getImageUrl(photo.filePath)} 
                alt={photo.title} 
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
            
            <div className="p-6">
              <h1 className="font-quicksand font-bold text-2xl md:text-3xl mb-2">{photo.title}</h1>
              <p className="text-lg mb-4">{photo.description}</p>
              
              <div className="flex flex-wrap justify-between items-center">
                <span className="text-gray-500">{formatDate(photo.uploadedAt)}</span>
                
                <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    className={`flex items-center gap-2 ${photo.isLiked ? 'text-[#9C7178]' : ''}`}
                    onClick={handleLike}
                    disabled={likeMutation.isPending}
                  >
                    <Heart className={`h-5 w-5 ${photo.isLiked ? 'fill-[#9C7178]' : ''}`} />
                    {photo.isLiked ? 'Liked' : 'Like'}
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleEditClick}
                  >
                    <Edit className="h-5 w-5" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant={isDeleting ? "destructive" : "outline"} 
                    className="flex items-center gap-2"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-5 w-5" />
                    {isDeleting ? 'Confirm Delete?' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </HandDrawn>
        </div>
      </div>
      
      {isEditModalOpen && collections.length > 0 && photo && (
        <EditPhotoModal
          photo={photo}
          collections={collections}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
}
