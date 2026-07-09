# DiecastBD — Development Log

Running record of what was done, in order. Newest entries go at the **bottom**. Each phase gets its own section; ad-hoc changes between/after phases get their own dated entries appended the same way. For the current state of the architecture (not history), see `docs/plan.md`.

---

## Phase 0 — Architecture & System Design

No code. Produced the full architecture plan: tech stack confirmation, folder structure, database design, API design, state/routing design, environment variables. Three deliberate deviations from the literal spec flagged and approved: `OrderItems` embedded (not a collection), `Cart` collection added (not in the original list), `Analytics` scoped to rollups instead of raw event tracking. Confirmed with the user: COD + bKash for payment, English-only for v1.0, Vercel + Railway/Render as the hosting target, `react-router` (not `react-router-dom`).

Mid-review, user asked for shadcn/ui to be added alongside DaisyUI — resolved by making shadcn the primary primitive layer and narrowing DaisyUI to components shadcn doesn't ship (Rating, Steps, Loading), avoiding two competing component systems.

## Phase 1 — Project Initialization

Scaffolded `frontend/` (React 19 + Vite, JS not TS) and `backend/` (Express 5 + ESM). Tailwind v4 + shadcn/ui (Nova preset, Radix base) + DaisyUI configured with the brand's dark/lime palette (sourced from the logo once it was dropped into `assets/logo/`). Base folder structure, `.env.example` for both apps, MongoDB Atlas + Firebase Admin/client config wired and verified live.

**Bugs found and fixed:**
- `express-mongo-sanitize` is incompatible with Express 5 (tries to reassign `req.query`, which has no setter) — replaced with a custom in-place sanitizer, tested against injection payloads.
- `create-vite`'s `react-swc` template no longer exists in the current CLI — silently produced a vanilla-ts skeleton instead of failing; caught by inspecting the scaffolded files and re-run with the correct template.

Credentials obtained and verified: MongoDB Atlas (had to fix an IP allowlist issue), Firebase (client config + Admin SDK service account).

## Phase 2 — Authentication System

Firebase (email/password + Google) as identity provider; backend verifies the Firebase ID token and mints its own JWT session (httpOnly access + refresh cookies) so RBAC is backend-owned and independent of Firebase's 1-hour token expiry. `ADMIN_EMAILS` env var auto-promotes matching accounts to admin on first sign-in. Frontend: Login/Register/Forgot-password forms, `useCurrentUser()` (TanStack Query) as source of truth with a thin Zustand mirror for route guards, axios interceptor for silent token refresh.

Mid-phase, scope expanded: user asked for self-service profile CRUD, customer order/cart visibility, and admin user-role management. Resolved by splitting the work — self-service profile CRUD (`PATCH/DELETE /users/me` + a My Profile page) landed in this phase since it's tightly coupled to the User model already being built; admin user-management (list/search/role-change) deferred to Phase 10 alongside the admin UI that will consume it, since shipping the API without a UI to exercise it means shipping untested surface area.

**Bug found and fixed (real security issue):** `PATCH /users/me` allowed a logged-in customer to smuggle `"role": "admin"` into the request body and self-promote. Root cause: the `validate()` middleware stripped unknown fields from the *validated Zod result* but never removed them from `req.body` itself, so the untouched `role` field rode along into the database write. Fixed at the middleware level (body fully replaced with validated data, not merged) and with defense-in-depth in the controller (explicit field whitelist rather than trusting `req.body` wholesale). Verified closed by retesting the exact attack.

## Phase 3 — Database Models, Seed Script, Cloudinary, Product/Brand/Category CRUD

