import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({ 
  title = "ROVER.IMAGINE", 
  children,
  className 
}) => {
  return (
    <div className={cn(
      "relative bg-background border border-primary ascii-box",
      "overflow-hidden",
      className
    )}>
      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />
      
      {/* Terminal header */}
      <div className="border-b border-primary px-4 py-2 flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-3">
          <span className="text-primary text-glow font-terminal text-lg">╔═</span>
          <span className="text-primary text-glow font-terminal text-xl tracking-widest">
            {title}
          </span>
          <span className="text-primary text-glow font-terminal text-lg">═╗</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-terminal text-sm">
            v1.0.0
          </span>
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
        </div>
      </div>
      
      {/* Terminal content */}
      <div className="relative crt-flicker">
        {children}
      </div>
    </div>
  );
};
