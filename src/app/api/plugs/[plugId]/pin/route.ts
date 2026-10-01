import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { plugId: string } }
) {
  try {
    const { plugId } = params;
    const body = await request.json();
    const { pin } = body;

    if (!pin || pin.length !== 4) {
      return NextResponse.json(
        { message: 'A valid 4-digit PIN is required.' },
        { status: 400 }
      );
    }

    // TODO: Update plug profile in your database (e.g. Prisma / Drizzle / Supabase)
    // await db.plug.update({ where: { id: plugId }, data: { pin, has_pin: true } });

    return NextResponse.json({ success: true, message: 'PIN created successfully.' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}