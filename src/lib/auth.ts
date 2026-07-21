// src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';
import { one } from '@/src/lib/hackDb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class UnauthorizedError extends Error {
    status: number;
    constructor(message: string, status = 401) {
        super(message);
        this.status = status;
    }
}

// Verifies the bearer token against Supabase Auth and returns the caller's user id.
async function getAuthedUserId(request: Request): Promise<string> {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedError('missing bearer token');

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) throw new UnauthorizedError('invalid or expired token');

    return data.user.id;
}

// Confirms the authenticated caller is either the client or the assigned plug on this job.
// Throws UnauthorizedError (401/403) if not — callers should catch and translate to a response.
export async function requireJobParty(
    request: Request,
    job: { clientId: string; plugId: string | null }
): Promise<string> {
    const authUserId = await getAuthedUserId(request);

    if (authUserId === job.clientId) return authUserId;

    if (job.plugId) {
        const plugProfile = await one('select "userId" from "PlugProfile" where id = $1', [job.plugId]);
        if (plugProfile?.userId === authUserId) return authUserId;
    }

    throw new UnauthorizedError('not a party to this job', 403);
}