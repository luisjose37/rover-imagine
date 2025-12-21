import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalButton } from './TerminalButton';
import { TerminalInput } from './TerminalInput';
import { ASCIILoader } from './ASCIIElements';
import { cn } from '@/lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ALPHA_THRESHOLD = 13;

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
}

export const AlphaRovers: React.FC = () => {
  const { toast } = useToast();
  const [alphaRovers, setAlphaRovers] = useState<NFT[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [manualTokenId, setManualTokenId] = useState('');
  const [isCheckingManual, setIsCheckingManual] = useState(false);

  const fetchRover = async (tokenId: string): Promise<NFT | null> => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId.trim() })
      });
      const data = await response.json();
      if (data.error) return null;
      return data;
    } catch {
      return null;
    }
  };

  const checkManualRover = async () => {
    if (!manualTokenId.trim()) {
      toast({
        title: "INPUT REQUIRED",
        description: "Please enter a token ID",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingManual(true);
    const rover = await fetchRover(manualTokenId);
    setIsCheckingManual(false);

    if (!rover) {
      toast({
        title: "SCAN FAILED",
        description: "Could not locate rover",
        variant: "destructive"
      });
      return;
    }

    const traitCount = rover.traits?.length || 0;
    if (traitCount >= ALPHA_THRESHOLD) {
      // Check if already in list
      if (!alphaRovers.find(r => r.identifier === rover.identifier)) {
        setAlphaRovers(prev => [...prev, rover]);
      }
      toast({
        title: "★ ALPHA DETECTED ★",
        description: `${rover.name} has ${traitCount} traits!`
      });
    } else {
      toast({
        title: "NOT AN ALPHA",
        description: `${rover.name} has only ${traitCount} traits (need ${ALPHA_THRESHOLD}+)`,
        variant: "destructive"
      });
    }
    setManualTokenId('');
  };

  const scanForAlphas = useCallback(async () => {
    setIsScanning(true);
    setAlphaRovers([]);
    const foundAlphas: NFT[] = [];
    const totalToScan = 100; // Scan first 100 random rovers for demo
    const randomIds = Array.from({ length: totalToScan }, () => Math.floor(Math.random() * 5555) + 1);

    setScanProgress({ current: 0, total: totalToScan });

    for (let i = 0; i < randomIds.length; i++) {
      const rover = await fetchRover(String(randomIds[i]));
      setScanProgress({ current: i + 1, total: totalToScan });

      if (rover && rover.traits && rover.traits.length >= ALPHA_THRESHOLD) {
        foundAlphas.push(rover);
        setAlphaRovers([...foundAlphas]);
      }
    }

    setIsScanning(false);
    toast({
      title: "SCAN COMPLETE",
      description: `Found ${foundAlphas.length} Alpha Rovers out of ${totalToScan} scanned`
    });
  }, [toast]);

  const removeRover = (identifier: string) => {
    setAlphaRovers(prev => prev.filter(r => r.identifier !== identifier));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-primary font-terminal text-lg text-glow mb-2">
          ★ ALPHA ROVERS ★
        </div>
        <div className="text-muted-foreground font-terminal text-xs">
          Rovers with {ALPHA_THRESHOLD}+ traits are considered Alpha class
        </div>
      </div>

      {/* Manual Check */}
      <div className="border border-primary/30 p-4">
        <div className="text-primary font-terminal text-sm mb-3">CHECK SPECIFIC ROVER</div>
        <div className="flex gap-2">
          <TerminalInput
            label=""
            value={manualTokenId}
            onChange={setManualTokenId}
            placeholder="Enter Token ID..."
            onSubmit={checkManualRover}
            disabled={isCheckingManual}
            className="flex-1"
          />
          <TerminalButton
            onClick={checkManualRover}
            disabled={isCheckingManual || !manualTokenId.trim()}
            variant="primary"
          >
            {isCheckingManual ? 'CHECKING...' : 'CHECK'}
          </TerminalButton>
        </div>
      </div>

      {/* Scan Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <TerminalButton
          onClick={scanForAlphas}
          disabled={isScanning}
          variant="primary"
          size="lg"
        >
          {isScanning ? `SCANNING... (${scanProgress.current}/${scanProgress.total})` : '🔍 SCAN FOR ALPHAS'}
        </TerminalButton>
        {alphaRovers.length > 0 && !isScanning && (
          <TerminalButton
            onClick={() => setAlphaRovers([])}
            variant="secondary"
          >
            CLEAR LIST
          </TerminalButton>
        )}
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="py-4">
          <ASCIILoader text={`SCANNING ROVERS (${scanProgress.current}/${scanProgress.total})`} />
          <div className="mt-4 border border-primary/30 h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Alpha Rovers List */}
      {alphaRovers.length > 0 && (
        <div className="space-y-4">
          <div className="text-primary font-terminal text-sm text-center">
            ─[ FOUND {alphaRovers.length} ALPHA ROVER{alphaRovers.length !== 1 ? 'S' : ''} ]─
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alphaRovers.map((rover) => (
              <div 
                key={rover.identifier}
                className="border border-primary p-3 bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {/* Rover Image */}
                <div className="relative aspect-square w-full max-w-[200px] mx-auto border border-primary/50 overflow-hidden mb-3">
                  {rover.image_url ? (
                    rover.image_url.endsWith('.mp4') ? (
                      <video
                        src={rover.image_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={rover.image_url}
                        alt={rover.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/50 text-xs font-terminal">
                      [NO IMG]
                    </div>
                  )}
                </div>

                {/* Rover Info */}
                <div className="text-center mb-2">
                  <div className="text-primary text-glow font-terminal text-sm">
                    {rover.name}
                  </div>
                  <div className="text-muted-foreground font-terminal text-xs">
                    TOKEN #{rover.identifier}
                  </div>
                </div>

                {/* Alpha Badge */}
                <div className="flex justify-center mb-2">
                  <div className="inline-block bg-primary/20 border border-primary px-2 py-0.5">
                    <span className="text-primary text-glow font-terminal text-xs animate-pulse">
                      ★ {rover.traits.length} TRAITS ★
                    </span>
                  </div>
                </div>

                {/* Trait Summary */}
                <div className="text-center mb-2">
                  <div className="text-muted-foreground font-terminal text-[10px]">
                    {rover.traits.slice(0, 5).map(t => t.trait_type).join(' • ')}
                    {rover.traits.length > 5 && ` +${rover.traits.length - 5} more`}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="text-center">
                  <button
                    onClick={() => removeRover(rover.identifier)}
                    className="text-muted-foreground hover:text-destructive font-terminal text-xs transition-colors"
                  >
                    [REMOVE]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {alphaRovers.length === 0 && !isScanning && (
        <div className="text-center py-8 border border-primary/20">
          <div className="text-muted-foreground font-terminal text-sm mb-2">
            NO ALPHA ROVERS FOUND
          </div>
          <div className="text-muted-foreground/70 font-terminal text-xs">
            Scan for Alphas or check a specific rover by ID
          </div>
        </div>
      )}
    </div>
  );
};
