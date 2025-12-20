import React from 'react';
import { cn } from '@/lib/utils';

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{ trait_type: string; value: string }>;
}

interface NFTCardProps {
  nft: NFT;
  isSelected: boolean;
  onSelect: () => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full text-left p-3 border transition-all duration-300",
        "font-terminal bg-background hover:bg-secondary/30",
        isSelected 
          ? "border-primary border-glow-strong" 
          : "border-primary/30 hover:border-primary/60"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-px -left-px -right-px h-1 bg-primary animate-pulse-glow" />
      )}
      
      <div className="flex gap-3">
        {/* NFT Image - ASCII style frame */}
        <div className="relative w-16 h-16 flex-shrink-0 border border-primary/50 overflow-hidden">
          {nft.image_url ? (
            <img 
              src={nft.image_url} 
              alt={nft.name}
              className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/50 text-xs">
              [NO IMG]
            </div>
          )}
          {/* Scanline effect on image */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        </div>
        
        {/* NFT Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">{">"}</span>
            <span className={cn(
              "text-lg truncate",
              isSelected ? "text-primary text-glow" : "text-primary/80"
            )}>
              {nft.name || `ROVER #${nft.identifier}`}
            </span>
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            ID: {nft.identifier}
          </div>
          {nft.traits && nft.traits.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {nft.traits.length} TRAITS DETECTED
            </div>
          )}
        </div>
        
        {/* Selection arrow */}
        <div className={cn(
          "flex items-center text-2xl transition-all",
          isSelected ? "text-primary text-glow" : "text-primary/30"
        )}>
          {isSelected ? "◄" : "○"}
        </div>
      </div>
    </button>
  );
};

interface NFTListProps {
  nfts: NFT[];
  selectedId: string | null;
  onSelect: (nft: NFT) => void;
  isLoading?: boolean;
}

export const NFTList: React.FC<NFTListProps> = ({ 
  nfts, 
  selectedId, 
  onSelect,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-primary font-terminal text-lg glow-pulse">
          SCANNING BLOCKCHAIN
        </div>
        <div className="text-muted-foreground font-terminal text-sm mt-2 loading-dots">
          FETCHING ROVERS
        </div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground font-terminal">
          NO ROVERS DETECTED IN COLLECTION
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
      <div className="text-muted-foreground font-terminal text-sm mb-3">
        {">"} {nfts.length} ROVERS DETECTED
      </div>
      {nfts.map((nft) => (
        <NFTCard
          key={nft.identifier}
          nft={nft}
          isSelected={selectedId === nft.identifier}
          onSelect={() => onSelect(nft)}
        />
      ))}
    </div>
  );
};
