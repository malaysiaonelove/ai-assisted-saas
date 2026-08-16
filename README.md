# SalesBook — SaaS sales book for SMEs

A simple SaaS app for small businesses to keep their sales book: customers,
products, sales, and subscription billing.

## Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | Next.js 14 (App Router, Tailwind CSS)                 |
| Backend   | NestJS 10, Passport + JWT                             |
| ORM / DB  | Prisma, PostgreSQL 16                                  |
| Payments  | Paystack (checkout, verify, webhooks)                 |

## Features

- **Authentication** — register/login with username or email + password, JWT bearer tokens.
- **Authorization** — roles (`OWNER` / `MEMBER`) and organization scoping on every resource.
- **Billing**
  - Subscription plans with per-plan `features` and `limits` (stored as JSON).
  - Subscriptions (Free / Pro / Business) with monthly billing periods.
  - Invoices with receipt URLs and re-verification against Paystack.
  - Paystack hosted checkout + signature-verified webhooks.
- **Feature usage & limits** — customers, products, and monthly sales are counted per
  organization and enforced against the active plan's limits (a `null` limit = unlimited).
- **Sales book** — customers, products, and sales with line items (auto invoice numbers,
  subtotal / discount / tax / total).

## Project layout

```
backend/    NestJS API (Prisma schema + migrations, seed)
frontend/   Next.js app (auth, dashboard, customers, products, sales, billing)
docker-compose.yml   Local PostgreSQL
```

## Getting started

### 1. Database

```bash
docker compose up -d db
```

(Or point `DATABASE_URL` at any PostgreSQL instance.)

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit secrets, especially JWT_SECRET and PAYSTACK_*
npm install
npx prisma migrate dev --name init
npm run prisma:seed         # creates Free/Pro/Business plans + demo user
npm run start:dev           # API on http://localhost:3001/api
```

Demo login: `demo` / `demo1234` (organization "Demo Business").

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                 # app on http://localhost:3000
```

## Paystack setup (test mode)

1. Create a free account at [dashboard.paystack.com](https://dashboard.paystack.com) and
   copy the **test** secret/public keys into `backend/.env`.
2. For automatic payment confirmations, point a webhook at
   `https://<your-public-url>/api/payments/webhook`
   (during local development use an ngrok tunnel to `http://localhost:3001/api/payments/webhook`).
3. If you don't configure webhooks, payments still work — the Billing page shows a
   **Verify payment** button that re-checks the transaction with Paystack after the
   user returns from the checkout page.
4. Use Paystack's test cards (e.g. `4084 0840 8408 4081`, any future expiry, any CVV).

## API overview (all under `/api`, except `/plans` and `/payments/webhook`)

| Method | Path                                | Description                              |
| ------ | ----------------------------------- | ---------------------------------------- |
| POST   | `/auth/register`                    | Create org + owner, return JWT           |
| POST   | `/auth/login`                       | Username/email + password → JWT          |
| GET    | `/auth/me`                          | Current user                             |
| GET    | `/organizations/me`                 | Org, plan, usage, revenue, recent sales  |
| PATCH  | `/organizations/me`                 | Rename org (OWNER)                       |
| GET    | `/users`                            | Org members                              |
| PATCH  | `/users/:id/role`                   | Change member role (OWNER)               |
| GET    | `/plans`                            | Active plans (public)                    |
| GET    | `/subscriptions/me`                 | Current subscription + plan              |
| POST   | `/subscriptions/checkout`           | `{ planId }` → Paystack URL (or instant) |
| POST   | `/subscriptions/me/cancel`          | Stop renewal at period end               |
| POST   | `/payments/webhook`                 | Paystack webhook (signature verified)    |
| POST   | `/payments/:invoiceId/verify`       | Re-check payment status                  |
| GET    | `/invoices`                         | Org invoices                             |
| CRUD   | `/customers`, `/products`, `/sales` | Org-scoped sales book (limits enforced)  |

## How limits work

- Every organization belongs to a plan (Free by default).
- `UsageService` counts customers, products, and sales created in the current month.
- Create endpoints are guarded by `CheckLimitGuard`, which throws `403` with an
  upgrade prompt when a limit is reached.
- Limits live in the `limits` JSON column on `Plan`; `null` means unlimited.
  Edit `backend/prisma/seed.ts` and re-seed to change them.

## Notes & known simplifications

- Amounts are stored as `Float` for simplicity. For a finance-grade product, switch
  `price` / sale amounts to `Decimal`.
- JWT is a single access token (7-day expiry); no refresh-token rotation yet.
- Recurring billing: checkout charges once per month. Auto-renewal is handled by
  re-invoicing each period; Paystack subscriptions/recurring API is not used.
- Team invites are not implemented — the owner can change member roles via the API,
  but member creation currently happens through registration.

## Useful scripts

```bash
cd backend
npm run build              # compile
npm run prisma:migrate     # dev migration
npm run prisma:seed        # reseed plans + demo user
```
Deployment configuration updated.
