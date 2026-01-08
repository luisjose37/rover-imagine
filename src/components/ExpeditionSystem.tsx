import React, { useState, useEffect, useRef } from 'react';
import { Expedition, ExpeditionRun, Item, NFT, DIFFICULTY_COLORS, RARITY_COLORS, ExpeditionLogEntry } from '@/types/game';
import { RoverMedia } from './RoverMedia';
import { TerminalButton } from './TerminalButton';
import { ASCIILoader } from './ASCIIElements';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ExpeditionSystemProps {
  expeditions: Expedition[];
  activeExpeditions: ExpeditionRun[];
  items: Item[];
  coins: number;
  selectedRover: NFT | null;
  roverRarityScore: number;
  onStartExpedition: (expeditionId: string, roverTokenId: string, roverName: string, rarityScore: number) => Promise<ExpeditionRun | null>;
  onAddLog: (runId: string, entry: ExpeditionLogEntry) => Promise<void>;
  onCompleteExpedition: (runId: string, success: boolean, rewardItemId?: string, rewardCoins?: number) => Promise<ExpeditionRun | null>;
}

// Narrative messages for expeditions
const EXPEDITION_NARRATIVES: Record<string, string[]> = {
  exploring: [
    "{rover} scans the horizon with enhanced sensors...",
    "{rover} navigates through the debris field...",
    "{rover} detects unusual energy signatures ahead...",
    "{rover} proceeds cautiously into unknown territory...",
  ],
  danger: [
    "WARNING: Hostile activity detected!",
    "ALERT: Environmental hazards ahead!",
    "DANGER: Unstable ground detected!",
    "CAUTION: Radiation levels rising!",
  ],
  success: [
    "{rover} found something valuable!",
    "{rover} discovered a hidden cache!",
    "{rover} successfully navigated the obstacle!",
    "{rover} secured the objective!",
  ],
  failure: [
    "{rover} was forced to retreat...",
    "{rover} encountered overwhelming odds...",
    "{rover} lost track in the chaos...",
    "{rover} barely escaped intact...",
  ]
};

const getRandomNarrative = (type: keyof typeof EXPEDITION_NARRATIVES, roverName: string): string => {
  const narratives = EXPEDITION_NARRATIVES[type];
  const narrative = narratives[Math.floor(Math.random() * narratives.length)];
  return narrative.replace('{rover}', roverName);
};

