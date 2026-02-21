import React from 'react';
import { cn } from '@/lib/utils';

interface ASCIIBoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const ASCIIBox: React.FC<ASCIIBoxProps> = ({ children, className, title }) => {
  return (
    <div className={cn("win95-groupbox", className)}>
      {title && (
        <span className="absolute -top-2 left-3 bg-card px-1 text-[11px] font-win95">
          {title}
        </span>
      )}
      {children}
    </div>
  );
};

interface ASCIILoaderProps {
  text?: string;
}

export const ASCIILoader: React.FC<ASCIILoaderProps> = ({ text = "Loading" }) => {
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

  const blocks = Math.floor(progress / 5);

  return (
    <div className="flex flex-col items-center gap-3 py-6 w-full max-w-sm mx-auto">
      <div className="w-full win95-sunken p-1 bg-white">
        <div className="flex h-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 mx-[1px]",
                i < blocks ? "bg-primary" : "bg-transparent"
              )}
            />
          ))}
        </div>
      </div>
      <div className="text-foreground font-win95 text-[11px]">
        {text}... {Math.floor(progress)}%
      </div>
    </div>
  );
};

export const ASCIIDivider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("my-2", className)}>
      <div className="win95-groove" />
    </div>
  );
};

export const BlinkingCursor: React.FC = () => {
  return (
    <span className="inline-block w-[2px] h-[13px] bg-foreground animate-pulse ml-[1px]" />
  );
};
