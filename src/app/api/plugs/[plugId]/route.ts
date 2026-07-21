// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view. Sits alongside the existing mock /api/plugs (different segment). Next 16:
// await params.

import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;
  const repo = getRepo(resolveSource(request));

  try {
    const plug = await repo.getPlug(plugId);
    if (!plug) {
      return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    }

    const withdrawals = await repo.listWithdrawals();
    return NextResponse.json({ plug, withdrawals: withdrawals ?? [] });
  } catch (e) {
    console.error('plug snapshot failed', e);
    return NextResponse.json({ error: 'could not load plug' }, { status: 500 });
  }
}

/**
 * PATCH — edit the Plug's own profile (PLG-02) and flip ops approval.
 * Only editable fields are accepted: bio, photo, work posts, and `verified` (which stands in
 * for the ops-approval step). Verified identity data (name/trade/NIN) is locked post-
 * verification per spec, so it is deliberately not patchable here.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  let body: {
    bio?: string;
    photoUrl?: string | null;
    workPosts?: unknown;
    verified?: boolean;
    source?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const repo = getRepo(resolveSource(request, body.source));

  const hasUpdate =
    typeof body.bio === 'string' ||
    typeof body.photoUrl === 'string' ||
    body.photoUrl === null ||
    Array.isArray(body.workPosts) ||
    typeof body.verified === 'boolean';

  if (!hasUpdate) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  try {
    const plug = await repo.updatePlug(plugId, {
      bio: body.bio,
      photoUrl: body.photoUrl,
      workPosts: body.workPosts,
      verified: body.verified,
    });
    if (!plug) return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    return NextResponse.json({ plug });
  } catch (e) {
    console.error('plug update failed', e);
    return NextResponse.json({ error: 'could not update plug' }, { status: 500 });
  }
}