Built `Category`, `Brand`, `Product` models; Cloudinary + Multer image upload (thumbnail/gallery, replace/delete sync); `AuditLog` model + middleware wrapping every admin mutation route automatically. Public read API (filter/search/paginate) and full admin CRUD for all three catalog resources. Seed script imports the real 32-SKU July 2026 inventory from `docs/Inventory.md` as hand-curated structured data (not runtime markdown parsing — the source doc mixes title/series/model-number/variant into one free-text string per SKU that doesn't decompose reliably by regex); idempotent, safe to re-run. Admin frontend: Products (data table, filters, create/edit form, image manager) and a shared `SimpleCatalogManager` (list + dialog CRUD) reused by Brands and Categories since their CRUD shape is identical.

**Bugs found and fixed:**
- Express 5's `req.query` is an **uncached getter** — it re-parses the raw query string fresh on every access, so the earlier "mutate in place" fix for `validate()` was silently discarded for query params specifically (pagination defaults never reached controllers). Fixed by shadowing the property on the request instance via `Object.defineProperty` instead of mutating the returned object.
- Mongoose 9 deprecation: `findOneAndUpdate`'s `new: true` replaced with `returnDocument: "after"` throughout.

Cloudinary credentials obtained and verified (upload, replace, delete-sync all tested against real Cloudinary assets).

## Phase 4 — Homepage

`WebsiteSettings` (singleton CMS content) and `NewsletterSubscriber` modules built; `featured`/`hero`/`newArrival` filters added to the existing product list endpoint. Seeded real DiecastBD brand copy (hero banner, "why choose us," collector promise) — but testimonials and social/contact fields deliberately left empty rather than fabricated, since fake customer quotes are deceptive even as placeholder data if they ever shipped unedited. Frontend: real logo wired into header/footer, `ProductCard` (first reusable product display component), Embla carousels for Collector Picks/Featured/New Arrivals, hero carousel with Framer Motion transitions — every section reading from live data.

**Bugs found and fixed:**
- lucide-react (installed version) has no Facebook/Instagram glyphs — brand icons were dropped from the package. Replaced with small inline SVGs.
- A section used `import * as Icons from "lucide-react"` for dynamic icon-by-name lookup, which defeats tree-shaking and pulled in the full 1000+ icon set (~600KB). Switched to an explicit icon allow-list.

## Phase 5 — Product Listing (Shop Page)

Added a `series` filter and a `filter-options` endpoint (distinct series values + price bounds) to the product API. Frontend Shop page: all filter/sort/search/pagination state lives in the URL via `useSearchParams` (shareable, bookmarkable, back-button-safe). Filter sidebar collapses into a slide-out Sheet on mobile. Header got a real "Shop" link; homepage hero CTAs updated to point to `/shop` (with brand pre-filtered) now that the route exists.

## Phase 6 — Product Detail Page

`Wishlist` module (add/remove/list, idempotent, unique per user+product). PDP with Embla gallery + click-to-zoom dialog, specs table, breadcrumb, native Web Share with clipboard fallback, JSON-LD Product structured data + per-product Open Graph tags. Wishlist heart button wired into both `ProductCard` and the PDP via one shared cache (no N+1 per-card requests). Recently Viewed is a Zustand + localStorage store — deliberately client-only, no backend, since it's device-local browsing history. No add-to-cart yet at this point (Cart was still Phase 7).

**Bugs found and fixed (both reported by the user from a screenshot):**
- `WishlistButton`'s labeled variant and `ShareButton` used different button implementations with mismatched padding/height. Fixed by routing the labeled variant through the same shadcn `Button` component/size.
- Nine sections across the app implemented "centered max-width content with padding" two different ways (padding inside vs. outside the max-width wrapper) — mathematically identical on narrow viewports but diverging by exactly the padding amount once the viewport exceeds the max-width, which is exactly what the user's wide monitor surfaced. Root-caused and fixed by consolidating all nine onto one new `Container` component rather than patching the symptom section-by-section.

## Phase 7 — Cart System

`Cart` module with atomic stock-validated add/update/remove and a `merge` endpoint. Totals computed from the *live* populated product price at fetch time, not the stored `priceSnapshot` — a cart is pre-purchase browsing state, so totals should reflect current reality; the snapshot only powers a "price changed" hint. Frontend: one `useCart()` hook presents an identical interface for guests (Zustand + localStorage, no backend calls) and logged-in users (server cart) — components never branch on auth state. `CartMergeOnLogin` (mounted once at the app root, lives in the cart feature rather than auth, since cart is what cares about the login event) drains the guest cart into the server cart the moment login state flips. `AddToCartButton` (qty selector capped at stock) on the PDP, header `CartDrawer`, and a full `/cart` page share one `CartLineItem` component.

Full stock-validation lifecycle verified via curl: add succeeds up to stock, exceeding stock is rejected with a clear message, merge caps at available stock rather than double-adding.

## Phase 8 — Checkout, Orders, Emails, Confirmation

The largest phase to date. New backend modules: `Address` (CRUD, first address auto-defaults, deleting the default promotes the next one), `Coupon` (model + `validate` endpoint, discount math centralized in `coupon.service.js` so preview and checkout can never drift — admin CRUD UI still deferred to Phase 10, seeded two real test coupons so checkout could actually be exercised), `InventoryLog` (audit trail for every stock movement), and `Order` itself.

**Stock reservation design** (the core of this phase): `reservedStock` holds inventory for pending orders without touching `stock`; crossing into a "committed" status (`confirmed` and beyond) converts the hold into a permanent `stock` decrement; cancelling before that commit just releases the hold, cancelling after restores the stock. Implemented inside a real MongoDB multi-document transaction (Atlas free-tier clusters are replica sets, so transactions are available) rather than best-effort sequential updates, since inventory/money correctness isn't a place to cut corners. Verified end-to-end via curl: reserve → confirm (commits stock) → cancel-after-confirm (restores stock) → separate order pending → cancel-before-confirm (releases hold, stock untouched) → terminal-status guard (can't modify a cancelled order further). All four paths behaved exactly as designed.

