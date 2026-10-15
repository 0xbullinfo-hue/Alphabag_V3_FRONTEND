import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DecimalInput, sanitizeDecimalString } from '../../src/components/ui/DecimalInput';

describe('sanitizeDecimalString', () => {
  it('strips non-numeric characters and converts comma to dot', () => {
    expect(sanitizeDecimalString('12,34')).toBe('12.34');
    expect(sanitizeDecimalString('12a3b4')).toBe('1234');
    expect(sanitizeDecimalString('$150.50')).toBe('150.50');
  });

  it('preserves only the first decimal dot', () => {
    expect(sanitizeDecimalString('12.34.56')).toBe('12.3456');
  });

  it('restricts decimal places to maxDecimals', () => {
    expect(sanitizeDecimalString('12.345678', 2)).toBe('12.34');
    expect(sanitizeDecimalString('12.345678', 4)).toBe('12.3456');
    expect(sanitizeDecimalString('12.345678', 0)).toBe('12.');
  });
});

describe('DecimalInput component', () => {
  it('renders input with decimal mode and custom placeholder', () => {
    const handleValueChange = vi.fn();
    render(
      <DecimalInput
        value=""
        onValueChange={handleValueChange}
        placeholder="Enter amount"
        data-testid="decimal-input"
      />
    );

    const input = screen.getByTestId('decimal-input') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.placeholder).toBe('Enter amount');
  });

  it('prevents typing scientific notation e, E and signs +, -', () => {
    const handleValueChange = vi.fn();
    render(
      <DecimalInput
        value="10"
        onValueChange={handleValueChange}
        data-testid="decimal-input"
      />
    );

    const input = screen.getByTestId('decimal-input');
    const blockedKeys = ['e', 'E', '+', '-'];

    blockedKeys.forEach((key) => {
      const event = fireEvent.keyDown(input, { key });
      expect(event).toBe(false); // defaultPrevented
    });
  });

  it('prevents typing a second decimal point or comma when dot exists', () => {
    const handleValueChange = vi.fn();
    render(
      <DecimalInput
        value="10.5"
        onValueChange={handleValueChange}
        data-testid="decimal-input"
      />
    );

    const input = screen.getByTestId('decimal-input');
    expect(fireEvent.keyDown(input, { key: '.' })).toBe(false);
    expect(fireEvent.keyDown(input, { key: ',' })).toBe(false);
  });

  it('sanitizes pasted values', () => {
    const handleValueChange = vi.fn();
    render(
      <DecimalInput
        value=""
        onValueChange={handleValueChange}
        maxDecimals={2}
        data-testid="decimal-input"
      />
    );

    const input = screen.getByTestId('decimal-input');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '1,234.567'
      }
    });

    expect(handleValueChange).toHaveBeenCalledWith('1234.56');
  });

  it('clamps values to min and max on blur', () => {
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <DecimalInput
        value="0.5"
        min={1}
        max={100}
        onValueChange={handleValueChange}
        data-testid="decimal-input"
      />
    );

    const input = screen.getByTestId('decimal-input');
    fireEvent.blur(input);
    expect(handleValueChange).toHaveBeenCalledWith('1');

    handleValueChange.mockClear();
    rerender(
      <DecimalInput
        value="150"
        min={1}
        max={100}
        onValueChange={handleValueChange}
        data-testid="decimal-input"
      />
    );
    fireEvent.blur(input);
    expect(handleValueChange).toHaveBeenCalledWith('100');
  });
});
