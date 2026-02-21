import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const TerminalButton: React.FC<TerminalButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  disabled,
  ...props
}) => {
  const sizes = {
    sm: "px-2 py-1 text-[11px]",
    md: "px-4 py-1 text-[11px]",
    lg: "px-6 py-1.5 text-xs",
  };

  return (
    <button
      className={cn(
        "win95-button font-win95",
        sizes[size],
        disabled && "!text-muted !cursor-default",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
