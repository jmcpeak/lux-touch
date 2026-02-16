import { describe, expect, it, vi } from 'vitest';
import { requireAuth } from '../auth-utils';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

const { auth } = await import('@/auth');

describe('requireAuth', () => {
  it('returns 401 when no session', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const result = await requireAuth();
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(401);
    const json = await (result.ok === false ? result.response.json() : null);
    expect(json).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when session has no user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: null, expires: '' } as any);
    const result = await requireAuth();
    expect(result.ok).toBe(false);
  });

  it('returns 401 when session user has no id', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { name: 'Test', email: null, image: null },
      expires: '',
    } as any);
    const result = await requireAuth();
    expect(result.ok).toBe(false);
  });

  it('returns session when authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', name: 'Test', email: null, image: null },
      expires: '',
    } as any);
    const result = await requireAuth();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.user.id).toBe('user-1');
    }
  });
});
