// src/app/api/plugs/[plugId]/route.ts
// GET — a single Plug's wallet snapshot (available vs locked), polled by the Screen 6
// wallet view. Sits alongside the existing mock /api/plugs (different segment). Next 16:
// await params.

import { NextResponse } from 'next/server';
import { one, q } from '@/src/lib/hackDb';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ plugId: string }> }
) {
  const { plugId } = await params;

  try {
    const plug = await one('select * from hack_plugs where id = $1', [plugId]);
    if (!plug) {
      return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    }

    const withdrawals = await q(
      "select * from hack_transactions where type = 'withdrawal' order by created_at desc"
    );

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

  let body: { bio?: string; photoUrl?: string | null; workPosts?: unknown; verified?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const sets: string[] = [];
  const vals: any[] = [];
  const add = (frag: string, v: any) => {
    vals.push(v);
    sets.push(`${frag} = $${vals.length}`);
  };

  if (typeof body.bio === 'string') add('bio', body.bio.slice(0, 600));
  if (typeof body.photoUrl === 'string' || body.photoUrl === null) add('photo_url', body.photoUrl);
  if (Array.isArray(body.workPosts)) add('work_posts', JSON.stringify(body.workPosts));
  if (typeof body.verified === 'boolean') add('verified', body.verified);

  if (!sets.length) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  try {
    vals.push(plugId);
    const plug = await one(
      `update hack_plugs set ${sets.join(', ')} where id = $${vals.length} returning *`,
      vals
    );
    if (!plug) return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    return NextResponse.json({ plug });
  } catch (e) {
    console.error('plug update failed', e);
    return NextResponse.json({ error: 'could not update plug' }, { status: 500 });
  }
}
