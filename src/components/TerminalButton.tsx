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
  const baseStyles = "font-terminal uppercase tracking-wider transition-all duration-200 border";
  
  const variants = {
    primary: cn(
      "bg-primary text-primary-foreground border-primary",
      "hover:bg-background hover:text-primary hover:border-glow-strong",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
    secondary: cn(
      "bg-background text-primary border-primary/50",
      "hover:border-primary hover:border-glow",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
    ghost: cn(
      "bg-transparent text-primary border-transparent",
      "hover:border-primary/50",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
  };

  const sizes = {
    sm: "px-2 sm:px-3 py-1 text-xs sm:text-sm",
    md: "px-3 sm:px-4 py-2 text-sm sm:text-base",
    lg: "px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "terminal-button",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <span className="flex items-center gap-2">
        <span className="text-glow">[</span>
        {children}
        <span className="text-glow">]</span>
      </span>
    </button>
  );
};
