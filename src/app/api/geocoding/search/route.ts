import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const query =
      typeof body?.query === 'string'
        ? body.query.trim()
        : '';

    if (!query) {
      return NextResponse.json(
        { error: 'A location search query is required.' },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      q: query,
      limit: '1',
    });

    const response = await fetch(
      `${NOMINATIM_URL}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Plugr/1.0 (https://www.getplugr.com)',
          'Accept-Language': 'en',
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');

      console.error(
        'Nominatim search geocoding failed:',
        response.status,
        text,
      );

      return NextResponse.json(
        { error: 'Location search failed.' },
        { status: 502 },
      );
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: 'Location not found.' },
        { status: 404 },
      );
    }

    const result = results[0];

    const importance = Number(result.importance ?? 0);

    return NextResponse.json({
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      formattedAddress: result.display_name,
      confidence: importance,
      provider: 'nominatim',
      lowConfidence: importance < 0.0001,
    });
  } catch (error) {
    console.error('Search geocoding route failed:', error);

    return NextResponse.json(
      { error: 'Could not search for the location.' },
      { status: 500 },
    );
  }
}