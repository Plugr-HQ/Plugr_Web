// src/app/api/jobs/route.ts
// GET  — list recent jobs (optionally ?status=PENDING,PLUG_ACCEPTED), for the Plug view.
// POST — create a job (Screen: Book). Inserts a Job row at status 'PENDING'; the
// returned id becomes the ALATPay orderId so the payment can be correlated back.

import { NextResponse } from 'next/server';
import { q, one } from '@/src/lib/hackDb'; // TODO: rename this file once the hack_* cutover is fully done

// Placeholder until the booking screen actually captures a location.
// Ikeja, Lagos center — swap for real geolocation capture in a follow-up.
const DEFAULT_LAT = 6.6018;
const DEFAULT_LNG = 3.3515;

export async function GET(request: Request) {
  const statusParam = new URL(request.url).searchParams.get('status');
  try {
    const jobs = statusParam
      ? await q(
        'select * from "Job" where status = any($1) order by "createdAt" desc limit 50',
        [statusParam.split(',').map((s) => s.trim())]
      )
      : await q('select * from "Job" order by "createdAt" desc limit 50');
    return NextResponse.json({ jobs });
  } catch (e) {
    console.error('list jobs failed', e);
    return NextResponse.json({ error: 'could not list jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    plugId?: string;
    clientName?: string;
    clientPhone?: string;
    jobDescription?: string;
    amount?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const { plugId, clientName, clientPhone, jobDescription } = body;
  const amount = Number(body.amount);

  // clientPhone is now required — Job needs a real client User, and User.phone is unique/required.
  if (!plugId || !clientName || !clientPhone || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'plugId, clientName, clientPhone and a positive amount are required' },
      { status: 400 }
    );
  }

  try {
    // A job inherits its category from the plug being booked — the client
    // already picked a category implicitly by picking this plug during browse.
    const plugProfile = await one(
      'select "categoryId" from "PlugProfile" where id = $1',
      [plugId]
    );
    if (!plugProfile) {
      return NextResponse.json({ error: 'plug not found' }, { status: 404 });
    }

    // Find-or-create the client User by phone.
    const client = await one(
      `insert into "User" (phone, name, role, status, "onboardingStep")
       values ($1, $2, 'CLIENT', 'ACTIVE', 0)
       on conflict (phone) do update set name = excluded.name
       returning id`,
      [clientPhone, clientName]
    );

    const job = await one(
      `insert into "Job"
         (id, "clientId", "plugId", "categoryId", status, title, description,
          latitude, longitude, price)
       values (gen_random_uuid(), $1, $2, $3, 'PENDING', $4, $4, $5, $6, $7)
       returning *`,
      [
        client.id,
        plugId,
        plugProfile.categoryId,
        jobDescription ?? 'Service Request',
        DEFAULT_LAT,
        DEFAULT_LNG,
        amount,
      ]
    );

    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    console.error('create job failed', e);
    return NextResponse.json({ error: 'could not create job' }, { status: 500 });
  }
}