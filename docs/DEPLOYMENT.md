# DiecastBD — Deployment Runbook (Vercel)

How DiecastBD runs in production, and how to reproduce or debug it. **Both apps are
deployed to Vercel as two separate projects from the same monorepo.** This doc is the
source of truth for the live topology; cross-check against it before changing anything
deploy-related.

> History note: an earlier draft of this runbook targeted **Render** for the backend.
> That plan was dropped — the backend now runs on Vercel serverless. The Render steps
> survive only in git history.

## Live topology

```
diecastbd.com          → Vercel · frontend project (Vite SPA)   · Root Directory: frontend/
www.diecastbd.com      → 308 redirect → diecastbd.com
api.diecastbd.com      → Vercel · backend project (Express API) · Root Directory: backend/
MongoDB Atlas · Firebase · Cloudinary · Resend  → external, env-driven
DNS                    → Vercel nameservers (Vercel is authoritative for diecastbd.com)
```

`diecastbd.com` (apex) is the **canonical** origin. The backend lives on the
`api.diecastbd.com` **subdomain of the same registrable domain** — this is not cosmetic,
it's what makes auth work (see "Why the backend must be a subdomain" below).

---

## 1. The two Vercel projects

Both import the **same GitHub repo**; they differ only by Root Directory. Each reads its
own `vercel.json`.

| | Frontend project | Backend project |
|---|---|---|
| Root Directory | `frontend` | `backend` |
| Framework preset | Vite (auto) | Other |
| Build | `npm run build` → `dist` | (serverless, no static output) |
| Custom domain | `diecastbd.com` + `www` redirect | `api.diecastbd.com` |
| Config | `frontend/vercel.json` | `backend/vercel.json` |

**Root Directory is mandatory.** If it isn't set, Vercel ignores that app's `vercel.json`
and mis-detects the build. A `/var/task/backend/...` path in a backend error log confirms
Root Directory is `backend`.

---

## 2. Backend serverless setup (the part that fought us)

The backend is a normal Express app served as a single Vercel serverless function.

**Entry point:** `backend/api/index.js` — a default-exported handler that ensures the
(cached) Mongo connection, then delegates to the Express app:

```js
export default async function handler(req, res) {
  await connectDB();
  return app(req, res);
}
```

**`backend/vercel.json` pins that one entry with legacy `builds`/`routes`:**

```json
{
  "builds":  [{ "src": "api/index.js", "use": "@vercel/node" }],
  "routes":  [{ "src": "/(.*)", "dest": "api/index.js" }],
  "crons":   [ /* stale-reservation release + analytics rollup */ ]
}
```

> **Why `builds`, not `functions`/`rewrites`:** with the modern `functions` property,
> Vercel *also* auto-detected the Express app in `src/app.js` and tried to serve it as a
> native server — throwing `Invalid export found in module src/app.js. The default export
> must be a function or server`. `builds` disables framework auto-detection entirely, so
> **only** `api/index.js` is built. Do not re-introduce `functions`/`rewrites` here.

**Belt-and-suspenders in `src/app.js`:** it also `export default app` and, gated on
`process.env.VERCEL`, runs a middleware that calls `connectDB()` — so if Vercel ever serves
`app.js` directly, it's still a valid handler with a live DB. Local dev and tests (no
`VERCEL` env) are unaffected.

**Serverless DB connection** (`src/config/db.js`) caches the connection promise across warm
invocations with a small `maxPoolSize` — many serverless instances each open their own pool.

**Cron jobs** run via Vercel Cron hitting `/api/v1/cron/*` over HTTP (guarded by
`CRON_SECRET`), not `node-cron`, which needs a long-running process.

---

## 3. Environment variables

`.env` is **not** deployed — set these in each project's Vercel dashboard (Settings →
Environment Variables → Production). The backend fails fast on boot if any required var is
missing (Zod-validated in `src/config/env.js`).

