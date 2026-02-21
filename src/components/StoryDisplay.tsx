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

  useEffect(() => {
    setDisplayedText(story);
  }, [story]);

  if (!story && !isGenerating) {
    return (
      <div className={cn("font-win95 text-center py-8", className)}>
        <div className="win95-sunken bg-white p-6 max-w-md mx-auto">
          <div className="text-foreground text-[11px] mb-2">ℹ️ Information</div>
          <div className="text-foreground text-[11px]">
            Select a Rover to begin story generation.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("font-win95", className)}>
      {/* Story header */}
      <div className="text-foreground text-xs font-bold mb-2">
        {roverName ? `Transmission from ${roverName}` : 'Incoming Transmission'}
      </div>

      {/* Story content in sunken text area */}
      <div className="win95-sunken bg-white p-3 min-h-[200px]">
        {isGenerating && !story && (
          <div className="text-center py-8">
            <div className="text-foreground text-[11px] font-bold">
              Generating story...
            </div>
            <div className="text-muted-foreground text-[11px] mt-1">
              Analyzing rover traits
            </div>
          </div>
        )}

        {displayedText && (
          <div className="space-y-3">
            {displayedText.split('\n\n').map((paragraph, index) => (
              <p 
                key={index} 
                className="text-foreground text-[11px] leading-relaxed"
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
        <div className="text-muted-foreground text-[11px] mt-2 flex items-center justify-between">
          <span>Transmission complete</span>
          <span>[{story.split(' ').length} words received]</span>
        </div>
      )}
    </div>
  );
};
