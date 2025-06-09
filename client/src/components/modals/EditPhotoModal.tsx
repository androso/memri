import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collection, Photo } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

interface EditPhotoModalProps {
  photo: Photo;
  collections: Collection[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPhotoModal({ photo, collections, isOpen, onClose }: EditPhotoModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(photo.title);
  const [description, setDescription] = useState(photo.description || "");
  const [collectionId, setCollectionId] = useState(String(photo.collectionId));

  // Update photo mutation
  const updateMutation = useMutation({
    mutationFn: () => 
      apiRequest("PUT", API_ENDPOINTS.photo(photo.id), {
        title,
        description,
        collectionId: parseInt(collectionId)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photos] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photo(photo.id)] });
      toast({
        title: "Photo updated",
        description: "Your photo has been updated successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update photo",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white font-lato">
        <DialogTitle className="font-quicksand font-bold text-xl text-center mb-4">
          <HandDrawn>
            Edit Photo
          </HandDrawn>
        </DialogTitle>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Collection</Label>
            <Select 
              value={collectionId} 
              onValueChange={(value) => setCollectionId(value)}
            >
              <SelectTrigger id="collection">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {collections.map((collection) => (
                    <SelectItem 
                      key={collection.id} 
                      value={String(collection.id)}
                    >
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Photo Preview */}
          <div className="flex justify-center mb-6">
            <HandDrawn className="bg-gray-50 p-4">
              <img 
                src={getImageUrl(photo.filePath)} 
                alt={photo.title} 
                className="max-w-xs max-h-60 object-contain rounded-md"
              />
            </HandDrawn>
          </div>

          <DialogFooter className="pt-4">
            <HandDrawn>
              <Button 
                type="submit" 
                className="w-full"
                disabled={!title || !collectionId || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </HandDrawn>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}