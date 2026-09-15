# Evenly

**Split shared costs. Trust the numbers.**

Evenly is a web app for small groups — roommates, classmates, friends, flatmates — to track shared expenses and settle up without arguing about the math. Open it on your phone between plans, log a bill, and see **who owes whom** in seconds.

Built for privacy and accuracy: quiet ledgers, clear balances, no payment gateway noise.

---

## Who it’s for

Young adults sharing costs in informal groups of up to **5 people**. No fixed occasion required — everyday bills, trips, groceries, rent splits.

## What you can do

- **Groups** — Create a group, invite people by email, accept or decline in-app
- **Expenses** — Equal, exact, percentage, or shares splits; categories, notes, comments
- **Balances** — See what you owe and what’s owed to you, pair by pair
- **Settle** — Record that A paid B (full or partial); history on Transfers
- **Friends** — Direct expenses between two people outside a group
- **Stay in sync** — Notifications, activity feed, monthly summaries, optional amount-due email
- **Insights** — Spend by category and month across your groups

Settlements are recorded in the app only. Evenly does not move money.

## Product principles

1. **Numbers first** — Balances and amounts lead every relevant screen  
2. **Earn trust through clarity** — Obvious owe / owed / settled states  
3. **Private by default** — Group data stays with the group; no performative chrome  
4. **Mobile-ready** — One-handed use between conversations  

More detail: [`PRODUCT.md`](PRODUCT.md) · design system: [`DESIGN.md`](DESIGN.md)

---

## Stack

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript, Tailwind CSS v4 |
| Auth | Auth.js — email + password, JWT sessions |
| Data | Drizzle ORM + libSQL (local SQLite / Turso in production) |
| UI | Archivo + Azeret Mono, light & dark themes, INR-first money |

## Local development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Turso env vars, data lives in `data/evenly.db` (gitignored).

### Demo accounts

| Email | Password |
|---|---|
| `rahul@demo.com` | `password123` |
| `priya@demo.com` | `password123` |

### Environment

Create `.env.local` as needed:

```
AUTH_SECRET=a-long-random-string
APP_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=Evenly <onboarding@resend.dev>
CRON_SECRET=a-long-random-string
```

To use the same database as production, also set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

Monthly amount-due emails need `RESEND_API_KEY` and a verified `EMAIL_FROM`. Vercel Cron calls `/api/cron/monthly-reminders` on the 1st with `Authorization: Bearer $CRON_SECRET`.

## Production (Vercel + Turso)

Local SQLite does not persist on Vercel — use [Turso](https://turso.tech).

1. Create a Turso database; copy URL and token  
2. Import this repo into Vercel  
3. Set env vars for **Production** and **Preview**, then deploy:

| Variable | Purpose |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://….turso.io` |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `APP_URL` | Same as `AUTH_URL` |
| `RESEND_API_KEY` | Optional until email is enabled |
| `EMAIL_FROM` | e.g. `Evenly <onboarding@resend.dev>` |
| `CRON_SECRET` | Secret for the monthly reminder cron |

4. If `AUTH_URL` / `APP_URL` were empty on first deploy, set them and **redeploy**

Schema migrates on first request. Optionally run `npm run db:migrate` locally against Turso.

Prefer Vercel Functions region **`bom1`** (Mumbai) when the Turso DB is in `aws-ap-south-1`.

Push to `main` (or deploy that commit) for new releases. Redeploying an old Vercel deployment rebuilds that old commit, not latest `main`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply schema |
| `npm run db:seed` | Seed demo users and group |
| `npm test` | Unit tests (balances / splits) |
| `npm run lint` | ESLint |

## Notes

- `data/` and `.env*` are gitignored  
- Receipt uploads under `public/uploads` are ephemeral on Vercel  
- Groups are capped at **5** members by design
