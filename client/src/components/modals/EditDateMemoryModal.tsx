
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Calendar } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { Collection } from "@shared/schema";

interface EditDateMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Collection | undefined;
}

export function EditDateMemoryModal({ isOpen, onClose, memory }: EditDateMemoryModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateValue, setDateValue] = useState<string>("");

  // Initialize form with memory data when modal opens
  useEffect(() => {
    if (memory && isOpen) {
      setName(memory.name || "");
      setDescription(memory.description || "");
      
      // Extract date from memory - check if there's a custom date field or use createdAt
      const memoryDate = memory.createdAt ? new Date(memory.createdAt) : new Date();
      setDateValue(memoryDate.toISOString().substring(0, 10));
    }
  }, [memory, isOpen]);

  // Update memory mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!memory || !name.trim()) {
        throw new Error("Memory name required");
      }
      
      const updateData = {
        name,
        description,
        date: dateValue
      };
      
      const response = await fetch(API_ENDPOINTS.collection(memory.id.toString()), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update memory");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collections] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collectionsWithThumbnails] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.collection(memory?.id.toString() || "")] });
      toast({
        title: "Memory updated",
        description: "Your date memory has been successfully updated.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to update memory",
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
    updateMutation.mutate();
  };
  
  const handleClose = () => {
    setName("");
    setDescription("");
    setDateValue("");
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
            Edit Date Memory
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
              disabled={!name.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Memory'}
            </Button>
          </HandDrawn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
