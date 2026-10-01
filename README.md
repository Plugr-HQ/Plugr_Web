<div align="center">
<img src="./public/logo_light.svg" alt="Plugr Logo" width="200" />
</div>

# Plugr

**Plugr is a verified artisan identity platform connecting clients with trusted, verified service providers ("Plugs") in Nigeria.**

Finding a reliable artisan — a plumber, electrician, tailor, mechanic — is usually word-of-mouth and guesswork. Plugr fixes that by giving every service provider a verified identity (NIN-backed), a track record of completed jobs, and an escrow-protected payment flow, so clients can book with confidence and Plugs get paid fairly and on time.

Plugr is launching in Yaba, Lagos, and is built by [Alhazen].

## How it works

- **Verification first** — Plugs go through identity verification (NIN-based) before they can accept jobs, so clients know who they're letting into their home or business.
- **WhatsApp-first onboarding** — no app download required to get started; Plugs and clients can onboard and interact directly through WhatsApp.
- **Escrow-protected payments** — job payments are held in escrow and released to the Plug once work is confirmed complete, protecting both sides of the transaction.
- **Category-based matching** — clients find Plugs by job category (electrician, plumber, tailor, etc.), making it easy to find the right person for the job.

## Tech Stack

- **Backend:** NestJS (TypeScript), Prisma ORM, PostgreSQL
- **Frontend:** Next.js, React, Tailwind CSS
- **Messaging:** WhatsApp Cloud API (Meta)
- **Infrastructure:** Redis (BullMQ job queues), Render

## Getting Started

**Prerequisites:** Node.js, PostgreSQL, Redis

```bash
# install dependencies
npm install

# set up environment variables
cp .env.example .env

# run database migrations
npx prisma generate
npx prisma migrate dev

# start the dev server
npm run start:dev
```