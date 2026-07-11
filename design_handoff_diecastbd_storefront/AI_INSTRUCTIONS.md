# AI Implementation Playbook — DiecastBD Storefront

Copy-paste prompts for implementing this design in the existing DiecastBD codebase with Claude Code (or any coding AI). Work through the phases in order — one phase per session/PR. Read `README.md` first; it is the spec. `HANDOFF.md` adds the product-image/Cloudinary spec.

**Ground rules to include in EVERY session** (paste at the top):

> Rules for this work:
> - The `.dc.html` files in `design_handoff_diecastbd_storefront/` are DESIGN REFERENCES, not code. Recreate them; never import or copy their markup/scripts (`support.js`, `image-slot.js` are viewer runtime only).
> - Frontend only. Do not modify backend code, API contracts, or database models. Wire UI to existing endpoints.
> - Stack: React 19 + Vite, react-router v8 (NOT react-router-dom), Tailwind CSS v4 `@theme` tokens, shadcn/ui first (DaisyUI only for Rating/Steps/Loading), Embla Carousel, Framer Motion, RHF+Zod, Zustand (persist), TanStack Query, Lucide icons, React Hot Toast, React Helmet Async.
> - Every page has TWO layouts in one file: desktop ≥768px, mobile <768px (app-like, dark floating bottom nav). Both are mandatory.
> - Use the design tokens from README.md §Design Tokens — never invent colors/fonts. Currency is ৳ with `toLocaleString('en-IN')`.
> - `<image-slot>` elements in the references = image placeholders → render `<img>` from Cloudinary (`c_pad,b_white,ar_1:1,w_800` for cards), `aspect-square object-contain bg-white p-[5%]`.

---

## Phase 0 — Audit (no code)
> Read design_handoff_diecastbd_storefront/README.md and HANDOFF.md. Then inventory the existing codebase: list current routes/pages, layout components, the Tailwind config, Zustand stores, TanStack Query hooks, and API endpoints for products, cart, orders, auth, wishlist, newsletter, and reviews. Output a mapping table: design screen → existing route/page file → endpoints it needs → components to create/replace. Flag anything the design needs that has no endpoint (e.g. restock "Notify me", coupon apply) so I can confirm before you build.

