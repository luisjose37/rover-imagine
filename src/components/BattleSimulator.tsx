import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalButton } from './TerminalButton';
import { TerminalInput } from './TerminalInput';
import { ASCIILoader, ASCIIDivider } from './ASCIIElements';
import { AlphaRovers } from './AlphaRovers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { shareBattleResult } from '@/lib/shareUtils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const TOTAL_SUPPLY = 5555;

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
  count?: number;
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
  const { toast } = useToast();
  const [tokenId1, setTokenId1] = useState('');
  const [tokenId2, setTokenId2] = useState('');
  const [rover1, setRover1] = useState<NFT | null>(null);
  const [rover2, setRover2] = useState<NFT | null>(null);
  const [isLoadingRover1, setIsLoadingRover1] = useState(false);
  const [isLoadingRover2, setIsLoadingRover2] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const fetchRover = async (tokenId: string, setRover: (nft: NFT | null) => void, setLoading: (loading: boolean) => void) => {
    if (!tokenId.trim()) { toast({ title: "Input Required", description: "Please enter a token ID", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tokenId: tokenId.trim() }) });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setRover(data);
      toast({ title: "Rover Located", description: `${data.name} loaded with ${data.traits?.length || 0} traits` });
    } catch (error) {
      toast({ title: "Scan Failed", description: error instanceof Error ? error.message : "Failed to locate rover", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const simulateBattle = useCallback(async () => {
    if (!rover1 || !rover2) return;
    setIsSimulating(true); setBattleResult(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/simulate-battle`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rover1: { identifier: rover1.identifier, name: rover1.name, traits: rover1.traits }, rover2: { identifier: rover2.identifier, name: rover2.name, traits: rover2.traits } })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setBattleResult(data);
      toast({ title: "Battle Complete", description: `${data.winner} wins!` });
    } catch (error) {
      toast({ title: "Simulation Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally { setIsSimulating(false); }
  }, [rover1, rover2, toast]);

  const resetBattle = () => { setTokenId1(''); setTokenId2(''); setRover1(null); setRover2(null); setBattleResult(null); };
  const generateRandomTokenId = () => Math.floor(Math.random() * 5555) + 1;

  const calculatePowerScore = (traits: Array<{ trait_type: string; value: string }>) => {
    let totalPower = 0;
    traits.forEach(trait => {
      const hash = (trait.trait_type + trait.value).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
      const rarity = Math.abs(hash % 29) + 1;
      const power = Math.round((30 - rarity) * 3.33);
      totalPower += power;
    });
    return totalPower;
  };

  const isTopTierPower = (traits: Array<{ trait_type: string; value: string }> | undefined) => {
    if (!traits) return false;
    return calculatePowerScore(traits) >= 600;
  };

  const RoverCard: React.FC<{ rover: NFT | null; stats: RoverStats | null; isWinner: boolean; side: 'left' | 'right'; }> = ({ rover, stats, isWinner, side }) => {
    if (!rover) return null;
    return (
      <div className={cn("flex-1 win95-raised bg-card p-3", isWinner && "outline outline-2 outline-primary")}>
        {isWinner && (
          <div className="text-center mb-2">
            <span className="bg-primary text-primary-foreground font-win95 text-[11px] px-2 py-0.5 font-bold">★ WINNER ★</span>
          </div>
        )}
        <div className="relative aspect-square w-full max-w-[350px] mx-auto win95-sunken overflow-hidden mb-2">
          {rover.image_url ? (
            rover.image_url.endsWith('.mp4') ? <video src={rover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover.image_url} alt={rover.name} className="w-full h-full object-cover" />
          ) : <div className="w-full h-full flex items-center justify-center text-muted text-[11px] font-win95">[No Image]</div>}
        </div>
        <div className="text-center mb-2">
          <div className="text-foreground font-win95 text-[11px] font-bold">{rover.name}</div>
          <div className="text-muted-foreground font-win95 text-[10px]">Token #{rover.identifier}</div>
          {isTopTierPower(rover.traits) && (
            <div className="inline-block bg-primary text-primary-foreground px-2 py-0.5 mt-1">
              <span className="font-win95 text-[10px] font-bold">★ Top 5% Power</span>
            </div>
          )}
        </div>
        {stats && (
          <div className="text-center mb-2">
            <div className="text-muted-foreground font-win95 text-[10px]">Total Power</div>
            <div className={cn("font-win95 text-lg font-bold", isWinner ? "text-primary" : "text-foreground")}>{stats.totalPower}</div>
          </div>
        )}
        {stats && (
          <div className="win95-groupbox relative mt-2">
            <span className="absolute -top-2 left-3 bg-card px-1 text-[10px]">Traits ({stats.traits.length})</span>
            <div className="space-y-0.5">
              {stats.traits.map((trait, idx) => (
                <div key={idx} className={cn("flex flex-col text-[10px] font-win95 p-1", trait === stats.dominantTrait ? "bg-primary/10 win95-sunken" : "")}>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{trait.trait_type}</span>
                    <span className={cn("font-bold", trait === stats.dominantTrait ? "text-primary" : "text-foreground")}>{trait.power} PWR</span>
                  </div>
                  <div className="text-foreground">{trait.value}</div>
                  <div className="text-muted text-[9px] border-t border-border pt-0.5 mt-0.5">
                    100 - {trait.rarity}% rarity = {trait.power}
                    {trait.count !== undefined && trait.count > 0 && <span className="ml-1">({trait.count}/5555 have this)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const battleContent = (
    <>
      {!battleResult && !isSimulating && (
        <div className="space-y-4">
          <div className="text-foreground font-win95 text-xs font-bold text-center">
            {rover1 && rover2 ? 'Rovers Ready for Battle' : 'Select Two Rovers for Battle'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Rover 1 */}
            <div className="win95-groupbox relative">
              <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">Rover 1</span>
              {rover1 ? (
                <div className="text-center">
                  <div className="relative aspect-square w-full max-w-[262px] mx-auto win95-sunken overflow-hidden mb-2">
                    {rover1.image_url?.endsWith('.mp4') ? <video src={rover1.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover1.image_url} alt={rover1.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-foreground font-win95 text-[11px] font-bold">{rover1.name}</div>
                  <div className="text-muted-foreground font-win95 text-[10px] mb-1">Token #{rover1.identifier}</div>
                  {isTopTierPower(rover1.traits) && <div className="inline-block bg-primary text-primary-foreground px-2 py-0.5 mb-1"><span className="font-win95 text-[10px] font-bold">★ Top 5%</span></div>}
                  {rover1.traits && rover1.traits.length > 0 && (
                    <div className="text-left mt-2 space-y-0.5">
                      <div className="text-foreground font-win95 text-[10px] text-center font-bold">Traits ({rover1.traits.length})</div>
                      {rover1.traits.map((trait, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] font-win95 p-1 win95-sunken bg-white">
                          <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                          <span className="text-foreground truncate ml-2">{trait.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <TerminalInput label="Token ID" value={tokenId1} onChange={setTokenId1} placeholder="e.g., 1234" onSubmit={() => fetchRover(tokenId1, setRover1, setIsLoadingRover1)} disabled={isLoadingRover1} />
                  <div className="flex gap-2">
                    <TerminalButton onClick={() => fetchRover(tokenId1, setRover1, setIsLoadingRover1)} disabled={isLoadingRover1 || !tokenId1.trim()} variant="primary" className="flex-1">
                      {isLoadingRover1 ? 'Scanning...' : 'Locate'}
                    </TerminalButton>
                    <TerminalButton onClick={() => setTokenId1(String(generateRandomTokenId()))} disabled={isLoadingRover1} variant="secondary">🎲 Random</TerminalButton>
                  </div>
                </div>
              )}
            </div>

            {/* Rover 2 */}
            <div className="win95-groupbox relative">
              <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">Rover 2</span>
              {rover2 ? (
                <div className="text-center">
                  <div className="relative aspect-square w-full max-w-[262px] mx-auto win95-sunken overflow-hidden mb-2">
                    {rover2.image_url?.endsWith('.mp4') ? <video src={rover2.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover2.image_url} alt={rover2.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="text-foreground font-win95 text-[11px] font-bold">{rover2.name}</div>
                  <div className="text-muted-foreground font-win95 text-[10px] mb-1">Token #{rover2.identifier}</div>
                  {isTopTierPower(rover2.traits) && <div className="inline-block bg-primary text-primary-foreground px-2 py-0.5 mb-1"><span className="font-win95 text-[10px] font-bold">★ Top 5%</span></div>}
                  {rover2.traits && rover2.traits.length > 0 && (
                    <div className="text-left mt-2 space-y-0.5">
                      <div className="text-foreground font-win95 text-[10px] text-center font-bold">Traits ({rover2.traits.length})</div>
                      {rover2.traits.map((trait, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] font-win95 p-1 win95-sunken bg-white">
                          <span className="text-muted-foreground truncate">{trait.trait_type}</span>
                          <span className="text-foreground truncate ml-2">{trait.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <TerminalInput label="Token ID" value={tokenId2} onChange={setTokenId2} placeholder="e.g., 5678" onSubmit={() => fetchRover(tokenId2, setRover2, setIsLoadingRover2)} disabled={isLoadingRover2} />
                  <div className="flex gap-2">
                    <TerminalButton onClick={() => fetchRover(tokenId2, setRover2, setIsLoadingRover2)} disabled={isLoadingRover2 || !tokenId2.trim()} variant="primary" className="flex-1">
                      {isLoadingRover2 ? 'Scanning...' : 'Locate'}
                    </TerminalButton>
                    <TerminalButton onClick={() => setTokenId2(String(generateRandomTokenId()))} disabled={isLoadingRover2} variant="secondary">🎲 Random</TerminalButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden text-center text-foreground font-win95 text-sm font-bold">VS</div>

          {rover1 && rover2 && (
            <div className="flex justify-center gap-3">
              <TerminalButton onClick={simulateBattle} disabled={isSimulating} variant="primary" size="lg">
                {isSimulating ? 'Simulating...' : '⚔ Start Battle'}
              </TerminalButton>
              <TerminalButton onClick={resetBattle} variant="secondary">Reset</TerminalButton>
            </div>
          )}
        </div>
      )}

      {isSimulating && <div className="py-6"><ASCIILoader text="Simulating Battle" /></div>}

      {battleResult && !isSimulating && (
        <div className="space-y-4">
          <div className="text-foreground font-win95 text-xs font-bold text-center">Battle Results</div>
          <div className="flex flex-col md:flex-row gap-3 items-start">
            <RoverCard rover={rover1} stats={battleResult.rover1Stats} isWinner={battleResult.winnerId === rover1?.identifier} side="left" />
            <div className="hidden md:flex items-center justify-center px-2">
              <span className="text-foreground font-win95 text-sm font-bold">VS</span>
            </div>
            <div className="md:hidden text-center text-foreground font-win95 text-sm font-bold py-1">VS</div>
            <RoverCard rover={rover2} stats={battleResult.rover2Stats} isWinner={battleResult.winnerId === rover2?.identifier} side="right" />
          </div>

          <ASCIIDivider />

          {/* Battle Log */}
          <div className="win95-groupbox relative">
            <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">Battle Log</span>
            <div className="win95-sunken bg-white p-2">
              <pre className="text-foreground font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{battleResult.battleLog}</pre>
            </div>
          </div>

          {/* Winner */}
          {(() => {
            const winnerPower = battleResult.winnerId === rover1?.identifier ? battleResult.rover1Stats.totalPower : battleResult.rover2Stats.totalPower;
            const loserPower = battleResult.winnerId === rover1?.identifier ? battleResult.rover2Stats.totalPower : battleResult.rover1Stats.totalPower;
            const isUnderdogVictory = winnerPower < loserPower;
            return (
              <div className="text-center win95-raised bg-card p-4">
                {isUnderdogVictory && (
                  <div className="inline-block text-foreground px-2 py-0.5 mb-2" style={{ background: 'hsl(50 100% 50%)' }}>
                    <span className="font-win95 text-[11px] font-bold">⚡ Underdog Victory!</span>
                  </div>
                )}
                <div className="text-muted-foreground font-win95 text-[10px] mb-1">Victor</div>
                <div className="text-primary font-win95 text-lg font-bold">{battleResult.winner}</div>
                {isUnderdogVictory && <div className="text-foreground font-win95 text-[11px] mt-1">Won with {winnerPower} PWR vs {loserPower} PWR!</div>}
                <div className="text-muted-foreground font-win95 text-[10px] mt-1">
                  Dominant Trait: {battleResult.winnerId === rover1?.identifier ? `${battleResult.rover1Stats.dominantTrait?.trait_type}: ${battleResult.rover1Stats.dominantTrait?.value}` : `${battleResult.rover2Stats.dominantTrait?.trait_type}: ${battleResult.rover2Stats.dominantTrait?.value}`}
                </div>
              </div>
            );
          })()}

          <div className="flex justify-center gap-2">
            <TerminalButton onClick={resetBattle} variant="primary">New Battle</TerminalButton>
            <TerminalButton
              onClick={() => {
                const winner = battleResult.winner;
                const loser = battleResult.winnerId === rover1?.identifier ? rover2?.name : rover1?.name;
                const winnerPower = battleResult.winnerId === rover1?.identifier ? battleResult.rover1Stats.totalPower : battleResult.rover2Stats.totalPower;
                const loserPower = battleResult.winnerId === rover1?.identifier ? battleResult.rover2Stats.totalPower : battleResult.rover1Stats.totalPower;
                shareBattleResult(winner, loser || 'Unknown', winnerPower, loserPower);
              }}
              variant="secondary"
            >
              𝕏 Share
            </TerminalButton>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="battle" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-card border border-border mb-4">
          <TabsTrigger value="battle" className="font-win95 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ⚔ Battle
          </TabsTrigger>
          <TabsTrigger value="alphas" className="font-win95 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ★ Alpha Rovers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="battle">{battleContent}</TabsContent>
        <TabsContent value="alphas"><AlphaRovers /></TabsContent>
      </Tabs>
    </div>
  );
};
