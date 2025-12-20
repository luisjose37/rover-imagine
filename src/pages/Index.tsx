import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TerminalWindow } from '@/components/TerminalWindow';
import { TraitDisplay } from '@/components/TraitDisplay';
import { StoryDisplay } from '@/components/StoryDisplay';
import { TerminalButton } from '@/components/TerminalButton';
import { ASCIILoader, ASCIIDivider } from '@/components/ASCIIElements';
import { TerminalInput } from '@/components/TerminalInput';
import { WordCountSelector } from '@/components/WordCountSelector';

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
  const [wordCount, setWordCount] = useState<500 | 1000 | 1500>(500);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const fetchNFT = async () => {
    if (!tokenId.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a token ID",
        variant: "destructive"
      });
      return;
    }
    setIsLoadingNFT(true);
    setSelectedNFT(null);
    setStory('');
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
      if (data.error) {
        throw new Error(data.error);
      }
      setSelectedNFT(data);
      toast({
        title: "Rover Located",
        description: `${data.name} loaded with ${data.traits?.length || 0} traits`
      });
    } catch (error) {
      console.error('Error fetching NFT:', error);
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to locate rover",
        variant: "destructive"
      });
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const generateStory = useCallback(async () => {
    if (!selectedNFT) return;
    if (!selectedNFT.traits || selectedNFT.traits.length === 0) {
      toast({
        title: "No Traits Detected",
        description: "This rover has no trait data available for story generation",
        variant: "destructive"
      });
      return;
    }
    setIsGeneratingStory(true);
    setStory('');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roverName: selectedNFT.name,
          traits: selectedNFT.traits,
          wordCount: wordCount
        })
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
        title: "Story Complete",
        description: `Story generated (~${wordCount} words)`
      });
    } catch (error) {
      console.error('Error generating story:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  }, [selectedNFT, wordCount, toast]);

  const copyToClipboard = () => {
    if (story) {
      navigator.clipboard.writeText(story);
      toast({
        title: "Copied",
        description: "Story copied to clipboard"
      });
    }
  };

  const exportStory = () => {
    if (story && selectedNFT) {
      const traitsText = selectedNFT.traits?.map(t => `  ${t.trait_type}: ${t.value}`).join('\n') || 'No traits';
      const content = `ROVER.IMAGINE - Story Export
${'─'.repeat(50)}

Rover: ${selectedNFT.name}
Token ID: ${selectedNFT.identifier}

TRAITS:
${traitsText}

${'─'.repeat(50)}
STORY:
${'─'.repeat(50)}

${story}

${'─'.repeat(50)}
Generated by rover.imagine | Word Count: ~${wordCount}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rover-${selectedNFT.identifier}-story.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetSearch = () => {
    setTokenId('');
    setSelectedNFT(null);
    setStory('');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <TerminalWindow className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="p-8 border-b border-border">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground tracking-tight">
              Rover.Imagine
            </h1>
            <p className="text-muted-foreground mt-2 font-serif text-lg">
              Generate unique stories for your Rovers NFT
            </p>
          </div>
        </div>

        {/* Token ID Input Section */}
        <div className="p-6 border-b border-border">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <span className="text-foreground font-mono text-sm uppercase tracking-wider">
                Enter Rover Token ID
              </span>
            </div>
            
            <div className="flex gap-3 items-end justify-center flex-wrap">
              <TerminalInput 
                label="Token ID" 
                value={tokenId} 
                onChange={setTokenId} 
                placeholder="e.g., 1234" 
                onSubmit={fetchNFT} 
                disabled={isLoadingNFT} 
              />
              
              <TerminalButton 
                onClick={fetchNFT} 
                disabled={isLoadingNFT || !tokenId.trim()} 
                variant="primary"
              >
                {isLoadingNFT ? 'Searching...' : 'Find Rover'}
              </TerminalButton>
            </div>

            <div className="text-center text-muted-foreground text-sm mt-4">
              Enter any token ID from the Rovers collection (e.g., 1, 100, 5450)
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingNFT && (
          <div className="p-8">
            <ASCIILoader text="Locating Rover" />
          </div>
        )}

        {/* NFT Details and Story Generation */}
        {selectedNFT && !isLoadingNFT && (
          <div className="flex flex-col">
            {/* NFT details panel */}
            <div className="border-b border-border p-6">
              <div className="text-center mb-6">
                <span className="text-primary font-mono text-sm uppercase tracking-wider">
                  Rover Found
                </span>
              </div>

              {/* NFT Preview */}
              <div className="mb-6">
                {/* NFT Image - Centered */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-[768px] h-[768px] max-w-full aspect-square border border-border rounded-lg overflow-hidden shadow-page">
                    {selectedNFT.image_url ? (
                      selectedNFT.image_url.endsWith('.mp4') ? (
                        <video 
                          src={selectedNFT.image_url} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <img 
                          src={selectedNFT.image_url} 
                          alt={selectedNFT.name} 
                          className="w-full h-full object-cover" 
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
                
                {/* NFT Info - Centered below image */}
                <div className="text-center">
                  <h2 className="text-foreground font-serif text-3xl font-semibold">
                    {selectedNFT.name}
                  </h2>
                  <div className="text-muted-foreground font-mono text-sm mt-1">
                    Token ID: {selectedNFT.identifier}
                  </div>
                  {selectedNFT.opensea_url && (
                    <a 
                      href={selectedNFT.opensea_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:text-accent font-mono text-sm mt-2 inline-block elegant-underline"
                    >
                      View on OpenSea →
                    </a>
                  )}
                </div>
              </div>

              <ASCIIDivider />
              
              {/* Traits */}
              <TraitDisplay traits={selectedNFT.traits} className="mt-4" />

              <ASCIIDivider className="mt-4" />

              {/* Word Count Selection */}
              <div className="mt-4">
                <WordCountSelector 
                  value={wordCount} 
                  onChange={setWordCount} 
                  disabled={isGeneratingStory} 
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <TerminalButton 
                  onClick={generateStory} 
                  disabled={isGeneratingStory || !selectedNFT.traits || selectedNFT.traits.length === 0} 
                  variant="primary" 
                  size="lg"
                >
                  {isGeneratingStory ? 'Generating...' : 'Generate Story'}
                </TerminalButton>
                
                <TerminalButton 
                  onClick={resetSearch} 
                  variant="secondary" 
                  disabled={isGeneratingStory}
                >
                  New Search
                </TerminalButton>
              </div>

              {(!selectedNFT.traits || selectedNFT.traits.length === 0) && (
                <div className="mt-4 text-destructive text-sm border border-destructive/30 rounded p-3 text-center bg-destructive/5">
                  No trait data available for this rover
                </div>
              )}
            </div>

            {/* Story display panel */}
            <div className="p-6">
              <div className="text-center mb-4">
                <span className="text-primary font-mono text-sm uppercase tracking-wider">
                  Story • {wordCount} words
                </span>
              </div>
              
              <StoryDisplay 
                story={story} 
                isGenerating={isGeneratingStory} 
                roverName={selectedNFT?.name} 
              />

              {story && !isGeneratingStory && (
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <TerminalButton onClick={copyToClipboard} variant="secondary">
                    Copy Story
                  </TerminalButton>
                  <TerminalButton onClick={exportStory} variant="secondary">
                    Export as .txt
                  </TerminalButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no NFT selected */}
        {!selectedNFT && !isLoadingNFT && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <div className="text-muted-foreground font-serif text-lg">
              Enter a token ID above to begin
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between text-muted-foreground font-mono text-xs">
            <span>Rover.Imagine v1.0.0</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-gentle-pulse" />
              Online
            </span>
            <span>Ethereum</span>
          </div>
        </div>
      </TerminalWindow>
    </div>
  );
};

export default Index;