import { useState } from "react";
import { useLocation } from "wouter";
import { Collection } from "@shared/schema";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { Button } from "@/components/ui/button";
import { Heart, Edit, Maximize, Calendar, Image } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/utils";

// Extend the Collection type to include date property and thumbnailUrl
interface DateMemory extends Collection {
  date?: string;
  thumbnailUrl?: string;
}

interface DateMemoriesGalleryProps {
  dateMemories: (Collection & { thumbnailUrl?: string })[];
  isLoading: boolean;
  onCreateCollection: () => void;
}

export default function DateMemoriesGallery({ dateMemories, isLoading, onCreateCollection }: DateMemoriesGalleryProps) {
  const [, navigate] = useLocation();

  // Get thumbnail URL - use first photo or placeholder
  const getThumbnailUrl = (memory: Collection & { thumbnailUrl?: string }) => {
    return getImageUrl(memory.thumbnailUrl) || 'https://placehold.co/600x400';
  };

  const handleMemoryClick = (memory: Collection) => {
    navigate(`/date-memory/${memory.id}`);
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

  // No memories state
  if (!dateMemories || dateMemories.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16 text-center">
        <HandDrawn className="bg-white p-8 max-w-lg mx-auto">
          <h3 className="font-quicksand font-bold text-xl mb-4 text-[#9C7178]">No Date Memories Found</h3>
          <p className="mb-6 text-[#4A4A4A]">
            Start creating your relationship timeline by adding your first date memory.
          </p>
          <Button 
            className="bg-[#E6B89C] hover:bg-[#9C7178] text-white"
            onClick={onCreateCollection}
          >
            Add Your First Date Memory
          </Button>
        </HandDrawn>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {dateMemories.map((memory, index) => {
          // Cast to DateMemory to handle the date property
          const dateMemory = memory as DateMemory;
          return (
            <div 
              key={memory.id} 
              className="memory-card relative bg-white rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-lg"
              onClick={() => handleMemoryClick(memory)}
            >
              <div className="relative overflow-hidden" style={{ height: "220px" }}>
                <img 
                  src={getThumbnailUrl(memory)}
                  alt={memory.name} 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute bottom-0 right-0 bg-white bg-opacity-80 px-2 py-1 m-2 rounded text-xs flex items-center">
                  <Image size={12} className="mr-1" />
                  <span>{memory.thumbnailUrl ? 'Has photos' : 'No photos'}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-quicksand font-semibold text-lg mb-1">{memory.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{memory.description || "No description available"}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {dateMemory.date ? formatDate(dateMemory.date) : formatDate(memory.createdAt || new Date())}
                  </span>
                  <div className="flex space-x-2">
                    <button className="text-[#88B9B0] hover:text-opacity-80">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-[#9C7178] hover:text-opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        // In the future you can open a modal here
                      }}
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {dateMemories.length >= 8 && (
        <div className="flex justify-center mt-12">
          <HandDrawn>
            <Button className="bg-[#E6B89C] hover:bg-[#9C7178] text-white px-6 py-6 font-quicksand text-lg">
              Load More Memories
            </Button>
          </HandDrawn>
        </div>
      )}
    </section>
  );
} 