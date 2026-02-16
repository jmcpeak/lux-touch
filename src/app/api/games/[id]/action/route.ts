import { NextResponse } from 'next/server';
import { applyAction } from '@/lib/game-engine';
import { updateGameState } from '@/lib/game-repository';
import { getMap } from '@/lib/map-loader';
import { resolveGameAccess } from '@/lib/game-access';
import type { ActionRequest, GameStateSnapshot } from '@/lib/types';

/** X-Idempotency-Key is ignored (spec 016). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { allowed, game } = await resolveGameAccess(id, request);
  if (!allowed || !game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as ActionRequest;
  const { action, payload } = body;
  if (!action || !payload) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 },
    );
  }

  const stateRow = game.states[0];
  if (!stateRow) {
    return NextResponse.json({ error: 'Game state not found' }, { status: 500 });
  }

  const map = getMap(game.mapId);
  if (!map) {
    return NextResponse.json({ error: 'Map not found' }, { status: 500 });
  }

  const currentState = stateRow.stateJson as unknown as GameStateSnapshot;
  currentState.gameId = game.id;

  const { state: newState, error } = applyAction(
    currentState,
    map,
    action,
    payload,
  );
  if (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  const { runBotTurnsUntilHuman } = await import('@/lib/bot');
  const state = runBotTurnsUntilHuman(newState, map);

  await updateGameState(id, state);

  return NextResponse.json({ success: true, state });
}
