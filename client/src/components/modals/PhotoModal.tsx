import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Collection, Photo } from "@shared/schema";
import { formatDate } from "@/lib/constants";
import { Heart, Share2, X, Edit } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import EditPhotoModal from "./EditPhotoModal";
import { getImageUrl } from "@/lib/utils";

interface PhotoModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoModal({ photo, isOpen, onClose }: PhotoModalProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Fetch collections for the edit modal
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: [API_ENDPOINTS.collections],
    enabled: isEditModalOpen,
  });

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", API_ENDPOINTS.likePhoto(photo.id), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
    }
  });

  const handleLike = () => {
    likeMutation.mutate();
  };
  
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none">
        <div className="relative">
          <Button 
            variant="ghost" 
            className="absolute top-2 right-2 text-white bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full p-2 h-auto w-auto"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="max-h-[80vh] flex items-center justify-center bg-black">
            <img 
              src={getImageUrl(photo.filePath)} 
              alt={photo.title} 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
          
          <div className="bg-white p-6">
            <h3 className="font-quicksand font-bold text-xl mb-2">{photo.title}</h3>
            <p className="text-[#4A4A4A] mb-3">{photo.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{formatDate(photo.uploadedAt)}</span>
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  className={`flex items-center gap-2 ${photo.isLiked ? 'text-[#9C7178]' : ''}`}
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`h-5 w-5 ${photo.isLiked ? 'fill-[#9C7178]' : ''}`} />
                  {photo.isLiked ? 'Liked' : 'Like'}
                </Button>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share
                </Button>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2"
                  onClick={handleEditClick}
                >
                  <Edit className="h-5 w-5" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {isEditModalOpen && collections.length > 0 && (
        <EditPhotoModal
          photo={photo}
          collections={collections}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </Dialog>
  );
}