Before starting, asked the user whether to wire up bKash now or ship COD-only — chose COD-only given bKash needs real sandbox merchant credentials tied to a business account the user doesn't have yet. The `Order` schema already carries the bKash-related fields, so this is additive later, not a rework.

Frontend: Address book (inline add-new during checkout), Checkout page (address selection, phone/delivery note, coupon apply with live discount preview, COD-only payment selection with bKash shown disabled as "coming soon"), order confirmation page (success banner on first view, doubles as the permanent order-detail view), My Orders history list.

Resend credentials requested for order-confirmation emails (send is wrapped in try/catch so a missing/failing email never blocks order creation) — pending at the time of this entry.

## Documentation established

Created `docs/plan.md` (current-state architecture, kept up to date going forward) and this file, `docs/log.md` (chronological changelog, append-only), at the user's request — both are now standing requirements for the rest of the project, updated after every phase and every subsequent change, not just through Phase 8.

## Phase 8 continued — Resend wired in and verified

Received the real Resend API key. Wired it into `backend/.env` along with `EMAIL_FROM=onboarding@resend.dev` (no custom domain verified yet, so this is Resend's default testing sender).

**Bug found and fixed:** the Resend SDK resolves to `{ data, error }` on API-level failures rather than throwing — `sendOrderConfirmationEmail` was `await`-ing the call and never checking `result.error`, so a failed send would silently succeed from the code's point of view instead of hitting the caller's `.catch()`. Fixed by checking `error` and throwing manually when present.

Verified live: a direct Resend test send confirmed Resend's sandbox restriction (with an unverified domain, `onboarding@resend.dev` can only deliver to the account's own address, `diecastbd.official@gmail.com` — sending to any other address returns a 403 `validation_error`, not a crash). Retested against the correct recipient and it delivered successfully. Then called `sendOrderConfirmationEmail` directly with a realistic fake order (multiple items, coupon discount, free shipping) to confirm the actual HTML template renders and sends correctly end-to-end — confirmed. Real order creation will only email successfully for accounts matching the Resend-verified address until a custom sending domain is verified at resend.com/domains; noting this as a known limitation to revisit before production launch (Phase 12).

