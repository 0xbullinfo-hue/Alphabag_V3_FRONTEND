import React, { forwardRef, useCallback } from 'react';

export interface DecimalInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (val: string) => void;
  maxDecimals?: number;
  min?: number;
  max?: number;
  label?: string;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const sanitizeDecimalString = (raw: string, maxDecimals = 18): string => {
  let val = raw.trim();

  // Handle cases where both comma and dot are present (e.g. 1,234.56 or 1.234,56)
  if (val.includes(',') && val.includes('.')) {
    const lastComma = val.lastIndexOf(',');
    const lastDot = val.lastIndexOf('.');
    if (lastComma < lastDot) {
      // 1,234.56 -> comma is thousand separator
      val = val.replace(/,/g, '');
    } else {
      // 1.234,56 -> dot is thousand separator, comma is decimal point
      val = val.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (val.includes(',')) {
    val = val.replace(/,/g, '.');
  }

  // Strip invalid characters: only keep digits and dot
  val = val.replace(/[^0-9.]/g, '');

  // Ensure at most one dot
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }

  // Enforce max decimals
  if (val.includes('.') && maxDecimals >= 0) {
    const [whole, decimals] = val.split('.');
    val = whole + '.' + (decimals || '').slice(0, maxDecimals);
  }

  return val;
};

export const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(({
  value,
  onValueChange,
  maxDecimals = 18,
  min,
  max,
  label,
  prefixElement,
  suffixElement,
  error,
  helperText,
  className = '',
  disabled,
  placeholder = '0.0',
  onKeyDown,
  onPaste,
  onBlur,
  ...props
}, ref) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Block scientific notation and sign operators
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Block multiple dots or commas if already present
    if ((e.key === '.' || e.key === ',') && value.includes('.')) {
      e.preventDefault();
      return;
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [value, onKeyDown]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const sanitized = sanitizeDecimalString(pastedData, maxDecimals);
    if (sanitized) {
      onValueChange(sanitized);
    }
    if (onPaste) {
      onPaste(e);
    }
  }, [maxDecimals, onValueChange, onPaste]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeDecimalString(raw, maxDecimals);
    onValueChange(sanitized);
  }, [maxDecimals, onValueChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    let finalVal = value;
    if (finalVal.endsWith('.')) {
      finalVal = finalVal.slice(0, -1);
    }
    if (finalVal !== '') {
      const numVal = parseFloat(finalVal);
      if (!isNaN(numVal)) {
        if (min !== undefined && numVal < min) {
          finalVal = min.toString();
        } else if (max !== undefined && numVal > max) {
          finalVal = max.toString();
        }
      }
    }
    if (finalVal !== value) {
      onValueChange(finalVal);
    }
    if (onBlur) {
      onBlur(e);
    }
  }, [value, min, max, onValueChange, onBlur]);

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
          type="text"
          inputMode="decimal"
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          className={`w-full bg-transparent px-3 py-2 text-xs font-mono tabular-nums text-alphabag-text placeholder:text-alphabag-subtext/60 focus:outline-none disabled:cursor-not-allowed ${className}`}
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

DecimalInput.displayName = 'DecimalInput';
