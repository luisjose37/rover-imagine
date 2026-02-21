import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalButton } from './TerminalButton';
import { ASCIILoader } from './ASCIIElements';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  const [alphaRovers, setAlphaRovers] = useState<AlphaRover[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef(false);
  const knownAlphaIds = useRef<Set<string>>(new Set());
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => { loadAlphaRovers(); }, []);

  const loadAlphaRovers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('alpha_rovers').select('*').order('trait_count', { ascending: false });
    if (error) {
      console.error('Error loading alpha rovers:', error);
    } else if (data) {
      const alphas = data.map(row => ({ ...row, traits: row.traits as NFT['traits'] }));
      setAlphaRovers(alphas);
      alphas.forEach(a => knownAlphaIds.current.add(a.token_id));
      setScanProgress(Math.max(...alphas.map(a => parseInt(a.token_id)), 0));
    }
    setIsLoading(false);
  };

  const saveAlphaRover = async (rover: NFT): Promise<boolean> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/save-alpha-rover`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_id: rover.identifier, name: rover.name, image_url: rover.image_url, trait_count: rover.traits.length, traits: rover.traits })
      });
      const data = await response.json();
      if (data.error) return false;
      if (data.exists) return false;
      return data.success;
    } catch { return false; }
  };

  const fetchRover = async (tokenId: string): Promise<NFT | null> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId.trim() })
      });
      const data = await response.json();
      if (data.error) return null;
      return data;
    } catch { return null; }
  };

  const startScanning = useCallback(async () => {
    setIsScanning(true); setIsPaused(false); abortRef.current = false;
    let currentId = scanProgress > 0 ? scanProgress + 1 : 1;
    while (currentId <= TOTAL_ROVERS && !abortRef.current) {
      const batchIds: number[] = [];
      for (let i = 0; i < BATCH_SIZE && currentId + i <= TOTAL_ROVERS; i++) {
        const id = currentId + i;
        if (!knownAlphaIds.current.has(String(id))) batchIds.push(id);
      }
      if (batchIds.length === 0) { currentId += BATCH_SIZE; setScanProgress(currentId - 1); continue; }
      const results = await Promise.all(batchIds.map(id => fetchRover(String(id))));
      for (const rover of results) {
        if (rover && rover.traits && rover.traits.length >= ALPHA_THRESHOLD) {
          const saved = await saveAlphaRover(rover);
          if (saved) {
            toast({ title: "★ Alpha Discovered", description: `${rover.name} has ${rover.traits.length} traits!` });
            const newAlpha: AlphaRover = { id: crypto.randomUUID(), token_id: rover.identifier, name: rover.name, image_url: rover.image_url, trait_count: rover.traits.length, traits: rover.traits, discovered_at: new Date().toISOString() };
            setAlphaRovers(prev => [...prev, newAlpha].sort((a, b) => b.trait_count - a.trait_count));
            knownAlphaIds.current.add(rover.identifier);
          }
        }
      }
      currentId += BATCH_SIZE; setScanProgress(currentId - 1);
      if (!abortRef.current) await delay(BATCH_DELAY);
    }
    if (currentId > TOTAL_ROVERS) toast({ title: "Scan Complete", description: `Finished scanning all ${TOTAL_ROVERS} rovers.` });
    setIsScanning(false);
  }, [scanProgress, toast, alphaRovers.length]);

  const pauseScanning = () => { abortRef.current = true; setIsPaused(true); setIsScanning(false); };
  const resetScan = () => { abortRef.current = true; setIsScanning(false); setIsPaused(false); setScanProgress(0); };

  useEffect(() => { startScanning(); return () => { abortRef.current = true; }; }, []);

  const progressPercent = scanProgress / TOTAL_ROVERS * 100;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-foreground font-win95 text-xs font-bold mb-1">Alpha Rovers</div>
        <div className="text-muted-foreground font-win95 text-[11px]">
          Rovers with {ALPHA_THRESHOLD}+ traits are considered Alpha class
        </div>
      </div>

      {/* Progress */}
      <div className="win95-groupbox relative">
        <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">Scan Progress</span>
        <div className="flex justify-between text-[11px] font-win95 text-muted-foreground mb-1">
          <span>Scanned: {scanProgress} / {TOTAL_ROVERS}</span>
          <span>Alphas: {alphaRovers.length}</span>
        </div>
        <div className="win95-sunken p-0.5 bg-white">
          <div className="flex h-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className={cn("flex-1 mx-[1px]", i < Math.floor(progressPercent / 5) ? "bg-primary" : "bg-transparent")} />
            ))}
          </div>
        </div>
        <div className="text-center mt-1 text-foreground font-win95 text-[11px]">{progressPercent.toFixed(1)}% Complete</div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {isScanning ? (
          <TerminalButton onClick={pauseScanning} variant="secondary">⏸ Pause</TerminalButton>
        ) : (
          <TerminalButton onClick={startScanning} variant="primary" size="lg">
            {isPaused ? '▶ Resume' : '🔍 Start Scan'}
          </TerminalButton>
        )}
        <TerminalButton onClick={resetScan} variant="secondary" disabled={isScanning}>↺ Reset</TerminalButton>
      </div>

      {isScanning && <ASCIILoader text={`Scanning Rover #${scanProgress + 1}`} />}

      {/* Alpha Rovers Grid */}
      {alphaRovers.length > 0 && (
        <div className="space-y-3">
          <div className="text-foreground font-win95 text-[11px] text-center font-bold">
            {alphaRovers.length} Alpha Rover{alphaRovers.length !== 1 ? 's' : ''} Found
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alphaRovers.map(rover => (
              <div key={rover.token_id} className="win95-raised bg-card p-2">
                <div className="relative aspect-square w-full max-w-[200px] mx-auto win95-sunken overflow-hidden mb-2">
                  {rover.image_url ? (
                    rover.image_url.endsWith('.mp4') ? (
                      <video src={rover.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                    ) : (
                      <img src={rover.image_url} alt={rover.name} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-[11px] font-win95">[No Image]</div>
                  )}
                </div>
                <div className="text-center mb-1">
                  <div className="text-foreground font-win95 text-[11px] font-bold">{rover.name}</div>
                  <div className="text-muted-foreground font-win95 text-[10px]">Token #{rover.token_id}</div>
                </div>
                <div className="flex justify-center mb-1">
                  <div className="inline-block bg-primary text-primary-foreground px-2 py-0.5">
                    <span className="font-win95 text-[10px] font-bold">★ {rover.trait_count} Traits</span>
                  </div>
                </div>
                <div className="text-center text-muted-foreground font-win95 text-[10px]">
                  {rover.traits?.slice(0, 5).map(t => t.trait_type).join(' • ')}
                  {rover.traits && rover.traits.length > 5 && ` +${rover.traits.length - 5} more`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alphaRovers.length === 0 && !isScanning && scanProgress === 0 && (
        <div className="text-center py-6 win95-sunken bg-white">
          <div className="text-foreground font-win95 text-[11px] mb-1">No Alpha Rovers found yet</div>
          <div className="text-muted-foreground font-win95 text-[10px]">Start scanning to find all Alpha Rovers</div>
        </div>
      )}
    </div>
  );
};
