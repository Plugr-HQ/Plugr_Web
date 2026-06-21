import { NextResponse } from 'next/server';
import { Client } from 'pg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { email?: unknown; userType?: unknown };

  // 1. Parse Request Body Safely
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const userType = body.userType;

  // 2. Validate Fields
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  if (userType !== 'client' && userType !== 'artisan') {
    return NextResponse.json({ error: 'userType must be "client" or "artisan".' }, { status: 400 });
  }

  // Map userType vocabulary onto existing "Type" column ("plug" | "client")
  const dbType = userType === 'artisan' ? 'plug' : 'client';

  // 3. Initialize Short-lived Client Connection for Serverless Environment
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Direct connections to Supabase from Vercel require SSL
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Open connection
    await client.connect();

    // Execute Query
    await client.query(
      'INSERT INTO "Plugr Waitlist" ("Type", "Email") VALUES ($1, $2)',
      [dbType, email]
    );

  } catch (error: any) {
    // Treat duplicate email (unique constraint violation code 23505) as success
    if (error && error.code === '23505') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Comprehensive logs to pinpoint exact issues in Vercel
    console.error('Waitlist database insert error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return NextResponse.json({ error: 'Could not join the waitlist.' }, { status: 500 });

  } finally {
    // CRITICAL: Always close the connection in a serverless function
    await client.end();
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}