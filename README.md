# Evenly

A small-group expense splitter for roommates, friends, and trips. Anyone in a group should be able to answer **who owes what** in a few seconds — without arguing about the math.

Web only. Groups are capped at **5 members**. Settlements are recorded in-app (A paid B ₹X). There is no payment gateway.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **Auth.js** (email + password, JWT sessions)
- **Drizzle ORM** + **libSQL**
  - Local: SQLite file at `data/evenly.db`
  - Production (Vercel): **Turso**
- Dark / light theme, DM Sans, INR-first money formatting

## Features

### Auth & profiles
- Register / log in / password reset
- Show-password toggle on auth forms
- 5 preset avatars (no uploads)
- Theme toggle (light / dark)

### Groups
- Create groups (max 5 people)
- Invite by email of a registered user → in-app Accept / Reject
- Inviter is notified on accept or decline
- Group settings, default split, debt simplification
- Soft-delete / restore groups

### Expenses
- Equal, exact, percentage, and shares splits
- Single or multi-payer
- Categories, notes, comments, edit history
- **Edit** only for the person who added the bill
- Filters: search, category, **added by**, **paid by**
- Each row shows who added it and who paid
- Soft-delete / restore expenses
- CSV / JSON export
- Optional receipt notes / itemization (files do not persist on Vercel)

### Balances & settlements
- Pairwise balances: only **your** pairs (you ↔ each member)
- **You owe** and **You’re owed** both shown when they apply
- **Pay part** on a pair you owe — e.g. ₹100 of ₹200 leaves ₹100
- You cannot record a payment for someone else’s debt
- **Transfers** page: every payment you sent, and payments sent to you
- Group page lists your transfers in that group

### Friends, activity, insights
- Add friends by email, accept / reject requests
- Direct expenses between two friends
- In-app notifications (mark read)
- Activity feed
- Charts (category, month, cross-group)
- Payment reminders (“nudge people who owe”)
- Per-group **monthly summary** (spend, your share, categories, current nets)
- Opt-in **monthly amount-due email** (Resend + Vercel Cron on the 1st)

## Local setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Turso env vars, the app uses `data/evenly.db` (gitignored).

### Demo accounts

| Email | Password |
|---|---|
| `rahul@demo.com` | `password123` |
| `priya@demo.com` | `password123` |

Optional `.env.local`:

```
AUTH_SECRET=a-long-random-string
APP_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=Evenly <onboarding@resend.dev>
CRON_SECRET=a-long-random-string
```

To talk to the **same** Turso database as production, also set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

Monthly amount-due emails need `RESEND_API_KEY` (and a verified `EMAIL_FROM` in production). Vercel Cron hits `/api/cron/monthly-reminders` on the 1st with `Authorization: Bearer $CRON_SECRET`.

## Deploy on Vercel + Turso

Local SQLite cannot persist on Vercel. Use Turso.

1. Create a database at [turso.tech](https://turso.tech) and copy the URL + token.
2. Import this repo into Vercel.
3. Set environment variables (Production **and** Preview), then deploy:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://….turso.io` |
| `TURSO_AUTH_TOKEN` | Turso token |
| `AUTH_SECRET` | Random string (`openssl rand -base64 32`) |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `APP_URL` | Same as `AUTH_URL` |
| `RESEND_API_KEY` | Resend API key (optional until you use email) |
| `EMAIL_FROM` | e.g. `Evenly <onboarding@resend.dev>` |
| `CRON_SECRET` | Random string for monthly reminder cron |

4. After the first deploy, set `AUTH_URL` / `APP_URL` if they were blank and **redeploy**.

Schema is created on first request (`migrate()`). Optional: run `npm run db:migrate` locally with the Turso env vars.

**Deploying new code:** push to `main` (or **Create Deployment** from that commit). Vercel’s **Redeploy** on an old deployment rebuilds that old commit, not the latest.

**Speed:** set the Vercel Functions region to **`bom1`** (Mumbai) if the Turso DB is in `aws-ap-south-1`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run db:migrate` | Create / update schema |
| `npm run db:seed` | Demo users + group |
| `npm test` | Balance / split unit tests |
| `npm run lint` | ESLint |
| `npm run build` | Production build |

## Project notes

- `data/` and `.env*` are gitignored — local DB and secrets stay off git
- Receipt files under `public/uploads` are ephemeral on Vercel
- Product / design intent: [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md)
