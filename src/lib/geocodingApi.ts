// src/lib/geocodingApi.ts

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: number;
  provider: string;
  lowConfidence: boolean;
}

const API_BASE = '/api';

async function post<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => '');

    throw new Error(
      message || `Geocoding request failed (${res.status})`,
    );
  }

  return res.json();
}

export function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodeResult> {
  return post<GeocodeResult>(
    '/geocoding/reverse',
    {
      latitude,
      longitude,
    },
  );
}

export function searchGeocode(
  query: string,
): Promise<GeocodeResult> {
  return post<GeocodeResult>(
    '/geocoding/search',
    {
      query,
    },
  );
}