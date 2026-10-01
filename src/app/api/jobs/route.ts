// src/app/api/jobs/route.ts
import { NextResponse } from 'next/server';
import { getRepo, resolveSource } from '@/src/lib/repo';

// Your WhatsApp bot phone number in international format without '+' or spaces (e.g. 2349119253019)
const WA_BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || '2349119253019';

export async function GET(request: Request) {
  const repo = getRepo(resolveSource(request));
  const statusParam = new URL(request.url).searchParams.get('status');

  try {
    const jobs = await repo.listJobs(statusParam?.split(',').map((s) => s.trim()));
    return NextResponse.json({ jobs });
  } catch (e) {
    console.error('list jobs failed', e);
    return NextResponse.json({ error: 'could not list jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    plugId?: string;
    clientName?: string;
    clientPhone?: string;
    jobDescription?: string;
    amount?: number;
    source?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  const repo = getRepo(resolveSource(request, body.source));
  const { plugId, clientName, jobDescription } = body;
  const amount = Number(body.amount);

  // Sanitize phone number (strip whitespace like "+234 906 ...")
  const clientPhone = body.clientPhone ? body.clientPhone.replace(/\s+/g, '') : null;

  if (!plugId || !clientName || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'plugId, clientName and a positive amount are required' },
      { status: 400 }
    );
  }

  try {
    const job = await repo.createJob({
      plugId,
      clientName,
      clientPhone,
      jobDescription: jobDescription ?? null,
      amount,
    });

    // Construct pre-filled WhatsApp bot message
    const waMessage = `Hi! I'm ${clientName}.\nI want to confirm my booking (Ref: ${job.id.slice(-6)}):\n• Task: ${jobDescription || 'Service request'}\n• Amount: ₦${amount.toLocaleString()}`;
    const whatsappUrl = `https://wa.me/${WA_BOT_NUMBER}?text=${encodeURIComponent(waMessage)}`;

    return NextResponse.json({ job, whatsappUrl }, { status: 201 });
  } catch (e: any) {
    console.error('create job failed', e);

    const message = String(e?.message ?? '');
    if (message.includes('clientPhone is required') || message.includes('plug not found')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Surface actual error message for debugging
    return NextResponse.json(
      { error: e?.message || 'could not create job' },
      { status: 500 }
    );
  }
}