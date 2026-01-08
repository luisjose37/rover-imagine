import React, { useState } from 'react';
import { InventoryItem, Item, RARITY_COLORS } from '@/types/game';
import { ItemCard } from './ItemCard';
import { TerminalButton } from './TerminalButton';
import { cn } from '@/lib/utils';

interface InventoryProps {
  inventory: InventoryItem[];
  coins: number;
  onEquipItem?: (inventoryId: string, item: Item) => void;
  selectedRoverTokenId?: string;
}

type FilterType = 'all' | 'weapon' | 'armor' | 'accessory' | 'consumable';

export const Inventory: React.FC<InventoryProps> = ({
  inventory,
  coins,
  onEquipItem,
  selectedRoverTokenId
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filteredInventory = inventory.filter(inv => 
    filter === 'all' || inv.item?.item_type === filter
  );

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'ALL' },
    { type: 'weapon', label: '⚔ WEAPONS' },
    { type: 'armor', label: '🛡 ARMOR' },
    { type: 'accessory', label: '✨ ACCESSORIES' }
  ];

  return (
    <div className="border border-primary/30 p-4 font-terminal">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-primary text-glow text-sm">
          {">"} INVENTORY
        </div>
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <span>💰</span>
          <span>{coins} COINS</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterButtons.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              'px-2 py-1 text-xs border transition-all',
              filter === type
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-primary/30 text-muted-foreground hover:border-primary/60'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {filteredInventory.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 text-sm">
          [NO ITEMS IN INVENTORY]
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {filteredInventory.map(inv => (
            inv.item && (
              <ItemCard
                key={inv.id}
                item={inv.item}
                quantity={inv.quantity}
                onClick={() => setSelectedItem(inv)}
                selected={selectedItem?.id === inv.id}
              />
            )
          ))}
        </div>
      )}

      {/* Selected Item Actions */}
      {selectedItem && selectedItem.item && (
        <div className="mt-4 pt-4 border-t border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <span className={cn('text-sm', RARITY_COLORS[selectedItem.item.rarity])}>
                {selectedItem.item.name}
              </span>
              <span className="text-muted-foreground text-xs ml-2">
                ({selectedItem.item.item_type})
              </span>
            </div>
            {onEquipItem && selectedRoverTokenId && selectedItem.item.item_type !== 'consumable' && (
              <TerminalButton
                onClick={() => onEquipItem(selectedItem.id, selectedItem.item!)}
                variant="primary"
                className="text-xs"
              >
                EQUIP TO ROVER
              </TerminalButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
