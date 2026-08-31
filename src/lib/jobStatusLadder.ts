// src/lib/jobStatusLadder.ts
// The single source of truth for how a job's state is described in plain language.
//
// Before this, three Plug-facing surfaces each kept their own map and had already drifted —
// AWAITING_CONFIRM was "Awaiting confirmation" on the job card and the deep-link page but
// "Awaiting confirm" on the dashboard chip, and ESCROW_HELD was "Paid into escrow" in two places
// and "In escrow" in the third. All three also fell back to rendering the RAW ENUM (`?? status`)
// for anything unmapped, so a Plug on a disputed or completed job could be shown "DISPUTED".
// Nothing here can return a raw code.
//
// ── On the two labels per rung ────────────────────────────────────────────────────────────────
// `canonical` is the product ladder verbatim. It is written from the CLIENT's point of view, which
// is correct for a client but misleading for the Plug reading it about their own job: "Quote sent,
// waiting on you" tells a Plug the ball is in their court when it is actually with the client, and
// "Job done, confirm when ready" invites the Plug to confirm a completion only the client can
// confirm. `plug` is therefore the string the Plug app renders, and it differs from `canonical` on
// exactly the four rungs where the client-voice wording would misstate who owes the next action.
// Both are kept side by side so the client surfaces can adopt `canonical` later without a second,
// drifting copy of the ladder.

export type LadderTone = 'gold' | 'blue' | 'amber' | 'indigo' | 'green' | 'red' | 'neutral';

export type LadderRung = {
  /** 1–9 along the ladder; 0 for states that sit off it (terminal, cancelled, unassigned). */
  step: number;
  /** The product ladder wording, verbatim, in the client's voice. */
  canonical: string;
  /** What the Plug app shows. Same as `canonical` unless that would mislead the Plug. */
  plug: string;
  /** Second-person line telling the Plug what is actually true and who owes the next move. */
  hint?: string;
  tone: LadderTone;
};

/** How many rungs the ladder has — used to render "step N of 9". */
export const LADDER_LENGTH = 9;

