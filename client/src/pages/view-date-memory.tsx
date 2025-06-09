import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { Collection, Photo } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient"; 
import { useState, useRef, useEffect } from "react";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { formatDate } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CommentsSidebar } from "@/components/CommentsSidebar";
import { PhotoUploadDialog } from "@/components/PhotoUploadDialog";
import { EditDateMemoryModal } from "@/components/modals/EditDateMemoryModal";
import { SessionStatusWidget } from "@/components/SessionStatusWidget";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Edit, 
  Trash2, 
  Calendar,
  Image,
  Plus,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

export default function ViewDateMemory() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Touch/swipe handling for photo slider
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Early return if no id
  if (!id) {
    navigate("/");
    return null;
  }

  // Fetch memory details
  const { 
    data: memory, 
    isLoading: memoryLoading, 
    error: memoryError 
  } = useQuery<Collection>({
    queryKey: [API_ENDPOINTS.collection(id)],
  });

  // Fetch photos for this memory
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError
  } = useQuery<Photo[]>({
    queryKey: [API_ENDPOINTS.collectionPhotos(id)],
    // Only fetch if we have a valid memory
    enabled: !!memory,
  });

  // Delete memory mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", API_ENDPOINTS.collection(id), {}),
    onSuccess: () => {
      toast({
        title: "Memory deleted",
        description: "The date memory has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collections] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collectionsWithThumbnails] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete memory",
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

  // Photo slider navigation functions
  const goToPrevPhoto = () => {
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    }
  };

  const goToNextPhoto = () => {
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    }
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && photos.length > 1) {
      goToNextPhoto();
    }
    if (isRightSwipe && photos.length > 1) {
      goToPrevPhoto();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (photos.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevPhoto();
      } else if (e.key === 'ArrowRight') {
        goToNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  const isLoading = memoryLoading || photosLoading;
  const error = memoryError || photosError;

  if (isLoading) {
    return (
      <div className="bg-[#F4F1EA] min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
            </Button>
            <SessionStatusWidget compact={true} />
          </div>
          <div className="bg-white rounded-lg overflow-hidden shadow-md">
            <Skeleton className="w-full h-[40vh]" />
            <div className="p-6">
              <Skeleton className="h-8 w-2/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex items-center mb-4">
                <Skeleton className="h-6 w-6 mr-2 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
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

  if (error || !memory) {
    return (
      <div className="bg-[#F4F1EA] min-h-screen p-4 flex items-center justify-center">
        <HandDrawn className="bg-white p-8 max-w-md">
          <h1 className="text-2xl font-quicksand font-bold text-[#9C7178] mb-4">Memory Not Found</h1>
          <p className="mb-6">We couldn't find the date memory you're looking for.</p>
          <Button onClick={() => navigate("/")}>Return to Gallery</Button>
        </HandDrawn>
      </div>
    );
  }

  const activePhoto = photos.length > 0 ? photos[activePhotoIndex] : null;
  const dateValue = memory.createdAt ? new Date(memory.createdAt) : new Date();
  const formattedDate = dateValue.toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  return (
    <div className="bg-[#F4F1EA] min-h-screen p-4 md:p-8 relative font-lato text-[#4A4A4A]">
      <WatercolorOverlay />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            className="font-quicksand" 
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Memories
          </Button>
          
          <SessionStatusWidget compact={true} />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-6">
          {/* Main content */}
          <HandDrawn className="bg-white overflow-hidden shadow-lg">
            {activePhoto ? (
              <div className="relative">
                <div 
                  className="relative overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img 
                    src={getImageUrl(activePhoto.filePath)} 
                    alt={activePhoto.title || memory.name} 
                    className="w-full object-contain max-h-[50vh] select-none"
                    draggable={false}
                  />
                  
                  {/* Navigation arrows - only show if more than 1 photo */}
                  {photos.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full"
                        onClick={goToPrevPhoto}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full"
                        onClick={goToNextPhoto}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}
                  
                  {/* Photo counter */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {activePhotoIndex + 1} / {photos.length}
                    </div>
                  )}
                </div>
                

                <Button 
                  className="absolute top-4 right-4 bg-[#E6B89C] hover:bg-[#9C7178] text-white font-quicksand"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Upload Photos</span>
                </Button>
              </div>
            ) : (
              <div className="bg-gray-100 flex items-center justify-center h-[40vh] relative">
                <div className="text-center p-8">
                  <Image className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No photos in this memory yet</p>
                </div>
                <Button 
                  className="absolute top-4 right-4 bg-[#E6B89C] hover:bg-[#9C7178] text-white font-quicksand"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Upload Photos</span>
                </Button>
              </div>
            )}
            
            <div className="p-6">
              <h1 className="font-quicksand font-bold text-2xl md:text-3xl mb-2">{memory.name}</h1>
              <div className="flex items-center text-[#9C7178] mb-2">
                <Calendar className="h-5 w-5 mr-1" />
                <span>{formattedDate}</span>
              </div>
              <p className="text-lg mb-6">{memory.description}</p>
              
              {/* Photo thumbnails */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-quicksand font-medium text-lg mb-2">Photos from this moment:</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 overflow-x-auto">
                    {photos.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className={`cursor-pointer border-2 overflow-hidden rounded-md relative ${
                          index === activePhotoIndex ? 'border-[#9C7178]' : 'border-transparent'
                        }`}
                        onClick={() => setActivePhotoIndex(index)}
                      >
                        <img 
                          src={getImageUrl(photo.filePath)} 
                          alt={photo.title || `Photo ${index + 1}`} 
                          className="w-full h-20 object-cover"
                        />
                        {/* Comment indicator - we'll add this later when we have comment counts */}
                        <div className="absolute bottom-1 right-1 bg-[#9C7178] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-75">
                          <MessageCircle className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap justify-between items-center border-t pt-4">
                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-1" />
                  <span>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Like
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Share
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <Edit className="h-5 w-5" />
                    Edit
                  </Button>
                  
                  {/* Show comments button only on mobile */}
                  <Button 
                    variant="outline" 
                    className="flex xl:hidden items-center gap-2"
                    onClick={() => setIsCommentsSidebarOpen(true)}
                    disabled={!activePhoto}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Comments
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
          
          {/* Comments sidebar - visible on desktop */}
          <div className="hidden xl:block">
            {activePhoto && (
              <CommentsSidebar 
                photoId={activePhoto.id.toString()} 
                photoTitle={activePhoto.title}
                isDesktopSidebar={true}
              />
            )}
          </div>
        </div>
        
        {/* Comments sidebar for mobile - sheet overlay */}
        <div className="xl:hidden">
          {activePhoto && (
            <CommentsSidebar 
              photoId={activePhoto.id.toString()}
              photoTitle={activePhoto.title}
              isOpen={isCommentsSidebarOpen}
              onOpenChange={setIsCommentsSidebarOpen}
            />
          )}
        </div>

        {/* Photo Upload Dialog */}
        <PhotoUploadDialog
          isOpen={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          collectionId={id}
          onUploadComplete={() => {
            // Reset active photo index to 0 when new photos are uploaded
            setActivePhotoIndex(0);
          }}
        />

        {/* Edit Date Memory Modal */}
        <EditDateMemoryModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          memory={memory}
        />
      </div>
    </div>
  );
} 