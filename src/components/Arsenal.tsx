import React, { useState, useEffect, useCallback } from 'react';
import { NFT, RoverEquipment, Item, RARITY_COLORS } from '@/types/game';
import { RoverMedia } from './RoverMedia';
import { TerminalButton } from './TerminalButton';
import { TerminalInput } from './TerminalInput';
import { ASCIILoader } from './ASCIIElements';
import { ItemCard } from './ItemCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Sword, Shield, Sparkles } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ArsenalProps {
  onSelectRover?: (rover: NFT, equipment: RoverEquipment[]) => void;
  inventory: Array<{ id: string; item_id: string; quantity: number; item?: Item }>;
  onEquipItem: (roverTokenId: string, inventoryId: string, slot: 'weapon' | 'armor' | 'accessory') => Promise<boolean>;
  onUnequipItem: (equipmentId: string) => Promise<void>;
}

interface LoadedRover extends NFT {
  equipment: RoverEquipment[];
  rarityScore: number;
}

// Calculate rarity score from traits (higher = rarer)
const calculateRarityScore = (traits: Array<{ trait_type: string; value: string }>): number => {
  if (!traits || traits.length === 0) return 0;
  
  // Simple hash-based rarity calculation (matches backend logic)
  let totalRarity = 0;
  traits.forEach(trait => {
    const hash = (trait.trait_type + trait.value).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const rarity = 100 - (Math.abs(hash % 29) + 1);
    totalRarity += rarity;
  });
  
  return Math.round(totalRarity / traits.length);
};

const SlotIcon: Record<string, React.ReactNode> = {
  weapon: <Sword className="w-4 h-4" />,
  armor: <Shield className="w-4 h-4" />,
  accessory: <Sparkles className="w-4 h-4" />
};

