// src/app/login/page.tsx
// Defensive catch route. This build has no /login page (auth lives at /auth, /app/auth/phone and
// /ad-minn/login), but stale links / an old deploy / Supabase Auth's redirect config still send
// users to /login?reason=session_expired — which 404s. Redirect any /login hit to the homepage so
// a signed-out or session-expired user lands on the entry point instead of a dead 404.
import { redirect } from 'next/navigation';

export default function LoginRedirect() {
  redirect('/');
}
