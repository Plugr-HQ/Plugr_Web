// src/app/api/plug/verification/skills/schedule/route.ts
// Provides live 7-day scheduling availability synchronized with backend server time.

import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://plugr-backbackend.onrender.com';

const TIME_WINDOWS_CONFIG = [
  {
    id: 'afternoon' as const,
    label: 'Afternoon (2:00 PM – 3:00 PM)',
    shortLabel: '2:00 PM – 3:00 PM',
    slots: [
      { label: '2:00 PM', value: '14:00' },
      { label: '2:30 PM', value: '14:30' },
    ],
  },
  {
    id: 'evening' as const,
    label: 'Evening (5:30 PM – 9:00 PM)',
    shortLabel: '5:30 PM – 9:00 PM',
    slots: [
      { label: '5:30 PM', value: '17:30' },
      { label: '6:00 PM', value: '18:00' },
      { label: '6:30 PM', value: '18:30' },
      { label: '7:00 PM', value: '19:00' },
      { label: '7:30 PM', value: '19:30' },
      { label: '8:00 PM', value: '20:00' },
      { label: '8:30 PM', value: '20:30' },
    ],
  },
];

function toLagosDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  // In Lagos (UTC+1)
  const lagosTime = new Date(d.getTime() + 60 * 60 * 1000);
  return `${lagosTime.getUTCFullYear()}-${pad(lagosTime.getUTCMonth() + 1)}-${pad(lagosTime.getUTCDate())}`;
}

function lagosSlotToUtcIso(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  // Lagos is UTC+1 (WAT) all year round: UTC hour = Lagos hour - 1
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0, 0));
  return utcDate.toISOString();
}

export async function GET() {
  let serverDate = new Date();

  // Fetch live Date header from backend to guarantee synchronization with backend server clock
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const parsed = new Date(dateHeader);
      if (!isNaN(parsed.getTime())) {
        serverDate = parsed;
      }
    }
  } catch {
    // Fall back to Node server time if remote call times out
    serverDate = new Date();
  }

  const serverTimeIso = serverDate.toISOString();
  const serverTimestamp = serverDate.getTime();

  // Lagos Date calculation (UTC+1)
  const lagosOffsetMs = 60 * 60 * 1000;
  const lagosNow = new Date(serverTimestamp + lagosOffsetMs);

  const days = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(lagosNow);
    dayDate.setUTCDate(lagosNow.getUTCDate() + i);

    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${dayDate.getUTCFullYear()}-${pad(dayDate.getUTCMonth() + 1)}-${pad(dayDate.getUTCDate())}`;

    let label = '';
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else {
      label = new Intl.DateTimeFormat('en-NG', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(dayDate);
    }

    const formattedFull = new Intl.DateTimeFormat('en-NG', {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(dayDate);

    const windows = TIME_WINDOWS_CONFIG.map((win) => {
      const slots = win.slots.map((slot) => {
        const isoUtc = lagosSlotToUtcIso(dateStr, slot.value);
        const slotTimestamp = new Date(isoUtc).getTime();
        // Slot is available if it's at least 45 minutes in the future from current server time
        const available = slotTimestamp - serverTimestamp >= 45 * 60 * 1000;
        return {
          label: slot.label,
          value: slot.value,
          isoUtc,
          available,
        };
      });

      const hasAvailableSlots = slots.some((s) => s.available);

      return {
        id: win.id,
        label: win.label,
        shortLabel: win.shortLabel,
        slots,
        hasAvailableSlots,
      };
    });

    const hasAnySlots = windows.some((w) => w.hasAvailableSlots);

    days.push({
      dateStr,
      label,
      formattedFull,
      hasAnySlots,
      windows,
    });
  }

  return NextResponse.json(
    {
      serverTime: serverTimeIso,
      timezone: 'Africa/Lagos',
      days,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    },
  );
}
