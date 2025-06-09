import React from "react";

interface WatercolorOverlayProps {
  opacity?: number;
}

export function WatercolorOverlay({ opacity = 0.1 }: WatercolorOverlayProps) {
  return (
    <div 
      className="watercolor-overlay absolute top-0 left-0 w-full h-full bg-cover bg-center mix-blend-overlay pointer-events-none z-0"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1580106285538-132e4d39e035?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3")',
        opacity 
      }}
    />
  );
}
