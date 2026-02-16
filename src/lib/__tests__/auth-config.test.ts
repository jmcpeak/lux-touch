import { describe, expect, it, vi } from 'vitest';
import {
  AUTH_PROVIDER_IDS,
  getConfiguredProviders,
  type AuthProviderId,
} from '../auth-config';

describe('AUTH_PROVIDER_IDS', () => {
  it('has expected provider ids', () => {
    expect(AUTH_PROVIDER_IDS.GITHUB).toBe('github');
    expect(AUTH_PROVIDER_IDS.GOOGLE).toBe('google');
    expect(AUTH_PROVIDER_IDS.FACEBOOK).toBe('facebook');
  });
});

describe('getConfiguredProviders', () => {
  const envVars = [
    'AUTH_GITHUB_ID',
    'AUTH_GITHUB_SECRET',
    'AUTH_GOOGLE_ID',
    'AUTH_GOOGLE_SECRET',
    'AUTH_FACEBOOK_ID',
    'AUTH_FACEBOOK_SECRET',
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of envVars) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of envVars) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  it('returns empty when no env vars', () => {
    const providers = getConfiguredProviders();
    expect(providers).toEqual([]);
  });

  it('returns github when env vars set', () => {
    process.env.AUTH_GITHUB_ID = 'gid';
    process.env.AUTH_GITHUB_SECRET = 'gsecret';
    const providers = getConfiguredProviders();
    expect(providers).toContain('github' as AuthProviderId);
    expect(providers).toHaveLength(1);
  });

  it('returns multiple providers when all set', () => {
    process.env.AUTH_GITHUB_ID = 'gid';
    process.env.AUTH_GITHUB_SECRET = 'gsecret';
    process.env.AUTH_GOOGLE_ID = 'oid';
    process.env.AUTH_GOOGLE_SECRET = 'osecret';
    process.env.AUTH_FACEBOOK_ID = 'fid';
    process.env.AUTH_FACEBOOK_SECRET = 'fsecret';
    const providers = getConfiguredProviders();
    expect(providers).toContain('github' as AuthProviderId);
    expect(providers).toContain('google' as AuthProviderId);
    expect(providers).toContain('facebook' as AuthProviderId);
    expect(providers).toHaveLength(3);
  });

  it('excludes github when only id set (no secret)', () => {
    process.env.AUTH_GITHUB_ID = 'gid';
    const providers = getConfiguredProviders();
    expect(providers).not.toContain('github' as AuthProviderId);
    expect(providers).toHaveLength(0);
  });
});
