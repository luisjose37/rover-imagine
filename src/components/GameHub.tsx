import React, { useState } from 'react';
import { useGameData } from '@/hooks/useGameData';
import { Arsenal } from './Arsenal';
import { Inventory } from './Inventory';
import { ExpeditionSystem } from './ExpeditionSystem';
import { NFT, RoverEquipment } from '@/types/game';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ASCIILoader } from './ASCIIElements';

export const GameHub: React.FC = () => {
  const {
    items,
    inventory,
    expeditions,
    activeExpeditions,
    coins,
    loading,
    equipItem,
    unequipItem,
    startExpedition,
    addExpeditionLog,
    completeExpedition
  } = useGameData();

  const [selectedRover, setSelectedRover] = useState<NFT | null>(null);
  const [roverEquipment, setRoverEquipment] = useState<RoverEquipment[]>([]);
  const [roverRarityScore, setRoverRarityScore] = useState(0);

  const handleSelectRover = (rover: NFT, equipment: RoverEquipment[]) => {
    setSelectedRover(rover);
    setRoverEquipment(equipment);
    
    // Calculate rarity score
    const score = rover.traits?.reduce((total, trait) => {
      const hash = (trait.trait_type + trait.value).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return total + (100 - (Math.abs(hash % 29) + 1));
    }, 0) || 0;
    
    setRoverRarityScore(Math.round(score / (rover.traits?.length || 1)));
  };

  if (loading) {
    return (
      <div className="p-8">
        <ASCIILoader text="LOADING GAME DATA" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="arsenal" className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-background border border-primary/30 mb-6">
          <TabsTrigger 
            value="arsenal" 
            className="font-terminal text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:text-glow"
          >
            ⚔ ARSENAL
          </TabsTrigger>
          <TabsTrigger 
            value="expeditions" 
            className="font-terminal text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:text-glow"
          >
            🚀 EXPEDITIONS
          </TabsTrigger>
          <TabsTrigger 
            value="inventory" 
            className="font-terminal text-xs sm:text-sm data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:text-glow"
          >
            📦 INVENTORY
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arsenal">
          <Arsenal
            onSelectRover={handleSelectRover}
            inventory={inventory}
            onEquipItem={equipItem}
            onUnequipItem={unequipItem}
          />
        </TabsContent>

        <TabsContent value="expeditions">
          <ExpeditionSystem
            expeditions={expeditions}
            activeExpeditions={activeExpeditions}
            items={items}
            coins={coins}
            selectedRover={selectedRover}
            roverRarityScore={roverRarityScore}
            onStartExpedition={startExpedition}
            onAddLog={addExpeditionLog}
            onCompleteExpedition={completeExpedition}
          />
        </TabsContent>

        <TabsContent value="inventory">
          <Inventory
            inventory={inventory}
            coins={coins}
            selectedRoverTokenId={selectedRover?.identifier}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Rover Display */}
      {selectedRover && (
        <div className="mt-4 border border-primary/30 p-3 font-terminal">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-primary/50 overflow-hidden">
              {selectedRover.image_url?.endsWith('.mp4') ? (
                <video src={selectedRover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={selectedRover.image_url} alt={selectedRover.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-primary text-sm">{selectedRover.name}</div>
              <div className="text-muted-foreground text-xs">Rarity: {roverRarityScore} | Gear Equipped: {roverEquipment.length}/3</div>
            </div>
            <button 
              onClick={() => setSelectedRover(null)}
              className="text-muted-foreground hover:text-primary text-xs"
            >
              [CLEAR]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
