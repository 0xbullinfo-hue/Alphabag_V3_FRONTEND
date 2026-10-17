import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Calculator } from '../../src/pages/frontend/Calculator';

// Mock api to prevent network calls in tests
vi.mock('../../src/services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: {
        bitcoin: { usd: 65000 },
        ethereum: { usd: 3500 },
        solana: { usd: 150 },
      },
    }),
  },
}));

describe('Alpha Calculator - Core Mathematical Verification', () => {
  it('calculates correct figures for default Leverage mode on Dashboard', () => {
    render(<Calculator minimal={false} />);

    // Default values: entry 65000, margin 1000, lev 10x, TP 70000, SL 62500
    // Position Size: 1000 * 10 = $10,000.00
    // Long Liq: 65000 * ((1 - 0.1) / (1 - 0.005)) = 65000 * 0.9 / 0.995 = 58,793.97
    // TP PnL: 10000 * (5000 / 65000) = +$769.23 (+76.9%)
    // SL PnL: 10000 * (-2500 / 65000) = -$384.62 (-38.5%)
    expect(screen.getByText('Alpha Calculator')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument(); // Position size
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();  // Margin
    expect(screen.getAllByText('10x').length).toBeGreaterThanOrEqual(1);        // Leverage
    expect(screen.getByText('$58,793.97')).toBeInTheDocument(); // Exact Binance Long Liq
    expect(screen.getByText('+$769.23 (+76.9%)')).toBeInTheDocument(); // TP P&L
    expect(screen.getByText('-$384.62 (-38.5%)')).toBeInTheDocument(); // SL P&L
  });

  it('calculates and displays TP and SL P&L on Landing Page (minimal mode)', () => {
    render(<Calculator minimal={true} />);

    // In minimal mode on landing page, position size, liq price, and TP/SL must all be visible
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
    expect(screen.getByText('$58,793.97')).toBeInTheDocument();
    expect(screen.getByText('+$769.23 (+76.9%)')).toBeInTheDocument();
    expect(screen.getByText('-$384.62 (-38.5%)')).toBeInTheDocument();
  });

  it('calculates correct figures for Short direction with inverted TP/SL', async () => {
    render(<Calculator minimal={false} />);

    const shortButton = screen.getByText('↓ Short');
    fireEvent.click(shortButton);

    // Switching to short flips TP delta (+5000 -> -5000 = 60000) and SL delta (-2500 -> +2500 = 67500)
    // Short Liq: 65000 * ((1 + 0.1) / (1 + 0.005)) = 65000 * 1.1 / 1.005 = 71,144.28
    // Short TP @ 60000: 10000 * (65000 - 60000) / 65000 = +$769.23 (+76.9%)
    // Short SL @ 67500: 10000 * (65000 - 67500) / 65000 = -$384.62 (-38.5%)
    expect(screen.getByText('$71,144.28')).toBeInTheDocument();
    expect(screen.getByText('+$769.23 (+76.9%)')).toBeInTheDocument();
    expect(screen.getByText('-$384.62 (-38.5%)')).toBeInTheDocument();
  });

  it('unleveraged 1x Long has liquidation price of $0.00', () => {
    render(<Calculator minimal={false} />);

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '1' } });

    // 1x leverage: (1 - 1/1) = 0 -> liqPrice = $0.00
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('warns when SL is below liquidation price for Long', () => {
    render(<Calculator minimal={false} />);

    // Liquidation price is ~58,793.97. Setting SL to 50000 should trigger warning
    const slInput = screen.getByPlaceholderText('62500');
    fireEvent.change(slInput, { target: { value: '50000' } });

    expect(screen.getByText(/SL is below liquidation price/i)).toBeInTheDocument();
  });

  it('calculates correct Spot figures and break-even', () => {
    render(<Calculator minimal={false} />);

    const spotTab = screen.getByText('Spot');
    fireEvent.click(spotTab);

    // Defaults: buy 3200, sell 3600, amount 2.5, fee 0.1%
    // Total cost: 3200 * 2.5 = $8,000.00
    // Total rev: 3600 * 2.5 = $9,000.00
    // Fees: (8000 + 9000) * 0.001 = $17.00
    // Gross: $1,000.00
    // Net: $983.00 (+12.3%)
    // Break-even: 3200 * 1.001 / 0.999 = $3,206.41
    expect(screen.getByText('$8,000.00')).toBeInTheDocument();
    expect(screen.getByText('$9,000.00')).toBeInTheDocument();
    expect(screen.getByText('$17.00')).toBeInTheDocument();
    expect(screen.getByText('+$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('+$983.00 (+12.3%)')).toBeInTheDocument();
    expect(screen.getByText('$3,206.41')).toBeInTheDocument();
  });

  it('calculates correct Degen EV and multiple without negative sign bugs', () => {
    render(<Calculator minimal={false} />);

    const degenTab = screen.getByText('Degen');
    fireEvent.click(degenTab);

    // Defaults: inv 1000, entryMC 250000, targetMC 1000000, rug 30%
    // Multiple: 4.00x
    // Target Value: $4,000.00
    // Net Profit: +$3,000.00 (+300%)
    // EV: (4000 * 0.7) - 1000 = +$1,800.00 (Positive EV)
    expect(screen.getByText('4.00x')).toBeInTheDocument();
    expect(screen.getByText('$4,000.00')).toBeInTheDocument();
    expect(screen.getByText('+$3,000.00 (+300%)')).toBeInTheDocument();
    expect(screen.getByText('Positive EV')).toBeInTheDocument();
    expect(screen.getByText('+$1,800.00')).toBeInTheDocument();

    // Verify negative ROI does not produce (+-50%)
    const targetInput = screen.getByPlaceholderText('1000000');
    fireEvent.change(targetInput, { target: { value: '125000' } }); // 0.5x, -50% ROI
    expect(screen.getByText('0.50x')).toBeInTheDocument();
    expect(screen.getByText('-$500.00 (-50%)')).toBeInTheDocument(); // clean sign without "+-"
  });

  it('calculates Impermanent Loss with both positive and negative percentage changes', () => {
    render(<Calculator minimal={false} />);

    const ilTab = screen.getByText('IL Risk');
    fireEvent.click(ilTab);

    // Defaults: A = +50%, B = +10%
    // ratioA = 1.5, ratioB = 1.1, k = 1.363636
    // IL = 2*sqrt(1.363636)/(1 + 1.363636) - 1 = 0.988095 - 1 = -0.011905 -> 1.19%
    expect(screen.getByText('1.19%')).toBeInTheDocument();

    // Test negative price change (Asset A -20%, Asset B 0%)
    const inputA = screen.getByPlaceholderText('e.g. 50 or -20');
    const inputB = screen.getByPlaceholderText('e.g. 10 or -15');
    fireEvent.change(inputA, { target: { value: '-20' } });
    fireEvent.change(inputB, { target: { value: '0' } });

    // ratioA = 0.8, ratioB = 1.0, k = 0.8
    // IL = 2*sqrt(0.8)/1.8 - 1 = 1.78885/1.8 - 1 = -0.00619 -> 0.62%
    expect(screen.getByText('0.62%')).toBeInTheDocument();
  });

  it('enables IL Risk and Instant Converter interactive controls on Landing Page (minimal mode)', () => {
    render(<Calculator minimal={true} />);

    // Switch to IL Risk tab on landing page
    const ilTab = screen.getByText('IL Risk');
    fireEvent.click(ilTab);

    const inputA = screen.getByPlaceholderText('e.g. 50 or -20') as HTMLInputElement;
    expect(inputA.disabled).toBe(false);

    // Switch to Converter tab on landing page
    const converterTab = screen.getByText('Converter');
    fireEvent.click(converterTab);

    const amountInput = screen.getByRole('textbox') as HTMLInputElement;
    expect(amountInput.disabled).toBe(false);
  });
});
