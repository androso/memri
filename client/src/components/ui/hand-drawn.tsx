import React from "react";
import { cn } from "@/lib/utils";

interface HandDrawnProps {
  children: React.ReactNode;
  className?: string;
}

export function HandDrawn({ children, className }: HandDrawnProps) {
  return (
    <div 
      className={cn(
        "hand-drawn overflow-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
