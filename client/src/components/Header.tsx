import { HandDrawn } from "@/components/ui/hand-drawn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, BookOpen, Compass, Plus, Heart } from "lucide-react";
import { motion } from "framer-motion";
import UserAccountMenu from "@/components/UserAccountMenu";
import { usePartner } from "@/hooks/usePartnerships";

interface HeaderProps {
  onCreateCollection: () => void;
}

export default function Header({ onCreateCollection }: HeaderProps) {
  const { data: partnerData } = usePartner();
  const partner = partnerData?.partner;

  return (
    <header className="relative overflow-hidden">
      {/* Cloud decoration */}
      <div className="absolute top-10 left-1/4 opacity-20">
        <div className="relative">
          {/* Main cloud body */}
          <div className="w-32 h-20 bg-gradient-to-r from-[#88B9B0] to-[#E6B89C] rounded-full"></div>
          {/* Cloud bumps */}
          <div className="absolute -top-4 left-6 w-16 h-16 bg-gradient-to-r from-[#88B9B0] to-[#E6B89C] rounded-full"></div>
          <div className="absolute -top-2 right-4 w-12 h-12 bg-gradient-to-r from-[#E6B89C] to-[#9C7178] rounded-full"></div>
          <div className="absolute -top-6 left-16 w-20 h-20 bg-gradient-to-r from-[#88B9B0] to-[#E6B89C] rounded-full"></div>
        </div>
      </div>
      <div className="absolute top-20 right-1/4 opacity-15">
        <div className="relative">
          {/* Smaller cloud */}
          <div className="w-24 h-16 bg-gradient-to-r from-[#E6B89C] to-[#9C7178] rounded-full"></div>
          <div className="absolute -top-3 left-4 w-12 h-12 bg-gradient-to-r from-[#88B9B0] to-[#E6B89C] rounded-full"></div>
          <div className="absolute -top-1 right-2 w-8 h-8 bg-gradient-to-r from-[#E6B89C] to-[#9C7178] rounded-full"></div>
          <div className="absolute -top-4 left-12 w-16 h-16 bg-gradient-to-r from-[#88B9B0] to-[#E6B89C] rounded-full"></div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          >
            <HandDrawn className="bg-[#88B9B0] p-3 mr-4 rounded-full">
              <Camera className="text-white" size={24} />
            </HandDrawn>
          </motion.div>
          <div className="flex flex-col">
            <h1 className="font-quicksand font-bold text-2xl md:text-3xl text-[#9C7178]">Our Date Gallery</h1>
            {partner && (
              <Badge 
                variant="secondary" 
                className="bg-[#9C7178]/10 text-[#9C7178] border-[#9C7178]/20 w-fit mt-1"
              >
                <Heart className="w-3 h-3 mr-1" />
                Shared with {partner.displayName}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserAccountMenu />
          <HandDrawn>
            <Button 
              className="bg-[#9C7178] hover:bg-opacity-90 text-white font-quicksand"
              onClick={onCreateCollection}
            >
              <Plus className="mr-2 h-4 w-4" /> New Date
            </Button>
          </HandDrawn>
        </div>
      </nav>

      {/* Hero section */}
      <div className="container mx-auto px-4 pt-6 pb-6 text-center relative">
        <h2 className="font-quicksand font-bold text-3xl md:text-4xl lg:text-5xl mb-4 text-[#4A4A4A]">
          {partner ? `Our Journey Together` : `Your Memory Collection`}
        </h2>
        <p className="text-lg max-w-2xl mx-auto mb-8">
          {partner 
            ? `Relive your special moments with photos, stories, and memories from each date you've shared with ${partner.displayName}.`
            : `Capture and organize your precious memories. Invite someone special to share your journey together.`
          }
        </p>
      </div>
    </header>
  );
}
