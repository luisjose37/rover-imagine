import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalWindow } from './TerminalWindow';
import { TerminalButton } from './TerminalButton';
import { TerminalInput } from './TerminalInput';
import { ASCIILoader, ASCIIDivider } from './ASCIIElements';
import { cn } from '@/lib/utils';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
}
interface TraitWithRarity {
  trait_type: string;
  value: string;
  rarity: number;
  power: number;
}
interface RoverStats {
  name: string;
  identifier: string;
  totalPower: number;
  traits: TraitWithRarity[];
  dominantTrait: TraitWithRarity | null;
}
interface BattleResult {
  battleLog: string;
  rover1Stats: RoverStats;
  rover2Stats: RoverStats;
  winner: string;
  winnerId: string;
}
export const BattleSimulator: React.FC = () => {
  const {
    toast
  } = useToast();
  const [tokenId1, setTokenId1] = useState('');
  const [tokenId2, setTokenId2] = useState('');
  const [rover1, setRover1] = useState<NFT | null>(null);
  const [rover2, setRover2] = useState<NFT | null>(null);
  const [isLoadingRover1, setIsLoadingRover1] = useState(false);
  const [isLoadingRover2, setIsLoadingRover2] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const fetchRover = async (tokenId: string, setRover: (nft: NFT | null) => void, setLoading: (loading: boolean) => void) => {
    if (!tokenId.trim()) {
      toast({
        title: "INPUT REQUIRED",
        description: "Please enter a token ID",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokenId: tokenId.trim()
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setRover(data);
      toast({
        title: "ROVER LOCATED",
        description: `${data.name} loaded with ${data.traits?.length || 0} traits`
      });
    } catch (error) {
      console.error('Error fetching NFT:', error);
      toast({
        title: "SCAN FAILED",
        description: error instanceof Error ? error.message : "Failed to locate rover",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const simulateBattle = useCallback(async () => {
    if (!rover1 || !rover2) return;
    setIsSimulating(true);
    setBattleResult(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/simulate-battle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rover1: {
            identifier: rover1.identifier,
            name: rover1.name,
            traits: rover1.traits
          },
          rover2: {
            identifier: rover2.identifier,
            name: rover2.name,
            traits: rover2.traits
          }
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setBattleResult(data);
      toast({
        title: "BATTLE COMPLETE",
        description: `${data.winner} wins!`
      });
    } catch (error) {
      console.error('Error simulating battle:', error);
      toast({
        title: "SIMULATION FAILED",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsSimulating(false);
    }
  }, [rover1, rover2, toast]);
  const resetBattle = () => {
    setTokenId1('');
    setTokenId2('');
    setRover1(null);
    setRover2(null);
    setBattleResult(null);
  };

  const generateRandomTokenId = () => {
    return Math.floor(Math.random() * 5555) + 1;
  };

  // Calculate power score for a rover (EXACT same logic as backend)
  const calculatePowerScore = (traits: Array<{ trait_type: string; value: string }>) => {
    let totalPower = 0;
    traits.forEach(trait => {
      // Must match backend hash exactly - uses trait_type not trait.trait_type in string
      const hash = (trait.trait_type + trait.value).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a; // Backend uses bitwise AND
      }, 0);
      const rarity = Math.abs(hash % 29) + 1; // Backend uses % 29, not % 30
      const power = Math.round((30 - rarity) * 3.33); // Backend formula
      totalPower += power;
    });
    return totalPower;
  };

  // Check if rover is in top 5% power tier (threshold: ~600+ power)
  const isTopTierPower = (traits: Array<{ trait_type: string; value: string }> | undefined) => {
    if (!traits) return false;
    const power = calculatePowerScore(traits);
    return power >= 600;
  };
  const RoverCard: React.FC<{
    rover: NFT | null;
    stats: RoverStats | null;
    isWinner: boolean;
    side: 'left' | 'right';
  }> = ({
    rover,
    stats,
    isWinner,
    side
  }) => {
    if (!rover) return null;
    return <div className={cn("flex-1 border p-3 sm:p-4", isWinner ? "border-primary border-glow-strong bg-primary/10" : "border-primary/30")}>
        {/* Winner Badge */}
        {isWinner && <div className="text-center mb-2">
            <span className="text-primary text-glow font-terminal text-xs sm:text-sm animate-pulse">
              ★ WINNER ★
            </span>
          </div>}

        {/* Rover Image */}
        <div className="relative aspect-square w-full max-w-[350px] sm:max-w-[437px] mx-auto border border-primary/50 overflow-hidden mb-3">
          {rover.image_url ? rover.image_url.endsWith('.mp4') ? <video src={rover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover.image_url} alt={rover.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary/50 text-xs font-terminal">
              [NO IMG]
            </div>}
        </div>

        {/* Rover Name */}
        <div className="text-center mb-3">
          <div className="text-primary text-glow font-terminal text-sm sm:text-lg">
            {rover.name}
          </div>
          <div className="text-muted-foreground font-terminal text-xs">
            TOKEN #{rover.identifier}
          </div>
          {isTopTierPower(rover.traits) && (
            <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5 mt-1">
              <span className="text-primary text-glow font-terminal text-xs animate-pulse">★ TOP 5% POWER ★</span>
            </div>
          )}
        </div>

        {/* Power Score */}
        {stats && <div className="text-center mb-3">
            <div className="text-muted-foreground font-terminal text-xs mb-1">TOTAL POWER</div>
            <div className={cn("font-terminal text-xl sm:text-2xl", isWinner ? "text-primary text-glow" : "text-muted-foreground")}>
              {stats.totalPower}
            </div>
          </div>}

        {/* Traits with Rarity */}
        {stats && <div className="space-y-1">
            <div className="text-primary font-terminal text-xs mb-2 text-center">
              ─[ TRAITS ({stats.traits.length}) ]─
            </div>
            {stats.traits.map((trait, idx) => <div key={idx} className={cn("flex items-center justify-between text-xs font-terminal p-1 border", trait === stats.dominantTrait ? "border-primary bg-primary/20" : "border-primary/20")}>
                <div className="flex-1 min-w-0">
                  <div className="text-muted-foreground truncate">{trait.trait_type}</div>
                  <div className="text-primary truncate">{trait.value}</div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-muted-foreground">{trait.rarity}%</div>
                  <div className={cn(trait === stats.dominantTrait ? "text-primary text-glow" : "text-foreground")}>
                    {trait.power} PWR
                  </div>
                </div>
              </div>)}
          </div>}
      </div>;
  };
  return <div className="p-4 md:p-6">
      {/* Rover Input Section */}
      {!rover1 || !rover2 ? <div className="space-y-6">
          <div className="text-primary font-terminal text-base md:text-lg text-glow text-center">
            {">"} SELECT TWO ROVERS FOR BATTLE
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start">
            {/* Rover 1 Input */}
            <div className="border border-primary/30 p-4">
              <div className="text-primary font-terminal text-sm mb-3 text-center">ROVER 1</div>
              {rover1 ? <div className="text-center">
                  <div className="relative aspect-square w-full max-w-[262px] mx-auto border border-primary overflow-hidden mb-3">
                    {rover1.image_url?.endsWith('.mp4') ? <video src={rover1.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover1.image_url} alt={rover1.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-primary text-glow font-terminal text-lg">{rover1.name}</div>
                  <div className="text-muted-foreground font-terminal text-xs mb-1">TOKEN #{rover1.identifier}</div>
                  {isTopTierPower(rover1.traits) && (
                    <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5 mb-2">
                      <span className="text-primary text-glow font-terminal text-xs animate-pulse">★ TOP 5% POWER ★</span>
                    </div>
                  )}
                  {/* Trait List */}
                  {rover1.traits && rover1.traits.length > 0 && <div className="text-left mt-3 space-y-1">
                      <div className="text-primary font-terminal text-xs mb-2 text-center">─[ TRAITS ({rover1.traits.length}) ]─</div>
                      {rover1.traits.map((trait, idx) => <div key={idx} className="flex justify-between text-xs font-terminal border border-primary/20 p-1">
                          <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                          <span className="text-primary truncate ml-2">{trait.value}</span>
                        </div>)}
                    </div>}
                </div> : <div className="flex flex-col gap-3">
                  <TerminalInput label="TOKEN ID" value={tokenId1} onChange={setTokenId1} placeholder="e.g., 1234" onSubmit={() => fetchRover(tokenId1, setRover1, setIsLoadingRover1)} disabled={isLoadingRover1} />
                  <div className="flex gap-2">
                    <TerminalButton onClick={() => fetchRover(tokenId1, setRover1, setIsLoadingRover1)} disabled={isLoadingRover1 || !tokenId1.trim()} variant="primary" className="flex-1">
                      {isLoadingRover1 ? 'SCANNING...' : 'LOCATE'}
                    </TerminalButton>
                    <TerminalButton onClick={() => setTokenId1(String(generateRandomTokenId()))} disabled={isLoadingRover1} variant="secondary" className="whitespace-nowrap">
                      🎲 RANDOM
                    </TerminalButton>
                  </div>
                </div>}
            </div>

            {/* VS Divider */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-primary text-glow font-terminal text-2xl">VS</span>
            </div>

            {/* Rover 2 Input */}
            <div className="border border-primary/30 p-4">
              <div className="text-primary font-terminal text-sm mb-3 text-center">ROVER 2</div>
              {rover2 ? <div className="text-center">
                  <div className="relative aspect-square w-full max-w-[262px] mx-auto border border-primary overflow-hidden mb-3">
                    {rover2.image_url?.endsWith('.mp4') ? <video src={rover2.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover2.image_url} alt={rover2.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-primary text-glow font-terminal text-lg">{rover2.name}</div>
                  <div className="text-muted-foreground font-terminal text-xs mb-1">TOKEN #{rover2.identifier}</div>
                  {isTopTierPower(rover2.traits) && (
                    <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5 mb-2">
                      <span className="text-primary text-glow font-terminal text-xs animate-pulse">★ TOP 5% POWER ★</span>
                    </div>
                  )}
                  {/* Trait List */}
                  {rover2.traits && rover2.traits.length > 0 && <div className="text-left mt-3 space-y-1">
                      <div className="text-primary font-terminal text-xs mb-2 text-center">─[ TRAITS ({rover2.traits.length}) ]─</div>
                      {rover2.traits.map((trait, idx) => <div key={idx} className="flex justify-between text-xs font-terminal border border-primary/20 p-1">
                          <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                          <span className="text-primary truncate ml-2">{trait.value}</span>
                        </div>)}
                    </div>}
                </div> : <div className="flex flex-col gap-3">
                  <TerminalInput label="TOKEN ID" value={tokenId2} onChange={setTokenId2} placeholder="e.g., 5678" onSubmit={() => fetchRover(tokenId2, setRover2, setIsLoadingRover2)} disabled={isLoadingRover2} />
                  <div className="flex gap-2">
                    <TerminalButton onClick={() => fetchRover(tokenId2, setRover2, setIsLoadingRover2)} disabled={isLoadingRover2 || !tokenId2.trim()} variant="primary" className="flex-1">
                      {isLoadingRover2 ? 'SCANNING...' : 'LOCATE'}
                    </TerminalButton>
                    <TerminalButton onClick={() => setTokenId2(String(generateRandomTokenId()))} disabled={isLoadingRover2} variant="secondary" className="whitespace-nowrap">
                      🎲 RANDOM
                    </TerminalButton>
                  </div>
                </div>}
            </div>
          </div>

          {/* Mobile VS */}
          <div className="md:hidden text-center text-primary text-glow font-terminal text-xl">VS</div>

          {/* Battle Button */}
          {rover1 && rover2 && <div className="text-center">
              <TerminalButton onClick={simulateBattle} disabled={isSimulating} variant="primary" size="lg">
                {isSimulating ? 'SIMULATING...' : '⚔ START BATTLE ⚔'}
              </TerminalButton>
            </div>}
        </div> : null}

      {/* Loading State */}
      {isSimulating && <div className="py-8">
          <ASCIILoader text="SIMULATING BATTLE" />
        </div>}

      {/* Battle Results */}
      {battleResult && !isSimulating && <div className="space-y-6">
          <div className="text-primary font-terminal text-base md:text-lg text-glow text-center">
            {">"} BATTLE RESULTS
          </div>

          {/* Rovers Side by Side */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <RoverCard rover={rover1} stats={battleResult.rover1Stats} isWinner={battleResult.winnerId === rover1?.identifier} side="left" />
            
            <div className="hidden md:flex items-center justify-center px-4">
              <span className="text-primary text-glow font-terminal text-xl">VS</span>
            </div>
            <div className="md:hidden text-center text-primary text-glow font-terminal text-lg py-2">VS</div>

            <RoverCard rover={rover2} stats={battleResult.rover2Stats} isWinner={battleResult.winnerId === rover2?.identifier} side="right" />
          </div>

          <ASCIIDivider />

          {/* Battle Log */}
          <div className="border border-primary/50 p-4 bg-primary/5">
            <div className="text-primary font-terminal text-sm mb-3 text-glow">
              {">"} BATTLE LOG
            </div>
            <pre className="text-foreground font-terminal text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
              {battleResult.battleLog}
            </pre>
          </div>

          {/* Winner Announcement */}
          <div className="text-center border border-primary p-4 bg-primary/10">
            <div className="text-muted-foreground font-terminal text-xs mb-1">VICTOR</div>
            <div className="text-primary text-glow font-terminal text-xl sm:text-2xl animate-pulse">
              {battleResult.winner}
            </div>
            <div className="text-muted-foreground font-terminal text-xs mt-2">
              Dominant Trait: {battleResult.winnerId === rover1?.identifier ? `${battleResult.rover1Stats.dominantTrait?.trait_type}: ${battleResult.rover1Stats.dominantTrait?.value}` : `${battleResult.rover2Stats.dominantTrait?.trait_type}: ${battleResult.rover2Stats.dominantTrait?.value}`}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <TerminalButton onClick={simulateBattle} variant="primary">
              REMATCH
            </TerminalButton>
            <TerminalButton onClick={resetBattle} variant="secondary">
              NEW BATTLE
            </TerminalButton>
          </div>
        </div>}

      {/* Both Rovers Selected but no battle yet */}
      {rover1 && rover2 && !battleResult && !isSimulating && <div className="space-y-6">
          <div className="text-primary font-terminal text-base md:text-lg text-glow text-center">
            {">"} ROVERS READY FOR BATTLE
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 border border-primary/30 p-4 text-center">
              <div className="relative aspect-square w-full max-w-[350px] mx-auto border border-primary overflow-hidden mb-3">
                {rover1.image_url?.endsWith('.mp4') ? <video src={rover1.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover1.image_url} alt={rover1.name} className="w-full h-full object-cover" />}
              </div>
              <div className="text-primary text-glow font-terminal text-lg">{rover1.name}</div>
              {isTopTierPower(rover1.traits) && (
                <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5 mt-1">
                  <span className="text-primary text-glow font-terminal text-xs animate-pulse">★ TOP 5% POWER ★</span>
                </div>
              )}
              {rover1.traits && rover1.traits.length > 0 && <div className="text-left mt-3 space-y-1">
                  <div className="text-primary font-terminal text-xs mb-2 text-center">─[ TRAITS ({rover1.traits.length}) ]─</div>
                  {rover1.traits.map((trait, idx) => <div key={idx} className="flex justify-between text-xs font-terminal border border-primary/20 p-1">
                      <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                      <span className="text-primary truncate ml-2">{trait.value}</span>
                    </div>)}
                </div>}
            </div>

            <div className="flex items-center justify-center px-4">
              <span className="text-primary text-glow font-terminal text-2xl">VS</span>
            </div>

            <div className="flex-1 border border-primary/30 p-4 text-center">
              <div className="relative aspect-square w-full max-w-[350px] mx-auto border border-primary overflow-hidden mb-3">
                {rover2.image_url?.endsWith('.mp4') ? <video src={rover2.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover2.image_url} alt={rover2.name} className="w-full h-full object-cover" />}
              </div>
              <div className="text-primary text-glow font-terminal text-lg">{rover2.name}</div>
              {isTopTierPower(rover2.traits) && (
                <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5 mt-1">
                  <span className="text-primary text-glow font-terminal text-xs animate-pulse">★ TOP 5% POWER ★</span>
                </div>
              )}
              {rover2.traits && rover2.traits.length > 0 && <div className="text-left mt-3 space-y-1">
                  <div className="text-primary font-terminal text-xs mb-2 text-center">─[ TRAITS ({rover2.traits.length}) ]─</div>
                  {rover2.traits.map((trait, idx) => <div key={idx} className="flex justify-between text-xs font-terminal border border-primary/20 p-1">
                      <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                      <span className="text-primary truncate ml-2">{trait.value}</span>
                    </div>)}
                </div>}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <TerminalButton onClick={simulateBattle} variant="primary" size="lg">
              ⚔ START BATTLE ⚔
            </TerminalButton>
            <TerminalButton onClick={resetBattle} variant="secondary">
              RESET
            </TerminalButton>
          </div>
        </div>}
    </div>;
};