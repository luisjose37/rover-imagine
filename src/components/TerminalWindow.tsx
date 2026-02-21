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
      "relative bg-card win95-raised",
      "overflow-hidden",
      className
    )}>
      {/* Win95 Title Bar */}
      <div className="win95-titlebar px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs">📁</span>
          <span className="text-primary-foreground font-win95 text-sm font-bold tracking-normal">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-[2px]">
          <button className="win95-button !p-0 !min-w-[16px] w-[16px] h-[14px] flex items-center justify-center text-[10px] leading-none">_</button>
          <button className="win95-button !p-0 !min-w-[16px] w-[16px] h-[14px] flex items-center justify-center text-[10px] leading-none">□</button>
          <button className="win95-button !p-0 !min-w-[16px] w-[16px] h-[14px] flex items-center justify-center text-[10px] leading-none font-bold">×</button>
        </div>
      </div>
      
      {/* Window content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
