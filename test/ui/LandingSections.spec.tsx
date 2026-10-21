import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  OnboardingPipeline,
  ProblemSection,
  SolutionSection,
} from '../../src/components/frontend/LandingSections';

describe('OnboardingPipeline', () => {
  it('describes tracking an existing public address and never claims custody', () => {
    const { container } = render(<OnboardingPipeline />);
    expect(screen.getByText('Track a wallet')).toBeTruthy();
    expect(container.textContent).toMatch(/public wallet address/i);
    expect(container.textContent).not.toMatch(/custodial wallet/i);
    expect(container.textContent).not.toMatch(/under 60 seconds/i);
  });

  it('shows the four verified steps', () => {
    render(<OnboardingPipeline />);
    ['Track a wallet', 'Connect an exchange', 'Review your portfolio', 'Use analysis tools'].forEach(
      (title) => expect(screen.getByRole('heading', { name: title })).toBeTruthy(),
    );
  });
});

describe('SolutionSection', () => {
  it('discloses sample data exactly once and shows no false live/sync labels', () => {
    const { container } = render(<SolutionSection />);
    const text = container.textContent || '';
    const disclosure = 'Illustrative sample data — not live account balances';
    expect(text.split(disclosure).length - 1).toBe(1);
    expect(text).not.toMatch(/\bLive\b/);
    expect(text).not.toMatch(/SYNCED/);
    expect(text).not.toMatch(/Auto-Sync/);
    expect(text).not.toMatch(/and more tools/i);
  });

  it('keeps all four feature-card headings', () => {
    render(<SolutionSection />);
    ['Performance Analytics', 'Portfolio Allocation', 'Multi-wallet Tracking', 'Seamless Integration'].forEach(
      (title) => expect(screen.getByRole('heading', { name: title })).toBeTruthy(),
    );
  });
});

describe('ProblemSection', () => {
  it('has no repeated PROBLEM 0x badges but keeps all three headings', () => {
    const { container } = render(<ProblemSection />);
    expect(container.textContent).not.toMatch(/PROBLEM 0\d/);
    ['Scattered Across Exchanges', 'Wasting 10+ Hours Monthly', 'Zero Portfolio Visibility'].forEach(
      (title) => expect(screen.getByRole('heading', { name: title })).toBeTruthy(),
    );
  });
});
