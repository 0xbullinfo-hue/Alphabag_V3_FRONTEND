import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePortfolioStream } from '../../src/hooks/usePortfolioStream';

describe('usePortfolioStream hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('remains inactive when token or address is missing', () => {
    const { result } = renderHook(() => usePortfolioStream(null, undefined), { wrapper });

    expect(result.current.isLive).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
  });

  it('aborts previous requests on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {})); // pending

    const { unmount } = renderHook(
      () => usePortfolioStream('mock-jwt-token', '0x1111111111111111111111111111111111111111'),
      { wrapper }
    );

    unmount();
    expect(abortSpy).toHaveBeenCalled();
  });

  it('schedules reconnection with backoff on network failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network offline'));

    const { result } = renderHook(
      () => usePortfolioStream('mock-jwt-token', '0x1111111111111111111111111111111111111111'),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isReconnecting).toBe(true);
      expect(result.current.isLive).toBe(false);
    });
  });
});
