import React from 'react';
import { cn } from '@/lib/utils';

interface WordCountSelectorProps {
  value: 500 | 1000 | 1500;
  onChange: (value: 500 | 1000 | 1500) => void;
  disabled?: boolean;
}

const options: Array<{ value: 500 | 1000 | 1500; label: string }> = [
  { value: 500, label: '500 WORDS' },
  { value: 1000, label: '1000 WORDS' },
  { value: 1500, label: '1500 WORDS' },
];

export const WordCountSelector: React.FC<WordCountSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="font-terminal flex flex-col items-center">
      <div className="text-muted-foreground text-sm mb-2">
        {">"} SELECT STORY LENGTH:
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 border transition-all duration-200",
              "font-terminal text-sm",
              value === option.value
                ? "border-primary bg-primary text-primary-foreground border-glow"
                : "border-primary/30 text-primary/70 hover:border-primary/60 hover:text-primary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            [{value === option.value ? '●' : '○'}] {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
