# DiecastBD

Premium, collector-focused diecast e-commerce for Bangladesh — authentic Hot Wheels
Premium and MINI GT, curated for collectors. Dark, minimal, luxury aesthetic.

Two independent apps in one repo:

- **[`frontend/`](frontend/)** — React 19 + Vite SPA (storefront + admin dashboard). Tailwind v4, shadcn/ui, TanStack Query, Zustand, `react-router`.
- **[`backend/`](backend/)** — Express 5 + MongoDB (Mongoose) API. Firebase-verified identity with a backend-owned JWT session, Cloudinary media, Resend email.

## Quick start

```bash
# backend
cd backend && npm install && cp .env.example .env   # fill in values
npm run seed    # load the catalog from docs/Inventory.md (once)
npm run dev

# frontend (separate terminal)
cd frontend && npm install && cp .env.example .env   # fill in Firebase values
npm run dev
```

Run tests with `npm test` in either app.

## Documentation

- **[`docs/plan.md`](docs/plan.md)** — current-state architecture: tech stack, DB schema, API reference, and the numbered log of key decisions/deviations.
- **[`docs/log.md`](docs/log.md)** — chronological changelog, one entry per phase and per notable change.
- **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** — production deployment runbook (Vercel + Render).
- **[`docs/Inventory.md`](docs/Inventory.md)** — source of truth for the product catalog (seeded, never hardcoded).

## Status

v1.0 feature-complete across all 12 build phases (architecture → storefront → cart/checkout →
orders → admin dashboard → content pages → testing/perf/security/SEO). COD checkout for v1.0;
bKash is schema-ready for a later addition. See `docs/plan.md` for the phase roadmap.