## Phase 8 bugfix — nested `<form>` elements broke coupon apply and address save

User reported that clicking "Apply" on the coupon field behaved like a page reload, and that saved addresses/customer details went missing on reload. Audited every form in the checkout flow to find the root cause: `CheckoutPage` wraps the whole checkout in one outer `<form>`, and both `AddressForm` (rendered via `AddressSelector`) and `CouponInput` rendered their *own* `<form>` elements inside it. HTML explicitly forbids `<form>` as a descendant of `<form>` — React will still construct that DOM structure without complaint, but the browser's `submit` event bubbles regardless, so clicking "Apply" or "Save address" fired the inner form's own handler *and* bubbled up to trigger the outer checkout form's `handleSubmit`, running full checkout validation/submission with whatever partial state happened to exist. Which of the two nested forms actually "owns" a given submit click is undefined behavior in browsers precisely because nested forms are invalid — that's why the symptoms looked inconsistent rather than a clean, reproducible failure.

Confirmed via the Phase 8 curl testing that `POST /addresses` itself was never the problem — this was purely a frontend structural bug, not data loss on the backend.

**Fix:** removed the `<form>` tag from both `AddressForm` and `CouponInput`, converting their submit buttons to `type="button"` with `onClick={handleSubmit(onSubmit)}` (react-hook-form's `handleSubmit` works fine as a plain click handler, it doesn't require an actual form submit event) — `CouponInput` additionally handles Enter-key-in-input manually via `onKeyDown` to restore the UX a real form would give for free. Audited every other `onSubmit={handleSubmit(...)}` usage in the codebase (8 total) for the same pattern — the only other candidate, `SimpleCatalogManager`'s form, lives inside a Radix `Dialog`, which portals its content to `document.body` and is therefore never actually a DOM descendant of any surrounding page form, so it was already safe.

## Resend domain verification

User already owned `diecastbd.com` and verified it with Resend (added the SPF/DKIM DNS records Resend generated). Updated `EMAIL_FROM` to `noreply@diecastbd.com` and restarted the backend. Verified live by sending to an address other than the Resend account owner's — delivered successfully with no restriction error, confirming the earlier sandbox limitation is fully resolved. Order confirmation emails now work for any real customer, not just the account owner.

---

## Phase 9 — Order Management: Admin, Customer Tracking, Analytics

Triggered by the user noticing their own real checkout ("order flow is incomplete i dont see a confirmed order in admin dashboard") — confirmed this was expected Phase 9 scope, not a Phase 8 gap, and proceeded.

**Backend:** `Order` gained `statusHistory[]` (status/note/changedBy/at — already existed structurally but is now populated on every transition), plus `trackingNumber`/`courierName`, settable when an admin transitions an order to `shipped`. `transitionOrderStatus` (the existing stock-reservation-aware service from Phase 8) extended to accept and persist them rather than adding a second write path. New admin endpoints: `GET /admin/orders/:id` (populates customer name/email/phone) and search-by-`orderNumber` (`?q=`) on the existing list endpoint.

New `analytics` module: `AnalyticsDaily` model + `computeDailyRollup()`/`upsertDailyRollup()`/`getSummary()`/`getDailyHistory()`. `LOW_STOCK_THRESHOLD` set to 2 units, not a generic "10 units" default — collector diecast is seeded with naturally thin per-SKU stock (1-4 units typical), so a bulkier-retail threshold would flag almost the entire catalog as low-stock and make the signal useless. `GET /admin/analytics/summary` computes today live (the stored table won't have today's row until the nightly job runs) plus a live last-7-days total; `GET /admin/analytics/daily` serves the stored history.

