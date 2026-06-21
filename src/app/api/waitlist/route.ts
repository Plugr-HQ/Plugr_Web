import { NextResponse } from 'next/server';
import { Client } from 'pg';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // 1. Pre-flight Check: Prevent unhandled connection string parse crashes
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('CRITICAL: DATABASE_URL environment variable is completely missing or empty.');
    return NextResponse.json({ error: 'Database configuration missing.' }, { status: 500 });
  }

  let body: { email?: unknown; userType?: unknown };

  // 2. Parse Request Body Safely
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const userType = body.userType;

  // 3. Validate Fields
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  if (userType !== 'client' && userType !== 'artisan') {
    return NextResponse.json({ error: 'userType must be "client" or "artisan".' }, { status: 400 });
  }

  const dbType = userType === 'artisan' ? 'plug' : 'client';

  // 4. Initialize Short-lived Client Connection safely
  let client: Client;
  try {
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
  } catch (configError: any) {
    console.error('CRITICAL: Node-postgres failed to parse connection string structure:', configError.message);
    return NextResponse.json({ error: 'Internal configuration error.' }, { status: 500 });
  }

  try {
    // Open connection
    await client.connect();

    // Execute Query
    await client.query(
      'INSERT INTO "Plugr Waitlist" ("Type", "Email") VALUES ($1, $2)',
      [dbType, email]
    );

    return NextResponse.json({ ok: true }, { status: 201 });

  } catch (error: any) {
    if (error && error.code === '23505') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    console.error('Waitlist database execution error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });

    return NextResponse.json({ error: 'Could not join the waitlist.' }, { status: 500 });

  } finally {
    // Ensure cleanup only runs if client was successfully constructed and connected
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error('Failed to close database client cleanly:', endError);
      }
    }
  }
}