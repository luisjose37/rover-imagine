import React from 'react';
import { cn } from '@/lib/utils';

interface TerminalInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  className?: string;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  onSubmit,
  disabled,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className={cn("font-mono", className)}>
      <label className="block text-muted-foreground text-sm mb-1.5 font-medium">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full bg-background border border-border text-foreground",
          "px-4 py-2.5 font-mono text-lg rounded",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200"
        )}
      />
    </div>
  );
};