## Phase 1 — Tokens & fonts
> Add the DiecastBD design tokens from README.md §Design Tokens to our Tailwind v4 `@theme` block. Load Google Fonts Archivo (500–800, italics) and Instrument Sans (400–700) via index.html preconnect+link. Define global body defaults (bg paper, font-sans, text ink, antialiased) and default link colors (ink, hover #5F7A10). Do not restyle existing pages yet.

## Phase 2 — Shared shell
> Build the shared layout per README §Key Components: `SiteHeader` (sticky frosted glass: bg rgba(250,250,247,.6) + backdrop-blur-[24px] saturate-180, nav links, wishlist + cart icon buttons w/ lime count badge from the cart store, Sign in pill), `SiteFooter` (dark ink; big variant for landing/shop/PDP with SHOP+HELP columns, newsletter, payment pills COD/bKash/BanglaQR, social icons, ghost DIECASTBD watermark; slim single-row variant for utility pages), `MobileAppBar`, and `MobileBottomNav` (fixed inset-x-3 bottom-3 h-[66px] rounded-[22px], bg rgba(13,15,7,.92) + blur, border white/16, tabs Home/Shop/Saved/Cart/Account, active tab #C9E469 font-extrabold via NavLink, inactive #B4B7A8, hidden md:up). Wire into the root layout with route-aware footer variant. Match "DiecastBD Landing Final.dc.html" pixel-for-pixel.

## Phase 3 — Product primitives
> Build `ProductCard`, `ProductCarousel`, `QtyStepper`, `StatusChip`, `SectionHeader` per README §Key Components. Critical details: whole card navigates to the PDP (inner wishlist/quick-add/notify buttons stopPropagation); NEW = ink pill, SALE = lime pill; sold-out = 55% paper overlay + SOLD OUT pill + outline "Notify me"; title reserves 2 lines (min-height) so price rows align across cards; price + add button pinned to a shared bottom baseline; images aspect-square object-contain on white with 5% padding; hover lift -2px + shadow `0 12px 32px rgba(16,18,8,.10)`. ProductCarousel = Embla, align start, slide widths 316px desktop / 210px mobile with the next card partially visible on mobile, arrow buttons scroll ~80% width, no visible scrollbar, and generous vertical padding so hover shadows don't clip.

## Phase 4 — Home (`/`)
> Rebuild the home page from "DiecastBD Landing Final.dc.html": announcement bar, hero (implement the photo-fullbleed variant as default; the file also contains lime-showroom and dark-spotlight variants — build the JSX so swapping is one prop), Shop-by-shelf image tiles (white label pill + lime arrow circle; horizontal swipe row on mobile), Collector Picks carousel (curated endpoint), Featured Products (spotlight + 3 row cards, featured endpoint), dark Premium Shelf banner, New Arrivals carousel (createdAt sort), joined trust strip (single card, 4 cells, hairline dividers, wrap-safe), testimonials (approved reviews; hide if empty), big footer. Mobile mirrors the file's <768px layout exactly.

## Phase 5 — Shop (`/shop`)
> Rebuild from "DiecastBD Shop.dc.html": sticky filter sidebar (brand/category pill groups, series select, price range slider, in-stock toggle, Clear all) driving URL search params + TanStack Query; search input; sort select; responsive grid `minmax(270px,1fr)`; pagination pills + "Showing x–y of N". Mobile: search bar, chip toolbar where Filters opens a shadcn Sheet with the same controls, 2-col grid, bottom nav Shop active.

## Phase 6 — Product Details (`/product/:slug`)
> Rebuild from "DiecastBD Product Details.dc.html": breadcrumb; sticky gallery (main square image + 3 thumbs, click-to-zoom dialog at full res, Esc/click closes); buy panel: brand+SKU kicker, wishlist/share circles, H1, badge row, price + strikethrough + lime "Save ৳X" chip, low-stock line (#B45309) when stock ≤3, qty stepper clamped to stock, lime "Add to cart", ink "Buy now — pay on delivery"; reassurance card (delivery ETA / payment methods / authenticity); Description, Specifications rows, Features checklist; Related + Recently-viewed Embla carousels (recently-viewed from the existing Zustand persist store; record the current product on mount). Mobile: back app bar, and a sticky bottom bar (qty stepper · lime Add to cart · white Buy now) replacing the bottom nav on this route.

## Phase 7 — Cart & Checkout (`/cart`, `/checkout`)
> Rebuild from "DiecastBD Cart.dc.html" and "DiecastBD Checkout.dc.html". Cart: line items (thumb, brand, title→PDP, stock note, stepper, line total, remove), live subtotal/shipping/total, coupon input+Apply, sticky summary card w/ payment pills + authenticity line; mobile sticky Total+Checkout glass bar. Checkout: header progress Cart✓→2 Checkout→3 Done; guest mode = full RHF+Zod address form (name, phone 01X validation, address, city/district/postal, optional email) + "Have an account?" banner; signed-in mode = saved address radio cards + add-new dashed card; Delivery radio cards (Inside Dhaka ৳60 24–48h / Nationwide ৳120 2–4 days) updating totals; Payment radio cards where the selected method expands — COD plain, bKash (pink logo chip, QR image, copyable Send Money number, Transaction ID input required by Zod when selected), BanglaQR (QR image, exact-total note, payment reference input); terms note; desktop sticky order summary, mobile summary-on-top + sticky Place-order bar. Place order → existing order endpoint → confirmation route.

## Phase 8 — Orders, Account, Wishlist, Auth
> Rebuild "DiecastBD Order Placed.dc.html" (success header, order id + status chip, 5-step OrderTracker Pending→Confirmed→Packed→Shipped→Delivered driven by order.status, items, address + ETA, summary, View my orders / Continue shopping), "DiecastBD My Orders.dc.html" (filter chips All/Active/Delivered/Cancelled; cards with color-coded StatusChip — Pending #B45309/#F7EAD6, Delivered #4F6B0B/#EFF5DC, Cancelled/Refunded #B3261E/#F9E3E1 — and contextual action Track/Buy again/Details), "DiecastBD Account.dc.html" (desktop hub grid; mobile menu lists; Firebase Google sign-in shown in details; notification toggles; delete-account row), "DiecastBD Wishlist.dc.html" (filled lime hearts, Add to cart / Notify me), and the split-screen auth pages "DiecastBD Sign In.dc.html" + "DiecastBD Create Account.dc.html" (Firebase email + Google, password strength meter on signup, no local password storage).

## Phase 9 — Static & policy pages
> Rebuild Contact (channel cards + form w/ optional Order ID + Follow card), FAQ (accordion, one open, plus/minus circles), About, and the 4 policy pages using a shared `PolicyLayout` (kicker, H1, last-updated, switcher chips, lime TL;DR card, prose sections, dark contact CTA, slim footer). Copy text verbatim from the files.

## Phase 10 — QA pass
> Compare every route against its .dc.html side-by-side at 1440px and 390px. Checklist: fonts/weights, token colors only, card alignment (price rows level), carousel peek on mobile, glass blur on header + bottom bars, hover/focus states, toasts, empty states (empty cart, no orders, empty wishlist), loading skeletons via existing patterns, Helmet titles + the SEO meta from README, aria-labels on icon buttons, 44px touch targets, no horizontal overflow at 320px. Fix all diffs.

---

### Verifying each phase
Open the matching `.dc.html` in a browser next to your dev server. Resize below 768px to compare the mobile build. Screenshot both and ask the AI to list and fix the differences — repeat until clean.