const LADDER: Record<string, LadderRung> = {
  // 1 ─────────────────────────────────────────────────────────────────────────────────────────
  PLUG_ASSIGNED: {
    step: 1,
    canonical: 'Plug notified',
    // "Plug notified" reads as third-party narration to the Plug it is describing.
    plug: 'New assignment',
    hint: 'A client booked you. Accept to open the line and scope the job — or decline to send it back to dispatch.',
    tone: 'gold',
  },

  // 2 ─────────────────────────────────────────────────────────────────────────────────────────
  IN_DISCUSSION: {
    step: 2,
    canonical: 'Plug accepted, scoping the job',
    plug: 'Scoping the job',
    hint: 'You accepted. Send a quote when you are ready, or request an on-site visit first if you need to diagnose.',
    tone: 'blue',
  },

  // 3 ─────────────────────────────────────────────────────────────────────────────────────────
  VISIT_PENDING: {
    step: 3,
    canonical: 'Diagnosis visit needed',
    plug: 'Diagnosis visit needed',
    // The fee is the client's to pay, and the visit cannot be marked done until it clears — so
    // this is the one place a Plug needs to know a payment is outstanding on someone else's side.
    hint: 'The client still owes the visit fee. You can mark the visit done once it clears.',
    tone: 'amber',
  },

  // 4 ─────────────────────────────────────────────────────────────────────────────────────────
  VISIT_DONE: {
    step: 4,
    canonical: 'Diagnosing the problem',
    plug: 'Diagnosing the problem',
    hint: 'Visit done and the fee is held. Send your quote when you have priced the work.',
    tone: 'indigo',
  },

  // 5 ─────────────────────────────────────────────────────────────────────────────────────────
  QUOTED: {
    step: 5,
    canonical: 'Quote sent, waiting on you',
    // "waiting on you" means the CLIENT in the canonical ladder. To a Plug it reads as a task
    // they owe, when in fact they are the one waiting.
    plug: 'Quote sent, waiting on the client',
    hint: 'Your quote is with the client — they have 24h to accept or decline. You can re-quote if needed.',
    tone: 'green',
  },

  // 6 ─────────────────────────────────────────────────────────────────────────────────────────
  QUOTE_ACCEPTED: {
    step: 6,
    canonical: 'Quote accepted, pay to start',
    // "pay to start" is an instruction to the client. The Plug pays nothing.
    plug: 'Quote accepted, waiting on payment',
    hint: 'The client accepted your quote. Work starts once their payment is secured.',
    tone: 'green',
  },
  ESCROW_HELD: {
    step: 6,
    canonical: 'Quote accepted, pay to start',
    plug: 'Payment secured',
    hint: 'The money is held in escrow. You are clear to start — set off when you are ready.',
    tone: 'green',
  },

  // 7 ─────────────────────────────────────────────────────────────────────────────────────────
  EN_ROUTE: {
    step: 7,
    canonical: 'Plug on the way',
    plug: 'You are on the way',
    hint: 'The client can see that you are heading over.',
    tone: 'blue',
  },
  // ARRIVED is a real state in the machine but has no rung in the product ladder. It sits between
  // "on the way" and "in progress", so it shares step 7 rather than inventing a tenth rung.
  ARRIVED: {
    step: 7,
    canonical: 'Plug on the way',
    plug: 'You have arrived',
    hint: 'You are on site. Start the job when you begin work.',
    tone: 'blue',
  },

  // 8 ─────────────────────────────────────────────────────────────────────────────────────────
  IN_PROGRESS: {
    step: 8,
    canonical: 'Job in progress',
    plug: 'Job in progress',
    hint: 'Mark the job done when the work is finished.',
    tone: 'amber',
  },

  // 9 ─────────────────────────────────────────────────────────────────────────────────────────
  AWAITING_CONFIRM: {
    step: 9,
    canonical: 'Job done, confirm when ready',
    // The CLIENT confirms. Telling the Plug to "confirm when ready" points them at an action that
    // is not theirs and that they cannot take.
    plug: 'Job done, waiting on client confirmation',
    hint: 'You marked the work finished. Payment releases once the client confirms.',
    tone: 'amber',
  },

  // ── Off-ladder ────────────────────────────────────────────────────────────────────────────
  // Real states with no rung. They still need plain language, because the alternative is the raw
  // enum leaking into the UI — which is exactly what happened before.
  COMPLETED: {
    step: 0,
    canonical: 'Job complete',
    plug: 'Job complete',
    hint: 'The client confirmed the work.',
    tone: 'green',
  },
  RELEASED: {
    step: 0,
    canonical: 'Paid out',
    plug: 'Paid out',
    hint: 'Your payment has been released to your wallet.',
    tone: 'green',
  },
  DISPUTED: {
    step: 0,
    canonical: 'Under review',
    plug: 'Under review',
    hint: 'The client raised an issue. Our team is reviewing it — payment is on hold until it is resolved.',
    tone: 'red',
  },
  SEARCHING_PLUG: {
    step: 0,
    canonical: 'Looking for a Plug',
    plug: 'Back in the queue',
    hint: 'This job is no longer assigned to you.',
    tone: 'neutral',
  },
  CANCELLED: {
    step: 0,
    canonical: 'Cancelled',
    plug: 'Cancelled',
    tone: 'red',
  },
  EXPIRED: {
    step: 0,
    canonical: 'Expired',
    plug: 'Expired',
    tone: 'neutral',
  },
  // Pre-dispatch. A Plug should never see it, but it is a valid enum value so it gets wording
  // rather than a fallback.
  PENDING: {
    step: 0,
    canonical: 'Booking received',
    plug: 'Booking received',
    tone: 'neutral',
  },
};

/**
 * Plain-language rung for a raw JobStatus.
 *
 * Never returns the raw code. An unrecognised status — a new enum value shipped by the backend
 * before the frontend knows about it — degrades to a neutral, honest placeholder rather than
 * exposing "AWAITING_CONFIRM" to a Plug.
 */
export function rungFor(status: string | null | undefined): LadderRung {
  const key = String(status ?? '').trim().toUpperCase();
  return (
    LADDER[key] ?? {
      step: 0,
      canonical: 'In progress',
      plug: 'In progress',
      hint: 'This job is moving through a step we do not have a description for yet.',
      tone: 'neutral',
    }
  );
}

/** What the Plug app renders as the status label. */
export function plugStatusLabel(status: string | null | undefined): string {
  return rungFor(status).plug;
}

/** The second-person "what now" line, when there is one worth showing. */
export function plugStatusHint(status: string | null | undefined): string | undefined {
  return rungFor(status).hint;
}

/** True when the status sits on the 9-rung ladder (so a step indicator makes sense). */
export function isOnLadder(status: string | null | undefined): boolean {
  return rungFor(status).step > 0;
}
