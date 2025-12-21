import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalButton } from './TerminalButton';
import { ASCIILoader } from './ASCIIElements';
import { supabase } from '@/integrations/supabase/client';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ALPHA_THRESHOLD = 13;
const TOTAL_ROVERS = 5555;
const BATCH_SIZE = 2;
const BATCH_DELAY = 1000;
interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
}
interface AlphaRover {
  id: string;
  token_id: string;
  name: string;
  image_url: string | null;
  trait_count: number;
  traits: NFT['traits'];
  discovered_at: string;
}
export const AlphaRovers: React.FC = () => {
  const {
    toast
  } = useToast();
  const [alphaRovers, setAlphaRovers] = useState<AlphaRover[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef(false);
  const knownAlphaIds = useRef<Set<string>>(new Set());
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Load existing alphas from database on mount
  useEffect(() => {
    loadAlphaRovers();
  }, []);
  const loadAlphaRovers = async () => {
    setIsLoading(true);
    const {
      data,
      error
    } = await supabase.from('alpha_rovers').select('*').order('trait_count', {
      ascending: false
    });
    if (error) {
      console.error('Error loading alpha rovers:', error);
    } else if (data) {
      const alphas = data.map(row => ({
        ...row,
        traits: row.traits as NFT['traits']
      }));
      setAlphaRovers(alphas);
      alphas.forEach(a => knownAlphaIds.current.add(a.token_id));
      setScanProgress(Math.max(...alphas.map(a => parseInt(a.token_id)), 0));
    }
    setIsLoading(false);
  };
  const saveAlphaRover = async (rover: NFT): Promise<boolean> => {
    const {
      error
    } = await supabase.from('alpha_rovers').insert({
      token_id: rover.identifier,
      name: rover.name,
      image_url: rover.image_url,
      trait_count: rover.traits.length,
      traits: rover.traits
    });
    if (error) {
      if (error.code === '23505') {
        // Already exists, that's fine
        return false;
      }
      console.error('Error saving alpha rover:', error);
      return false;
    }
    return true;
  };
  const fetchRover = async (tokenId: string): Promise<NFT | null> => {
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
      if (data.error) return null;
      return data;
    } catch {
      return null;
    }
  };
  const startScanning = useCallback(async () => {
    setIsScanning(true);
    setIsPaused(false);
    abortRef.current = false;
    let currentId = scanProgress > 0 ? scanProgress + 1 : 1;
    while (currentId <= TOTAL_ROVERS && !abortRef.current) {
      // Skip already known alphas
      const batchIds: number[] = [];
      for (let i = 0; i < BATCH_SIZE && currentId + i <= TOTAL_ROVERS; i++) {
        const id = currentId + i;
        if (!knownAlphaIds.current.has(String(id))) {
          batchIds.push(id);
        }
      }
      if (batchIds.length === 0) {
        currentId += BATCH_SIZE;
        setScanProgress(currentId - 1);
        continue;
      }
      const results = await Promise.all(batchIds.map(id => fetchRover(String(id))));
      for (let i = 0; i < results.length; i++) {
        const rover = results[i];
        if (rover && rover.traits && rover.traits.length >= ALPHA_THRESHOLD) {
          // Log the discovery
          console.log(`🌟 ALPHA FOUND: ${rover.name} with ${rover.traits.length} traits!`);

          // Save to database
          const saved = await saveAlphaRover(rover);
          if (saved) {
            toast({
              title: "★ ALPHA DISCOVERED ★",
              description: `${rover.name} has ${rover.traits.length} traits!`
            });

            // Add to local state
            const newAlpha: AlphaRover = {
              id: crypto.randomUUID(),
              token_id: rover.identifier,
              name: rover.name,
              image_url: rover.image_url,
              trait_count: rover.traits.length,
              traits: rover.traits,
              discovered_at: new Date().toISOString()
            };
            setAlphaRovers(prev => [...prev, newAlpha].sort((a, b) => b.trait_count - a.trait_count));
            knownAlphaIds.current.add(rover.identifier);
          }
        }
      }
      currentId += BATCH_SIZE;
      setScanProgress(currentId - 1);
      if (!abortRef.current) {
        await delay(BATCH_DELAY);
      }
    }
    if (currentId > TOTAL_ROVERS) {
      toast({
        title: "SCAN COMPLETE",
        description: `Finished scanning all ${TOTAL_ROVERS} rovers. Found ${alphaRovers.length} Alphas.`
      });
    }
    setIsScanning(false);
  }, [scanProgress, toast, alphaRovers.length]);
  const pauseScanning = () => {
    abortRef.current = true;
    setIsPaused(true);
    setIsScanning(false);
  };
  const resetScan = () => {
    abortRef.current = true;
    setIsScanning(false);
    setIsPaused(false);
    setScanProgress(0);
  };

  // Auto-start scanning on mount
  useEffect(() => {
    startScanning();
    return () => {
      abortRef.current = true;
    };
  }, []);
  const progressPercent = scanProgress / TOTAL_ROVERS * 100;
  return <div className="space-y-6">
      <div className="text-center">
        <div className="text-primary font-terminal text-lg text-glow mb-2"> ALPHA ROVERS </div>
        <div className="text-muted-foreground font-terminal text-xs">
          Rovers with {ALPHA_THRESHOLD}+ traits are considered Alpha class
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border border-primary/30 p-4">
        <div className="flex justify-between text-xs font-terminal text-muted-foreground mb-2">
          <span>SCANNED: {scanProgress} / {TOTAL_ROVERS}</span>
          <span>ALPHAS FOUND: {alphaRovers.length}</span>
        </div>
        <div className="border border-primary/30 h-3 overflow-hidden bg-background">
          <div className="h-full bg-primary transition-all duration-300" style={{
          width: `${progressPercent}%`
        }} />
        </div>
        <div className="text-center mt-2 text-primary font-terminal text-xs">
          {progressPercent.toFixed(1)}% COMPLETE
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {isScanning ? <TerminalButton onClick={pauseScanning} variant="secondary">
            ⏸ PAUSE SCAN
          </TerminalButton> : <TerminalButton onClick={startScanning} variant="primary" size="lg">
            {isPaused ? '▶ RESUME SCAN' : '🔍 START SCAN'}
          </TerminalButton>}
        <TerminalButton onClick={resetScan} variant="secondary" disabled={isScanning}>
          ↺ RESET
        </TerminalButton>
      </div>

      {/* Scanning Indicator */}
      {isScanning && <div className="py-2">
          <ASCIILoader text={`SCANNING ROVER #${scanProgress + 1}`} />
        </div>}

      {/* Alpha Rovers List */}
      {alphaRovers.length > 0 && <div className="space-y-4">
          <div className="text-primary font-terminal text-sm text-center">
            ─[ {alphaRovers.length} ALPHA ROVER{alphaRovers.length !== 1 ? 'S' : ''} FOUND ]─
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alphaRovers.map(rover => <div key={rover.token_id} className="border border-primary p-3 bg-primary/5">
                {/* Rover Image */}
                <div className="relative aspect-square w-full max-w-[200px] mx-auto border border-primary/50 overflow-hidden mb-3">
                  {rover.image_url ? rover.image_url.endsWith('.mp4') ? <video src={rover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={rover.image_url} alt={rover.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary/50 text-xs font-terminal">
                      [NO IMG]
                    </div>}
                </div>

                {/* Rover Info */}
                <div className="text-center mb-2">
                  <div className="text-primary text-glow font-terminal text-sm">
                    {rover.name}
                  </div>
                  <div className="text-muted-foreground font-terminal text-xs">
                    TOKEN #{rover.token_id}
                  </div>
                </div>

                {/* Alpha Badge */}
                <div className="flex justify-center mb-2">
                  <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5">
                    <span className="text-primary text-glow font-terminal text-xs animate-pulse">
                      ★ {rover.trait_count} TRAITS ★
                    </span>
                  </div>
                </div>

                {/* Trait Summary */}
                <div className="text-center">
                  <div className="text-muted-foreground font-terminal text-[10px]">
                    {rover.traits?.slice(0, 5).map(t => t.trait_type).join(' • ')}
                    {rover.traits && rover.traits.length > 5 && ` +${rover.traits.length - 5} more`}
                  </div>
                </div>
              </div>)}
          </div>
        </div>}

      {/* Empty State */}
      {alphaRovers.length === 0 && !isScanning && scanProgress === 0 && <div className="text-center py-8 border border-primary/20">
          <div className="text-muted-foreground font-terminal text-sm mb-2">
            NO ALPHA ROVERS FOUND YET
          </div>
          <div className="text-muted-foreground/70 font-terminal text-xs">
            Start scanning to find all Alpha Rovers
          </div>
        </div>}
    </div>;
};