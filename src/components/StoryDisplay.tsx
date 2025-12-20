import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { BlinkingCursor } from './ASCIIElements';

interface StoryDisplayProps {
  story: string;
  isGenerating: boolean;
  roverName?: string;
  className?: string;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ 
  story, 
  isGenerating,
  roverName,
  className 
}) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typing effect for the story
  useEffect(() => {
    setDisplayedText(story);
  }, [story]);

  if (!story && !isGenerating) {
    return (
      <div className={cn("font-terminal text-center py-12", className)}>
        <pre className="text-primary/40 text-glow text-xs mb-6">
{`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║     SELECT A ROVER TO BEGIN           ║
    ║     STORY GENERATION PROTOCOL         ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
`}
        </pre>
        <div className="text-muted-foreground">
          {">"} AWAITING ROVER SELECTION...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("font-terminal", className)}>
      {/* Story header */}
      <div className="text-primary text-glow text-lg mb-4 flex items-center gap-2">
        <span>{">>>"}</span>
        <span className="uppercase tracking-wider">
          {roverName ? `TRANSMISSION FROM ${roverName}` : 'INCOMING TRANSMISSION'}
        </span>
        <span className="flex-1 overflow-hidden text-primary/30">
          {'═'.repeat(20)}
        </span>
      </div>

      {/* Story content */}
      <div className="relative bg-card/30 border border-primary/30 p-4">
        {/* Corner decorations */}
        <span className="absolute top-0 left-0 text-primary text-glow">╔</span>
        <span className="absolute top-0 right-0 text-primary text-glow">╗</span>
        <span className="absolute bottom-0 left-0 text-primary text-glow">╚</span>
        <span className="absolute bottom-0 right-0 text-primary text-glow">╝</span>

        {isGenerating && !story && (
          <div className="text-center py-8">
            <div className="text-primary glow-pulse text-lg">
              GENERATING STORY
            </div>
            <div className="text-muted-foreground text-sm mt-2 loading-dots">
              ANALYZING ROVER TRAITS
            </div>
            <pre className="text-primary/30 text-xs mt-4">
{`
   [████████░░░░░░░░░░]  42%
   PROCESSING NEURAL PATHWAYS...
`}
            </pre>
          </div>
        )}

        {displayedText && (
          <div className="space-y-4">
            {displayedText.split('\n\n').map((paragraph, index) => (
              <p 
                key={index} 
                className="text-primary text-glow leading-relaxed text-lg"
              >
                {paragraph}
              </p>
            ))}
            {isGenerating && <BlinkingCursor />}
          </div>
        )}
      </div>

      {/* Footer */}
      {story && !isGenerating && (
        <div className="text-muted-foreground text-sm mt-4 flex items-center justify-between">
          <span>{">"} TRANSMISSION COMPLETE</span>
          <span className="text-primary/50">
            [{story.split(' ').length} WORDS RECEIVED]
          </span>
        </div>
      )}
    </div>
  );
};
