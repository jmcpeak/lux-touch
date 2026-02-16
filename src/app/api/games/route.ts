import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAuth } from '@/lib/auth-utils';
import { createGame, listUserGames } from '@/lib/game-repository';

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const games = await listUserGames(authResult.session.user!.id, status);
  return NextResponse.json({ games });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mapId = body.mapId ?? 'classic';
  const playerCount = Math.min(6, Math.max(2, body.playerCount ?? 4));

  const session = await auth();
  const userId = session?.user?.id ?? null;

  try {
    const result = await createGame({ mapId, playerCount, userId });
    return NextResponse.json({
      gameId: result.gameId,
      accessToken: result.accessToken,
      state: result.state,
      map: result.map,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create game';
    if (msg === 'Map not found') {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
