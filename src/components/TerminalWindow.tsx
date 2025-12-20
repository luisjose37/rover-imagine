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
      "relative bg-card border border-border rounded-lg shadow-page",
      "overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-secondary/50">
        <div className="flex items-center gap-3">
          <span className="text-primary font-mono text-xl tracking-wide font-semibold">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-sm">
            v1.0.0
          </span>
          <span className="w-2 h-2 bg-accent rounded-full animate-gentle-pulse" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};