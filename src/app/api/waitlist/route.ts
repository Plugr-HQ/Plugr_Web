import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Initialize the database pool using DATABASE_URL from environment variables.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  let body: { email?: unknown; userType?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const userType = body.userType;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  if (userType !== 'client' && userType !== 'artisan') {
    return NextResponse.json({ error: 'userType must be "client" or "artisan".' }, { status: 400 });
  }

  // Map the new userType vocabulary onto the existing "Type" column ("plug" | "client").
  const dbType = userType === 'artisan' ? 'plug' : 'client';

  try {
    await pool.query(
      'INSERT INTO "Plugr Waitlist" ("Type", "Email") VALUES ($1, $2)',
      [dbType, email]
    );
  } catch (error: any) {
    // Treat a duplicate email (unique constraint violation code 23505) as success — they're already on the list.
    if (error && error.code === '23505') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.error('Waitlist database insert error:', error);
    return NextResponse.json({ error: 'Could not join the waitlist.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

