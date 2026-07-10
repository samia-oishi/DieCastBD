# DiecastBD API

Express + MongoDB backend for DiecastBD.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

## Structure

- `src/config/` — env validation, MongoDB, Firebase Admin, Cloudinary
- `src/modules/` — one folder per domain (auth, products, orders, ...), each owning its model/controller/service/routes/validation
- `src/middlewares/` — auth, role guard, validation, error handling, rate limiting
- `src/utils/` — shared helpers (`ApiError`, `asyncHandler`, response envelope)
- `src/jobs/` — scheduled tasks (stock reservation release, analytics rollup)
- `src/emails/` — Resend templates and senders
- `src/seeds/` — imports `docs/Inventory.md` data into MongoDB
- `src/modules/sitemap/` — dynamic `GET /sitemap.xml` (served at app root, product URLs from the DB)
- `test/` — Vitest unit tests (discount math, JWT, sanitize, utils)

## Scripts

- `npm run dev` — start with file watching
- `npm start` — start (production)
- `npm run seed` — run the database seed script
- `npm test` — run the Vitest suite (`npm run test:watch` for watch mode)

## Deployment

See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the full runbook (Render setup, env
vars, health check, proxy/cookie notes).
