import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { API_ENDPOINTS } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";
import { CloudUpload, X, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUpload {
  file: File;
  preview: string;
  title: string;
}

interface PhotoUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  onUploadComplete?: () => void;
}

export function PhotoUploadDialog({ isOpen, onOpenChange, collectionId, onUploadComplete }: PhotoUploadDialogProps) {
  const { toast } = useToast();
  const [uploadPhotos, setUploadPhotos] = useState<PhotoUpload[]>([]);

  // Upload photos mutation
  const uploadMutation = useMutation({
    mutationFn: async (photos: PhotoUpload[]) => {
      const uploadPromises = photos.map(async (photo) => {
        const formData = new FormData();
        formData.append('photo', photo.file);
        formData.append('title', photo.title || 'Uploaded Photo');
        formData.append('description', 'Added to memory');
        formData.append('collectionId', collectionId);

        const response = await fetch(API_ENDPOINTS.photos, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (!response.ok) {
          let errorMessage = "Failed to upload photo";
          try {
            const errorData = await response.json();
            if (errorData.code === 'DATABASE_TIMEOUT') {
              errorMessage = "Database connection timeout. Please try again in a moment.";
            } else if (errorData.code === 'CONNECTION_RESET') {
              errorMessage = "Connection was reset. Please try again.";
            } else {
              errorMessage = errorData.message || errorMessage;
            }
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        return await response.json();
      });

      return await Promise.all(uploadPromises);
    },
    onSuccess: (uploadedPhotos) => {
      // Invalidate queries to refresh the gallery
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collectionPhotos(collectionId)] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collectionsWithThumbnails] });
      
      toast({
        title: "Photos uploaded successfully!",
        description: `${uploadedPhotos.length} photo${uploadedPhotos.length !== 1 ? 's' : ''} added to this memory.`,
      });
      
      // Clean up and close dialog
      uploadPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.preview);
      });
      setUploadPhotos([]);
      onOpenChange(false);
      
      // Call optional callback
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error) => {
      console.error('Upload error:', error);
      
      let title = "Upload failed";
      let description = "An unknown error occurred";
      
      if (error instanceof Error) {
        description = error.message;
        
        if (error.message.includes('timeout')) {
          title = "Connection timeout";
          description = "The upload took too long. Please check your connection and try again.";
        } else if (error.message.includes('reset')) {
          title = "Connection interrupted";
          description = "The connection was interrupted. Please try again.";
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    }
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, "") // Remove file extension
    }));
    
    setUploadPhotos(prev => [...prev, ...newPhotos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true
  });

  const removeUploadPhoto = (index: number) => {
    setUploadPhotos(prev => {
      const updatedPhotos = [...prev];
      URL.revokeObjectURL(updatedPhotos[index].preview);
      updatedPhotos.splice(index, 1);
      return updatedPhotos;
    });
  };

  const handleUpload = () => {
    if (uploadPhotos.length > 0) {
      uploadMutation.mutate(uploadPhotos);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs when closing
    uploadPhotos.forEach(photo => {
      URL.revokeObjectURL(photo.preview);
    });
    setUploadPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <DialogTitle className="font-quicksand text-2xl text-[#9C7178]">
            Upload Photos to Memory
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Add new photos to this memory. You can drag and drop multiple files or click to browse.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6">
          <div className="h-full flex flex-col space-y-6">
            {/* Dropzone - Always visible */}
            <div className="flex-shrink-0">
              <HandDrawn className="overflow-y-visible">
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive 
                      ? 'border-[#9C7178] bg-[#9C7178] bg-opacity-5' 
                      : 'border-[#88B9B0] hover:border-[#9C7178] hover:bg-gray-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <CloudUpload className="h-12 w-12 text-[#88B9B0] mx-auto mb-3" />
                  <h3 className="text-lg font-quicksand font-bold text-[#4A4A4A] mb-2">
                    {isDragActive ? "Drop your photos here!" : "Choose photos to upload"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Drag and drop your photos here, or click to browse your files
                  </p>
                  <Button 
                    type="button" 
                    className="bg-[#88B9B0] hover:bg-[#9C7178] text-white font-quicksand"
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Browse Photos
                  </Button>
                </div>
              </HandDrawn>
            </div>
            
            {/* Upload photos preview - Scrollable */}
            {uploadPhotos.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <h3 className="font-quicksand font-bold text-lg text-[#9C7178]">
                    {uploadPhotos.length} photo{uploadPhotos.length !== 1 ? 's' : ''} ready to upload
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      uploadPhotos.forEach(photo => {
                        URL.revokeObjectURL(photo.preview);
                      });
                      setUploadPhotos([]);
                    }}
                  >
                    Clear all
                  </Button>
                </div>
                
                <div className="flex-1 min-h-0">
                  <HandDrawn className="bg-[#F4F1EA] p-4 h-full">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pr-4 pb-4">
                        {uploadPhotos.map((photo, index) => (
                          <div key={index} className="relative group bg-white rounded-lg p-3">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3 relative">
                              <img 
                                src={photo.preview} 
                                alt={`Upload ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-6 h-6 p-0"
                                onClick={() => removeUploadPhoto(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Input
                              value={photo.title}
                              onChange={(e) => {
                                const newPhotos = [...uploadPhotos];
                                newPhotos[index].title = e.target.value;
                                setUploadPhotos(newPhotos);
                              }}
                              className="text-sm"
                              placeholder="Enter photo title..."
                            />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </HandDrawn>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-6 pt-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            className="bg-[#88B9B0] hover:bg-[#9C7178] text-white font-quicksand"
            onClick={handleUpload}
            disabled={uploadPhotos.length === 0 || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {uploadPhotos.length} Photo{uploadPhotos.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 