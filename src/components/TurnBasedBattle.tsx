import React, { useState, useCallback, useMemo } from 'react';
import { TerminalButton } from './TerminalButton';
import { ASCIIDivider } from './ASCIIElements';
import { cn } from '@/lib/utils';

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface RoverCombatStats {
  name: string;
  identifier: string;
  totalPower: number;
  maxHealth: number;
  currentHealth: number;
  baseAttack: number;
  baseDefense: number;
  isDefending: boolean;
  traits: Array<{
    trait_type: string;
    value: string;
    power: number;
  }>;
}

type ActionType = 'aggressive' | 'defensive' | 'trait';
type TraitAbility = 'critical_strike' | 'heal' | 'power_surge' | 'shield_bash';

interface BattleLogEntry {
  round: number;
  turn: 'player' | 'enemy';
  action: string;
  damage?: number;
  healing?: number;
  description: string;
}

interface TurnBasedBattleProps {
  playerRover: NFT;
  enemyRover: NFT;
  playerTotalPower: number;
  enemyTotalPower: number;
  onBattleEnd: (winner: 'player' | 'enemy' | 'draw', log: BattleLogEntry[]) => void;
  onReset: () => void;
}

const BASE_HEALTH = 100;
const BASE_ATTACK = 15;
const BASE_DEFENSE = 5;
const MAX_ROUNDS = 3;
const UNDERDOG_LUCK_BONUS = 0.15; // 15% crit chance bonus for underdogs

const TRAIT_ABILITIES: { name: TraitAbility; label: string; description: string }[] = [
  { name: 'critical_strike', label: 'CRITICAL STRIKE', description: '+50% damage' },
  { name: 'heal', label: 'EMERGENCY REPAIR', description: 'Recover 20-30 HP' },
  { name: 'power_surge', label: 'POWER SURGE', description: '+30% next attack' },
  { name: 'shield_bash', label: 'SHIELD BASH', description: 'Attack + Defend' },
];

const BATTLE_DESCRIPTIONS = {
  aggressive: [
    "charges forward with relentless fury",
    "unleashes a devastating assault",
    "strikes with overwhelming force",
    "launches an all-out offensive",
  ],
  defensive: [
    "raises shields and braces for impact",
    "activates defensive protocols",
    "hunkers down behind reinforced plating",
    "engages evasive maneuvers",
  ],
  critical_strike: [
    "targets a critical weak point",
    "executes a precision strike",
    "delivers a devastating blow to vital systems",
  ],
  heal: [
    "activates emergency repair protocols",
    "initiates self-repair sequence",
    "deploys nanobots for rapid healing",
  ],
  power_surge: [
    "overcharges power cores",
    "channels excess energy",
    "activates overdrive mode",
  ],
  shield_bash: [
    "combines defense with a counter-strike",
    "deflects and retaliates simultaneously",
    "uses shield as a battering weapon",
  ],
  damage_taken: [
    "takes a heavy hit",
    "absorbs significant damage",
    "staggers from the impact",
    "systems rattle from the blow",
  ],
  damage_reduced: [
    "absorbs most of the impact",
    "deflects the brunt of the attack",
    "shrugs off the damage",
  ],
};

