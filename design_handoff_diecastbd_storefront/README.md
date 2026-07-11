# Handoff: DiecastBD Storefront Redesign

## Overview
Full frontend redesign for **DiecastBD** — a premium diecast car store (Hot Wheels Premium & MINI GT, 1:64) in Bangladesh. 18 screens covering the entire customer journey: landing, shop, product details, cart, checkout (guest + signed-in), order placed, my orders, account, wishlist, auth (sign in + create account), contact, FAQ, about, and 4 policy pages. The backend already exists and must not change — this is a frontend-only reimplementation.

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, NOT production code to copy. Your task is to **recreate these designs in the existing codebase** using its established stack and patterns:

- React 19 + Vite, **react-router v8** (no react-router-dom)
- **Tailwind CSS v4** (`@theme` tokens), **shadcn/ui** as primary component layer (Radix), DaisyUI scoped to Rating/Steps/Loading only
- Framer Motion, **Embla Carousel** (+ autoplay), React Hook Form + Zod, Zustand (persist: guest cart, recently-viewed), TanStack Query, Axios, React Hot Toast, React Helmet Async, **Lucide React** icons
- Backend: Express 5 + MongoDB + Firebase Auth (Google sign-in; no local passwords), Cloudinary images, bKash/BanglaQR/COD payments, Resend email

Open each `.dc.html` in a browser to inspect. Each page renders BOTH breakpoints from one file: desktop ≥768px, mobile <768px (resize to switch). Ignore the `<script>` runtime plumbing (`support.js`, `image-slot.js`) — read the inline-styled markup inside `<x-dc>` as the spec. `<image-slot>` elements = product/marketing image placeholders → replace with `<img>` from Cloudinary.

## Fidelity
**High-fidelity.** Colors, type, spacing, radii, copy, and interactions are final. Recreate pixel-perfectly with Tailwind utilities mapped to the tokens below.

## Design Tokens (Tailwind v4 `@theme`)

```css
@theme {
  --color-brand: #A8CD2F;        /* primary lime */
  --color-brand-bright: #B9DC4B; /* lime hover */
  --color-brand-deep: #4F6B0B;   /* lime-tinted text on light (AA) */
  --color-brand-tint: #EFF5DC;   /* lime icon-circle bg */
  --color-brand-glow: #C9E469;   /* active tab / accents on dark */
  --color-brand-soft: #F1F7DE;   /* TL;DR / info banner bg (border #DCE9B4) */
  --color-ink: #101208;          /* near-black */
  --color-ink-soft: #3A3D33;     /* body text */
  --color-muted: #6B6E60;        /* secondary text */
  --color-faint: #8A8D80;        /* kickers / meta */
  --color-paper: #FAFAF7;        /* page bg */
  --color-line: #E7E8E0;         /* borders */
  --color-line-soft: #EFEFE9;    /* inner dividers */
  --color-warn: #B45309;         /* low stock / pending (bg #F7EAD6) */
  --color-danger: #B3261E;       /* cancelled/refunded/delete (bg #F9E3E1) */
  --font-display: "Archivo", sans-serif;      /* 700/800, italic accents — headings, prices, wordmark */
  --font-sans: "Instrument Sans", sans-serif; /* 400–700 body */
}
```

- Lime hero/banner gradient: `radial-gradient(120% 140% at 85% 0%, #BADD4D 0%, #A8CD2F 52%, #9CC12A 100%)`
- Dark spotlight hero gradient: `radial-gradient(90% 130% at 78% 0%, #2A2E1C 0%, #14160C 48%, #0B0C06 100%)`
- Radii: pills `rounded-full`, cards 18–20px, small cards 16px, panels 24–28px
- Card hover: `translateY(-2px)` + `0 12px 32px rgba(16,18,8,.10)`, 180ms ease
- **Frosted glass** (headers/app bars): `rgba(250,250,247,.6)` + `backdrop-filter: blur(24px) saturate(180%)`; floating dark bars: `rgba(13,15,7,.92)` + `blur(22px) saturate(160%)` + `border: 1px solid rgba(255,255,255,.16)`
- Currency: `৳` + Indian-style grouping (`toLocaleString('en-IN')`)
- Fonts via Google Fonts: Archivo (500–800 + italics), Instrument Sans (400–700)

