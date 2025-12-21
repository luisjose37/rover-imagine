import React from 'react';
import { cn } from '@/lib/utils';

interface ASCIIBoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const ASCIIBox: React.FC<ASCIIBoxProps> = ({ children, className, title }) => {
  return (
    <div className={cn("relative", className)}>
      {/* Top border */}
      <div className="text-primary text-glow font-terminal text-sm">
        ╔{'═'.repeat(title ? Math.max(40 - title.length - 4, 10) : 50)}
        {title && <span className="mx-2">[{title}]</span>}
        {'═'.repeat(title ? 10 : 0)}╗
      </div>
      
      {/* Content with side borders */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 text-primary text-glow font-terminal flex flex-col">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>║</span>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 text-primary text-glow font-terminal flex flex-col">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i}>║</span>
          ))}
        </div>
        <div className="px-6 py-2">
          {children}
        </div>
      </div>
      
      {/* Bottom border */}
      <div className="text-primary text-glow font-terminal text-sm">
        ╚{'═'.repeat(60)}╝
      </div>
    </div>
  );
};

interface ASCIILoaderProps {
  text?: string;
}

export const ASCIILoader: React.FC<ASCIILoaderProps> = ({ text = "LOADING" }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-8 w-full max-w-md mx-auto">
      <div className="w-full">
        <div className="h-3 w-full bg-secondary/50 rounded-sm overflow-hidden border border-primary/30">
          <div 
            className="h-full bg-primary transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary font-terminal text-xl">[</span>
        <span className="text-primary font-terminal text-xl glow-pulse">
          {text}
        </span>
        <span className="text-primary font-terminal text-xl loading-dots"></span>
        <span className="text-primary font-terminal text-xl">]</span>
      </div>
    </div>
  );
};

export const ASCIIDivider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("text-primary/50 font-terminal text-sm text-center py-2", className)}>
      ═══════════════════════════════════════════════════════════
    </div>
  );
};

export const BlinkingCursor: React.FC = () => {
  return (
    <span className="inline-block w-3 h-5 bg-primary animate-blink ml-1" />
  );
};
