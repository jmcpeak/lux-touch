import { NextResponse } from 'next/server';
import { getMap } from '@/lib/map-loader';
import { requireAuth } from '@/lib/auth-utils';
import { deleteGame } from '@/lib/game-repository';
import { resolveGameAccess } from '@/lib/game-access';
import type { GameStateSnapshot } from '@/lib/types';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { id } = await params;
  const deleted = await deleteGame(id, authResult.session.user!.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { allowed, game } = await resolveGameAccess(id, request);
  if (!allowed || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const stateRow = game.states[0];
  if (!stateRow) {
    return NextResponse.json({ error: 'Game state not found' }, { status: 500 });
  }

  const map = getMap(game.mapId);
  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 500 });
  }

  const state = stateRow.stateJson as unknown as GameStateSnapshot;
  state.gameId = game.id;

  return NextResponse.json({
    game: { id: game.id, status: game.status, mapId: game.mapId },
    state,
    map,
  });
}
