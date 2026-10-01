import { NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude.' },
        { status: 400 },
      );
    }

    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      lat: String(latitude),
      lon: String(longitude),
      zoom: '18',
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
        'Nominatim reverse geocoding failed:',
        response.status,
        text,
      );

      return NextResponse.json(
        { error: 'Reverse geocoding failed.' },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (!data?.display_name) {
      return NextResponse.json(
        { error: 'No location could be found for these coordinates.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      latitude: Number(data.lat ?? latitude),
      longitude: Number(data.lon ?? longitude),
      formattedAddress: data.display_name,
      confidence: Number(data.importance ?? 0),
      provider: 'nominatim',
      lowConfidence: Number(data.importance ?? 0) < 0.0001,
    });
  } catch (error) {
    console.error('Reverse geocoding route failed:', error);

    return NextResponse.json(
      { error: 'Could not determine the location.' },
      { status: 500 },
    );
  }
}