const getRandomDescription = (type: keyof typeof BATTLE_DESCRIPTIONS): string => {
  const descriptions = BATTLE_DESCRIPTIONS[type];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

export const TurnBasedBattle: React.FC<TurnBasedBattleProps> = ({
  playerRover,
  enemyRover,
  playerTotalPower,
  enemyTotalPower,
  onBattleEnd,
  onReset,
}) => {
  // Calculate underdog bonus (the rover with less power gets benefits)
  const powerDifference = Math.abs(playerTotalPower - enemyTotalPower);
  const playerIsUnderdog = playerTotalPower < enemyTotalPower;
  const enemyIsUnderdog = enemyTotalPower < playerTotalPower;
  
  // Underdog gets bonus luck (higher crit chance) based on power gap
  const underdogLuckBonus = Math.min(powerDifference / 200, UNDERDOG_LUCK_BONUS);
  const playerLuckBonus = playerIsUnderdog ? underdogLuckBonus : 0;
  const enemyLuckBonus = enemyIsUnderdog ? underdogLuckBonus : 0;

  // Initialize combat stats with reduced power scaling
  const initializeStats = useCallback((rover: NFT, totalPower: number, opponentPower: number): RoverCombatStats => {
    // Reduced stat scaling - power matters less
    const maxHealth = BASE_HEALTH + Math.round(totalPower / 8); // Was /5
    const baseAttack = BASE_ATTACK + Math.round(totalPower / 15); // Was /10
    const baseDefense = BASE_DEFENSE + Math.round(totalPower / 25); // Was /20
    
    return {
      name: rover.name,
      identifier: rover.identifier,
      totalPower,
      maxHealth,
      currentHealth: maxHealth,
      baseAttack,
      baseDefense,
      isDefending: false,
      traits: rover.traits?.map(t => ({
        trait_type: t.trait_type,
        value: t.value,
        power: Math.round(totalPower / (rover.traits?.length || 1)),
      })) || [],
    };
  }, []);

  const [playerStats, setPlayerStats] = useState<RoverCombatStats>(() => 
    initializeStats(playerRover, playerTotalPower, enemyTotalPower)
  );
  const [enemyStats, setEnemyStats] = useState<RoverCombatStats>(() => 
    initializeStats(enemyRover, enemyTotalPower, playerTotalPower)
  );
  const [currentRound, setCurrentRound] = useState(1);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [selectedAbility, setSelectedAbility] = useState<TraitAbility | null>(null);
  const [powerSurgeActive, setPowerSurgeActive] = useState(false);
  const [enemyPowerSurgeActive, setEnemyPowerSurgeActive] = useState(false);

  const addLogEntry = useCallback((entry: Omit<BattleLogEntry, 'round'>) => {
    setBattleLog(prev => [...prev, { ...entry, round: currentRound }]);
  }, [currentRound]);

  const calculateDamage = useCallback((
    attacker: RoverCombatStats,
    defender: RoverCombatStats,
    isAggressive: boolean,
    multiplier: number = 1,
    luckBonus: number = 0
  ): { damage: number; isLuckyStrike: boolean } => {
    let damage = attacker.baseAttack;
    let isLuckyStrike = false;
    
    // Lucky strike check (underdog bonus + base 5% chance)
    const luckyChance = 0.05 + luckBonus;
    if (Math.random() < luckyChance) {
      isLuckyStrike = true;
      damage *= 1.75; // Lucky strikes do 75% more damage
    }
    
    // Aggressive attack bonus
    if (isAggressive) {
      damage *= 1.2;
    }
    
    // Apply multiplier (critical strike, power surge)
    damage *= multiplier;
    
    // Defense reduction (only if not aggressive and defender is defending)
    if (!isAggressive && defender.isDefending) {
      damage = Math.max(1, damage - defender.baseDefense * 2);
    } else if (defender.isDefending) {
      damage = Math.max(1, damage - defender.baseDefense);
    }
    
    // Increased randomness for more unpredictable battles
    damage *= (0.8 + Math.random() * 0.4); // ±20% variance (was ±10%)
    
    return { damage: Math.round(damage), isLuckyStrike };
  }, []);

  const checkBattleEnd = useCallback((
    pStats: RoverCombatStats,
    eStats: RoverCombatStats,
    round: number
  ): 'player' | 'enemy' | 'draw' | null => {
    if (pStats.currentHealth <= 0) return 'enemy';
    if (eStats.currentHealth <= 0) return 'player';
    if (round > MAX_ROUNDS) {
      if (pStats.currentHealth > eStats.currentHealth) return 'player';
      if (eStats.currentHealth > pStats.currentHealth) return 'enemy';
      return 'draw';
    }
    return null;
  }, []);

  const executePlayerAction = useCallback((action: ActionType, ability?: TraitAbility) => {
    if (!isPlayerTurn || isProcessing || battleEnded) return;
    
    setIsProcessing(true);
    
    let newPlayerStats = { ...playerStats, isDefending: false };
    let newEnemyStats = { ...enemyStats };
    let description = '';
    let damage = 0;
    let healing = 0;
    let actionName = '';

    switch (action) {
      case 'aggressive': {
        let multiplier = powerSurgeActive ? 1.3 : 1;
        const result = calculateDamage(playerStats, enemyStats, true, multiplier, playerLuckBonus);
        damage = result.damage;
        newEnemyStats.currentHealth = Math.max(0, newEnemyStats.currentHealth - damage);
        actionName = powerSurgeActive ? 'POWER SURGE + AGGRESSIVE ATTACK' : 'AGGRESSIVE ATTACK';
        const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
        description = `${playerRover.name} ${getRandomDescription('aggressive')}! Deals ${damage} damage${powerSurgeActive ? ' (Power Surge!)' : ''}${luckyText} ${enemyRover.name} ${getRandomDescription('damage_taken')}.`;
        setPowerSurgeActive(false);
        break;
      }
      case 'defensive': {
        newPlayerStats.isDefending = true;
        actionName = 'DEFENSIVE MANEUVER';
        description = `${playerRover.name} ${getRandomDescription('defensive')}. Defense doubled for this turn!`;
        break;
      }
      case 'trait': {
        const usedAbility = ability || selectedAbility || 'critical_strike';
        
        switch (usedAbility) {
          case 'critical_strike': {
            const result = calculateDamage(playerStats, enemyStats, true, 1.5, playerLuckBonus);
            damage = result.damage;
            newEnemyStats.currentHealth = Math.max(0, newEnemyStats.currentHealth - damage);
            actionName = 'CRITICAL STRIKE';
            const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
            description = `${playerRover.name} ${getRandomDescription('critical_strike')}! Critical hit for ${damage} damage!${luckyText}`;
            break;
          }
          case 'heal': {
            healing = 20 + Math.round(Math.random() * 10);
            newPlayerStats.currentHealth = Math.min(
              newPlayerStats.maxHealth,
              newPlayerStats.currentHealth + healing
            );
            actionName = 'EMERGENCY REPAIR';
            description = `${playerRover.name} ${getRandomDescription('heal')}! Recovered ${healing} HP!`;
            break;
          }
          case 'power_surge': {
            setPowerSurgeActive(true);
            actionName = 'POWER SURGE';
            description = `${playerRover.name} ${getRandomDescription('power_surge')}! Next attack will deal +30% damage!`;
            break;
          }
          case 'shield_bash': {
            newPlayerStats.isDefending = true;
            const result = calculateDamage(playerStats, enemyStats, false, 0.7, playerLuckBonus);
            damage = result.damage;
            newEnemyStats.currentHealth = Math.max(0, newEnemyStats.currentHealth - damage);
            actionName = 'SHIELD BASH';
            const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
            description = `${playerRover.name} ${getRandomDescription('shield_bash')}! Deals ${damage} damage while defending!${luckyText}`;
            break;
          }
        }
        break;
      }
    }

    addLogEntry({
      turn: 'player',
      action: actionName,
      damage: damage || undefined,
      healing: healing || undefined,
      description,
    });

    setPlayerStats(newPlayerStats);
    setEnemyStats(newEnemyStats);
    setSelectedAbility(null);

    // Check for battle end
    const result = checkBattleEnd(newPlayerStats, newEnemyStats, currentRound);
    if (result) {
      setBattleEnded(true);
      setTimeout(() => {
        setIsProcessing(false);
        onBattleEnd(result, battleLog);
      }, 1500);
      return;
    }

    // Enemy turn
    setTimeout(() => {
      executeEnemyAction(newPlayerStats, newEnemyStats);
    }, 1500);
  }, [
    isPlayerTurn, isProcessing, battleEnded, playerStats, enemyStats, 
    playerRover, enemyRover, powerSurgeActive, selectedAbility,
    calculateDamage, addLogEntry, checkBattleEnd, currentRound, battleLog, onBattleEnd
  ]);

  const executeEnemyAction = useCallback((currentPlayerStats: RoverCombatStats, currentEnemyStats: RoverCombatStats) => {
    setIsPlayerTurn(false);
    
    let newPlayerStats = { ...currentPlayerStats };
    let newEnemyStats = { ...currentEnemyStats, isDefending: false };
    let description = '';
    let damage = 0;
    let healing = 0;
    let actionName = '';

    // Enemy AI decision
    const healthPercent = currentEnemyStats.currentHealth / currentEnemyStats.maxHealth;
    const random = Math.random();
    
    let action: ActionType = 'aggressive';
    let ability: TraitAbility | null = null;

    // Strategic AI based on health and randomness
    if (healthPercent < 0.3 && random < 0.6) {
      // Low health - likely to heal or defend
      action = 'trait';
      ability = 'heal';
    } else if (healthPercent < 0.5 && random < 0.3) {
      action = 'defensive';
    } else if (random < 0.15) {
      // Sometimes use special abilities
      action = 'trait';
      ability = ['critical_strike', 'power_surge', 'shield_bash'][Math.floor(Math.random() * 3)] as TraitAbility;
    } else if (random < 0.35) {
      action = 'defensive';
    } else {
      action = 'aggressive';
    }

    switch (action) {
      case 'aggressive': {
        let multiplier = enemyPowerSurgeActive ? 1.3 : 1;
        const result = calculateDamage(currentEnemyStats, currentPlayerStats, true, multiplier, enemyLuckBonus);
        damage = result.damage;
        newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - damage);
        actionName = enemyPowerSurgeActive ? 'POWER SURGE + AGGRESSIVE ATTACK' : 'AGGRESSIVE ATTACK';
        const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
        description = `${enemyRover.name} ${getRandomDescription('aggressive')}! Deals ${damage} damage${enemyPowerSurgeActive ? ' (Power Surge!)' : ''}${luckyText} ${playerRover.name} ${currentPlayerStats.isDefending ? getRandomDescription('damage_reduced') : getRandomDescription('damage_taken')}.`;
        setEnemyPowerSurgeActive(false);
        break;
      }
      case 'defensive': {
        newEnemyStats.isDefending = true;
        actionName = 'DEFENSIVE MANEUVER';
        description = `${enemyRover.name} ${getRandomDescription('defensive')}. Defense doubled for this turn!`;
        break;
      }
      case 'trait': {
        switch (ability) {
          case 'critical_strike': {
            const result = calculateDamage(currentEnemyStats, currentPlayerStats, true, 1.5, enemyLuckBonus);
            damage = result.damage;
            newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - damage);
            actionName = 'CRITICAL STRIKE';
            const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
            description = `${enemyRover.name} ${getRandomDescription('critical_strike')}! Critical hit for ${damage} damage!${luckyText}`;
            break;
          }
          case 'heal': {
            healing = 20 + Math.round(Math.random() * 10);
            newEnemyStats.currentHealth = Math.min(
              newEnemyStats.maxHealth,
              newEnemyStats.currentHealth + healing
            );
            actionName = 'EMERGENCY REPAIR';
            description = `${enemyRover.name} ${getRandomDescription('heal')}! Recovered ${healing} HP!`;
            break;
          }
          case 'power_surge': {
            setEnemyPowerSurgeActive(true);
            actionName = 'POWER SURGE';
            description = `${enemyRover.name} ${getRandomDescription('power_surge')}! Next attack will deal +30% damage!`;
            break;
          }
          case 'shield_bash': {
            newEnemyStats.isDefending = true;
            const result = calculateDamage(currentEnemyStats, currentPlayerStats, false, 0.7, enemyLuckBonus);
            damage = result.damage;
            newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - damage);
            actionName = 'SHIELD BASH';
            const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
            description = `${enemyRover.name} ${getRandomDescription('shield_bash')}! Deals ${damage} damage while defending!${luckyText}`;
            break;
          }
          default: {
            // Fallback to aggressive
            const result = calculateDamage(currentEnemyStats, currentPlayerStats, true, 1, enemyLuckBonus);
            damage = result.damage;
            newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - damage);
            actionName = 'AGGRESSIVE ATTACK';
            const luckyText = result.isLuckyStrike ? ' ⚡ LUCKY STRIKE!' : '';
            description = `${enemyRover.name} ${getRandomDescription('aggressive')}! Deals ${damage} damage!${luckyText}`;
          }
        }
        break;
      }
    }

    addLogEntry({
      turn: 'enemy',
      action: actionName,
      damage: damage || undefined,
      healing: healing || undefined,
      description,
    });

    setPlayerStats(newPlayerStats);
    setEnemyStats(newEnemyStats);

    // Check for battle end
    const nextRound = currentRound + 1;
    const result = checkBattleEnd(newPlayerStats, newEnemyStats, nextRound);
    
    if (result) {
      setBattleEnded(true);
      setTimeout(() => {
        setIsProcessing(false);
        onBattleEnd(result, [...battleLog, {
          round: currentRound,
          turn: 'enemy',
          action: actionName,
          damage: damage || undefined,
          healing: healing || undefined,
          description,
        }]);
      }, 1500);
      return;
    }

    // Next round
    setTimeout(() => {
      if (nextRound <= MAX_ROUNDS) {
        setCurrentRound(nextRound);
      }
      setIsPlayerTurn(true);
      setIsProcessing(false);
    }, 1000);
  }, [
    enemyRover, playerRover, enemyPowerSurgeActive, calculateDamage,
    addLogEntry, checkBattleEnd, currentRound, battleLog, onBattleEnd
  ]);

  const healthBarColor = (percent: number): string => {
    if (percent > 0.6) return 'bg-green-500';
    if (percent > 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const RoverBattleCard: React.FC<{
    stats: RoverCombatStats;
    rover: NFT;
    isPlayer: boolean;
  }> = ({ stats, rover, isPlayer }) => {
    const healthPercent = stats.currentHealth / stats.maxHealth;
    
    return (
      <div className={cn(
        "border p-3 sm:p-4 flex-1",
        isPlayer ? "border-primary/50" : "border-destructive/50",
        stats.isDefending && "ring-2 ring-blue-400/50"
      )}>
        <div className="text-center mb-3">
          <div className={cn(
            "font-terminal text-sm",
            isPlayer ? "text-primary" : "text-destructive"
          )}>
            {isPlayer ? 'YOUR ROVER' : 'ENEMY ROVER'}
          </div>
          <div className="text-foreground font-terminal text-lg">{stats.name}</div>
          {stats.isDefending && (
            <div className="text-blue-400 font-terminal text-xs animate-pulse">🛡 DEFENDING</div>
          )}
        </div>
        
        {/* Rover Image */}
        <div className="relative aspect-square w-full max-w-[200px] mx-auto border border-primary/30 overflow-hidden mb-3">
          {rover.image_url?.endsWith('.mp4') ? (
            <video src={rover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={rover.image_url} alt={rover.name} className="w-full h-full object-cover" />
          )}
        </div>
        
        {/* Health Bar */}
        <div className="mb-3">
          <div className="flex justify-between font-terminal text-xs mb-1">
            <span className="text-muted-foreground">HP</span>
            <span className="text-foreground">{stats.currentHealth}/{stats.maxHealth}</span>
          </div>
          <div className="h-4 bg-muted/30 border border-primary/30 overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", healthBarColor(healthPercent))}
              style={{ width: `${healthPercent * 100}%` }}
            />
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center font-terminal text-xs">
          <div className="border border-primary/20 p-2">
            <div className="text-muted-foreground">POWER</div>
            <div className="text-primary">{stats.totalPower}</div>
          </div>
          <div className="border border-primary/20 p-2">
            <div className="text-muted-foreground">ATK</div>
            <div className="text-primary">{stats.baseAttack}</div>
          </div>
          <div className="border border-primary/20 p-2">
            <div className="text-muted-foreground">DEF</div>
            <div className="text-primary">{stats.baseDefense}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Round Indicator */}
      <div className="text-center">
        <div className="inline-block border border-primary px-4 py-2 bg-primary/10">
          <span className="font-terminal text-primary text-glow text-lg">
            ROUND {currentRound}/{MAX_ROUNDS}
          </span>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <RoverBattleCard stats={playerStats} rover={playerRover} isPlayer={true} />
        
        <div className="flex items-center justify-center">
          <span className="text-primary text-glow font-terminal text-2xl">⚔</span>
        </div>
        
        <RoverBattleCard stats={enemyStats} rover={enemyRover} isPlayer={false} />
      </div>

      {/* Turn Indicator */}
      <div className="text-center">
        <span className={cn(
          "font-terminal text-sm px-3 py-1 border",
          isPlayerTurn 
            ? "text-primary border-primary bg-primary/10" 
            : "text-destructive border-destructive bg-destructive/10"
        )}>
          {battleEnded 
            ? "BATTLE ENDED" 
            : isPlayerTurn 
              ? "YOUR TURN - CHOOSE ACTION" 
              : "ENEMY TURN..."
          }
        </span>
        {powerSurgeActive && isPlayerTurn && (
          <div className="text-yellow-400 font-terminal text-xs mt-1 animate-pulse">
            ⚡ POWER SURGE ACTIVE - +30% NEXT ATTACK
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isPlayerTurn && !isProcessing && !battleEnded && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TerminalButton
              onClick={() => executePlayerAction('aggressive')}
              variant="primary"
              className="w-full"
            >
              <div className="flex flex-col items-center">
                <span>⚔ AGGRESSIVE ATTACK</span>
                <span className="text-xs text-muted-foreground">+20% damage, ignores defense</span>
              </div>
            </TerminalButton>
            
            <TerminalButton
              onClick={() => executePlayerAction('defensive')}
              variant="secondary"
              className="w-full"
            >
              <div className="flex flex-col items-center">
                <span>🛡 DEFENSIVE MANEUVER</span>
                <span className="text-xs text-muted-foreground">2x defense this turn</span>
              </div>
            </TerminalButton>
            
            <div className="relative">
              <TerminalButton
                onClick={() => setSelectedAbility(selectedAbility ? null : 'critical_strike')}
                variant={selectedAbility ? 'primary' : 'secondary'}
                className="w-full"
              >
                <div className="flex flex-col items-center">
                  <span>✨ USE SPECIAL TRAIT</span>
                  <span className="text-xs text-muted-foreground">Special abilities</span>
                </div>
              </TerminalButton>
            </div>
          </div>

          {/* Trait Abilities */}
          {selectedAbility !== null && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-primary/30 p-3 bg-primary/5">
              {TRAIT_ABILITIES.map(ability => (
                <TerminalButton
                  key={ability.name}
                  onClick={() => executePlayerAction('trait', ability.name)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  <div className="flex flex-col items-center text-xs">
                    <span>{ability.label}</span>
                    <span className="text-muted-foreground">{ability.description}</span>
                  </div>
                </TerminalButton>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center py-4">
          <span className="font-terminal text-primary animate-pulse">Processing...</span>
        </div>
      )}

      <ASCIIDivider />

      {/* Battle Log */}
      <div className="border border-primary/30 p-3 bg-background/50 max-h-[300px] overflow-y-auto">
        <div className="text-primary font-terminal text-sm mb-2">{">"} BATTLE LOG</div>
        {battleLog.length === 0 ? (
          <div className="text-muted-foreground font-terminal text-xs">
            Waiting for first action...
          </div>
        ) : (
          <div className="space-y-2">
            {battleLog.map((entry, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "font-terminal text-xs p-2 border-l-2",
                  entry.turn === 'player' 
                    ? "border-l-primary bg-primary/5" 
                    : "border-l-destructive bg-destructive/5"
                )}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className={cn(
                    "font-bold",
                    entry.turn === 'player' ? "text-primary" : "text-destructive"
                  )}>
                    [R{entry.round}] {entry.action}
                  </span>
                  {entry.damage && (
                    <span className="text-destructive">-{entry.damage} HP</span>
                  )}
                  {entry.healing && (
                    <span className="text-green-500">+{entry.healing} HP</span>
                  )}
                </div>
                <div className="text-foreground/80 mt-1">{entry.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset Button */}
      <div className="text-center">
        <TerminalButton onClick={onReset} variant="secondary" size="sm">
          ABORT BATTLE
        </TerminalButton>
      </div>
    </div>
  );
};
