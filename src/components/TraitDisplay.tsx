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
    <div className={cn("space-y-1 font-terminal flex flex-col items-center", className)}>
      <div className="text-primary text-glow text-sm mb-2">
        ┌─[ ROVER SPECIFICATIONS ]─────────────────┐
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {traits.map((trait, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-muted-foreground">├─</span>
            <span className="text-muted-foreground uppercase text-sm">
              {trait.trait_type}:
            </span>
            <span className="text-primary text-glow">
              {trait.value}
            </span>
          </div>
        ))}
      </div>
      
      <div className="text-primary text-glow text-sm mt-2">
        └──────────────────────────────────────────┘
      </div>
    </div>
  );
};
