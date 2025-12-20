import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalWindow } from '@/components/TerminalWindow';
import { NFTList } from '@/components/NFTCard';
import { TraitDisplay } from '@/components/TraitDisplay';
import { StoryDisplay } from '@/components/StoryDisplay';
import { TerminalButton } from '@/components/TerminalButton';
import { ASCIILoader, ASCIIDivider } from '@/components/ASCIIElements';

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  traits: Array<{ trait_type: string; value: string }>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { toast } = useToast();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [story, setStory] = useState('');
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [hasLoadedNFTs, setHasLoadedNFTs] = useState(false);

  const fetchNFTs = async () => {
    setIsLoadingNFTs(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const formattedNFTs = (data.nfts || []).map((nft: any) => ({
        identifier: nft.identifier,
        name: nft.name || `Rover #${nft.identifier}`,
        image_url: nft.image_url,
        traits: nft.traits || [],
      }));

      setNfts(formattedNFTs);
      setHasLoadedNFTs(true);

      toast({
        title: "SCAN COMPLETE",
        description: `${formattedNFTs.length} rovers detected in collection`,
      });

    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: "CONNECTION ERROR",
        description: error instanceof Error ? error.message : "Failed to connect to blockchain",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const generateStory = useCallback(async () => {
    if (!selectedNFT) return;

    setIsGeneratingStory(true);
    setStory('');

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roverName: selectedNFT.name,
          traits: selectedNFT.traits,
          imageUrl: selectedNFT.image_url,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limits exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('AI credits depleted. Please add funds.');
        }
        throw new Error('Failed to generate story');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullStory = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullStory += content;
              setStory(fullStory);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      toast({
        title: "TRANSMISSION COMPLETE",
        description: "Story generated successfully",
      });

    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "GENERATION FAILED",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStory(false);
    }
  }, [selectedNFT, toast]);

  const copyToClipboard = () => {
    if (story) {
      navigator.clipboard.writeText(story);
      toast({
        title: "COPIED",
        description: "Story copied to clipboard",
      });
    }
  };

  const exportStory = () => {
    if (story && selectedNFT) {
      const content = `ROVER.IMAGINE - Story Export\n${'='.repeat(50)}\n\nRover: ${selectedNFT.name}\nID: ${selectedNFT.identifier}\n\n${story}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rover-${selectedNFT.identifier}-story.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Main terminal container */}
      <TerminalWindow className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="p-6 border-b border-primary/30">
          <div className="text-center">
            <pre className="text-primary text-glow font-terminal text-xs md:text-sm inline-block">
{`
██████╗  ██████╗ ██╗   ██╗███████╗██████╗    ██╗███╗   ███╗ █████╗  ██████╗ ██╗███╗   ██╗███████╗
██╔══██╗██╔═══██╗██║   ██║██╔════╝██╔══██╗   ██║████╗ ████║██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝   ██║██╔████╔██║███████║██║  ███╗██║██╔██╗ ██║█████╗  
██╔══██╗██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║██║╚██╔╝██║██╔══██║██║   ██║██║██║╚██╗██║██╔══╝  
██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║██╗██║██║ ╚═╝ ██║██║  ██║╚██████╔╝██║██║ ╚████║███████╗
╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
`}
            </pre>
            <p className="text-muted-foreground font-terminal mt-4 text-lg">
              {">"} AI-POWERED STORY GENERATION FOR BLOCKCHAIN ROVERS
            </p>
          </div>
        </div>

        {/* Initial state - Load button */}
        {!hasLoadedNFTs && !isLoadingNFTs && (
          <div className="p-8 text-center">
            <ASCIIDivider />
            <div className="my-8">
              <pre className="text-primary/60 font-terminal text-xs mb-6">
{`
      _______________
     /               \\
    |   ROVER.XYZ    |
    |   COLLECTION   |
    |________________|
         ||    ||
         ||    ||
        _||____||_
       |__________|
`}
              </pre>
              <p className="text-primary font-terminal text-xl mb-6">
                INITIALIZE BLOCKCHAIN CONNECTION
              </p>
              <TerminalButton 
                size="lg" 
                onClick={fetchNFTs}
              >
                SCAN COLLECTION
              </TerminalButton>
            </div>
            <ASCIIDivider />
          </div>
        )}

        {/* Loading state */}
        {isLoadingNFTs && (
          <div className="p-8">
            <ASCIILoader text="SCANNING BLOCKCHAIN" />
          </div>
        )}

        {/* Main content - NFT selection and story generation */}
        {hasLoadedNFTs && !isLoadingNFTs && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left panel - NFT selection */}
            <div className="border-r border-primary/30 p-6">
              <div className="text-primary font-terminal text-lg mb-4 text-glow">
                {">"} SELECT ROVER FOR ANALYSIS
              </div>
              
              <NFTList
                nfts={nfts}
                selectedId={selectedNFT?.identifier || null}
                onSelect={(nft) => {
                  setSelectedNFT(nft);
                  setStory('');
                }}
              />

              {selectedNFT && (
                <div className="mt-6">
                  <ASCIIDivider />
                  <TraitDisplay 
                    traits={selectedNFT.traits} 
                    className="mt-4"
                  />
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <TerminalButton
                      onClick={generateStory}
                      disabled={isGeneratingStory}
                      variant="primary"
                    >
                      {isGeneratingStory ? 'GENERATING...' : 'GENERATE STORY'}
                    </TerminalButton>
                    
                    <TerminalButton
                      onClick={fetchNFTs}
                      variant="secondary"
                      disabled={isLoadingNFTs}
                    >
                      RESCAN
                    </TerminalButton>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel - Story display */}
            <div className="p-6">
              <div className="text-primary font-terminal text-lg mb-4 text-glow">
                {">"} STORY TRANSMISSION
              </div>
              
              <StoryDisplay
                story={story}
                isGenerating={isGeneratingStory}
                roverName={selectedNFT?.name}
              />

              {story && !isGeneratingStory && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <TerminalButton onClick={copyToClipboard} variant="secondary">
                    COPY
                  </TerminalButton>
                  <TerminalButton onClick={exportStory} variant="secondary">
                    EXPORT .TXT
                  </TerminalButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-primary/30 p-4">
          <div className="flex items-center justify-between text-muted-foreground font-terminal text-sm">
            <span>ROVER.IMAGINE v1.0.0</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              SYSTEM ONLINE
            </span>
            <span>BLOCKCHAIN: ETHEREUM</span>
          </div>
        </div>
      </TerminalWindow>
    </div>
  );
};

export default Index;
