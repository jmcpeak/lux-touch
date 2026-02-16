/**
 * Idempotency (spec 016).
 * MVP: No X-Idempotency-Key support. Duplicate requests are both applied.
 */
export const IDEMPOTENCY_SUPPORTED = false;

/** Returns whether idempotency keys are supported. MVP: always false. */
export function isIdempotencySupported(): boolean {
  return IDEMPOTENCY_SUPPORTED;
}

/**
 * Returns cached response for a duplicate request, if idempotency is supported.
 * MVP: always returns null (no caching).
 */
export function getCachedResponse(
  _gameId: string,
  _idempotencyKey: string,
): Promise<{ success: boolean; state: unknown } | null> {
  return Promise.resolve(null);
}
