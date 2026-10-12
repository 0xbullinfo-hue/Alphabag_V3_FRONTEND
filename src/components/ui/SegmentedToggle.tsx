import React from 'react';

export interface ToggleOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SegmentedToggleProps<T extends string = string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  variant?: 'pill' | 'tab';
}

export function SegmentedToggle<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
  variant = 'pill',
}: SegmentedToggleProps<T>) {
  const sizeClasses = {
    xs: 'text-[11px] py-1 px-2.5',
    sm: 'text-xs py-1.5 px-3',
    md: 'text-xs py-2 px-3.5',
  };

  if (variant === 'tab') {
    return (
      <div className={`flex items-center border-b border-[#2B313A] gap-4 ${className}`}>
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors duration-150 select-none ${
                isActive
                  ? 'border-alphabag-yellow text-alphabag-yellow'
                  : 'border-transparent text-alphabag-subtext hover:text-alphabag-text'
              }`}
            >
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center bg-[#0B0E11] border border-[#2B313A] rounded p-0.5 gap-0.5 ${className}`}>
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-[3px] font-medium transition-colors duration-150 flex items-center gap-1.5 select-none ${sizeClasses[size]} ${
              isActive
                ? 'bg-[#202630] text-alphabag-text font-semibold shadow-none'
                : 'text-alphabag-subtext hover:text-alphabag-text bg-transparent'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
