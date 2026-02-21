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
    <div className={cn("font-win95 w-full sm:w-auto", className)}>
      <label className="block text-foreground text-[11px] mb-1">
        {label}:
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full bg-white text-foreground win95-sunken",
          "px-2 py-1 font-win95 text-[11px]",
          "placeholder:text-muted",
          "focus:outline-none",
          "disabled:bg-card disabled:cursor-not-allowed"
        )}
      />
    </div>
  );
};
