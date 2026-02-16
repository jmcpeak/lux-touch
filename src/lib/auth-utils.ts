/**
 * Auth utilities for API routes (spec 002).
 */
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/auth';

/** Returns 401 JSON if no session; otherwise returns session */
export async function requireAuth(): Promise<
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true, session };
}
