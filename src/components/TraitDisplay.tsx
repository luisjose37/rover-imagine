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
      <div className={cn("text-muted-foreground font-win95 text-[11px]", className)}>
        No trait data available
      </div>
    );
  }

  return (
    <div className={cn("font-win95 w-full", className)}>
      <div className="win95-groupbox relative">
        <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">
          Rover Specifications
        </span>
        <table className="w-full text-[11px]">
          <tbody>
            {traits.map((trait, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-white/30" : ""}>
                <td className="px-2 py-0.5 text-muted-foreground font-bold">{trait.trait_type}</td>
                <td className="px-2 py-0.5 text-foreground">{trait.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
