import { describe, expect, it } from 'vitest';
import {
  getCachedResponse,
  IDEMPOTENCY_SUPPORTED,
  isIdempotencySupported,
} from '../idempotency';

describe('idempotency (spec 016)', () => {
  it('IDEMPOTENCY_SUPPORTED is false', () => {
    expect(IDEMPOTENCY_SUPPORTED).toBe(false);
  });

  it('isIdempotencySupported returns false', () => {
    expect(isIdempotencySupported()).toBe(false);
  });

  it('getCachedResponse always returns null', async () => {
    const result = await getCachedResponse('game-1', 'key-123');
    expect(result).toBeNull();
  });

  it('getCachedResponse returns null for any inputs', async () => {
    expect(await getCachedResponse('', '')).toBeNull();
    expect(await getCachedResponse('g', 'k')).toBeNull();
  });
});
