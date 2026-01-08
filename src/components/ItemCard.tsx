import React from 'react';
import { Item, RARITY_COLORS } from '@/types/game';
import { cn } from '@/lib/utils';
import { Sword, Shield, Sparkles, Zap } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  quantity?: number;
  onClick?: () => void;
  selected?: boolean;
  compact?: boolean;
}

const ItemTypeIcon: Record<Item['item_type'], React.ReactNode> = {
  weapon: <Sword className="w-4 h-4" />,
  armor: <Shield className="w-4 h-4" />,
  accessory: <Sparkles className="w-4 h-4" />,
  consumable: <Zap className="w-4 h-4" />
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  quantity,
  onClick,
  selected,
  compact
}) => {
  const rarityColor = RARITY_COLORS[item.rarity];

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'border p-2 font-terminal text-xs cursor-pointer transition-all',
          selected 
            ? 'border-primary bg-primary/20' 
            : 'border-primary/30 hover:border-primary/60 bg-background',
          onClick && 'hover:bg-primary/10'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={rarityColor}>{ItemTypeIcon[item.item_type]}</span>
          <span className={cn('flex-1 truncate', rarityColor)}>{item.name}</span>
          {quantity && quantity > 1 && (
            <span className="text-muted-foreground">x{quantity}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'border p-3 font-terminal cursor-pointer transition-all',
        selected 
          ? 'border-primary bg-primary/20 border-glow' 
          : 'border-primary/30 hover:border-primary/60 bg-background',
        onClick && 'hover:bg-primary/10'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className={rarityColor}>{ItemTypeIcon[item.item_type]}</span>
        <span className={cn('flex-1 text-sm', rarityColor)}>{item.name}</span>
        {quantity && quantity > 1 && (
          <span className="text-muted-foreground text-xs">x{quantity}</span>
        )}
      </div>

      {/* Rarity Badge */}
      <div className={cn('text-[10px] uppercase mb-2', rarityColor)}>
        [{item.rarity}]
      </div>

      {/* Description */}
      {item.description && (
        <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
          {item.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-xs">
        {item.power_bonus > 0 && (
          <span className="text-red-400">+{item.power_bonus} PWR</span>
        )}
        {item.defense_bonus > 0 && (
          <span className="text-blue-400">+{item.defense_bonus} DEF</span>
        )}
        {item.luck_bonus > 0 && (
          <span className="text-yellow-400">+{item.luck_bonus} LCK</span>
        )}
      </div>
    </div>
  );
};
