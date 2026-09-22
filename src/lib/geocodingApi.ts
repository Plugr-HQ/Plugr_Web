// src/lib/geocodingApi.ts
//
// NOTE(Phantom): assumes a base URL env var — swap this out for whatever your
// existing src/lib/api.ts / api-client.ts uses if you already have a shared
// fetch wrapper there. Kept standalone here so it's obvious what changed vs.
// the old direct-Nominatim calls.

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    confidence: number;
    provider: string;
    lowConfidence: boolean;
  }
  
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const message = await res.text().catch(() => '');
      throw new Error(message || `Geocoding request failed (${res.status})`);
    }
    return res.json();
  }
  
  export function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    return post<GeocodeResult>('/geocoding/reverse', { latitude, longitude });
  }
  
  export function searchGeocode(query: string): Promise<GeocodeResult> {
    return post<GeocodeResult>('/geocoding/search', { query });
  }