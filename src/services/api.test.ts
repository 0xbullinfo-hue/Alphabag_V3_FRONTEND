import { describe,expect,it } from 'vitest';
import { resolveApiUrl } from './api';

describe('resolveApiUrl', () => {
  it('uses the same-origin Vite proxy in development', () => {
    expect(resolveApiUrl('/api/stream/portfolio')).toBe('/api/stream/portfolio');
  });
});