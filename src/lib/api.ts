const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const REFRESH_KEY = 'plugr_refresh_token';

// Shared in-flight refresh so a burst of parallel 401s (e.g. the dashboard's several calls)
// triggers exactly one /auth/refresh, and they all wait on the same result.
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchange the stored refresh token for a fresh access token (silent session renewal).
 * Returns true and updates localStorage on success; false if there's no refresh token or the
 * backend rejects it (genuinely expired session). Callers should only log the user out on false.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return Promise.resolve(false);

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({} as any));
      if (data?.accessToken) {
        localStorage.setItem('plugr_token', data.accessToken);
        if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('plugr_token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('plugr_token');
  }
  return null;
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('plugr_token');
    localStorage.removeItem(REFRESH_KEY);
  }
};

/**
 * Authorization header for the stored access token, or {} if none.
 * Client-only (reads localStorage). Spread into a fetch's headers so the server-side proxy
 * routes receive the token and can forward it to the guarded NestJS endpoints.
 */
export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getHeaders = (auth = false) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const api = {
  auth: {
    register: async (phone: string, role: string, name?: string) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone, role, name }),
      });
      if (!res.ok) throw new Error('Registration failed');
      return res.json();
    },
    login: async (phone: string) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error('Login failed');
      return res.json();
    },
    // OTP login — same phone+code flow the backend uses for everyone. Role is optional and
    // only applied to brand-new numbers (as CLIENT/PLUG), never ADMIN — an existing user
    // keeps their DB role regardless of what's passed here. Callers on a role-specific entry
    // point (e.g. the Plug phone screen) should pass their role so a first-time signup lands
    // in the right bucket instead of silently defaulting to CLIENT on the backend.
    requestOtp: async (phone: string, role?: 'CLIENT' | 'PLUG', channel?: 'whatsapp' | 'sms') => {
      const res = await fetch(`${API_URL}/auth/otp/request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          phone,
          ...(role ? { role } : {}),
          ...(channel ? { channel } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.message || 'Could not send verification code.');
      }
      return res.json();
    },
    // Returns { accessToken, refreshToken, user: { id, phone, name, role, status }, isNewUser,
    // plugId } — plugId is the caller's PlugProfile id (what /plugs/:id expects) for a returning
    // Plug, or null if they have no profile yet.
    // With verifyOnly: true the backend just confirms the code (no account created, no tokens)
    // and returns { verified: true } — used by Plug onboarding, where the account is created
    // at the end via POST /auth/register.
    verifyOtp: async (phone: string, otp: string, verifyOnly?: boolean) => {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phone, otp, ...(verifyOnly ? { verifyOnly: true } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.message || 'Verification failed.');
      }
      return res.json();
    },
    // Exchange a refresh token for fresh claims. Prefer refreshAccessToken() for the silent
    // 401-retry path; this raw method is here for completeness.
    refresh: async (refreshToken: string) => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('Session refresh failed');
      return res.json();
    },
  },
  plugs: {
    getAll: async (city?: string, categoryCode?: string) => {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (categoryCode) params.append('categoryCode', categoryCode);

      const res = await fetch(`${API_URL}/plugs?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch plugs');
      return res.json();
    }
  },
  jobs: {
    create: async (title: string, description: string, categoryCode: string, latitude: number, longitude: number, address: string) => {
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ title, description, categoryCode, latitude, longitude, address }),
      });
      if (!res.ok) throw new Error('Failed to create job');
      return res.json();
    },
    getAll: async (status?: string) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const res = await fetch(`${API_URL}/jobs?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(true),
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    updateStatus: async (jobId: string, status: string, reason?: string) => {
      const res = await fetch(`${API_URL}/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: getHeaders(true),
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error('Failed to update job status');
      return res.json();
    }
  },
  //Bank verification check against provided account Number and Bank Code
  verification: {
    getBanks: async (): Promise<{ code: string; name: string; logoUrl: string }[]> => {
      const res = await fetch(`${API_URL}/verification/banks`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch bank list');
      return res.json();
    },
    validateAccount: async (
      accountNumber: string,
      bankCode: string,
    ): Promise<{
      accountNumber: string;
      accountName: string;
      bankCode: string;
      bankName: string;
      bankLogoUrl: string;
    }> => {
      const params = new URLSearchParams({ accountNumber, bankCode });
      const res = await fetch(`${API_URL}/verification/bank-account?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data?.message || 'Could not verify this account');
      }
      return res.json();
    },
  },
};