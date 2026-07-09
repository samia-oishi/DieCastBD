# DiecastBD — Project Plan

Living architecture document for DiecastBD v1.0 — a premium, collector-focused diecast e-commerce platform for Bangladesh (Hot Wheels Premium + MINI GT now, more brands later). This file reflects the **current, as-built state** of the project, kept current as phases complete. For a chronological account of what happened and when, see `docs/log.md`.

---

## 1. Business Context

- **Brand positioning:** premium/luxury/minimal — "Apple, Porsche," not a toy shop. Dark theme, large product photography, restrained lime-green accent.
- **Current brands:** Hot Wheels Premium, MINI GT. Planned future brands: Tarmac Works, Kaido House, Inno64, Pop Race, Tomica Limited Vintage, Auto World.
- **Market:** Bangladesh. Currency: BDT (৳). Language: English only for v1.0.
- **Source of truth for inventory:** `docs/Inventory.md` (32 real SKUs, July 2026 purchase batch) — imported via `backend/src/seeds/`, never hand-typed into the frontend.
- **Payment:** Cash on Delivery (COD) for v1.0. bKash direct merchant API is designed into the schema (`paymentMethod`, `paymentStatus`, `bkashTransactionId` fields already exist) but not wired up — deferred until real bKash sandbox merchant credentials are available.

---

## 2. Tech Stack (as implemented)

**Frontend:** React 19, Vite, `react-router` v8 (no `react-router-dom`), Tailwind CSS v4, shadcn/ui (primary component layer, Radix-based) + DaisyUI (scoped to Rating/Steps/Loading only), Framer Motion, Embla Carousel (+ autoplay plugin), React Hook Form, Zod, Zustand (+ persist middleware for guest cart / recently-viewed), TanStack Query, Axios, React Hot Toast, React Helmet Async, Lucide React.

**Backend:** Node.js (ESM), Express 5, MongoDB Atlas, Mongoose 9, Firebase Admin SDK, `jsonwebtoken`, Multer, Cloudinary SDK, Zod, Helmet, `express-rate-limit`, Morgan, CORS, Compression, Dotenv, `cookie-parser`, Resend, `node-cron` (nightly analytics rollup + hourly stale-reservation release), `bcrypt` (unused — Firebase owns credentials, no passwords stored locally).

