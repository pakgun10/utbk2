import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearTokensForTest, createToken, isValidToken, removeToken } from '@/lib/auth-store.js';

describe('auth-store', () => {
  afterEach(() => {
    vi.useRealTimers();
    clearTokensForTest();
  });

  it('marks a newly created token as valid', () => {
    const token = createToken();
    expect(isValidToken(token)).toBe(true);
  });

  it('invalidates a token after TTL passes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-24T00:00:00.000Z'));

    const token = createToken();
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);

    expect(isValidToken(token)).toBe(false);
  });

  it('removes a token explicitly', () => {
    const token = createToken();
    removeToken(token);
    expect(isValidToken(token)).toBe(false);
  });
});