Two `node-cron` jobs wired in via a new `jobs/scheduler.js`, started from `server.js` right after the DB connects: a nightly rollup (`5 0 * * *` UTC) that computes *yesterday's* rollup (today isn't finished yet) and upserts it into `AnalyticsDaily`, and an hourly stale-reservation release (`0 * * * *`) that finds `pending` orders older than 48 hours (abandoned COD orders nobody ever confirmed) and auto-cancels them by calling the existing `transitionOrderStatus` release path with `actorId: null` — reusing the Phase 8 stock-release logic rather than writing a second one.

**Frontend:** new admin `orders` and `analytics` features. `OrderStatusStepper` (new shared component, built on the DaisyUI `steps` primitive reserved for exactly this in Phase 0) renders the fulfillment flow (`pending → confirmed → packed → shipped → delivered`, or a terminal cancelled/refunded banner) and is used on *both* the customer-facing order-detail page and the new admin order-detail page — one shared visual language for order status, not two maintained separately. Admin `OrdersPage` (debounced search, status filter, paginated table) and `OrderDetailPage` (items/totals/address/status-history, plus an inline status-transition form that reveals tracking-number/courier inputs only when the selected next status is `shipped`). Customer `OrderDetailPage` (from Phase 8) updated to render the same stepper and a tracking-number display block when present.

Admin Dashboard (previously a Phase 1 placeholder) rebuilt with real data: stat cards (today's revenue/orders, last-7-days revenue/orders, new customers today, low-stock count) and a hand-built SVG revenue line/area chart (no charting library in the stack, and a single-series daily-revenue chart doesn't justify adding one) with hover crosshair + tooltip, following the project's dataviz conventions — one hue since it's a single series (brand primary lime, no legend needed), thin 2px line, recessive gridlines. A top-products-today list rounds out the dashboard, linking each product through to its admin edit page.

Wired `/admin/orders` and `/admin/orders/:id` into the router (aliased imports since the customer-facing `OrdersPage`/`OrderDetailPage` names were already taken) and added an "Orders" entry to the admin sidebar nav.

**Verification:** full lifecycle tested via curl end-to-end against a disposable test order (created, transitioned through `confirmed` → `shipped` with tracking info, confirmed `statusHistory`/tracking fields persisted correctly) — deliberately kept separate from the user's real pending order `DBD-20260709-B4519B` so it was never touched by testing. Also verified the analytics rollup computation directly against real order data, `releaseStaleReservations()` running cleanly with zero eligible orders (nothing old enough yet), and admin order search matching partial order numbers. No bugs found this phase — all backend paths passed on first verification.

## Phase 9 bugfix — order confirmation email never sent (real bug, user-reported)

User placed a real order from a logged-in customer account and got no confirmation email. Backend log showed the actual failure: `Order confirmation email failed: Resend: Missing \`to\` field.` Root cause: `authenticate` middleware deliberately keeps the JWT payload minimal — `req.user = { id, role} }` only, no name/email, to keep the token small and avoid baking in stale profile data. `createOrder` was passing `req.user` straight into `sendOrderConfirmationEmail`, which needs `.name`/`.email` for the `to` field and greeting — both were always `undefined` on that path. This bug existed since Phase 8 but was never caught because Phase 8's email verification called `sendOrderConfirmationEmail` directly with a hand-built fake user object (real name/email), never through the actual authenticated order-creation controller.

**Fix:** `createOrder` now fetches the real `User` document (`User.findById(req.user.id).select("name email")`) before sending, and passes that to the email function instead of the minimal JWT-derived `req.user`. Verified by fetching the real customer's account this way and sending an actual order-confirmation email end-to-end — delivered successfully, confirming the fix.

---

<!-- Append new entries below this line as work continues, following the same format:
one heading per phase or per notable change, prose paragraphs (not just bullet diffs),
call out bugs found/fixed explicitly, and note any credentials obtained. -->
