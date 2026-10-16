import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TurnstileWidget } from '../../src/components/common/TurnstileWidget';

describe('TurnstileWidget', () => {
  it('calls onVerify with bypass token when sitekey is not configured', () => {
    const onVerify = vi.fn();
    render(<TurnstileWidget onVerify={onVerify} />);
    expect(onVerify).toHaveBeenCalledWith('dev-turnstile-bypass-token');
  });

  it('renders turnstile container when sitekey is set', () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '0x4AAAAAAtestkey');
    const onVerify = vi.fn();
    const { container } = render(<TurnstileWidget onVerify={onVerify} action="test_action" />);
    const turnstileDiv = container.querySelector('.turnstile-container');
    expect(turnstileDiv).toBeTruthy();
    vi.unstubAllEnvs();
  });
});
