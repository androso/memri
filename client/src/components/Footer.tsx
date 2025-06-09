import { HandDrawn } from "@/components/ui/hand-drawn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { FaInstagram, FaTwitter, FaPinterest, FaFacebookF } from "react-icons/fa";
import { WatercolorOverlay } from "@/components/ui/watercolor-overlay";

export default function Footer() {
  return (
    <footer className="bg-[#88B9B0] bg-opacity-20 py-12 relative mt-10">
      <WatercolorOverlay opacity={0.1} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-6 md:mb-0">
            <HandDrawn className="bg-[#88B9B0] p-3 mr-4 rounded-full">
              <Camera className="text-white" size={24} />
            </HandDrawn>
            <h2 className="font-quicksand font-bold text-2xl text-[#9C7178]">Ghibli Memories</h2>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
              <FaInstagram size={24} />
            </a>
            <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
              <FaTwitter size={24} />
            </a>
            <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
              <FaPinterest size={24} />
            </a>
            <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
              <FaFacebookF size={24} />
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-quicksand font-semibold text-lg mb-4 text-[#4A4A4A]">About</h3>
            <p className="text-[#4A4A4A] text-sm">
              Ghibli Memories is a whimsical photo album application inspired by the magical aesthetics of Studio Ghibli. Create and share your own enchanted collections.
            </p>
          </div>
          <div>
            <h3 className="font-quicksand font-semibold text-lg mb-4 text-[#4A4A4A]">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
                  My Collections
                </a>
              </li>
              <li>
                <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
                  Explore
                </a>
              </li>
              <li>
                <a href="#" className="text-[#4A4A4A] hover:text-[#9C7178] transition-colors duration-300">
                  Help
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-quicksand font-semibold text-lg mb-4 text-[#4A4A4A]">Newsletter</h3>
            <p className="text-[#4A4A4A] text-sm mb-4">Stay updated with new features and inspiration.</p>
            <form className="flex">
              <HandDrawn className="flex-grow">
                <Input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 bg-white border border-[#88B9B0] rounded-l-lg font-lato focus:outline-none flex-grow"
                />
              </HandDrawn>
              <HandDrawn>
                <Button className="bg-[#88B9B0] hover:bg-opacity-90 text-white rounded-l-none font-quicksand">
                  Subscribe
                </Button>
              </HandDrawn>
            </form>
          </div>
        </div>
        
        <div className="border-t border-[#88B9B0] border-opacity-20 pt-6 text-center text-sm text-[#4A4A4A]">
          <p>© 2023 Ghibli Memories. All rights reserved. Inspired by Studio Ghibli.</p>
        </div>
      </div>
    </footer>
  );
}
