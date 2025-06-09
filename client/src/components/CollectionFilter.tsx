import { HandDrawn } from "@/components/ui/hand-drawn";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SimplifiedFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: string;
  onSortChange: (order: string) => void;
}

export default function SimplifiedFilter({
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange
}: SimplifiedFilterProps) {
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h2 className="font-quicksand font-bold text-2xl text-[#4A4A4A]">Our Dates</h2>
      </div>
      
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="relative min-w-[200px] flex-grow md:flex-grow-0">
          <HandDrawn>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-[#E6B89C]" size={16} />
              <Input 
                type="text" 
                placeholder="Search our moments..." 
                className="pl-10 pr-4 py-2 bg-white border border-[#E6B89C] font-lato"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </HandDrawn>
        </div>
        
        <div className="flex items-center">
          <span className="mr-2 text-[#4A4A4A]">Sort by:</span>
          <HandDrawn>
            <Select value={sortOrder} onValueChange={onSortChange}>
              <SelectTrigger className="min-w-[140px] bg-white border border-[#E6B89C] text-[#4A4A4A] font-lato">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Most Recent</SelectItem>
                <SelectItem value="oldest">First Dates</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </HandDrawn>
        </div>
      </div>
    </section>
  );
}
