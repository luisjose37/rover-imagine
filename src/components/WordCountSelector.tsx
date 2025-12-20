import React from 'react';
import { cn } from '@/lib/utils';

interface WordCountSelectorProps {
  value: 500 | 1000 | 1500;
  onChange: (value: 500 | 1000 | 1500) => void;
  disabled?: boolean;
}

const options: Array<{ value: 500 | 1000 | 1500; label: string }> = [
  { value: 500, label: '500 words' },
  { value: 1000, label: '1000 words' },
  { value: 1500, label: '1500 words' },
];

export const WordCountSelector: React.FC<WordCountSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-muted-foreground text-sm mb-3 font-mono uppercase tracking-wider">
        Select Story Length
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 border rounded transition-all duration-200",
              "font-mono text-sm",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary/50 hover:bg-muted",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};