## Screens / Routes

| Design file | Route | Notes |
|---|---|---|
| DiecastBD Landing Final.dc.html | `/` | 3 hero variants (see Hero below); Shop-by-shelf tiles; Collector Picks + New Arrivals carousels; Featured Products (spotlight + 3 rows); dark Premium Shelf banner; trust strip; testimonials; big footer |
| DiecastBD Shop.dc.html | `/shop` | Sticky filter sidebar (brand/category pills, series select, price range, in-stock toggle), search, sort, grid, pagination; mobile: chip toolbar (Filters opens a Sheet), 2-col grid |
| DiecastBD Product Details.dc.html | `/product/:slug` | Breadcrumb, sticky gallery + 3 thumbs, buy panel (badges, price + save chip, low-stock urgency, qty stepper max=stock, Add to cart, Buy now), reassurance card, specs, features, Related + Recently-viewed carousels; mobile sticky buy bar (qty · Add to cart · Buy now) |
| DiecastBD Cart.dc.html | `/cart` | Line items with steppers (live totals), remove, coupon, sticky summary; mobile sticky Total+Checkout bar. Stock note: "stock is held while you check out" (matches reservation cron) |
| DiecastBD Checkout.dc.html | `/checkout` | 3 numbered cards: Address (guest form OR saved-address cards when signed in), Delivery (Inside Dhaka ৳60 24–48h / Nationwide ৳120 2–4d), Payment (COD / bKash / BanglaQR radio cards — selected card expands: bKash shows QR + Send Money number + Transaction ID input; BanglaQR shows QR + payment reference). Header stepper Cart→Checkout→Done. Mobile: order summary on top, sticky Place-order bar |
| DiecastBD Order Placed.dc.html | `/order/:id/confirmation` | Success moment, order id + status chip, 5-step tracker (Pending→Confirmed→Packed→Shipped→Delivered), items, address + ETA, summary |
| DiecastBD My Orders.dc.html | `/account/orders` | Status filter chips; order cards w/ color-coded status chips + contextual action (Track / Buy again / Details) |
| DiecastBD Account.dc.html | `/account` | Desktop hub grid (recent order, wishlist, addresses, details, notification toggles, help, delete-account row); mobile app-style menu lists |
| DiecastBD Wishlist.dc.html | `/wishlist` | Cards w/ filled hearts, Add to cart / Notify me (sold out) |
| DiecastBD Sign In.dc.html / Create Account.dc.html | `/signin`, `/signup` | Split-screen brand panel + form; Google button (Firebase); password strength meter on signup |
| DiecastBD Contact / FAQ / About | `/contact`, `/faq`, `/about` | FAQ is an accordion (one open at a time); Contact has channel cards + form w/ optional Order ID |
| Shipping/Refund/Privacy Policy, Terms | `/policies/*` | Shared layout: kicker, title, "last updated", policy-switcher chips, lime TL;DR card, sections, contact CTA |

## Key Components (src/components/)

