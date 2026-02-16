/**
 * Game access resolution (spec 014).
 * Validates that the requester has access to a game via session or X-Game-Token.
 */
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export interface GameAccessContext {
  userId: string | null;
  gameToken: string | null;
}

export async function resolveGameAccess(
  gameId: string,
  request: Request,
): Promise<{ allowed: boolean; game?: Awaited<ReturnType<typeof loadGame>> }> {
  const game = await loadGame(gameId);
  if (!game) return { allowed: false };

  const ctx = await getAccessContext(request);

  // Authenticated: must own game
  if (ctx.userId && game.userId === ctx.userId) {
    return { allowed: true, game };
  }

  // Anonymous: must have valid token
  if (ctx.gameToken && game.accessToken === ctx.gameToken) {
    return { allowed: true, game };
  }

  return { allowed: false, game };
}

export async function getAccessContext(request: Request): Promise<GameAccessContext> {
  const session = await auth();
  const gameToken = request.headers.get('X-Game-Token');
  return {
    userId: session?.user?.id ?? null,
    gameToken: gameToken ?? null,
  };
}

export async function loadGame(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      states: true,
    },
  });
}
