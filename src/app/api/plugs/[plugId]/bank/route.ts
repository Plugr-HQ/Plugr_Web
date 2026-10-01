import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { plugId: string } }
) {
  try {
    const { plugId } = params;
    const body = await request.json();
    const { bankName, bankCode, accountNumber, accountName, bankLogoUrl } = body;

    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return NextResponse.json(
        { message: 'Invalid bank account details provided.' },
        { status: 400 }
      );
    }

    // TODO: Persist bank account details to the database against plugId
    // await db.plug.update({
    //   where: { id: plugId },
    //   data: { bankName, bankCode, accountNumber, accountName, bankLogoUrl }
    // });

    return NextResponse.json({
      success: true,
      bank: { bankName, bankCode, accountNumber, accountName, bankLogoUrl },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}