- `SiteHeader` — sticky frosted glass; nav: Shop, New arrivals, Hot Wheels Premium, MINI GT; wishlist + cart (Zustand badge) + Sign in. No Admin link in public nav.
- `MobileAppBar` + `MobileBottomNav` — bottom nav fixed `inset-x-3 bottom-3 h-[66px] rounded-[22px]`, dark glass, tabs Home/Shop/Saved/Cart/Account, active = `#C9E469` + font-weight 800, NavLink-driven. Hidden ≥md.
- `ProductCard` — `{ brand, title, price, oldPrice?, isNew?, onSale?, inStock, image, slug }`. **Whole card clickable → PDP**; inner buttons `stopPropagation`. Badges: NEW = ink pill, SALE = lime pill. Sold out: 55% paper overlay + pill + "Notify me" outline button → restock-alert endpoint. Image: square `aspect-ratio:1/1`, `object-contain`, white bg, 5% padding (Cloudinary `c_pad,b_white,ar_1:1,w_800`).
- `ProductCarousel` — Embla, align start, slides 316px desktop / 210px mobile (partial next-card peek REQUIRED on mobile), prev/next circle buttons in section header, hidden scrollbars, drag-free on desktop.
- `TrustStrip` — single joined white card, 4 cells w/ hairline dividers (wrap-safe: every cell border-top+left, container clips first row/col).
- `FeaturedSpotlight` — big card (square image, title, desc, price + Add to cart) + 3 horizontal row cards.
- `QtyStepper`, `StatusChip` (Pending amber / Delivered lime-deep / Cancelled+Refunded red), `OrderTracker` (5 steps), `PolicyLayout`, `TLDRCard`.
- Hero: 3 variants exist (lime showroom [default], dark spotlight, photo full-bleed). Implement the one the team picks; keep copy from the files.

## Interactions & Behavior
- Card hover lift (Framer Motion or CSS), 150–180ms ease transitions on buttons
- Carousels: native touch swipe + desktop drag; arrows scroll ~80% of viewport width
- Checkout payment radios expand/collapse the selected method's panel
- FAQ accordion: one item open; plus/minus circle indicator
- Mobile PDP/Cart/Checkout use sticky bottom action bars instead of the bottom nav
- Toasts (React Hot Toast) for add-to-cart, wishlist, newsletter join
- Titles/meta via React Helmet Async. SEO description: "Buy authentic Hot Wheels Premium and MINI GT diecast cars in Bangladesh. Verified 1:64 collectibles, collector-grade packaging, and nationwide delivery." Title: "Hot Wheels, MINI GT & Diecast Cars in Bangladesh | DiecastBD"

## State & Data Wiring (existing backend)
- Cart: Zustand persist (guest) → server cart on auth; badge count shared header/bottom nav
- Collector Picks → curated/featured endpoint; New Arrivals → sort createdAt; Featured → featured flag (item[0] spotlight, [1..3] rows)
- Recently viewed: existing Zustand persist store → PDP carousel
- Wishlist, restock alerts ("Notify me"), newsletter (Resend), reviews (approved only; hide section if empty)
- Orders: status drives chip color + tracker step; checkout total = subtotal + zone shipping
- Auth: Firebase (Google + email); guest checkout requires no account (email optional)

## Accessibility
- ≥44px touch targets (bottom nav, steppers, quick-add)
- `aria-label` on icon-only buttons; AA contrast maintained (ink-on-lime, `#B4B7A8` inactive tabs on dark)
- Focus styles on all interactive elements (design shows hover only — add focus-visible rings w/ brand color)

## Assets
- `assets/diecastbd-logo.png` — brand logo (header ~24px tall desktop / 20px mobile)
- Footer wordmark: "DIECAST" white + "BD" lime, Archivo italic 800; ghost watermark version at 4.5% white opacity
- Icons: Lucide equivalents — heart, shopping-bag, shield-check, package, truck, wallet, house, layout-grid, user, plus, arrow-right, star, map-pin, bell, copy, qr-code
- Product/QR images: user-provided via Cloudinary (never in this bundle)
- Social: facebook.com/diecastbd.official, instagram.com/diecastbd.official, youtube.com/@diecastbd (verify handles)

## Files in this bundle
- `README.md` (this file) — implementation spec
- `HANDOFF.md` — earlier per-page annotations incl. product image spec (serving sizes, Cloudinary transforms, PDP zoom)
- 18 × `DiecastBD *.dc.html` design references + `assets/`, `support.js`, `image-slot.js` (runtime for viewing only). `DiecastBD Landing Final.dc.html` is the ONLY landing page — any other landing/exploration files from earlier drafts are obsolete and intentionally excluded.
