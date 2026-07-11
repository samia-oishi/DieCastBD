# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

DiecastBD — premium diecast e-commerce for Bangladesh (BDT ৳, COD + manual bKash payment). Two independent apps, no root package.json — run all commands from inside `frontend/` or `backend/`.

- `frontend/` — React 19 + Vite SPA (storefront + admin dashboard)
- `backend/` — Express 5 + MongoDB (Mongoose 9) API, Node ≥20, ESM
- `docs/plan.md` — **the living architecture doc**: DB schema, API reference, and a numbered log of every architectural decision. Read it before making structural changes; record new decisions there and chronologically in `docs/log.md`. This is the project's established discipline.
- `docs/Inventory.md` — source of truth for the product catalog. Seeded via `npm run seed`, never hardcoded into the frontend.
- `docs/context/` — **session context snapshots.** At the start of a session, read the newest snapshot to pick up prior working state. Before context runs out, before `/clear`, and at the end of any session that changed project state, write/update a dated snapshot (`YYYY-MM-DD-<topic>.md`) covering what was done, current repo/server state, unfinished work, and gotchas — see the folder's README.

Note: the **storefront redesign v2** (light "paper" theme, brand lime `#A8CD2F`, built from `design_handoff_diecastbd_storefront/`) is now **live on `main`** — the customer-facing storefront is the light theme; the **admin dashboard stays dark** (`[data-theme="diecastbd-admin"]`, verified byte-identical by `frontend/scripts/verify-theme-split.mjs`). See `docs/plan.md` §7 decisions 42–49 and the "Storefront Redesign v2" entry in `docs/log.md`. Gotcha: `index.css` redefines the Tailwind radius scale, so use explicit `rounded-[Npx]` for storefront design radii (named `rounded-*` are reserved for shadcn primitives). An earlier v1 redesign attempt was reverted (commit `929085a`) and survives on the `storefront-redesign` branch; v2 was rebuilt from scratch, not from it.

## Commands

Both apps:

```bash
npm run dev          # backend: node --watch on :5000 · frontend: Vite on :5173
npm test             # Vitest, single run
npm run test:watch   # Vitest watch mode
npx vitest run path/to/file.test.js   # single test file
```

Frontend only: `npm run build`, `npm run lint` (oxlint), `npm run preview`.
Backend only: `npm run seed` (idempotent, loads `docs/Inventory.md` + settings/coupons/pages), `npm start` (production).

Backend tests live in `backend/test/unit/` (node env; `test/setup.js` seeds fake env vars so no real `.env` is needed). Frontend tests are colocated `src/**/*.test.{js,jsx}` (jsdom + React Testing Library). Both apps need `.env` copied from `.env.example` to actually run (`backend` fails fast on boot — env is Zod-validated in `src/config/env.js`).

## Backend architecture

