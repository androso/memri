import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SimplifiedFilter from "@/components/CollectionFilter";
import DateMemoriesGallery from "@/components/DateMemoriesGallery";
import NewCollectionBanner from "@/components/NewCollectionBanner";
import CollectionModal from "@/components/modals/CollectionModal";
import { API_ENDPOINTS } from "@/lib/constants";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";
import { Collection } from "@shared/schema";

export default function Home() {
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Fetch collections (using as date memories)
  const { data: dateMemories = [], isLoading: dateMemoriesLoading } = useQuery<(Collection & { thumbnailUrl?: string })[]>({
    queryKey: [API_ENDPOINTS.collectionsWithThumbnails],
  });

  // Filter date memories based on search query
  const filteredMemories = searchQuery 
    ? dateMemories.filter(memory => 
        memory.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (memory.description && memory.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : dateMemories;

  // Sort date memories based on sort order
  const sortedMemories = [...filteredMemories].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    } else if (sortOrder === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="bg-[#F4F1EA] min-h-screen relative font-lato text-[#4A4A4A]">
      <WatercolorOverlay />
      
      <Header onCreateCollection={() => setIsCollectionModalOpen(true)} />
      
      <SimplifiedFilter 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />
      
      <DateMemoriesGallery 
        dateMemories={sortedMemories}
        isLoading={dateMemoriesLoading}
        onCreateCollection={() => setIsCollectionModalOpen(true)}
      />
      
      <NewCollectionBanner 
        onCreateCollection={() => setIsCollectionModalOpen(true)} 
      />
      
      {isCollectionModalOpen && (
        <CollectionModal 
          isOpen={isCollectionModalOpen} 
          onClose={() => setIsCollectionModalOpen(false)} 
        />
      )}
    </div>
  );
}
