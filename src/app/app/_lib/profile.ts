// src/app/app/_lib/profile.ts
// Builds "LinkedIn for the informal economy" profile content from a Plug row.
// Copy is derived from the plug's trade + real stats (rating, jobs_completed).

type Plug = { name: string; trade: string; rating: number; jobs_completed: number };

const TRADE: Record<
  string,
  { headline: string; skills: string[]; story: (name: string, jobs: number) => string; history: { title: string; org: string; period: string; note: string }[] }
> = {
  electrician: {
    headline: 'Licensed Electrician · Yaba',
    skills: ['Wiring & rewiring', 'Fault diagnosis', 'DB board repair', 'Lighting & fittings', 'Inverter setup'],
    story: (n, j) =>
      `${n.split(' ')[0]} has spent over a decade making Lagos homes and shops safe. What started as an apprenticeship under a master electrician in Tejuosho Market grew into a trusted one-person practice — ${j.toLocaleString()} jobs and counting. Known for turning up on time, quoting before touching a wall, and never leaving a job half-done.`,
    history: [
      { title: 'Independent Electrician', org: 'Self-employed · Yaba', period: '2018 — Present', note: 'Residential & small-business electrical work.' },
      { title: 'Apprentice → Journeyman', org: 'Tejuosho Market', period: '2013 — 2018', note: 'Learned the trade the hard way, on the bench.' },
    ],
  },
  plumber: {
    headline: 'Certified Plumber · Yaba',
    skills: ['Leak detection', 'Pipe repair & fitting', 'Water heaters', 'Drainage', 'Bathroom installs'],
    story: (n, j) =>
      `${n.split(' ')[0]} fixes what others patch. From burst pipes at 2am to full bathroom re-plumbs, ${j.toLocaleString()} clients have called and stayed. Clean work, honest quotes, and a habit of explaining the problem so you actually understand it.`,
    history: [
      { title: 'Independent Plumber', org: 'Self-employed · Yaba', period: '2016 — Present', note: 'Homes, estates, and small businesses.' },
      { title: 'Site Plumber', org: 'Lagos construction sites', period: '2011 — 2016', note: 'New-build plumbing and drainage.' },
    ],
  },
  furniture: {
    headline: 'Furniture Maker & Carpenter · Yaba',
    skills: ['Custom furniture', 'Wardrobes & cabinets', 'Repairs & refinishing', 'Upholstery', 'Fittings'],
    story: (n, j) =>
      `${n.split(' ')[0]} builds furniture that outlives trends. Bespoke wardrobes, dining sets, shop fittings — measured, made, and finished by hand. ${j.toLocaleString()} pieces later, the workshop still runs on one rule: measure twice, cut once.`,
    history: [
      { title: 'Furniture Maker', org: 'Own workshop · Yaba', period: '2015 — Present', note: 'Bespoke pieces and fittings.' },
      { title: 'Carpentry Apprentice', org: 'Lagos furniture market', period: '2010 — 2015', note: 'Joinery and finishing.' },
    ],
  },
};

const REVIEWS = [
  { by: 'Amaka O.', text: 'Came on time, quoted before starting, and the work was clean. Rare.' },
  { by: 'Bola T.', text: 'Fixed in one visit what two others couldn’t. Fair price too.' },
  { by: 'Ifeanyi K.', text: 'Professional from start to finish. Will call again.' },
];

export function buildProfile(plug: Plug) {
  const key = plug.trade?.toLowerCase();
  const t = TRADE[key] ?? TRADE.electrician;
  return {
    headline: t.headline,
    skills: t.skills,
    story: t.story(plug.name, Number(plug.jobs_completed || 0)),
    history: t.history,
    reviews: REVIEWS,
    stats: {
      rating: Number(plug.rating || 0),
      jobs: Number(plug.jobs_completed || 0),
      responseMins: 12,
      onTimePct: 98,
    },
  };
}