**Notable version-driven deviations from the original plan** (see §7 for details): custom NoSQL-sanitize middleware (Express 5 breaks `express-mongo-sanitize`), custom `req.query` handling in validation middleware (Express 5's `req.query` is an uncached getter), `returnDocument: "after"` instead of deprecated Mongoose `new: true`.

---

## 3. Repository Structure

```
DieCastBD/
├── docs/                       # Inventory.md (source data), plan.md (this file), log.md (changelog)
├── frontend/                   # React 19 + Vite SPA — see structure below
└── backend/                    # Express API — see structure below
```

### Frontend (`frontend/src/`)
```
app/                    # router.jsx, providers/ (AppProviders), layouts/ (Public, Auth, Admin)
features/                # one folder per domain — each owns api/, components/, schemas/, hooks/
  auth/ account/ home/ products/ categories/ brands/ cart/ checkout/ orders/
  wishlist/ addresses/ newsletter/ settings/
  admin/{dashboard,products,brands,categories,catalog,orders,analytics,customers,coupons,inventory,settings,reports}/
components/
  ui/                    # shadcn-generated primitives
  shared/                # cross-feature composed components (ProductCard, Container,
                          #   ProductCarouselSection, Breadcrumb, Footer, Pagination, SocialIcons,
                          #   OrderStatusStepper (DaisyUI steps, shared customer+admin)...)
stores/                  # zustand: authStore, cartStore (guest, persisted), recentlyViewedStore (persisted)
lib/                     # axios instance (+ refresh interceptor), queryClient, firebase.js, utils.js
hooks/                   # useDebounce...
constants/               # routes.js (ROUTES, ROLES)
assets/logo/             # brand logo (logo.jpg)
```

### Backend (`backend/src/`)
```
config/                  # env.js (Zod-validated, fail-fast), db.js, firebaseAdmin.js, cloudinary.js,
                          #   constants.js (LOW_STOCK_THRESHOLD — shared by analytics + inventory)
modules/                 # one folder per domain, each: *.model.js, *.controller.js, *.service.js,
                          #   *.routes.js, *.validation.js
  auth/ users/ brands/ categories/ products/ settings/ newsletter/ wishlists/ cart/
  addresses/ coupons/ orders/ inventoryLogs/ auditLogs/ analytics/ inventory/
middlewares/             # authenticate, authorize(role), validate(schema), errorHandler,
                          #   rateLimiters, upload (Multer), auditLog, sanitize (custom)
utils/                   # apiResponse, apiError, asyncHandler, slugify, cloudinaryUpload,
                          #   jwt, cookies, parseDuration, generateOrderNumber
emails/                  # resendClient.js, orderConfirmation.js (HTML template + send)
jobs/                    # analyticsRollup.cron.js (nightly), releaseReservedStock.cron.js (hourly),
                          #   scheduler.js (registers both via node-cron, started from server.js)
seeds/                   # index.js (idempotent) + data/ (catalog, settings, coupons)
routes/index.js          # mounts every module router under /api/v1
```

---

## 4. Database Schema (MongoDB / Mongoose, as built)

Naming: `camelCase` fields, `PascalCase` model names, plural collections.

| Model | Purpose | Key fields | Notes |
|---|---|---|---|
| **User** | Account identity | `firebaseUid` (unique), `email` (unique), `name`, `phone`, `photoURL`, `role` (customer\|staff\|admin), `isActive`, `lastLoginAt` | No password — Firebase owns credentials. Role auto-assigned via `ADMIN_EMAILS` env on first sign-in. |
| **Brand** | Hot Wheels Premium, MINI GT, ... | `name`, `slug` (unique), `logo`, `isActive`, `sortOrder` | |
| **Category** | Premium Singles, Multi-Packs, Accessories | `name`, `slug` (unique), `parentCategory` (self-ref), `image`, `isActive`, `sortOrder` | Hot Wheels' own sub-lines (Car Culture, F1 Gold Label, etc.) live on `Product.series` (free text), not as categories. |
| **Product** | Catalog item | `sku` (unique), `slug` (unique), `title`, `brand` (ref), `category` (ref array), `manufacturer`, `series`, `modelNumber`, `scale`, `material`, `color`, `description`, `features[]`, `specifications` (Map), `thumbnail`, `gallery[]`, `price`, `salePrice`, `costPrice` (`select:false` — never sent to storefront), `stock`, `reservedStock`, `status` (draft\|active\|archived), `isFeatured`, `isHeroProduct`, `isNewArrival`, `tags[]`, `seo`, `isDeleted` | `availableStock` = `stock - reservedStock`, virtual, never stored. Text index on title/description/tags. |
| **Cart** | One per logged-in user | `user` (unique ref), `items[]` {product, qty, priceSnapshot} | *Not in the original spec's collection list — added because guest carts are client-only (Zustand/localStorage) and logged-in carts need a server home independent of the User doc (avoids write contention on auth-critical data).* Totals computed from **live** product price at read time, not the snapshot (snapshot is a "price changed" hint only). |
| **Wishlist** | Saved products | `user` (ref), `product` (ref) — compound unique | |
| **Address** | Saved shipping addresses | `user` (ref), `label`, `recipientName`, `phone`, `addressLine1/2`, `city`, `district`, `postalCode`, `isDefault` | First address auto-defaults; deleting the default promotes the next most recent. |
| **Order** | Placed order | `orderNumber` (unique, `DBD-YYYYMMDD-XXXXXX`), `user`, `items[]` (**embedded snapshot** — title/sku/price/thumbnail/qty at purchase time, immune to later product edits), `shippingAddress` (embedded snapshot), `phone`, `deliveryNote`, `coupon` (ref, nullable) + `couponCode` (snapshotted), `subtotal`, `discount`, `shippingFee`, `total`, `paymentMethod` (cod\|bkash), `paymentStatus`, `bkashTransactionId`, `status` (pending\|confirmed\|packed\|shipped\|delivered\|cancelled\|refunded), `statusHistory[]` {status, note, changedBy, at}, `trackingNumber`, `courierName` | *`OrderItems` deliberately not a separate collection — see §7.* Tracking fields set when status transitions to `shipped`; both customer and admin order-detail pages render a shared `OrderStatusStepper`. |
| **AnalyticsDaily** | Nightly business rollup | `date` (unique, `YYYY-MM-DD`), `revenue`, `ordersCount`, `newCustomers`, `topProducts[]` {product, title, unitsSold} (top 5), `lowStockCount` | Computed by `computeDailyRollup()` from live `Orders`/`Users`/`Products`; upserted nightly at 00:05 UTC for the *previous* day (today is still in progress). `GET /admin/analytics/summary` computes today's rollup live (not from the stored table, which won't have today's row yet) plus a live last-7-days total. `LOW_STOCK_THRESHOLD = 2` — deliberately low because collector diecast is seeded with naturally thin per-SKU stock (1-4 units), so a >10-unit threshold would flag nearly the whole catalog. |
| **Coupon** | Discount codes | `code` (unique), `type` (percentage\|fixed), `value`, `minOrderValue`, `maxDiscount`, `usageLimit`, `usedCount`, `expiresAt`, `isActive` | Admin CRUD UI deferred to Phase 10; model + validate endpoint + 2 seeded test coupons exist now. |
| **InventoryLog** | Stock movement audit trail | `product` (ref), `type` (restock\|sale\|reservation\|release\|adjustment), `quantityChange` (signed), `reason`, `referenceOrder`, `performedBy` | Written automatically at every reserve/commit/release transition (see §7 stock lifecycle). |
| **AuditLog** | Admin mutation trail | `actor`, `action`, `entityType`, `entityId`, `before`, `after`, `ip` | Written by a middleware wrapping every admin mutation route — not hand-called per controller, so it can't be forgotten. |
| **Settings** | Singleton CMS content | `heroBanner[]`, `announcementBar`, `whyChooseUs[]`, `collectorPromise`, `testimonials[]`, `socialLinks`, `contactInfo`, `shippingFee`, `freeShippingThreshold`, `seoDefaults` | Testimonials/social/contact deliberately seeded empty — no fabricated content. Admin editor UI deferred to Phase 10. |
| **NewsletterSubscriber** | Email capture | `email` (unique), `subscribedAt`, `isActive` | |

---

## 5. API Reference (as built)

Base path `/api/v1`. Envelope: `{ success, data, meta? }` / `{ success: false, message, errors? }`. Every write route: `authenticate` → `authorize(role)` → `validate(schema)` → controller → (admin mutations) `auditLog`.

| Domain | Endpoints |
|---|---|
| Auth | `POST /auth/session`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |
| Users (self) | `PATCH /users/me`, `DELETE /users/me` (soft-deactivate) · admin: `GET /admin/users` (search/filter by role/isActive), `GET /admin/users/:id`, `PATCH /admin/users/:id` (name/phone/isActive), `PATCH /admin/users/:id/role` (**admin-only**, not staff — guards: can't change own role, can't demote the last remaining admin) |
| Brands | `GET /brands` · admin: `GET/POST /admin/brands`, `PATCH/DELETE /admin/brands/:id`, `POST /admin/brands/:id/logo` |
| Categories | `GET /categories` · admin: same CRUD shape as Brands, `/admin/categories` |
| Products | `GET /products` (brand/category/series/price/inStock/featured/hero/newArrival/sort/q/page/limit), `GET /products/filter-options`, `GET /products/:slug`, `GET /products/:slug/related` · admin: full CRUD + `POST /admin/products/:id/thumbnail`, `POST /admin/products/:id/gallery`, `DELETE /admin/products/:id/gallery/:index` |
| Inventory | admin only: `GET /admin/inventory` (stock/reserved/available per product, `lowStockOnly` filter, search), `GET /admin/inventory/:id/logs` (history), `POST /admin/inventory/:id/adjust` (restock/adjustment, blocked if it would drop stock below `reservedStock`) |
| Coupons | `POST /coupons/validate` (authenticated) · admin: `GET/POST /admin/coupons`, `GET/PATCH/DELETE /admin/coupons/:id` (code immutable after creation; delete blocked once `usedCount > 0` — deactivate instead) |
| Settings | `GET /settings` · admin: `PATCH /admin/settings`, `POST /admin/settings/upload-image` (standalone Cloudinary upload for hero-slide images — returns `{url, cloudinaryId}` for the client to attach and save with the next full PATCH) |
| Newsletter | `POST /newsletter/subscribe` |
| Wishlist | `GET /wishlist`, `POST/DELETE /wishlist/:productId` (all authenticated) |
| Cart | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:productId`, `DELETE /cart/items/:productId`, `POST /cart/merge` (all authenticated — guest cart never touches the server until merge) |
| Addresses | `GET/POST /addresses`, `PATCH/DELETE /addresses/:id` (all authenticated) |
| Orders | `POST /orders`, `GET /orders` (mine), `GET /orders/:orderNumber` (mine) · admin: `GET /admin/orders` (paginated, filter by `status`, search by `q` on `orderNumber`), `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` (body: `status`, `note?`, `trackingNumber?`, `courierName?`) |
| Analytics | admin only: `GET /admin/analytics/summary` (today live + last-7-days), `GET /admin/analytics/daily?days=30` (stored `AnalyticsDaily` history, max 90 — also powers the Reports page's CSV export, no separate reporting backend) |

**Admin UI status:** every domain now has full admin dashboard UI — Products/Brands/Categories (Phase 3), Orders + Dashboard/Analytics (Phase 9), Customers/Coupons/Inventory/Settings/Reports (Phase 10).

---

## 6. Frontend Architecture

- **Design system:** dark theme is a fixed brand identity choice, not a toggle — single `:root` palette in `index.css`, no light-mode variant. shadcn/ui is the primary primitive layer; DaisyUI covers only Rating/Steps/Loading. All page-width/padding logic lives in one `<Container>` component (see §7 — this was a real bug fix, not a preemptive abstraction).
- **State split:** Zustand for client-only state that has no server counterpart (guest cart, recently-viewed, auth session mirror). TanStack Query for everything that comes from the API. Nothing server-authoritative lives in Zustand.
- **Auth state:** `useCurrentUser()` (TanStack Query) is the source of truth; `authStore` (Zustand) mirrors just `{status, role}` for synchronous route-guard reads, always written from the query result — never fetched independently.
- **Cart duality:** one `useCart()` hook presents an identical interface whether the visitor is a guest (Zustand + localStorage) or logged in (server API) — components never branch on auth state. `CartMergeOnLogin` (mounted once at the app root) drains the guest cart into the server cart the moment login state flips.
- **Routing:** `react-router` v8 Data Router (`createBrowserRouter`). Layouts: `PublicLayout` (header/footer), `AuthLayout` (centered, no chrome), `AdminLayout` (sidebar). Guards: `ProtectedRoute` (any authenticated user), `RequireRole` (admin/staff only).

---

## 7. Key Architectural Decisions & Deviations

Flagged explicitly as they were made, not silently — this section is the running record.

1. **`OrderItems` embedded, not a separate collection.** Order line items are always read with their order, never queried independently, and must snapshot product state at purchase time so later edits/deletion never corrupt order history.
2. **`Cart` collection added** (not in the original spec list) — guest carts are client-only; logged-in carts need a server home independent of the `User` document to avoid write contention on auth-critical data.
3. **`Analytics` scoped to business rollups, not raw event tracking** — built in Phase 9 as `AnalyticsDaily`, computed nightly from Orders/Products/Users. Traffic/behavior analytics is intentionally out of scope — that's what GA4/Plausible are for.
4. **shadcn/ui + DaisyUI split**, not either/or — see §6.
5. **Express 5 compatibility fixes:**
   - `express-mongo-sanitize` reassigns `req.query` wholesale, which throws under Express 5 (`req.query` has no setter). Replaced with a custom middleware that mutates objects in place.
   - `req.query` in Express 5 is an **uncached getter** — it re-parses the raw query string on every access, so mutating the object it returns is silently discarded. The `validate()` middleware now shadows the property on the request instance via `Object.defineProperty` instead.
   - Mongoose 9 deprecated `findOneAndUpdate`'s `new: true` in favor of `returnDocument: "after"` — updated throughout.
6. **Mass-assignment fix:** `validate()` originally stripped unknown fields from the *validated result* but left them on `req.body` itself, letting a smuggled `"role": "admin"` ride through `PATCH /users/me` and self-promote a customer. Fixed at the middleware level (body is now fully replaced with validated data) and defense-in-depth in the controller (explicit field whitelist).
7. **Self-service profile CRUD landed in Phase 2**, admin user-management (list/search/role-change) deferred to Phase 10 alongside the admin UI that will consume it — building the API without the UI it's tested against would ship untested surface area. Role changes get their own dedicated endpoint (not folded into general profile update) so they can carry their own safety guards (can't demote yourself, can't demote the last admin) and their own audit-log action type.
8. **Stock reservation lifecycle** (Order module): `reservedStock` holds inventory for pending/unconfirmed orders without touching `stock`. Crossing into a "committed" status (`confirmed` and beyond) converts the hold into a permanent `stock` decrement (`InventoryLog` type `sale`). Cancelling before that commit just releases the hold (`release`); cancelling after commit restores the stock (`adjustment`). All of this runs inside a MongoDB multi-document transaction (Atlas clusters are replica sets even on the free tier, so this is available) — inventory/money correctness isn't a place to cut corners.
9. **Coupon math centralized** in `coupon.service.js` (`findValidCoupon` + `calculateDiscount`), shared by both the preview endpoint (`POST /coupons/validate`) and authoritative order creation — the discount calculation can never drift between preview and checkout.
10. **Transactional email uses a light-background template**, not the site's dark theme. Dark-mode HTML email renders inconsistently (sometimes illegibly) across clients that force their own color scheme — universal legibility wins over 1:1 brand-theme parity for this one surface.
11. **No fabricated content, ever.** Testimonials seed empty (frontend hides the section until real ones exist) rather than shipping fake customer quotes; social links/contact info stay blank rather than guessing at a real phone number or handle.
12. **`Container` component** (Phase 6): nine sections had independently hand-rolled "centered max-width content with padding," split between two subtly different nesting patterns that only diverge once the viewport exceeds the max-width. Consolidated onto one component so the bug class can't recur.
13. **bKash deferred**, COD-only for v1.0 checkout — real bKash sandbox merchant credentials require a business account the user doesn't have yet. The `Order` schema already carries `paymentMethod`/`paymentStatus`/`bkashTransactionId`, so wiring it up later is additive, not a rework.
14. **Stale-reservation release job** (Phase 9): a `pending` order older than 48 hours (never confirmed — customer abandoned COD or admin never actioned it) is auto-cancelled hourly by `releaseReservedStock.cron.js`, which reuses the existing `transitionOrderStatus` release path (`actorId: null` marks it system-initiated) rather than a bespoke stock-release code path — one lifecycle implementation, not two.
15. **`OrderStatusStepper` is one shared component** (`components/shared/`, built on the DaisyUI `steps` primitive reserved for this in Phase 0 §6) rendered on both the customer order-detail page and the admin order-detail page — the fulfillment flow (`pending → confirmed → packed → shipped → delivered`, or a terminal `cancelled`/`refunded` state) is one visual language, not two independently maintained progress indicators.
16. **Admin dashboard revenue chart is hand-built SVG**, not a charting library — the prescribed stack has no chart dependency, and the dashboard needs exactly one chart (single-series daily revenue line/area), which doesn't justify pulling in a general-purpose charting library. Follows the project's dataviz conventions: one hue (brand primary, since it's a single series — no legend needed), thin 2px line, hover crosshair + tooltip, recessive gridlines.
17. **Role changes are their own endpoint** (`PATCH /admin/users/:id/role`, admin-only — staff, who share every other `/admin/users` route, are explicitly excluded via a second `authorize("admin")` check on just this route), exactly as scoped in the Phase 0 addendum: guards against self-demotion and demoting the last remaining admin, both enforced server-side so the dashboard can never be locked out of.
18. **Coupon codes are immutable after creation**; the update endpoint doesn't accept `code`. Changing a distributed code would silently break every customer who already has it — deactivating and issuing a new code is the correct fix, not an edit. Deletion is similarly blocked once `usedCount > 0` (delete would erase real usage history); deactivation is the only path for a used coupon.
19. **`LOW_STOCK_THRESHOLD` extracted to `config/constants.js`**, shared by the analytics rollup (Phase 9) and the new inventory admin view (Phase 10) — two independent definitions of "low stock" would have been a real (if quiet) bug the moment one got tuned without the other.
20. **Manual stock adjustments are blocked from dropping `stock` below `reservedStock`** — reducing total stock below what's already promised to pending orders would silently break the reservation invariant the whole checkout/fulfillment lifecycle (Phase 8) depends on. The admin sees a clear error naming the reserved quantity rather than a generic validation failure.
21. **"Media" scoped into the Settings editor, not a standalone library.** The original Phase 0 folder sketch listed a separate `admin/media/`, but nothing in the spec needs a general asset browser beyond what per-product Cloudinary upload (Phase 3) and hero-banner images (Phase 10) already cover. `POST /admin/settings/upload-image` returns a Cloudinary `{url, cloudinaryId}` for the editor to attach to a hero slide and save with the next full settings PATCH, rather than a slide-index-addressed endpoint that would race against reordering.
22. **Reports reuses the Phase 9 `AnalyticsDaily` history**, not a separate reporting backend — `GET /admin/analytics/daily` already has everything a daily report needs; the Reports page adds a date-range picker and a client-side CSV export over the same data the Dashboard chart already fetches.

---

## 8. Phase Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0 | Architecture, dependencies, folder structure, DB/API design | ✅ Done |
| 1 | Project initialization (frontend/backend scaffolds, Tailwind, Firebase, MongoDB, Git) | ✅ Done |
| 2 | Authentication system end-to-end + self-service profile CRUD | ✅ Done |
| 3 | Database models, seed script, Cloudinary, Product/Brand/Category CRUD (admin) | ✅ Done |
| 4 | Homepage, fully dynamic | ✅ Done |
| 5 | Product listing: filters, pagination, search, sorting | ✅ Done |
| 6 | Product details: gallery, related, wishlist, SEO | ✅ Done |
| 7 | Cart system: persistent, guest, merge, stock validation | ✅ Done |
| 8 | Checkout, orders, emails, confirmation | ✅ Done (COD only; bKash deferred) |
| 9 | Order management: admin, customer, tracking, analytics | ✅ Done |
| 10 | Admin dashboard: complete CRUD, inventory, customers/roles, coupons, media, reports, settings editor | ✅ Done |
| 11 | About, Contact, FAQ, Newsletter (admin-facing pieces) | ⬜ Planned |
| 12 | Testing, performance, accessibility, SEO polish, deployment, documentation | ⬜ Planned |

Credentials wired in so far: MongoDB Atlas, Firebase (client + Admin SDK), Cloudinary, Resend (sending from `noreply@diecastbd.com`, domain verified — delivers to any recipient). bKash intentionally not requested yet.