export const Arsenal: React.FC<ArsenalProps> = ({
  onSelectRover,
  inventory,
  onEquipItem,
  onUnequipItem
}) => {
  const [tokenId, setTokenId] = useState('');
  const [rover, setRover] = useState<LoadedRover | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState<'weapon' | 'armor' | 'accessory' | null>(null);

  // Fetch rover from OpenSea
  const fetchRover = async () => {
    if (!tokenId.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId.trim() })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Fetch equipment for this rover
      const { data: equipmentData } = await supabase
        .from('rover_equipment')
        .select('*, item:items(*)')
        .eq('rover_token_id', data.identifier);
      
      const loadedRover: LoadedRover = {
        ...data,
        equipment: (equipmentData as RoverEquipment[]) || [],
        rarityScore: calculateRarityScore(data.traits || [])
      };
      
      setRover(loadedRover);
    } catch (error) {
      console.error('Error fetching rover:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh equipment after changes
  const refreshEquipment = useCallback(async () => {
    if (!rover) return;
    
    const { data: equipmentData } = await supabase
      .from('rover_equipment')
      .select('*, item:items(*)')
      .eq('rover_token_id', rover.identifier);
    
    setRover(prev => prev ? {
      ...prev,
      equipment: (equipmentData as RoverEquipment[]) || []
    } : null);
  }, [rover]);

  const handleEquip = async (inventoryId: string) => {
    if (!rover || !showEquipModal) return;
    
    const success = await onEquipItem(rover.identifier, inventoryId, showEquipModal);
    if (success) {
      await refreshEquipment();
      setShowEquipModal(null);
    }
  };

  const handleUnequip = async (equipmentId: string) => {
    await onUnequipItem(equipmentId);
    await refreshEquipment();
  };

  // Get equipped item for a slot
  const getEquippedItem = (slot: 'weapon' | 'armor' | 'accessory'): RoverEquipment | undefined => {
    return rover?.equipment.find(e => e.slot === slot);
  };

  // Calculate total stats from equipment
  const getEquipmentStats = () => {
    if (!rover) return { power: 0, defense: 0, luck: 0 };
    
    return rover.equipment.reduce((stats, eq) => {
      if (eq.item) {
        stats.power += eq.item.power_bonus;
        stats.defense += eq.item.defense_bonus;
        stats.luck += eq.item.luck_bonus;
      }
      return stats;
    }, { power: 0, defense: 0, luck: 0 });
  };

  const equipmentStats = getEquipmentStats();

  // Filter inventory by slot type
  const getInventoryForSlot = (slot: 'weapon' | 'armor' | 'accessory') => {
    return inventory.filter(inv => inv.item?.item_type === slot);
  };

  return (
    <div className="border border-primary/30 p-4 font-terminal">
      <div className="text-primary text-glow text-sm mb-4">
        {">"} ARSENAL - ROVER EQUIPMENT
      </div>

      {/* Rover Selection */}
      {!rover && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <TerminalInput
              label="TOKEN ID"
              value={tokenId}
              onChange={setTokenId}
              placeholder="Enter rover token ID"
              onSubmit={fetchRover}
              disabled={isLoading}
            />
            <TerminalButton 
              onClick={fetchRover} 
              disabled={isLoading || !tokenId.trim()}
              variant="primary"
              className="sm:self-end"
            >
              {isLoading ? 'LOADING...' : 'LOAD ROVER'}
            </TerminalButton>
          </div>
          
          {isLoading && <ASCIILoader text="LOCATING ROVER" />}
        </div>
      )}

      {/* Loaded Rover Display */}
      {rover && (
        <div className="space-y-4">
          {/* Rover Info */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Rover Media */}
            <div className="w-full md:w-48 aspect-square border border-primary/50 overflow-hidden flex-shrink-0">
              <RoverMedia
                imageUrl={rover.image_url}
                name={rover.name}
              />
            </div>

            {/* Rover Details */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-primary text-glow text-lg">{rover.name}</div>
                <div className="text-muted-foreground text-xs">TOKEN #{rover.identifier}</div>
              </div>

              {/* Rarity Score */}
              <div className="border border-primary/30 p-2 inline-block">
                <div className="text-xs text-muted-foreground">RARITY SCORE</div>
                <div className="text-primary text-glow text-xl">{rover.rarityScore}</div>
              </div>

              {/* Equipment Stats */}
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">GEAR PWR: </span>
                  <span className="text-red-400">+{equipmentStats.power}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DEF: </span>
                  <span className="text-blue-400">+{equipmentStats.defense}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">LUCK: </span>
                  <span className="text-yellow-400">+{equipmentStats.luck}</span>
                </div>
              </div>

              <TerminalButton onClick={() => setRover(null)} variant="secondary" className="text-xs">
                CHANGE ROVER
              </TerminalButton>
            </div>
          </div>

          {/* Equipment Slots */}
          <div className="border-t border-primary/30 pt-4">
            <div className="text-primary text-xs mb-3">─[ EQUIPMENT SLOTS ]─</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['weapon', 'armor', 'accessory'] as const).map(slot => {
                const equipped = getEquippedItem(slot);
                const slotInventory = getInventoryForSlot(slot);
                
                return (
                  <div key={slot} className="border border-primary/30 p-3">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground uppercase">
                      {SlotIcon[slot]}
                      <span>{slot}</span>
                    </div>
                    
                    {equipped && equipped.item ? (
                      <div className="space-y-2">
                        <div className={cn('text-sm', RARITY_COLORS[equipped.item.rarity])}>
                          {equipped.item.name}
                        </div>
                        <div className="flex flex-wrap gap-1 text-xs">
                          {equipped.item.power_bonus > 0 && (
                            <span className="text-red-400">+{equipped.item.power_bonus} PWR</span>
                          )}
                          {equipped.item.defense_bonus > 0 && (
                            <span className="text-blue-400">+{equipped.item.defense_bonus} DEF</span>
                          )}
                          {equipped.item.luck_bonus > 0 && (
                            <span className="text-yellow-400">+{equipped.item.luck_bonus} LCK</span>
                          )}
                        </div>
                        <TerminalButton 
                          onClick={() => handleUnequip(equipped.id)}
                          variant="secondary"
                          className="text-xs w-full"
                        >
                          UNEQUIP
                        </TerminalButton>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-xs">[EMPTY]</div>
                        <TerminalButton 
                          onClick={() => setShowEquipModal(slot)}
                          variant="primary"
                          className="text-xs w-full"
                          disabled={slotInventory.length === 0}
                        >
                          {slotInventory.length > 0 ? 'EQUIP' : 'NO ITEMS'}
                        </TerminalButton>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Select for Battle/Expedition */}
          {onSelectRover && (
            <div className="pt-4 border-t border-primary/30">
              <TerminalButton 
                onClick={() => onSelectRover(rover, rover.equipment)}
                variant="primary"
                size="lg"
                className="w-full"
              >
                SELECT FOR MISSION
              </TerminalButton>
            </div>
          )}
        </div>
      )}

      {/* Equip Modal */}
      {showEquipModal && rover && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="border border-primary bg-background p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="text-primary text-glow text-sm mb-4">
              {">"} SELECT {showEquipModal.toUpperCase()} TO EQUIP
            </div>
            
            <div className="space-y-2 mb-4">
              {getInventoryForSlot(showEquipModal).map(inv => (
                inv.item && (
                  <ItemCard
                    key={inv.id}
                    item={inv.item}
                    quantity={inv.quantity}
                    onClick={() => handleEquip(inv.id)}
                    compact
                  />
                )
              ))}
            </div>
            
            <TerminalButton 
              onClick={() => setShowEquipModal(null)}
              variant="secondary"
              className="w-full"
            >
              CANCEL
            </TerminalButton>
          </div>
        </div>
      )}
    </div>
  );
};
