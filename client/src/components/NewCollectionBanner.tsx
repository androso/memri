import { HandDrawn } from "@/components/ui/hand-drawn";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";

interface NewCollectionBannerProps {
  onCreateCollection: () => void;
}

export default function NewCollectionBanner({ onCreateCollection }: NewCollectionBannerProps) {
  return (
    <section className="container mx-auto px-4 py-16 relative">
      <HandDrawn className="relative overflow-hidden bg-[#88B9B0] bg-opacity-20 p-8 md:p-12">
        <WatercolorOverlay opacity={0.1} />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:mr-8">
            <h2 className="font-quicksand font-bold text-2xl md:text-3xl text-[#4A4A4A] mb-3">
              Record a New Date
            </h2>
            <p className="text-[#4A4A4A] max-w-md">
              Save the memories from our special moments together. Add photos and notes from our latest adventure.
            </p>
          </div>
          <HandDrawn>
            <Button 
              className="bg-[#9C7178] hover:bg-opacity-90 text-white font-quicksand text-lg"
              onClick={onCreateCollection}
            >
              <Plus className="mr-2 h-4 w-4" /> New Date
            </Button>
          </HandDrawn>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1613928317813-448b53f5a3f3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" 
          alt="" 
          className="absolute -bottom-16 -right-16 w-48 h-48 opacity-10 transform rotate-12"
        />
      </HandDrawn>
    </section>
  );
}
