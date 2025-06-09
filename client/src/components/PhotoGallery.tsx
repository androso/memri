import { useState } from "react";
import { useLocation } from "wouter";
import { Photo } from "@shared/schema";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Button } from "@/components/ui/button";
import { Heart, Edit, Maximize } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { getImageUrl } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import PhotoModal from "@/components/modals/PhotoModal";

interface PhotoGalleryProps {
  photos: Photo[];
  isLoading: boolean;
}

export default function PhotoGallery({ photos, isLoading }: PhotoGalleryProps) {
  const [, navigate] = useLocation();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: (photoId: number) => apiRequest("POST", API_ENDPOINTS.likePhoto(photoId), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
    }
  });

  const handleLike = (photoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate(photoId);
  };

  const handlePhotoClick = (photo: Photo) => {
    navigate(`/photo/${photo.id}`);
  };

  const openPhotoModal = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhoto(photo);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-6 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md">
              <Skeleton className="w-full h-56" />
              <div className="p-4">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // No photos state
  if (!photos || photos.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <HandDrawn className="bg-white p-8 max-w-lg mx-auto">
          <h3 className="font-quicksand font-bold text-xl mb-4 text-[#9C7178]">No Photos Found</h3>
          <p className="mb-6 text-[#4A4A4A]">
            Start creating your magical photo collection by uploading your first photo.
          </p>
          <Button className="bg-[#E6B89C] hover:bg-[#9C7178] text-white">
            Upload Your First Photo
          </Button>
        </HandDrawn>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="photo-card relative bg-white rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
            onClick={() => handlePhotoClick(photo)}
          >
            <div className="relative overflow-hidden" style={{ height: "220px" }}>
              <img 
                src={getImageUrl(photo.filePath)} 
                alt={photo.title} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <button 
                className="absolute top-2 right-2 bg-white bg-opacity-70 hover:bg-opacity-90 text-[#9C7178] p-2 rounded-full"
                onClick={(e) => handleLike(photo.id, e)}
              >
                {photo.isLiked ? (
                  <Heart className="h-4 w-4 fill-[#9C7178]" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-quicksand font-semibold text-lg mb-1">{photo.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{photo.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{formatDate(photo.uploadedAt)}</span>
                <div className="flex space-x-2">
                  <button className="text-[#88B9B0] hover:text-opacity-80">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-[#9C7178] hover:text-opacity-80"
                    onClick={(e) => openPhotoModal(photo, e)}
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {photos.length >= 8 && (
        <div className="flex justify-center mt-12">
          <HandDrawn>
            <Button className="bg-[#E6B89C] hover:bg-[#9C7178] text-white px-6 py-6 font-quicksand text-lg">
              Load More Photos
            </Button>
          </HandDrawn>
        </div>
      )}

      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto} 
          isOpen={!!selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </section>
  );
}
