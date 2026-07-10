# DiecastBD — Deployment Runbook

Step-by-step guide to deploying DiecastBD v1.0 to production. The two apps deploy
independently: the **frontend** (Vite SPA) to **Vercel**, the **backend** (Express API)
to **Render**. Both are 12-factor and env-driven — no host lock-in in the code.

Target topology:

```
diecastbd.com          → Vercel (frontend)
api.diecastbd.com      → Render (backend)
MongoDB Atlas, Firebase, Cloudinary, Resend → already provisioned (dev + prod share, or split)
```

---

## 0. Prerequisites (accounts you need)

- [ ] **Vercel** account (frontend hosting)
- [ ] **Render** account (backend hosting) — or Railway; the steps are equivalent
- [ ] **GitHub** repo pushed (both apps live in one repo; each deploys from its own subdirectory)
- [ ] Existing credentials from development: **MongoDB Atlas**, **Firebase** (client config + Admin service account), **Cloudinary**, **Resend** (domain `diecastbd.com` already verified)
- [ ] Access to **DNS** for `diecastbd.com`

> **Decision — shared vs. separate prod database.** The dev work so far uses one Atlas
> cluster. For launch you can either keep using it (simplest) or create a separate prod
> database/cluster (cleaner separation, recommended if you'll keep developing). Either
> way, ensure the Atlas Network Access allowlist includes Render's outbound IPs (or
> `0.0.0.0/0` if you accept the tradeoff — Atlas still requires auth).

---

## 1. Backend → Render

1. **New Web Service** → connect the GitHub repo → set **Root Directory** to `backend`.
2. **Build command:** `npm install` · **Start command:** `npm start`.
3. **Health check path:** `/health` (already implemented — returns `{ success, data: { uptime } }`).
4. **Environment variables** (Render dashboard → Environment). Copy from `backend/.env.example`; the required ones:

   | Var | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render sets this; the app reads it) |
   | `MONGODB_URI` | Atlas connection string (prod DB) |
   | `CLIENT_URL` | `https://diecastbd.com` (exact origin — used for CORS **and** absolute sitemap URLs) |
   | `JWT_ACCESS_SECRET` | fresh 32+ char random string (**not** the dev value) |
   | `JWT_REFRESH_SECRET` | fresh 32+ char random string |
   | `COOKIE_SECRET` | fresh 32+ char random string |
   | `JWT_ACCESS_EXPIRES_IN` | `15m` (default) |
   | `JWT_REFRESH_EXPIRES_IN` | `30d` (default) |
   | `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | from the service account (keep the `\n` escapes in the private key — the code un-escapes them) |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |
   | `RESEND_API_KEY` | from Resend |
   | `EMAIL_FROM` | `noreply@diecastbd.com` |
   | `ADMIN_EMAILS` | comma-separated admin emails (auto-promoted on first **verified** sign-in) |

   > Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

5. Deploy. Confirm `https://<your-service>.onrender.com/health` returns 200.
6. (Optional but recommended) add the custom domain **`api.diecastbd.com`** in Render → Settings → Custom Domains, and create the DNS record it gives you.

**Already handled in code for this environment:**
- `app.set("trust proxy", 1)` in production → `secure` cookies are set and rate-limiting keys off the real client IP behind Render's proxy.
- Cookies use `sameSite: "none"; secure: true` in production → they work across the `diecastbd.com` ↔ `api.diecastbd.com` origin split.

---

## 2. Frontend → Vercel

1. **New Project** → import the repo → set **Root Directory** to `frontend`. Framework preset: **Vite** (auto-detected). Build: `npm run build`, output `dist`.
2. **Environment variables** (from `frontend/.env.example`), all `VITE_`-prefixed so they're inlined at build:

   | Var | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://api.diecastbd.com/api/v1` |
   | `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | the Firebase **client** config values |

3. **`frontend/vercel.json` is already committed** and does three things — **before deploying, edit one line in it:** replace `REPLACE_WITH_BACKEND_URL` in the `/sitemap.xml` rewrite with your real backend host (e.g. `api.diecastbd.com`). The file provides:
   - **SPA fallback** — every non-file route rewrites to `index.html` so client-side routing works on refresh/deep-link.
   - **Sitemap proxy** — `diecastbd.com/sitemap.xml` → the backend's dynamic sitemap, so crawlers find it at the site root.
   - **COOP header** — `Cross-Origin-Opener-Policy: same-origin-allow-popups`, which silences the Firebase sign-in-popup `window.closed` warning.
4. Deploy. Add the custom domain **`diecastbd.com`** (and `www` → redirect) in Vercel → Domains, and create the DNS records it gives you.

---

## 3. Wire the services together (post-deploy)

- [ ] **Firebase Authorized Domains** — Firebase Console → Authentication → Settings → Authorized domains → add `diecastbd.com` (and the `*.vercel.app` preview domain if you use previews). Google/email sign-in is blocked from unlisted domains.
- [ ] **CORS** — confirm the backend's `CLIENT_URL` exactly matches `https://diecastbd.com` (no trailing slash). The API only accepts credentialed requests from that origin.
- [ ] **Smoke test the full flow on production:** load the storefront, sign in, add to cart, place a COD order, confirm the confirmation email arrives, then check the order appears in `/admin`.
- [ ] **Google Search Console** — add the property, verify, and submit `https://diecastbd.com/sitemap.xml`.

---

## 4. Known follow-ups (not blockers)

- **bKash** — checkout is COD-only for v1.0; the `Order` schema already carries the bKash fields, so enabling it later is additive (needs real merchant credentials).
- **Rate-limit store** — the limiter is in-memory; fine on a single Render instance. If you scale to multiple instances, move it to a shared (Redis) store so limits are shared.
- **HWCC-004** — one product has no image pending a data fix (M3 vs M5 discrepancy in `docs/Inventory.md`); see `docs/log.md`.

---

For architecture and history, see `docs/plan.md` (current state) and `docs/log.md` (changelog).
