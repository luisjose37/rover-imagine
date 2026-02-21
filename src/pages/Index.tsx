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
import { cn } from '@/lib/utils';
import { shareMission } from '@/lib/shareUtils';

type AppMode = 'story' | 'battle';

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
      toast({ title: "Input Required", description: "Please enter a token ID", variant: "destructive" });
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
      toast({ title: "Rover Located", description: `${data.name} loaded with ${data.traits?.length || 0} traits` });
    } catch (error) {
      toast({ title: "Scan Failed", description: error instanceof Error ? error.message : "Failed to locate rover", variant: "destructive" });
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
      toast({ title: "Complete", description: `Story generated (~${wordCount} words)` });
    } catch (error) {
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
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
      toast({ title: "Mission Logged", description: "Random mission report generated" });
    } catch (error) {
      toast({ title: "Mission Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsGeneratingMission(false);
    }
  }, [selectedNFT, toast]);

  const copyToClipboard = () => { if (story) { navigator.clipboard.writeText(story); toast({ title: "Copied", description: "Story copied to clipboard" }); } };
  const exportStory = () => {
    if (story && selectedNFT) {
      const content = `ROVER.IMAGINE - Story Export\n${'='.repeat(50)}\n\nRover: ${selectedNFT.name}\nToken ID: ${selectedNFT.identifier}\n\nTRAITS:\n${selectedNFT.traits?.map(t => `  ${t.trait_type}: ${t.value}`).join('\n') || 'No traits'}\n\n${'='.repeat(50)}\nSTORY:\n${'='.repeat(50)}\n\n${story}\n\n${'='.repeat(50)}\nGenerated by rover.imagine | Word Count: ~${wordCount}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `rover-${selectedNFT.identifier}-story.txt`; a.click();
      URL.revokeObjectURL(url);
    }
  };
  const resetSearch = () => { setTokenId(''); setSelectedNFT(null); setStory(''); setMission(''); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
      {/* Desktop area */}
      <div className="flex-1">
        <TerminalWindow className="max-w-6xl mx-auto" title="Rover.Imagine">
          {/* Menu bar */}
          <div className="bg-card border-b border-border px-1 py-0.5 flex items-center gap-1">
            <span className="text-[11px] px-2 py-0.5 hover:bg-primary hover:text-primary-foreground cursor-pointer">File</span>
            <span className="text-[11px] px-2 py-0.5 hover:bg-primary hover:text-primary-foreground cursor-pointer">Edit</span>
            <span className="text-[11px] px-2 py-0.5 hover:bg-primary hover:text-primary-foreground cursor-pointer">View</span>
            <span className="text-[11px] px-2 py-0.5 hover:bg-primary hover:text-primary-foreground cursor-pointer">Help</span>
          </div>

          {/* Win95 Property Sheet Tabs */}
          <div className="bg-card px-2 pt-2 flex items-end">
            <button
              onClick={() => setAppMode('story')}
              className={cn(
                "win95-tab text-[11px] px-4 py-1",
                appMode === 'story' && "win95-tab-active"
              )}
            >
              📝 Stories
            </button>
            <button
              onClick={() => setAppMode('battle')}
              className={cn(
                "win95-tab text-[11px] px-4 py-1",
                appMode === 'battle' && "win95-tab-active"
              )}
            >
              ⚔️ Battles
            </button>
          </div>

          {/* Tab content area */}
          <div className="bg-card border-t-2 border-t-white">
            {/* Story Generator Mode */}
            {appMode === 'story' && (
              <>
                <div className="p-4 md:p-6 border-b border-border">
                  <div className="max-w-2xl mx-auto">
                    <div className="text-foreground font-win95 text-xs font-bold mb-3 text-center">Enter Rover Token ID</div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-end justify-center">
                      <TerminalInput label="Token ID" value={tokenId} onChange={setTokenId} placeholder="e.g., 1234" onSubmit={fetchNFT} disabled={isLoadingNFT} />
                      <TerminalButton onClick={fetchNFT} disabled={isLoadingNFT || !tokenId.trim()} variant="primary">
                        {isLoadingNFT ? 'Scanning...' : 'Locate Rover'}
                      </TerminalButton>
                    </div>
                    <div className="text-center text-muted-foreground font-win95 text-[11px] mt-3">Enter any token ID from the Rovers collection (e.g., 1, 100, 5450)</div>
                  </div>
                </div>

                {isLoadingNFT && <div className="p-8"><ASCIILoader text="Locating Rover" /></div>}

                {selectedNFT && !isLoadingNFT && (
                  <div className="flex flex-col">
                    <div className="border-b border-border p-4 md:p-6">
                      <div className="text-foreground font-win95 text-xs font-bold mb-3">Rover Detected</div>
                      <div className="mb-4 md:mb-6">
                        <div className="flex justify-center mb-4 md:mb-6">
                          <div className="relative w-full max-w-[768px] aspect-square win95-sunken overflow-hidden">
                            {selectedNFT.image_url ? (selectedNFT.image_url.endsWith('.mp4') ? <video src={selectedNFT.image_url} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={selectedNFT.image_url} alt={selectedNFT.name} className="w-full h-full object-cover" />) : <div className="w-full h-full flex items-center justify-center text-muted text-[11px] font-win95">[No Image]</div>}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-foreground font-win95 text-sm font-bold">{selectedNFT.name}</div>
                          <div className="text-muted-foreground font-win95 text-[11px] mt-1">Token ID: {selectedNFT.identifier}</div>
                          {selectedNFT.opensea_url && <a href={selectedNFT.opensea_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-win95 text-[11px] mt-1 inline-block">View on OpenSea</a>}
                        </div>
                      </div>
                      <ASCIIDivider />
                      <TraitDisplay traits={selectedNFT.traits} className="mt-4" />
                      <ASCIIDivider className="mt-4" />
                      <div className="mt-4"><WordCountSelector value={wordCount} onChange={setWordCount} disabled={isGeneratingStory} /></div>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        <TerminalButton onClick={generateStory} disabled={isGeneratingStory || isGeneratingMission || !selectedNFT.traits?.length} variant="primary" size="lg">{isGeneratingStory ? 'Generating...' : 'Generate Story'}</TerminalButton>
                        <TerminalButton onClick={generateMission} disabled={isGeneratingMission || isGeneratingStory || !selectedNFT.traits?.length} variant="secondary" size="lg">
                          {isGeneratingMission ? 'Loading...' : 'Mission Report'}
                        </TerminalButton>
                        <TerminalButton onClick={resetSearch} variant="secondary" disabled={isGeneratingStory || isGeneratingMission}>New Search</TerminalButton>
                      </div>
                      {mission && <div className="mt-4 p-3 win95-sunken bg-white">
                        <div className="text-foreground font-win95 text-[11px] font-bold mb-1">Mission Log:</div>
                        <p className="text-foreground font-win95 text-[11px] leading-relaxed">{mission}</p>
                        <div className="mt-2">
                          <TerminalButton onClick={() => shareMission(selectedNFT?.name || 'Unknown Rover', mission)} variant="secondary" size="sm">
                            𝕏 Share Mission
                          </TerminalButton>
                        </div>
                      </div>}
                      {!selectedNFT.traits?.length && <div className="mt-4 text-destructive font-win95 text-[11px] win95-sunken bg-white p-2">⚠ No trait data available for this rover</div>}
                    </div>
                    <div className="border-t border-border p-4 md:p-6">
                      <div className="text-foreground font-win95 text-xs font-bold mb-3">Story [{wordCount} words]</div>
                      <StoryDisplay story={story} isGenerating={isGeneratingStory} roverName={selectedNFT?.name} />
                      {story && !isGeneratingStory && <div className="mt-4 flex flex-wrap gap-2">
                        <TerminalButton onClick={copyToClipboard} variant="secondary">Copy</TerminalButton>
                        <TerminalButton onClick={exportStory} variant="secondary">Export .TXT</TerminalButton>
                      </div>}
                    </div>
                  </div>
                )}

                {!selectedNFT && !isLoadingNFT && <div className="p-8 text-center"><div className="text-muted-foreground font-win95 text-[11px]">Enter a Token ID to begin rover analysis...</div></div>}
              </>
            )}

            {/* Battle Mode */}
            {appMode === 'battle' && <BattleSimulator />}
          </div>

          {/* Status bar */}
          <div className="bg-card border-t border-border">
            <div className="flex items-center text-[11px] font-win95">
              <div className="flex-1 win95-sunken px-2 py-0.5 mx-0.5 mb-0.5">Rover.Imagine v1.0.0</div>
              <div className="win95-sunken px-2 py-0.5 mx-0.5 mb-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(120 60% 35%)' }} />
                Online
              </div>
              <div className="win95-sunken px-2 py-0.5 mx-0.5 mb-0.5 hidden sm:block">Ethereum</div>
            </div>
          </div>
        </TerminalWindow>
      </div>

      {/* Win95 Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card win95-raised border-t-2 border-t-white px-1 py-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button className="win95-button !py-0.5 !px-2 !min-w-0 flex items-center gap-1 font-bold text-[11px]">
            <span className="text-sm">🪟</span> Start
          </button>
          <div className="h-5 w-[2px] bg-border mx-1" />
          <BackgroundMusic />
        </div>
        <div className="win95-sunken px-2 py-0.5 text-[11px] font-win95">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Spacer for taskbar */}
      <div className="h-8" />
    </div>
  );
};

export default Index;
