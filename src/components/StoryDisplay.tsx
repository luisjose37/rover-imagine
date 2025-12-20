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
      <div className={cn("text-center py-12", className)}>
        <div className="text-6xl mb-6">📖</div>
        <div className="text-muted-foreground font-serif text-lg">
          Select a rover above to generate its story
        </div>
      </div>
    );
  }

  return (
    <div className={cn("font-serif", className)}>
      {/* Story header */}
      <div className="text-primary font-mono text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
        <span>
          {roverName ? `Story of ${roverName}` : 'Incoming Story'}
        </span>
      </div>

      {/* Story content */}
      <div className="relative bg-background border border-border rounded-lg p-6 shadow-sm">
        {isGenerating && !story && (
          <div className="text-center py-8">
            <div className="text-foreground text-lg font-medium">
              Generating Story
            </div>
            <div className="text-muted-foreground text-sm mt-2">
              Analyzing rover traits...
            </div>
            <div className="w-32 h-1 bg-secondary rounded-full overflow-hidden mx-auto mt-4">
              <div className="h-full bg-primary rounded-full animate-pulse w-1/2" />
            </div>
          </div>
        )}

        {displayedText && (
          <div className="space-y-4">
            {displayedText.split('\n\n').map((paragraph, index) => (
              <p 
                key={index} 
                className="text-foreground leading-relaxed text-lg"
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
        <div className="text-muted-foreground text-sm mt-4 flex items-center justify-between font-mono">
          <span>Story complete</span>
          <span>
            {story.split(' ').length} words
          </span>
        </div>
      )}
    </div>
  );
};