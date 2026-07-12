# 2026-07-12 — Vercel deployment (both apps live)

## What was done
Took DiecastBD from "backend deploy erroring" to **fully live and functional on Vercel**.
Storefront at **diecastbd.com**, API at **api.diecastbd.com**. Both apps are separate Vercel
projects from the one repo (Root Directory `frontend` / `backend`), DNS on Vercel nameservers.

Fixes shipped, in the order the failures surfaced (full story in `docs/log.md` 2026-07-12
entry; durable version in `docs/plan.md` §7 decision #50; runbook in `docs/DEPLOYMENT.md`):
1. **jose ESM crash** — `overrides: { "jose": "^4.15.9" }` in `backend/package.json` (firebase-admin→jwks-rsa needs CJS jose).
2. **`Invalid export … src/app.js`** — Vercel auto-detected the Express app. Switched `backend/vercel.json` to legacy `builds`/`routes` pinning `api/index.js`; added `export default app` + a `process.env.VERCEL`-gated `connectDB()` middleware in `src/app.js`.
3. **Frontend build failed** on `@fontsource-variable/archivo` — `package-lock.json` was out of sync; `npm install` reconciled it.
4. **CORS** — added optional `CORS_ORIGINS` env var (extra credentialed origins) so `CLIENT_URL` can stay the single canonical origin (also used for sitemap/email links).
5. **Domain** — `diecastbd.com` apex canonical, `www` → 308 redirect; nameservers moved to Vercel; **Resend MX/SPF/DKIM re-added in Vercel DNS**.
6. **401 wall** — cross-site third-party auth cookies (backend was on `*.vercel.app`). Fixed with **zero code change** by moving backend to `api.diecastbd.com` (same-site → first-party cookies). Repointed `VITE_API_BASE_URL` → `https://api.diecastbd.com/api/v1` and rebuilt frontend.

## Current state
- **Site: fully functional** per the user (admin dashboard loads, auth works).
- Branch `main`. Backend tests 35/35 green; frontend builds clean.
- **Latest commit `d1bfef4` (docs) — the user still needs to `git push`** (docs-only, no redeploy needed). Earlier code commits are already pushed.
- Key files: `backend/vercel.json` (builds/routes+crons), `backend/api/index.js` (handler), `backend/src/app.js` (export default + VERCEL DB middleware), `backend/src/config/env.js` (`CORS_ORIGINS`+`allowedOrigins`), `frontend/vercel.json` (SPA + sitemap proxy to api.diecastbd.com + COOP), `frontend/.env` (local, points at api.diecastbd.com; localhost line commented).

## Working agreement (this session)
- **The user pushes manually — I only commit, never `git push`.**
- Network calls from my environment are unreliable (a push timed out; a curl probe was declined) — guide the user to check dashboards/browser rather than probing live URLs myself.
- **Always keep a `docs/context/` snapshot current before context maxes out** (user's standing instruction).

## Env vars that must stay set (or the site breaks)
- Backend: `CLIENT_URL=https://diecastbd.com`, `MONGODB_URI` (Atlas allow `0.0.0.0/0`), JWT/cookie secrets, `CRON_SECRET`, `FIREBASE_*`, `ADMIN_EMAILS` (must contain the admin's verified email), `RESEND_API_KEY`, `EMAIL_FROM`. Optional `CORS_ORIGINS` for local dev.
- Frontend: `VITE_API_BASE_URL=https://api.diecastbd.com/api/v1`, `VITE_SITE_URL=https://diecastbd.com`, `VITE_FIREBASE_*`.

## Gotchas (don't regress)
- **Never put the backend on a bare `*.vercel.app` host** in prod — kills auth cookies. Must be a subdomain of the storefront's domain.
- **Don't re-add `functions`/`rewrites` to `backend/vercel.json`** — re-enables the Express auto-detection that broke the deploy. Keep `builds`/`routes`.
- `VITE_` vars are build-time — changing them needs a frontend **rebuild**, not just a redeploy of the same build.
- Nameservers are on Vercel → all DNS (incl. email) lives in Vercel DNS. Re-adding NS elsewhere would drop Resend records.
- Per-deploy `*.vercel.app` URLs change every deploy — use the custom domains everywhere.

## Open follow-ups (not blockers)
- Real Terms/Privacy/Refund/Shipping-Policy copy (CMS pages seeded from design; merchant to replace).
- bKash live gateway still deferred (COD + manual bKash for v1.0).
- Rate limiter is in-memory (per serverless instance) — move to Redis if global limits matter.
- Recommended: a real logged-in end-to-end smoke test (sign in → cart → COD order → shows in /admin → confirmation email).
