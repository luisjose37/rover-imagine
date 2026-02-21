import React from 'react';
import { cn } from '@/lib/utils';

export type WordCountOption = 100 | 250 | 500 | 1000 | 1500;

interface WordCountSelectorProps {
  value: WordCountOption;
  onChange: (value: WordCountOption) => void;
  disabled?: boolean;
}

const options: Array<{ value: WordCountOption; label: string }> = [
  { value: 100, label: '100' },
  { value: 250, label: '250' },
  { value: 500, label: '500' },
  { value: 1000, label: '1000' },
  { value: 1500, label: '1500' },
];

export const WordCountSelector: React.FC<WordCountSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="font-win95 win95-groupbox relative w-full">
      <span className="absolute -top-2 left-3 bg-card px-1 text-[11px]">
        Story Length
      </span>
      <div className="flex flex-wrap gap-3 justify-center py-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-1 text-[11px] cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="radio"
              name="wordCount"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="accent-primary"
            />
            {option.label} words
          </label>
        ))}
      </div>
    </div>
  );
};
