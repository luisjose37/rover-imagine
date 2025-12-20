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
      <div className={cn("text-muted-foreground font-mono text-center", className)}>
        No trait data available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="text-primary font-mono text-sm mb-3 uppercase tracking-wider">
        Rover Specifications
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl">
        {traits.map((trait, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2 bg-secondary/50 rounded px-3 py-2"
          >
            <span className="text-muted-foreground text-sm font-mono">
              {trait.trait_type}:
            </span>
            <span className="text-foreground font-medium">
              {trait.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};