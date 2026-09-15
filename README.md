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
| Data | Drizzle ORM + libSQL (Turso) |
| UI | Archivo + Azeret Mono, light & dark themes, INR-first money |
