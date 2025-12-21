import React from 'react';
import { cn } from '@/lib/utils';

interface Trait {
  trait_type: string;
  value: string;
}

interface TraitDisplayProps {
  traits: Trait[];
  className?: string;
}

export const TraitDisplay: React.FC<TraitDisplayProps> = ({ traits, className }) => {
  if (!traits || traits.length === 0) {
    return (
      <div className={cn("text-muted-foreground font-terminal", className)}>
        NO TRAIT DATA AVAILABLE
      </div>
    );
  }

  return (
    <div className={cn("space-y-1 font-terminal flex flex-col items-center w-full", className)}>
      <div className="text-primary text-glow text-xs sm:text-sm mb-2 hidden sm:block">
        ┌─[ ROVER SPECIFICATIONS ]─────────────────┐
      </div>
      <div className="text-primary text-glow text-xs mb-2 sm:hidden">
        ─[ ROVER SPECS ]─
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full max-w-xl">
        {traits.map((trait, index) => (
          <div key={index} className="flex items-start gap-1 sm:gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground hidden sm:inline">├─</span>
            <span className="text-muted-foreground sm:hidden">•</span>
            <span className="text-muted-foreground uppercase truncate">
              {trait.trait_type}:
            </span>
            <span className="text-primary text-glow truncate">
              {trait.value}
            </span>
          </div>
        ))}
      </div>
      
      <div className="text-primary text-glow text-xs sm:text-sm mt-2 hidden sm:block">
        └──────────────────────────────────────────┘
      </div>
    </div>
  );
};
