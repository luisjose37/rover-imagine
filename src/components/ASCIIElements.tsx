import React from 'react';
import { cn } from '@/lib/utils';

interface ASCIIBoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const ASCIIBox: React.FC<ASCIIBoxProps> = ({ children, className, title }) => {
  return (
    <div className={cn("relative border border-border rounded-lg bg-card p-4", className)}>
      {title && (
        <div className="absolute -top-3 left-4 bg-card px-2 text-sm font-medium text-muted-foreground">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

interface ASCIILoaderProps {
  text?: string;
}

export const ASCIILoader: React.FC<ASCIILoaderProps> = ({ text = "Loading" }) => {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-foreground font-mono text-lg">
          {text}...
        </span>
      </div>
      <div className="text-6xl mt-2">🤖</div>
    </div>
  );
};

export const ASCIIDivider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("border-t border-border my-4", className)} />
  );
};

export const BlinkingCursor: React.FC = () => {
  return (
    <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-1" />
  );
};