import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  prefixElement,
  suffixElement,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-alphabag-subtext flex justify-between items-center">
          <span>{label}</span>
        </label>
      )}
      <div className={`relative flex items-center bg-[#0B0E11] border rounded transition-colors duration-150 ${
        error 
          ? 'border-rose-500/60 focus-within:border-rose-500' 
          : 'border-[#2B313A] focus-within:border-alphabag-yellow'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {prefixElement && (
          <div className="pl-3 pr-1 text-alphabag-subtext flex items-center shrink-0">
            {prefixElement}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full bg-transparent px-3 py-2 text-xs text-alphabag-text placeholder:text-alphabag-subtext/60 focus:outline-none disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {suffixElement && (
          <div className="pr-3 pl-1 text-alphabag-subtext text-xs flex items-center shrink-0 select-none">
            {suffixElement}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-[11px] text-rose-400 mt-0.5">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-alphabag-subtext mt-0.5">{helperText}</span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