### Backend project
| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string (Atlas Network Access must allow `0.0.0.0/0` — Vercel IPs aren't static) |
| `CLIENT_URL` | `https://diecastbd.com` — the **single canonical** frontend origin. Used for CORS **and** sitemap/email links. No trailing slash. |
| `CORS_ORIGINS` | *(optional)* extra comma-separated origins allowed for credentialed CORS, e.g. `http://localhost:5173` for local frontend dev against prod. Leave blank in a pure-prod setup. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `COOKIE_SECRET` | fresh 32+ char randoms (not dev values) |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | `15m` / `30d` (defaults) |
| `CRON_SECRET` | random; Vercel Cron sends it as `Authorization: Bearer …` |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | service account (keep `\n` escapes in the key) |
| `CLOUDINARY_*` · `RESEND_API_KEY` · `EMAIL_FROM` (`noreply@diecastbd.com`) | as provisioned |
| `ADMIN_EMAILS` | comma-separated; auto-promoted to `admin` on first **verified** sign-in |
| `STEADFAST_API_KEY` | Steadfast courier — Settings → API in their merchant panel. **Optional**: unset hides the courier controls in the admin instead of showing buttons that can only fail. |
| `STEADFAST_SECRET_KEY` | The **second, different** value on that screen — the key and secret are not the same string. Steadfast locks the account after repeated auth failures, so a wrong pair is not harmless. |

### Frontend project (all `VITE_`-prefixed → inlined at build time)
| Var | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://api.diecastbd.com/api/v1` |
| `VITE_SITE_URL` | `https://diecastbd.com` (canonical URLs / og:url / JSON-LD) |
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase **client** config (public by design) |
| `PRERENDER_STRICT` | **`1` on Production AND Preview.** Fails the build when prerendering doesn't produce per-route metadata (see below). Not a `VITE_` var — it's read by the build script, not the bundle. |
| `PRERENDER_MIN_ROUTES` | optional, default `20` — floor below which a build is treated as broken |

> **`VITE_` vars are baked in at build time.** Changing one has no effect until the frontend
> **rebuilds** — Redeploy the frontend project (or push a commit). A backend env change needs
> a backend **redeploy**; adding a *domain* does **not** need a rebuild (it just re-aliases).

### Prerendering (`scripts/prerender.mjs`) — read this before touching the build

`npm run build` = `vite build` → `prerender.mjs` → `verify-prerender.mjs`. The prerender fetches
the live API and bakes a real `<title>`/description/canonical/og/JSON-LD into
`dist/<route>/index.html` for every indexable URL, discovered from the backend's `/sitemap.xml`.
Without it **every URL serves one identical shell with no canonical**, which is exactly the state
Search Console flagged in Jul 2026 (plan.md #88).

- It needs `VITE_SITE_URL` **and** `VITE_API_BASE_URL` at build time. If `VITE_SITE_URL` looks
  local it skips deliberately (so a laptop build can't bake `localhost` canonicals) — a local
  `npm run build` therefore succeeds with every route client-rendered, exactly as before.
- **`PRERENDER_STRICT=1` is the safety net, not a risk.** A failed build produces no deployment,
  so Vercel keeps the current one serving — the blast radius is "the deploy doesn't ship", never
  "the site breaks". The previous prerender exited 0 on failure and went unnoticed for months.

  Behaviour matrix (all four verified):

  | Situation | `PRERENDER_STRICT` unset | `PRERENDER_STRICT=1` |
  |---|---|---|
  | local build (`VITE_SITE_URL` = localhost) | exit 0, routes stay CSR | **exit 1** — catches a Vercel project missing `VITE_SITE_URL` |
  | production env, API reachable | exit 0, 48 routes baked | exit 0, 48 routes baked |
  | production env, **API down** | exit 0, ships a site with no metadata | **exit 1** — refuses to ship it |
  | a route fails to bake | exit 0, that route stays CSR | **exit 1** |
- `dist/app.html` is the neutral shell the `/(.*)` rewrite serves for every non-prerendered route.
  It must never gain a canonical or a per-route title.
- Escape hatch: `PRERENDER=false` writes `app.html` and leaves all routes client-rendered.
- No browser is involved. `vercel-build` no longer installs Chromium.

`frontend/vercel.json` now also carries a `redirects` block (`/index.html` → `/`) and route-scoped
`X-Robots-Tag: noindex` headers for the private/transactional routes. **Promotion gate:** on a
preview deployment, confirm public pages carry **no** `x-robots-tag`
(`curl -sI $PREVIEW/products/<slug> | grep -ci x-robots-tag` → `0`) while `/cart`, `/login`,
`/app.html` do. If a public page picks it up, Vercel is matching headers post-rewrite — fall back
to `<meta>`-only and do not promote.

---

## 4. Domains & DNS

Nameservers for `diecastbd.com` point at Vercel, so **Vercel is the authoritative DNS** and
auto-manages the A/CNAME records for the site and subdomains — you don't add those by hand.

- **Frontend:** add `diecastbd.com` (Connect to Production) + `www.diecastbd.com` as a **308
  Permanent Redirect → diecastbd.com**. When adding `www`, **uncheck "Include apex and www
  variants"** or Vercel tries to redirect the apex to itself ("a domain cannot redirect to
  itself").
- **Backend:** add `api.diecastbd.com` (Connect to Production; no redirect, no variants).

**Email (Resend) DNS lives in Vercel now.** Because nameservers moved to Vercel, the Resend
records that used to live at the old DNS host had to be **re-created in Vercel → Domains →
diecastbd.com → DNS Records**: the `MX` + SPF `TXT` on the `send` subdomain and the
`resend._domainkey` DKIM `TXT` (values come from Resend → Domains → diecastbd.com). In
Vercel's Name field enter only the subdomain part (`send`, `resend._domainkey`) — it appends
`.diecastbd.com`. If you ever re-point nameservers again, re-add these or order emails stop.

---

## 5. Why the backend must be a subdomain (`api.diecastbd.com`)

Auth is cookie-based: `POST /auth/session` sets httpOnly `accessToken`/`refreshToken`
cookies (`sameSite:"none"; secure:true` in production, `src/utils/cookies.js`); the axios
client sends them with `withCredentials:true`.

When the backend was on `die-castbd-backend.vercel.app`, those cookies were **cross-site**
(`diecastbd.com` vs `vercel.app` are different registrable domains) → browsers treat them as
**third-party cookies** and block them (Safari always, Chrome increasingly). Symptom: every
authed call — `/auth/refresh`, `/cart`, `/wishlist`, `/admin/*` — returned **401**, and the
admin dashboard couldn't load.

Moving the backend to `api.diecastbd.com` makes it **same-site** with the storefront, so the
cookies are **first-party** and accepted everywhere. No code change was needed — just the
subdomain + pointing `VITE_API_BASE_URL` at it. **Never put the backend on a bare
`*.vercel.app` host in production** for this reason.

---

## 6. Post-deploy wiring checklist

- [ ] Backend `CLIENT_URL` = `https://diecastbd.com` (exact) — else CORS blocks the storefront.
- [ ] Firebase Console → Auth → Settings → **Authorized domains** → add `diecastbd.com`.
- [ ] Admin access: your sign-in email is in backend `ADMIN_EMAILS` **and** verified.
- [ ] Smoke test in a fresh/incognito window: `api.diecastbd.com/health` → 200 · storefront
      loads products · sign in · add to cart · place a COD order · order shows in `/admin` and
      the confirmation email arrives.
- [ ] Google Search Console → submit `https://diecastbd.com/sitemap.xml` (proxied by
      `frontend/vercel.json` to `api.diecastbd.com/sitemap.xml`).

---

## 7. Issues hit during first deploy (and their fixes)

Quick reference if any recur:

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_REQUIRE_ESM … jose` from `jwks-rsa` | `firebase-admin` → `jwks-rsa` requires ESM-only `jose@6` via CommonJS `require()` | `overrides: { "jose": "^4.15.9" }` in `backend/package.json` (CJS-compatible). Verify lockfile resolves `jwks-rsa/node_modules/jose@4.x`. |
| `Invalid export found in module src/app.js. The default export must be a function or server` | Vercel auto-detected the Express app as a native server | `builds`/`routes` in `backend/vercel.json` (pins `api/index.js`, kills auto-detection) + `export default app` in `src/app.js`. |
| Frontend build: `Can't resolve '@fontsource-variable/archivo'` | `package-lock.json` out of sync — fonts declared but not resolved | `npm install` in `frontend/` to reconcile the lockfile, commit it. Vercel `npm ci` would fail on the mismatch. |
| Storefront/admin: 401 on all authed routes | cross-site third-party auth cookies (backend on `*.vercel.app`) | Move backend to `api.diecastbd.com` (§5). |
| `www` add fails: "a domain cannot redirect to itself" | "Include apex and www variants" checkbox expands the input to include the apex | Uncheck it; add `www` alone as a 308 redirect to the apex. |

---

## 8. Known follow-ups (not blockers)

- **bKash** — v1.0 is COD + manual bKash "Send Money"; the live gateway is deferred (schema
  already carries the fields).
- **Rate-limit store** — in-memory; fine per-instance. Serverless spreads across instances, so
  limits aren't globally shared — move to Redis if that matters.
- **Real policy copy** — the 4 CMS policy pages are seeded from the design; the merchant should
  replace them with genuine legal text via Admin → Pages.

## 9. One-off data scripts

Run from `backend/`, against whichever database `MONGODB_URI` points at — which is the **live
Atlas cluster**, so read the dry run before applying.

- **`node scripts/backfill-order-costs.mjs`** (profit reporting, plan.md #92) — snapshots each
  product's current `costPrice` onto order items placed before cost snapshots existed, then
  recomputes every daily rollup. Required after deploying #92: `AnalyticsDaily.revenue` changed
  meaning (now net of the delivery charge) and the counted statuses changed (confirmed-onward),
  so stored rows hold stale numbers until recomputed. Dry run by default; `--apply` writes.
  Idempotent — safe to re-run. **Already applied to the live cluster on 2026-08-07.**

Still outstanding from the admin light redesign (see
`docs/context/2026-07-18-admin-light-redesign-complete.md`): the announcement-bar `$set` to the
new shape, and the hero `$set hero.image` / `$unset heroBanner` + autoplay fields.

---

For architecture and history, see `docs/plan.md` (§7 decision #50 covers this deployment) and
`docs/log.md`.
