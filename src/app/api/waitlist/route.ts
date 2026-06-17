import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Existing Supabase project (anon key — same one the page used previously).
const supabaseUrl = 'https://rzxajmbgwwcmwxltcgeb.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6eGFqbWJnd3djbXd4bHRjZ2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTk5NDAsImV4cCI6MjA5MTMzNTk0MH0.l7iJ_585GkaJc7auSlUxzcG2hV85kiG0mmNvQsfnnok';

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { error } = await supabase
    .from('Plugr Waitlist')
    .insert([{ Type: dbType, Email: email }]);

  if (error) {
    // Treat a duplicate email as success — they're already on the list.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    console.error('Waitlist insert error:', error);
    return NextResponse.json({ error: 'Could not join the waitlist.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
