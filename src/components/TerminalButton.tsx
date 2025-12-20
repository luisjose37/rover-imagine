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
  const baseStyles = "font-mono uppercase tracking-wider transition-all duration-200 border rounded";
  
  const variants = {
    primary: cn(
      "bg-primary text-primary-foreground border-primary",
      "hover:bg-accent hover:border-accent shadow-sm",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
    secondary: cn(
      "bg-secondary text-secondary-foreground border-border",
      "hover:bg-muted hover:border-primary/50",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
    ghost: cn(
      "bg-transparent text-primary border-transparent",
      "hover:bg-secondary hover:border-border",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    ),
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        "reader-button",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};