/**
 * Cron configuration (spec 017).
 * MVP: No Vercel cron for bot job processing. Bots run inline.
 */
export const CRON_ENABLED = false;

/** Returns whether cron-based bot processing is enabled. MVP: always false. */
export function isCronEnabled(): boolean {
  return CRON_ENABLED;
}

/** Returns cron schedule path if enabled. MVP: always null. */
export function getCronSchedule(): string | null {
  return null;
}
