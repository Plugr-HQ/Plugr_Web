// src/app/api/admin/verification/[plugId]/reveal/[field]/route.ts
//
// Same-origin proxy for explicitly revealing one sensitive verification field.
// The NestJS backend performs the ADMIN authorization and audit logging.

import { proxyToBackend } from '@/src/lib/backendProxy';

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            plugId: string;
            field: string;
        }>;
    },
) {
    const { plugId, field } = await params;

    return proxyToBackend(request, {
        path: `/admin/verification/${encodeURIComponent(plugId)}/reveal/${encodeURIComponent(field)}`,
        timeoutMs: 20_000,
        fallbackError: 'could not reveal this verification field',
    });
}