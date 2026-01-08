import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalWindow } from '@/components/TerminalWindow';
import { TraitDisplay } from '@/components/TraitDisplay';
import { StoryDisplay } from '@/components/StoryDisplay';
import { TerminalButton } from '@/components/TerminalButton';
import { ASCIILoader, ASCIIDivider } from '@/components/ASCIIElements';
import { TerminalInput } from '@/components/TerminalInput';
import { WordCountSelector, WordCountOption } from '@/components/WordCountSelector';
import { BackgroundMusic } from '@/components/BackgroundMusic';
import { BattleSimulator } from '@/components/BattleSimulator';
import { GameHub } from '@/components/GameHub';
import { cn } from '@/lib/utils';
import { shareMission } from '@/lib/shareUtils';

type AppMode = 'story' | 'battle' | 'game';

interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  description?: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  opensea_url?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Index = () => {
  const { toast } = useToast();
  const [tokenId, setTokenId] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [story, setStory] = useState('');
  const [mission, setMission] = useState('');
  const [wordCount, setWordCount] = useState<WordCountOption>(500);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('story');

  const fetchNFT = async () => {
    if (!tokenId.trim()) {
      toast({ title: "INPUT REQUIRED", description: "Please enter a token ID", variant: "destructive" });
      return;
    }
    setIsLoadingNFT(true);
    setSelectedNFT(null);
    setStory('');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenId.trim() })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSelectedNFT(data);
      toast({ title: "ROVER LOCATED", description: `${data.name} loaded with ${data.traits?.length || 0} traits` });
    } catch (error) {
      toast({ title: "SCAN FAILED", description: error instanceof Error ? error.message : "Failed to locate rover", variant: "destructive" });
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const generateStory = useCallback(async () => {
    if (!selectedNFT || !selectedNFT.traits?.length) return;
    setIsGeneratingStory(true);
    setStory('');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roverName: selectedNFT.name, traits: selectedNFT.traits, wordCount })
      });
      if (!response.ok) throw new Error('Failed to generate story');
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
          if (line.startsWith(':') || line.trim() === '' || !line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullStory += content; setStory(fullStory); }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
      toast({ title: "TRANSMISSION COMPLETE", description: `Story generated (~${wordCount} words)` });
    } catch (error) {
      toast({ title: "GENERATION FAILED", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsGeneratingStory(false);
    }
  }, [selectedNFT, wordCount, toast]);

  const generateMission = useCallback(async () => {
    if (!selectedNFT || !selectedNFT.traits?.length) return;
    setIsGeneratingMission(true);
    setMission('');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roverName: selectedNFT.name, traits: selectedNFT.traits })
      });
      if (!response.ok) throw new Error('Failed to generate mission');
      const data = await response.json();
      setMission(data.mission);
      toast({ title: "MISSION LOGGED", description: "Random mission report generated" });
    } catch (error) {
      toast({ title: "MISSION FAILED", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsGeneratingMission(false);
    }
  }, [selectedNFT, toast]);

  const copyToClipboard = () => { if (story) { navigator.clipboard.writeText(story); toast({ title: "COPIED", description: "Story copied to clipboard" }); } };
  const exportStory = () => {
    if (story && selectedNFT) {
      const content = `ROVER.IMAGINE - Story Export\n${'═'.repeat(50)}\n\nRover: ${selectedNFT.name}\nToken ID: ${selectedNFT.identifier}\n\nTRAITS:\n${selectedNFT.traits?.map(t => `  ${t.trait_type}: ${t.value}`).join('\n') || 'No traits'}\n\n${'═'.repeat(50)}\nSTORY:\n${'═'.repeat(50)}\n\n${story}\n\n${'═'.repeat(50)}\nGenerated by rover.imagine | Word Count: ~${wordCount}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `rover-${selectedNFT.identifier}-story.txt`; a.click();
      URL.revokeObjectURL(url);
    }
  };
  const resetSearch = () => { setTokenId(''); setSelectedNFT(null); setStory(''); setMission(''); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <BackgroundMusic />
      <TerminalWindow className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-primary/30">
          <div className="text-center overflow-hidden">
            <div className="block md:hidden">
              <h1 className="text-primary text-glow font-terminal text-xl tracking-widest">ROVER.IMAGINE</h1>
              <p className="text-primary/70 font-terminal text-xs mt-1">NFT STORY GENERATOR</p>
            </div>
            <pre className="text-primary text-glow font-terminal text-[6px] sm:text-xs md:text-sm hidden md:inline-block">
{`
██████╗  ██████╗ ██╗   ██╗███████╗██████╗    ██╗███╗   ███╗ █████╗  ██████╗ ██╗███╗   ██╗███████╗
██╔══██╗██╔═══██╗██║   ██║██╔════╝██╔══██╗   ██║████╗ ████║██╔══██╗██╔════╝ ██║████╗  ██║██╔════╝
██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝   ██║██╔████╔██║███████║██║  ███╗██║██╔██╗ ██║█████╗  
██╔══██╗██║   ██║╚██╗ ██╔╝██╔══╝  ██╔══██╗   ██║██║╚██╔╝██║██╔══██║██║   ██║██║██║╚██╗██║██╔══╝  
██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██║  ██║██╗██║██║ ╚═╝ ██║██║  ██║╚██████╔╝██║██║ ╚████║███████╗
╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝
`}
            </pre>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="border-b border-primary/30 flex">
          <button onClick={() => setAppMode('story')} className={cn("flex-1 py-3 font-terminal text-xs sm:text-base transition-all", appMode === 'story' ? "text-primary text-glow bg-primary/10 border-b-2 border-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}>
            STORIES
          </button>
          <button onClick={() => setAppMode('battle')} className={cn("flex-1 py-3 font-terminal text-xs sm:text-base transition-all", appMode === 'battle' ? "text-primary text-glow bg-primary/10 border-b-2 border-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}>
            BATTLES
          </button>
          <button onClick={() => setAppMode('game')} className={cn("flex-1 py-3 font-terminal text-xs sm:text-base transition-all", appMode === 'game' ? "text-primary text-glow bg-primary/10 border-b-2 border-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5")}>
            GAME
          </button>
        </div>

        {/* Game Mode */}
        {appMode === 'game' && <GameHub />}

        {/* Story Generator Mode */}
        {appMode === 'story' && (
          <>
            <div className="p-4 md:p-6 border-b border-primary/30">
              <div className="max-w-2xl mx-auto">
                <div className="text-primary font-terminal text-base md:text-lg mb-4 text-glow text-center">{">"} ENTER ROVER TOKEN ID</div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end justify-center">
                  <TerminalInput label="TOKEN ID" value={tokenId} onChange={setTokenId} placeholder="e.g., 1234" onSubmit={fetchNFT} disabled={isLoadingNFT} />
                  <TerminalButton onClick={fetchNFT} disabled={isLoadingNFT || !tokenId.trim()} variant="primary" className="w-full sm:w-auto">
                    {isLoadingNFT ? 'SCANNING...' : 'LOCATE ROVER'}
                  </TerminalButton>
                </div>
                <div className="text-center text-muted-foreground font-terminal text-sm mt-4">Enter any token ID from the Rovers collection (e.g., 1, 100, 5450)</div>
              </div>
            </div>

            {isLoadingNFT && <div className="p-8"><ASCIILoader text="LOCATING ROVER" /></div>}

            {selectedNFT && !isLoadingNFT && (
              <div className="flex flex-col">
                <div className="border-b border-primary/30 p-4 md:p-6">
                  <div className="text-primary font-terminal text-base md:text-lg mb-4 text-glow">{">"} ROVER DETECTED</div>
                  <div className="mb-4 md:mb-6">
                    <div className="flex justify-center mb-4 md:mb-6">
                      <div className="relative w-full max-w-[768px] aspect-square border border-primary overflow-hidden">
                        {selectedNFT.image_url ? (selectedNFT.image_url.endsWith('.mp4') ? <video src={selectedNFT.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={selectedNFT.image_url} alt={selectedNFT.name} className="w-full h-full object-cover" />) : <div className="w-full h-full flex items-center justify-center text-primary/50 text-xs font-terminal">[NO IMG]</div>}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-primary text-glow font-terminal text-xl sm:text-2xl">{selectedNFT.name}</div>
                      <div className="text-muted-foreground font-terminal text-xs sm:text-sm mt-1">TOKEN ID: {selectedNFT.identifier}</div>
                      {selectedNFT.opensea_url && <a href={selectedNFT.opensea_url} target="_blank" rel="noopener noreferrer" className="text-primary/70 hover:text-primary font-terminal text-xs sm:text-sm underline mt-2 inline-block">{">"} VIEW ON OPENSEA</a>}
                    </div>
                  </div>
                  <ASCIIDivider />
                  <TraitDisplay traits={selectedNFT.traits} className="mt-4" />
                  <ASCIIDivider className="mt-4" />
                  <div className="mt-4"><WordCountSelector value={wordCount} onChange={setWordCount} disabled={isGeneratingStory} /></div>
                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <TerminalButton onClick={generateStory} disabled={isGeneratingStory || isGeneratingMission || !selectedNFT.traits?.length} variant="primary" size="lg">{isGeneratingStory ? 'GENERATING...' : 'GENERATE STORY'}</TerminalButton>
                    <TerminalButton onClick={generateMission} disabled={isGeneratingMission || isGeneratingStory || !selectedNFT.traits?.length} variant="secondary" size="lg">
                      <div className="flex flex-col items-center"><span>{isGeneratingMission ? 'LOADING...' : 'MISSION'}</span><span className="text-[10px] opacity-70 mt-0.5">GENERATE A 50-WORD REPORT</span></div>
                    </TerminalButton>
                    <TerminalButton onClick={resetSearch} variant="secondary" disabled={isGeneratingStory || isGeneratingMission}>NEW SEARCH</TerminalButton>
                  </div>
                  {mission && <div className="mt-4 p-4 border border-primary/50 bg-primary/5">
                    <div className="text-primary font-terminal text-sm mb-2 text-glow">{">"} MISSION LOG:</div>
                    <p className="text-foreground font-terminal text-sm leading-relaxed">{mission}</p>
                    <div className="mt-3">
                      <TerminalButton onClick={() => shareMission(selectedNFT?.name || 'Unknown Rover', mission)} variant="secondary" className="text-xs">
                        𝕏 SHARE MISSION
                      </TerminalButton>
                    </div>
                  </div>}
                  {!selectedNFT.traits?.length && <div className="mt-4 text-destructive font-terminal text-sm border border-destructive/50 p-3">⚠ NO TRAIT DATA AVAILABLE FOR THIS ROVER</div>}
                </div>
                <div className="border-t border-primary/30 p-4 md:p-6">
                  <div className="text-primary font-terminal text-base md:text-lg mb-4 text-glow">{">"} STORY TRANSMISSION [{wordCount} WORDS]</div>
                  <StoryDisplay story={story} isGenerating={isGeneratingStory} roverName={selectedNFT?.name} />
                  {story && !isGeneratingStory && <div className="mt-6 flex flex-wrap gap-3">
                    <TerminalButton onClick={copyToClipboard} variant="secondary">COPY</TerminalButton>
                    <TerminalButton onClick={exportStory} variant="secondary">EXPORT .TXT</TerminalButton>
                  </div>}
                </div>
              </div>
            )}

            {!selectedNFT && !isLoadingNFT && <div className="p-8 text-center"><div className="text-muted-foreground font-terminal">{">"} ENTER A TOKEN ID TO BEGIN ROVER ANALYSIS...</div></div>}
          </>
        )}

        <div className="border-t border-primary/30 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-muted-foreground font-terminal text-xs sm:text-sm">
            <span>ROVER.IMAGINE v1.0.0</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full animate-pulse" />SYSTEM ONLINE</span>
            <span className="hidden sm:inline">BLOCKCHAIN: ETHEREUM</span>
          </div>
        </div>
      </TerminalWindow>
    </div>
  );
};

export default Index;