- **Module pattern**: `src/modules/<domain>/` each owns `*.model.js`, `*.controller.js`, `*.service.js`, `*.routes.js`, `*.validation.js` (Zod). `src/routes/index.js` mounts every router under `/api/v1`.
- **Response envelope**: `{ success, data, meta? }` / `{ success: false, message, errors? }` via `utils/apiResponse.js` + `apiError.js` + `asyncHandler`.
- **Write-route middleware chain**: `authenticate` → `authorize(role)` → `validate(schema)` → controller → (admin mutations) `auditLog`. `optionalAuthenticate` exists only for the guest-or-logged-in routes (`POST /orders`, `POST /coupons/validate`).
- **Auth model**: Firebase owns credentials (no passwords stored — `bcrypt` is unused). `POST /auth/session` exchanges a Firebase ID token for backend-owned JWT cookies (15m access / 30d refresh). Per-user `tokenVersion` is stamped into JWTs as `tv` and checked on refresh — bump it to instantly revoke sessions. Roles: customer/staff/admin; admin auto-assigned via `ADMIN_EMAILS` env on first *verified* sign-in.
- **Stock lifecycle is safety-critical**: `reservedStock` holds inventory for pending orders; `availableStock = stock - reservedStock` is a virtual, never stored. `transitionOrderStatus` (`order.service.js`) implements a 3-bucket state machine (reserved/committed/released) handling all cross-bucket moves inside MongoDB multi-document transactions — see plan.md decisions #8 and #37 before touching it. Only `released → reserved/committed` re-checks availability.
- **Shared-math rule**: coupon discount math lives only in `coupon.service.js`; order creation paths (`createOrderFromCart`, `createOrderFromItems`) share one `buildAndSaveOrder` + `reserveStockForItems` core. Never duplicate this logic — preview and checkout must not drift.
- **Express 5 / Mongoose 9 gotchas** (already worked around — don't regress): `req.query` is an uncached getter (the `validate` middleware shadows it via `Object.defineProperty`); `express-mongo-sanitize` is replaced by a custom in-place sanitize middleware; use `returnDocument: "after"`, not `new: true`. Changing a schema index (e.g. adding `sparse`, renaming an indexed field) requires a live `Model.syncIndexes()` — a stale unique index has silently broken inserts in this project's history.
- **Cron jobs** (`src/jobs/`, registered from server.js): nightly analytics rollup into `AnalyticsDaily`, hourly stale-reservation release (auto-cancels pending orders >48h via the same `transitionOrderStatus` path).
- Guest checkout extends `User` (`firebaseUid`/`email` optional + sparse-unique, `isGuest` flag) — there is no separate Customer model. Order items and shipping address are embedded snapshots on `Order`, immune to later product edits.

## Frontend architecture

- **Routing**: `react-router` v8 Data Router — the package is `react-router`, **not** `react-router-dom`. Layouts: `PublicLayout`, `AuthLayout`, `AdminLayout`; guards: `ProtectedRoute`, `RequireRole`. Routes are code-split with `React.lazy` so storefront visitors never download admin code (Tiptap is isolated to the admin page-editor route).
- **State split**: TanStack Query for everything server-sourced; Zustand only for client-only state with no server counterpart (guest cart + recently-viewed, both persisted; auth session mirror). Nothing server-authoritative lives in Zustand. `useCurrentUser()` (query) is the auth source of truth; `authStore` mirrors `{status, role}` for synchronous guard reads and is only ever written from the query result.
- **Cart duality**: `useCart()` presents one interface whether guest (Zustand/localStorage) or logged in (server API) — components never branch on auth state. `CartMergeOnLogin` at the app root drains the guest cart into the server on login. Guest carts never touch the server until merge.
- **Feature folders**: `src/features/<domain>/` each owns its `api/`, `components/`, `schemas/`, `hooks/`. Cross-feature composed components go in `components/shared/`; shadcn-generated primitives in `components/ui/`.
- **Component library split**: shadcn/ui (Radix, via the unified `radix-ui` package) is the primary layer; DaisyUI is scoped to Rating/Steps/Loading only.
- **Design system**: the dark theme is a fixed brand identity, not a toggle — a single `:root` custom-property palette in `src/index.css` (brand lime `--primary`), no light-mode variant. Currency is ৳ with `toLocaleString('en-IN')` grouping.
- **Shared helpers with project-wide contracts**: `<Container>` owns all page-width/padding logic (see plan.md decision #12 — hand-rolled width wrappers were a real bug source); the axios instance in `lib/` carries the token-refresh interceptor.

## Project-wide conventions

- **No fabricated content, ever.** Testimonials, FAQs, policy copy, social links, contact info, and merchant details all seed empty and render empty states until an admin supplies real content. Never invent placeholder copy, products, or data fields to match a mock — flag the gap instead.
- Decisions get recorded: significant changes append a numbered decision to `docs/plan.md` §7 and an entry to `docs/log.md`, including what was verified and how. Backend flows are verified with real curl scripts against the dev database.
- Deployment runbook (Vercel + Render, proxy/cookie notes) is in `docs/DEPLOYMENT.md`; frontend `vercel.json` handles SPA fallback and the sitemap proxy.
