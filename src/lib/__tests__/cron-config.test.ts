import { describe, expect, it } from 'vitest';
import {
  CRON_ENABLED,
  getCronSchedule,
  isCronEnabled,
} from '../cron-config';

describe('cron-config (spec 017)', () => {
  it('CRON_ENABLED is false', () => {
    expect(CRON_ENABLED).toBe(false);
  });

  it('isCronEnabled returns false', () => {
    expect(isCronEnabled()).toBe(false);
  });

  it('getCronSchedule returns null', () => {
    expect(getCronSchedule()).toBeNull();
  });
});