export const ExpeditionSystem: React.FC<ExpeditionSystemProps> = ({
  expeditions,
  activeExpeditions,
  items,
  coins,
  selectedRover,
  roverRarityScore,
  onStartExpedition,
  onAddLog,
  onCompleteExpedition
}) => {
  const { toast } = useToast();
  const [selectedExpedition, setSelectedExpedition] = useState<Expedition | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const timerRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Calculate success chance based on rarity and difficulty
  const getSuccessChance = (difficulty: Expedition['difficulty'], rarityScore: number): number => {
    const baseDifficulty: Record<Expedition['difficulty'], number> = {
      easy: 85,
      medium: 65,
      hard: 45,
      extreme: 25
    };
    
    // Rarity bonus: higher rarity = better luck for rare items
    const rarityBonus = Math.min(rarityScore / 5, 15);
    return Math.min(baseDifficulty[difficulty] + rarityBonus, 95);
  };

  // Get item rarity chance based on rover rarity
  const getItemRarityChance = (rarityScore: number): Item['rarity'] => {
    const roll = Math.random() * 100;
    const rarityBonus = rarityScore / 2; // Higher rarity rovers get better items
    
    if (roll < 5 + rarityBonus / 2) return 'legendary';
    if (roll < 15 + rarityBonus) return 'epic';
    if (roll < 35 + rarityBonus * 1.5) return 'rare';
    if (roll < 60 + rarityBonus * 2) return 'uncommon';
    return 'common';
  };

  // Run expedition simulation
  const runExpeditionSimulation = async (run: ExpeditionRun) => {
    const expedition = run.expedition;
    if (!expedition) return;

    const durationMs = expedition.duration_minutes * 60 * 1000;
    const steps = 4;
    const stepDuration = durationMs / steps;

    // Generate log entries over time
    for (let i = 0; i < steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      
      const isLastStep = i === steps - 1;
      const roll = Math.random() * 100;
      const successChance = getSuccessChance(expedition.difficulty, run.rover_rarity_score);
      
      if (isLastStep) {
        // Final step - determine outcome
        const success = roll < successChance;
        
        if (success) {
          // Calculate rewards
          const targetRarity = getItemRarityChance(run.rover_rarity_score);
          const eligibleItems = items.filter(item => item.rarity === targetRarity);
          const rewardItem = eligibleItems.length > 0 
            ? eligibleItems[Math.floor(Math.random() * eligibleItems.length)]
            : null;
          
          const rewardCoins = Math.floor(
            expedition.coin_reward_min + 
            Math.random() * (expedition.coin_reward_max - expedition.coin_reward_min)
          );

          await onAddLog(run.id, {
            timestamp: Date.now(),
            message: getRandomNarrative('success', run.rover_name),
            type: 'success'
          });

          if (rewardItem) {
            await onAddLog(run.id, {
              timestamp: Date.now(),
              message: `REWARD: ${rewardItem.name} acquired!`,
              type: 'reward'
            });
          }

          await onAddLog(run.id, {
            timestamp: Date.now(),
            message: `REWARD: ${rewardCoins} coins earned!`,
            type: 'reward'
          });

          await onCompleteExpedition(run.id, true, rewardItem?.id, rewardCoins);
          
          toast({
            title: "EXPEDITION COMPLETE",
            description: `${run.rover_name} returned with rewards!`
          });
        } else {
          await onAddLog(run.id, {
            timestamp: Date.now(),
            message: getRandomNarrative('failure', run.rover_name),
            type: 'danger'
          });
          
          await onCompleteExpedition(run.id, false);
          
          toast({
            title: "EXPEDITION FAILED",
            description: `${run.rover_name} couldn't complete the mission.`,
            variant: "destructive"
          });
        }
      } else if (roll < 30) {
        // Danger event
        await onAddLog(run.id, {
          timestamp: Date.now(),
          message: getRandomNarrative('danger', run.rover_name),
          type: 'danger'
        });
      } else {
        // Normal exploration
        await onAddLog(run.id, {
          timestamp: Date.now(),
          message: getRandomNarrative('exploring', run.rover_name),
          type: 'info'
        });
      }
    }
  };

  // Start expedition
  const handleStartExpedition = async () => {
    if (!selectedExpedition || !selectedRover) return;
    
    setIsStarting(true);
    try {
      const run = await onStartExpedition(
        selectedExpedition.id,
        selectedRover.identifier,
        selectedRover.name,
        roverRarityScore
      );
      
      if (run) {
        toast({
          title: "EXPEDITION STARTED",
          description: `${selectedRover.name} deployed to ${selectedExpedition.name}`
        });
        
        // Start simulation in background
        runExpeditionSimulation(run);
      }
      
      setSelectedExpedition(null);
    } catch (error) {
      console.error('Failed to start expedition:', error);
    } finally {
      setIsStarting(false);
    }
  };

  // Check if rover is already on expedition
  const isRoverOnExpedition = (tokenId: string): boolean => {
    return activeExpeditions.some(run => run.rover_token_id === tokenId);
  };

  return (
    <div className="border border-primary/30 p-4 font-terminal">
      <div className="flex items-center justify-between mb-4">
        <div className="text-primary text-glow text-sm">
          {">"} EXPEDITIONS
        </div>
        <div className="text-yellow-400 text-sm">
          💰 {coins} COINS
        </div>
      </div>

      {/* Active Expeditions */}
      {activeExpeditions.length > 0 && (
        <div className="mb-6">
          <div className="text-primary text-xs mb-3">─[ ACTIVE MISSIONS ]─</div>
          <div className="space-y-3">
            {activeExpeditions.map(run => (
              <div key={run.id} className="border border-primary/50 p-3 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-primary">{run.rover_name}</span>
                  <span className={cn('text-xs', run.expedition && DIFFICULTY_COLORS[run.expedition.difficulty])}>
                    {run.expedition?.name}
                  </span>
                </div>
                
                {/* Progress indicator */}
                <div className="h-1 bg-muted rounded overflow-hidden mb-2">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '50%' }} />
                </div>
                
                {/* Log entries */}
                <div className="space-y-1 max-h-24 overflow-y-auto text-xs">
                  {run.log_entries?.slice(-3).map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        entry.type === 'danger' && 'text-red-400',
                        entry.type === 'success' && 'text-green-400',
                        entry.type === 'reward' && 'text-yellow-400',
                        entry.type === 'info' && 'text-muted-foreground'
                      )}
                    >
                      {">"} {entry.message}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Expeditions */}
      <div>
        <div className="text-primary text-xs mb-3">─[ AVAILABLE MISSIONS ]─</div>
        
        {!selectedRover ? (
          <div className="text-muted-foreground text-center py-4 text-sm">
            [SELECT A ROVER IN ARSENAL TO START EXPEDITIONS]
          </div>
        ) : isRoverOnExpedition(selectedRover.identifier) ? (
          <div className="text-yellow-400 text-center py-4 text-sm">
            [ROVER ALREADY ON EXPEDITION]
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expeditions.map(exp => (
              <div 
                key={exp.id}
                onClick={() => setSelectedExpedition(exp)}
                className={cn(
                  'border p-3 cursor-pointer transition-all',
                  selectedExpedition?.id === exp.id
                    ? 'border-primary bg-primary/20'
                    : 'border-primary/30 hover:border-primary/60'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-primary text-sm">{exp.name}</span>
                  <span className={cn('text-xs uppercase', DIFFICULTY_COLORS[exp.difficulty])}>
                    [{exp.difficulty}]
                  </span>
                </div>
                
                <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                  {exp.description}
                </p>
                
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    ⏱ {exp.duration_minutes}m
                  </span>
                  <span className="text-yellow-400">
                    💰 {exp.coin_reward_min}-{exp.coin_reward_max}
                  </span>
                </div>
                
                {selectedRover && (
                  <div className="mt-2 text-xs text-green-400">
                    Success: ~{getSuccessChance(exp.difficulty, roverRarityScore)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Start Button */}
        {selectedExpedition && selectedRover && !isRoverOnExpedition(selectedRover.identifier) && (
          <div className="mt-4 pt-4 border-t border-primary/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-primary text-sm">{selectedExpedition.name}</div>
                <div className="text-muted-foreground text-xs">
                  with {selectedRover.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 text-sm">
                  {getSuccessChance(selectedExpedition.difficulty, roverRarityScore)}% Success
                </div>
                <div className="text-muted-foreground text-xs">
                  Rarity Score: {roverRarityScore}
                </div>
              </div>
            </div>
            
            <TerminalButton
              onClick={handleStartExpedition}
              disabled={isStarting}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isStarting ? 'DEPLOYING...' : '🚀 DEPLOY ON EXPEDITION'}
            </TerminalButton>
          </div>
        )}
      </div>
    </div>
  );
};
