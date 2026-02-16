import { describe, expect, it, vi } from 'vitest';
import { getAccessContext, resolveGameAccess } from '../game-access';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  prisma: {
    game: {
      findUnique: vi.fn(),
    },
  },
}));

const { auth } = await import('@/auth');
const { prisma } = await import('@/lib/db');

describe('getAccessContext', () => {
  it('returns userId when session exists', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', name: 'Test', email: null, image: null },
      expires: '',
    } as any);
    const req = new Request('https://example.com', {
      headers: {},
    });
    const ctx = await getAccessContext(req);
    expect(ctx.userId).toBe('user-1');
    expect(ctx.gameToken).toBeNull();
  });

  it('returns gameToken from X-Game-Token header', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    const req = new Request('https://example.com', {
      headers: { 'X-Game-Token': 'token-abc' },
    });
    const ctx = await getAccessContext(req);
    expect(ctx.userId).toBeNull();
    expect(ctx.gameToken).toBe('token-abc');
  });
});

describe('resolveGameAccess', () => {
  it('returns allowed=false when game not found', async () => {
    vi.mocked(prisma.game.findUnique).mockResolvedValue(null);
    const req = new Request('https://example.com');
    const result = await resolveGameAccess('nonexistent', req);
    expect(result.allowed).toBe(false);
    expect(result.game).toBeUndefined();
  });

  it('returns allowed=true when user owns game', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', name: 'Test', email: null, image: null },
      expires: '',
    } as any);
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'game-1',
      userId: 'user-1',
      accessToken: 'token',
      states: [{ stateJson: {} }],
    } as any);
    const req = new Request('https://example.com');
    const result = await resolveGameAccess('game-1', req);
    expect(result.allowed).toBe(true);
    expect(result.game?.id).toBe('game-1');
  });

  it('returns allowed=true when token matches', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'game-1',
      userId: null,
      accessToken: 'secret-token',
      states: [{ stateJson: {} }],
    } as any);
    const req = new Request('https://example.com', {
      headers: { 'X-Game-Token': 'secret-token' },
    });
    const result = await resolveGameAccess('game-1', req);
    expect(result.allowed).toBe(true);
  });

  it('returns allowed=false when token does not match', async () => {
    vi.mocked(auth).mockResolvedValue(null);
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'game-1',
      userId: null,
      accessToken: 'secret-token',
      states: [{ stateJson: {} }],
    } as any);
    const req = new Request('https://example.com', {
      headers: { 'X-Game-Token': 'wrong-token' },
    });
    const result = await resolveGameAccess('game-1', req);
    expect(result.allowed).toBe(false);
  });

  it('returns allowed=false when user does not own game', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-2', name: 'Other', email: null, image: null },
      expires: '',
    } as any);
    vi.mocked(prisma.game.findUnique).mockResolvedValue({
      id: 'game-1',
      userId: 'user-1',
      accessToken: 'token',
      states: [{ stateJson: {} }],
    } as any);
    const req = new Request('https://example.com');
    const result = await resolveGameAccess('game-1', req);
    expect(result.allowed).toBe(false);
  });
});
