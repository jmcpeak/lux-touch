/**
 * Auth configuration helpers (spec 002).
 * Centralizes provider availability for sign-in UI.
 */

export const AUTH_PROVIDER_IDS = {
  GITHUB: 'github',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[keyof typeof AUTH_PROVIDER_IDS];

/** Returns provider IDs that have env vars configured */
export function getConfiguredProviders(): AuthProviderId[] {
  const providers: AuthProviderId[] = [];
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(AUTH_PROVIDER_IDS.GITHUB);
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(AUTH_PROVIDER_IDS.GOOGLE);
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    providers.push(AUTH_PROVIDER_IDS.FACEBOOK);
  }
  return providers;
}
