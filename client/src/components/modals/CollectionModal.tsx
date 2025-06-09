import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Calendar, CloudUpload, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PhotoUpload {
  file: File;
  preview: string;
  title: string;
}

export default function CollectionModal({ isOpen, onClose }: CollectionModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState<string>(
    new Date().toISOString().substring(0, 10) // Default to today
  );
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);

  // File dropzone handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const newPhotos = acceptedFiles.map(file => {
        // Create preview
        const objectUrl = URL.createObjectURL(file);
        
        // Generate title from filename
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const cleanedName = nameWithoutExt.replace(/[-_]/g, " ");
        const formattedName = cleanedName.replace(/\b\w/g, char => char.toUpperCase());
        
        return {
          file,
          preview: objectUrl,
          title: formattedName
        };
      });
      
      setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const updatedPhotos = [...prevPhotos];
      // Clean up preview URL
      URL.revokeObjectURL(updatedPhotos[index].preview);
      updatedPhotos.splice(index, 1);
      return updatedPhotos;
    });
  };

  // Create date entry mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("Memory name required");
      }
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('type', 'custom'); // Changed from 'date' to 'custom'
      
      // Explicitly convert date to string and store as additional metadata
      if (dateValue) {
        formData.append('date', dateValue);
      }
      
      // Add photos if any
      photos.forEach((photo, index) => {
        formData.append(`photo`, photo.file);
        formData.append(`photoTitle`, photo.title);
      });
      
      const response = await fetch(API_ENDPOINTS.collections, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create memory");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collections] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collectionsWithThumbnails] });
      toast({
        title: "Date memory added",
        description: "Your new date memory has been successfully created.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create memory",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Memory name required",
        description: "Please provide a name for this date memory.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };
  
  const handleClose = () => {
    // Clean up preview URLs
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.preview);
    });
    
    setName("");
    setDescription("");
    setDateValue(new Date().toISOString().substring(0, 10));
    setPhotos([]);
    onClose();
  };

  const formattedDate = dateValue ? new Date(dateValue).toLocaleDateString('en-US', {
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }) : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-quicksand font-bold text-2xl text-[#4A4A4A] text-center">
            Add Date Memory
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="memory-name" className="font-quicksand font-medium text-[#4A4A4A]">
              Memory Title
            </Label>
            <HandDrawn>
              <Input 
                id="memory-name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E6B89C] font-lato"
                placeholder="E.g., First Beach Trip, Pizza Night, Museum Visit"
              />
            </HandDrawn>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="date-value" className="font-quicksand font-medium text-[#4A4A4A] flex items-center">
              <Calendar className="h-4 w-4 mr-1" /> Date of our Moment
            </Label>
            <HandDrawn>
              <Input
                id="date-value"
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E6B89C] font-lato"
              />
            </HandDrawn>
            {formattedDate && (
              <p className="text-xs text-[#9C7178]">{formattedDate}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memory-description" className="font-quicksand font-medium text-[#4A4A4A]">
              Your Thoughts
            </Label>
            <HandDrawn>
              <Textarea 
                id="memory-description" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-[#E6B89C] font-lato"
                placeholder="Write your memories about this date..."
                rows={3}
              />
            </HandDrawn>
          </div>
          
          {/* Photo upload area */}
          <div className="space-y-2">
            <Label className="font-quicksand font-medium text-[#4A4A4A] flex items-center justify-between">
              <span>Photos ({photos.length})</span>
              {photos.length > 0 && (
                <span className="text-sm text-gray-500">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </Label>
            
            <HandDrawn>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed border-[#88B9B0] rounded-lg p-4 text-center cursor-pointer 
                  ${isDragActive ? 'bg-[#88B9B0] bg-opacity-10' : ''}`}
              >
                <input {...getInputProps()} />
                <CloudUpload className="h-8 w-8 text-[#88B9B0] mx-auto mb-2" />
                <p className="text-[#4A4A4A] text-sm mb-1">
                  {isDragActive ? "Drop photos here..." : "Drag and drop photos from our date"}
                </p>
                <p className="text-xs text-gray-500 mb-2">or</p>
                <Button 
                  type="button" 
                  className="bg-[#88B9B0] hover:bg-opacity-90 text-white font-quicksand text-sm py-1 h-8"
                >
                  Choose Photos
                </Button>
              </div>
            </HandDrawn>
          </div>
          
          {/* Selected photos preview */}
          {photos.length > 0 && (
            <div className="space-y-1">
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo.preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Button 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-1 h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(index);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={photo.title}
                      onChange={(e) => {
                        const newPhotos = [...photos];
                        newPhotos[index].title = e.target.value;
                        setPhotos(newPhotos);
                      }}
                      className="mt-1 text-xs p-1 w-full h-6"
                      placeholder="Photo title"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="font-quicksand"
          >
            Cancel
          </Button>
          <HandDrawn>
            <Button 
              className="bg-[#9C7178] hover:bg-opacity-90 text-white font-quicksand"
              onClick={handleSubmit}
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Memory'}
            </Button>
          </HandDrawn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
