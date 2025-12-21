import React, { useState, useEffect } from 'react';
import { ASCIILoader } from './ASCIIElements';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TOTAL_SUPPLY = 5000;

interface TraitEntry {
  traitType: string;
  value: string;
  count: number;
  rarity: number;
  power: number;
}

export const TraitLeaderboard: React.FC = () => {
  const [traits, setTraits] = useState<TraitEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [traitTypes, setTraitTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchTraits();
  }, []);

  const fetchTraits = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-collection-traits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      // Process traits into flat list with power calculations
      const allTraits: TraitEntry[] = [];
      const types: string[] = [];
      
      for (const [traitType, values] of Object.entries(data.traits as Record<string, Record<string, number>>)) {
        types.push(traitType);
        for (const [value, count] of Object.entries(values)) {
          const rarity = (count / TOTAL_SUPPLY) * 100;
          const power = Math.round(Math.max(0, 100 - rarity));
          allTraits.push({
            traitType,
            value,
            count,
            rarity: Math.round(rarity * 10) / 10,
            power
          });
        }
      }
      
      // Sort by power (highest first)
      allTraits.sort((a, b) => b.power - a.power);
      
      setTraits(allTraits);
      setTraitTypes(types.sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traits');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTraits = filter === 'all' 
    ? traits 
    : traits.filter(t => t.traitType === filter);

  const getPowerColor = (power: number) => {
    if (power >= 95) return 'text-yellow-400';
    if (power >= 90) return 'text-orange-400';
    if (power >= 80) return 'text-primary';
    if (power >= 60) return 'text-primary/70';
    return 'text-muted-foreground';
  };

  const getRarityLabel = (power: number) => {
    if (power >= 99) return 'LEGENDARY';
    if (power >= 95) return 'MYTHIC';
    if (power >= 90) return 'EPIC';
    if (power >= 80) return 'RARE';
    if (power >= 60) return 'UNCOMMON';
    return 'COMMON';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <ASCIILoader text="LOADING TRAIT DATABASE" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-destructive font-terminal">ERROR: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="text-primary font-terminal text-base md:text-lg mb-4 text-glow">
        {">"} TRAIT RARITY LEADERBOARD
      </div>
      
      <div className="text-muted-foreground font-terminal text-xs mb-4">
        Power = 100 - Rarity%. Rarer traits = Higher power.
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-background border border-primary/50 text-primary font-terminal text-sm px-3 py-2 focus:outline-none focus:border-primary"
        >
          <option value="all">ALL TRAIT TYPES ({traits.length})</option>
          {traitTypes.map(type => (
            <option key={type} value={type}>
              {type.toUpperCase()} ({traits.filter(t => t.traitType === type).length})
            </option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="border border-primary/30 p-3 text-center">
          <div className="text-muted-foreground font-terminal text-xs">TOTAL TRAITS</div>
          <div className="text-primary text-glow font-terminal text-xl">{filteredTraits.length}</div>
        </div>
        <div className="border border-yellow-400/30 p-3 text-center">
          <div className="text-muted-foreground font-terminal text-xs">LEGENDARY (99+)</div>
          <div className="text-yellow-400 font-terminal text-xl">{filteredTraits.filter(t => t.power >= 99).length}</div>
        </div>
        <div className="border border-orange-400/30 p-3 text-center">
          <div className="text-muted-foreground font-terminal text-xs">MYTHIC (95+)</div>
          <div className="text-orange-400 font-terminal text-xl">{filteredTraits.filter(t => t.power >= 95 && t.power < 99).length}</div>
        </div>
        <div className="border border-primary/30 p-3 text-center">
          <div className="text-muted-foreground font-terminal text-xs">EPIC (90+)</div>
          <div className="text-primary font-terminal text-xl">{filteredTraits.filter(t => t.power >= 90 && t.power < 95).length}</div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="border border-primary/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-primary/10 border-b border-primary/30">
                <th className="text-left text-primary font-terminal text-xs p-3">RANK</th>
                <th className="text-left text-primary font-terminal text-xs p-3">TRAIT TYPE</th>
                <th className="text-left text-primary font-terminal text-xs p-3">VALUE</th>
                <th className="text-right text-primary font-terminal text-xs p-3">COUNT</th>
                <th className="text-right text-primary font-terminal text-xs p-3">RARITY</th>
                <th className="text-right text-primary font-terminal text-xs p-3">POWER</th>
                <th className="text-center text-primary font-terminal text-xs p-3">TIER</th>
              </tr>
            </thead>
            <tbody>
              {filteredTraits.slice(0, 100).map((trait, idx) => (
                <tr 
                  key={`${trait.traitType}-${trait.value}`}
                  className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                >
                  <td className="text-muted-foreground font-terminal text-xs p-3">
                    #{idx + 1}
                  </td>
                  <td className="text-primary/70 font-terminal text-xs p-3 uppercase">
                    {trait.traitType}
                  </td>
                  <td className="text-foreground font-terminal text-xs p-3">
                    {trait.value}
                  </td>
                  <td className="text-muted-foreground font-terminal text-xs p-3 text-right">
                    {trait.count}/{TOTAL_SUPPLY}
                  </td>
                  <td className="text-muted-foreground font-terminal text-xs p-3 text-right">
                    {trait.rarity}%
                  </td>
                  <td className={`font-terminal text-sm p-3 text-right font-bold ${getPowerColor(trait.power)}`}>
                    {trait.power}
                  </td>
                  <td className={`font-terminal text-xs p-3 text-center ${getPowerColor(trait.power)}`}>
                    {getRarityLabel(trait.power)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTraits.length > 100 && (
          <div className="text-center text-muted-foreground font-terminal text-xs p-3 border-t border-primary/30">
            Showing top 100 of {filteredTraits.length} traits
          </div>
        )}
      </div>
    </div>
  );
};
