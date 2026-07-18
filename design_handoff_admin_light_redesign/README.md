# Handoff: DiecastBD Admin Dashboard — Light Redesign

## Overview
Complete redesign of the DiecastBD admin dashboard from the current dark theme to the **storefront's light design language** (paper background, white cards, lime accent, Archivo + Instrument Sans). Covers all 12 admin screens: Dashboard, Orders (+ detail + invoice), Products (+ add/edit form), Inventory, Brands, Categories, Customers (+ detail), Coupons, Newsletter, Reports, Pages (+ block-based page builder), and Settings. Every screen is fully responsive (desktop 1440px → mobile 390px) — the whole admin must be manageable from a phone.

## About the Design Files
The files in `designs/` are **design references created in HTML** — interactive prototypes showing intended look and behavior, NOT production code to copy. Each `*.dc.html` opens directly in a browser (they share `support.js`, keep it next to them). The task is to **recreate these designs in the existing codebase**: React 19 + Vite + Tailwind CSS v4 + shadcn/ui (Radix), react-router v8, TanStack Query, React Hook Form + Zod, Zustand, Framer Motion, React Hot Toast, Lucide React.

**Do not introduce new UI libraries.** Map every element to the existing component layer:
- Cards, inputs, selects, switches, dialogs, dropdowns → shadcn/ui
- Icons → Lucide React (the prototypes use hand-drawn 24×24 stroke SVGs; every one has a direct Lucide equivalent — names given per screen below)
- Toasts → React Hot Toast, styled to the spec in "Shared patterns"
- Charts → the revenue chart is a plain inline SVG area+line; keep it as SVG (no chart lib needed)
- Animations (drawer slide-in, toast rise) → Framer Motion or CSS keyframes; durations given below

## Fidelity
**High-fidelity.** Recreate pixel-perfect. All colors, sizes, radii, and spacing below are exact and come from the store's existing token system (`style-guide.md` is bundled — it is the source of truth; the tokens below restate what the admin actually uses). The user noted they have "slightly changed a few things" on the live frontend — **where the live token values differ from this doc, the live tokens win.** Read the Tailwind v4 `@theme` config in the codebase first and use the existing CSS variables/utilities rather than hard-coding hex values.

## Migration instructions (order of work)
1. **Delete the dark admin styling entirely.** Remove the dark palette, dark sidebar styles, and any admin-specific dark-mode tokens. The admin now uses the same token system as the storefront.
2. **Build the shared admin shell first** (sidebar, mobile top bar, drawer, toast, save-bar — see "Shared patterns"). Every page mounts inside it.
3. Port pages in this order: Dashboard → Orders → Products → Inventory → Brands/Categories → Customers → Coupons → Newsletter → Reports → Pages → Settings.
4. The **Pages block builder** is a new feature; ship the UI now, wire the backend (blocks JSON on the Page model) later — the block schema is specified below so Claude Code can implement the API when ready.
5. Wire everything to the existing Express/Mongo endpoints via TanStack Query; the prototypes' in-memory data shows the exact shapes the UI expects.

## Design Tokens (restated from style-guide.md — verify against live `@theme`)
Colors:
- Paper (app bg): `#FAFAF7` · Card: `#FFFFFF` · Hover row / subtle fill: `#FCFCF9` and `#F1F2EA`
- Ink (text): `#101208` · Body-secondary: `#3A3D33` · Muted: `#6B6E60` · Faint: `#8A8D80` · Disabled: `#B7BAAD` / `#DEDFD6`
- Border: `#E7E8E0` · Hairline: `#EFEFE9`
- Lime accent: `#A8CD2F` (hover `#B9DC4B`) · Lime light: `#C9E469` · Lime tint bg: `#EFF5DC` (border `#DCE9B4`) · Lime-on-dark text: `#DDDFD2`
- Deep green (promo): `#00240c` · Olive (links/active icons): `#4F6B0B` (hover `#5F7A10`)
- Status: amber `#B45309` on `#FDF3E7` · red `#B3261E` on `#F9E3E1` (danger button `#E5484D`, hover `#F16A6E`) · teal `#0E7490` on `#E6F4F7` · bKash pink `#E2136E`
- Overlay: `rgba(16,18,8,0.5)` + `blur(4px)` · Dark glass (bars/toasts): `rgba(13,15,7,0.94)` + `blur(22px) saturate(160%)`, border `rgba(255,255,255,0.16)`

Typography:
- Display/headings/buttons: **Archivo** (weights 700/800, letter-spacing −0.015em on H1)
- Body/UI: **Instrument Sans**
- Scale: H1 30px/800 (mobile 24px) · section H2 15.5–17px/700 · body 13.5px · secondary 12.5px · captions 11–12px · table header 10px/700, uppercase, letter-spacing 0.07em · kicker 10.5px/700 uppercase 0.08em

Shape & spacing:
- Radii: cards 18px · inner cards/rows 12–14px · inputs 12px · icon buttons 9–11px · pills/buttons/toggles 99px
- Card padding 22px · page gap 18px · grid gaps 10–14px
- Inputs 44px tall (mobile hit targets ≥44px; small desktop icon buttons 30px)
- Focus ring: `border-color #A8CD2F` + `box-shadow 0 0 0 3px rgba(168,205,47,0.22)`; `:focus-visible` outline `2px solid #A8CD2F`
- Shadows: drawer `0 12px 40px rgba(16,18,8,0.25)` · modal `0 20px 60px rgba(16,18,8,0.4)` · floating bar `0 10px 30px rgba(16,18,8,0.45)`

## Shared patterns (build once, reuse everywhere)

### Admin shell
- **Sidebar (≥768px)**: fixed left, 232px, white, right border `#E7E8E0`. Logo "DiecastBD." (Archivo 800 18px, lime dot) + "ADMIN" pill (9.5px/700, olive on `#EFF5DC`, border `#DCE9B4`). Nav items: 13.5px/600, padding 9px 12px, radius 10px; active = `#EFF5DC` bg, ink text, olive icon; inactive = `#3A3D33` text, `#8A8D80` icon; hover `#F1F2EA`. Footer: "Back to store" link + avatar (32px lime circle "DB") with admin email.
- Nav order + Lucide icons: Dashboard `layout-dashboard`, Orders `clipboard-list`, Products `package`, Inventory `archive`, Brands `badge`, Categories `tag`, Customers `users`, Coupons `ticket`, Newsletter `mail`, Reports `bar-chart-3`, Pages `file-text`, Settings `sliders-horizontal`.
- **Mobile top bar (<768px)**: fixed, 56px, `rgba(250,250,247,0.75)` + `blur(24px) saturate(180%)`, bottom border. Hamburger (44px), page title (Archivo 800 17px), avatar.
- **Mobile drawer**: 280px, white, radius `0 24px 24px 0`, slides in 220ms ease-out; scrim = overlay token. Same nav list at 14px/11px padding.
- Content: `max-width 1180px`, centered; desktop padding `34px 40px 60px` + 272px left offset; mobile `70px 16px 40px` (add ~130px bottom padding on screens with floating bars).

### Floating bars & toasts (dark glass)
- **Unsaved-changes bar** (Settings, Product form, Customer detail, Page builder): fixed bottom-center (desktop, min-width 440px; mobile full-width 12px inset), radius 22px, dark glass. Lime dot + "Unsaved changes" (`#DDDFD2` 13px/600); Discard (ghost, white 25% border) + Save (lime pill, Archivo 700). Appears only when dirty, 250ms rise.
- **Bulk-actions bar** (Orders, Products lists): same style; lime count badge + "selected"; actions: Set active/Set draft (Products), Clear, Delete (red `#E5484D`).
- **Toast**: dark glass pill, bottom-right desktop / bottom-center mobile, 26px lime check circle + 13.5px/600 white text, ~2.4s, 220ms rise. Use for every save/delete/toggle/copy action (exact copy strings are in the prototypes).

### Tables (all list screens)
- White card radius 18px; header row 10px/700 uppercase `#8A8D80`; rows split by `#EFEFE9` hairlines; row hover `#FCFCF9`; slim rows (7–10px vertical padding, single-line with ellipsis + `title` tooltip).
- Card gets `overflow-x:auto` with a min-width on the grid (Products 940px, Customers 860px, Coupons 820px, Inventory 900px, Brands/Categories 780px) so columns never clip.
- **Mobile**: rows collapse to stacked cards (primary line + meta line + right-aligned value/status) — see each prototype at 390px.
- **Multi-select**: 20px checkboxes radius 6px (lime fill + ink check when on); header checkbox = select page (dash icon when partial); selected row bg `#FBFDF3`.
- **Pagination**: "Showing X–Y of Z" (12.5px `#8A8D80`) left; right: 36px circular prev/next + numbered pills (active = ink bg/white). Page size 10 (Inventory 12). Reset to page 1 on search/filter change.
- **Filter chips**: 36px pills; active = ink bg white text; counts in small inner badges (Orders).
- **Search**: 44px pill input with Lucide `search` at left, one per list; filters as you type.

### Status pills
10–10.5px/700, radius 99px, padding 3–4px 9–10px. Pending amber · Confirmed/Active/Delivered/Published olive-on-`#EFF5DC` · Packed neutral · Shipped teal · Cancelled/Out red · Draft amber · Archived gray.

## Screens (reference each file in `designs/`)

### 1. Admin Dashboard.dc.html
KPI cards ×4 (label 12px + icon, Archivo 800 26px value, delta pill, sub-line); revenue & orders card with range chips (7/30/90 days) and SVG area chart (lime gradient fill `#A8CD2F` 35→2%, stroke `#7FA31C` 2.5px, peak dot ink/white, gridlines `#EFEFE9`, "Best day" pill); two-column zone (1.5fr/1fr): Recent orders list (avatar initials, items line, total + status pill) · right rail: Low stock card (amber header pill, counts red ≤1/amber ≤2, "Open inventory" button) + Top products (7 days) with lime progress bars; Order pipeline strip (Pending/Confirmed/Packed/Shipped/Delivered counts). Header actions: "Add product" (lime pill) + "Create coupon" (ink outline pill, hover inverts).

### 2. Admin Orders.dc.html
List: search (id/customer/phone/email), status chips with counts, columns [checkbox | Order id (Archivo 700) | Customer + phone | Date | Total | Status | chevron]; multi-select + bulk Delete bar; pagination.
Detail: back link; H1 = order id + status pill; "Print invoice" (ink outline). **Progress stepper**: 5 steps, 24px circles (done = lime + ink check), connectors lime/hairline, current label 800. Left: Items card (thumb, unit×qty, line totals, subtotal/shipping/total, payment method chip with paid/due split); Update status card (select + optional note + lime button; appends to history). Right: Shipping address card (olive map-pin, name/address/postal/phone/email, lime-tinted customer-note callout); Status history (vertical timeline, newest dot lime).
**Invoice modal**: scrim + white sheet 640px radius 16px; Print (lime) + close buttons above. Invoice: brand header + store contact; right meta (id, date, status pill); Deliver-to + Payment columns; item table (1.5px ink rules top/bottom); totals; delivery note; footer. **Print CSS**: printing shows only the invoice sheet, full width, exact colors.

### 3. Admin Products.dc.html
List: search, chips (All/Active/Draft/Low stock), slim single-line rows [checkbox | SKU (Archivo 11px `#6B6E60`) | Title (ellipsis+tooltip) | Brand | Price (sale = effective price + struck original) | Profit "৳130 · 65%" (olive/gray) | Stock (red 0 / amber ≤2) | Status | chevron]; bulk bar (Set active / Set draft / Clear / Delete); pagination.
Form (add/edit): two columns (1.4fr/1fr). Left: Basics (title; SKU + **Auto** generate button from brand prefix; status; brand; category; description), Photos (square grid, first = COVER badge ink/white, dashed "Add photo" tile), Collector details (series, model #, manufacturer, scale, material, color). Right rail: Pricing & stock (price, sale, cost, stock + **live profit/margin calculator** in lime-tinted box, red if negative), Merchandising toggles (Featured / Hero product / New arrival with hints), Pre-order toggle revealing start/end dates, Payment options toggles (COD / Delivery Charge Only / Partial Advance / Full). Sticky save bar: "Create product"/"Save product", validation toasts (title+SKU required).

### 4. Admin Inventory.dc.html
KPI mini-cards (Units in stock / Reserved by orders / Low-out (amber) / Restock alerts); search + toggle-chips "Low stock only (≤2 available)" and "Has restock alerts"; rows [thumb 32px | Title | SKU | Stock | Reserved | Available (colored + Low/Out badge) | Alerts (amber bell-count pill → alerts modal) | Actions: history (`history`) + adjust (`package`) 30px icon buttons]; pagination (12).
Modals (white, 480px, centered desktop / bottom-sheet mobile): **Adjust stock** — type select (Restock add / Recount set exact / Damaged-lost remove), units, reason (kept in history), lime "After saving: N in stock" preview box, Save. **Stock history** — timeline with type + signed delta pill (+lime/−red) + "→ N in stock" + timestamp + reason; empty state copy. **Restock alerts** — waiting customers (phone + since), note "notified automatically once available stock goes above zero", "Restock this item" shortcut into Adjust. Restocking an alerted item toasts "…customers notified" and clears alerts.

### 5–6. Admin Brands / Admin Categories (same pattern)
Rows: 40px logo tile (or initials) | name + description | slug | product count (links to Products) | Active switch | edit/delete icon buttons. Add/Edit modal: logo upload slot, name, **auto-slug** (kebab-case from name until manually edited), description, sort order. Footnote: deleting doesn't delete products; off = hidden from storefront menus.

### 7. Admin Customers.dc.html
List: search, chips (All / Registered / Guests / Admins & staff), rows [Name + Guest badge | Email | Joined | Orders | Spent ৳ | Role pill (Customer neutral / Staff teal / Admin lime `#C9E469`) | chevron]; pagination.
Detail: H1 + Guest/Role pills, meta line; stat cards (Orders / Lifetime spend / Last order); left: Profile card (name, phone) + Recent orders (linking to Orders); right: Account active toggle ("Deactivating blocks this user from signing in") + Role card (select Customer/Staff/Admin with permission explainer). Sticky save bar.

### 8. Admin Coupons.dc.html
Rows: code chip (Archivo 800, `#F1F2EA` bg) + **copy button** (clipboard, toasts "X copied") | discount ("৳500 off" / "10% (max ৳500)") | min order | used "1 / 50" | expiry pill (amber if dated, neutral "No expiry") | Active switch | edit/delete. Modal: code (auto-uppercase), type (Percentage/Fixed), value, min order, max-discount cap (percentage only), usage limit, expiry date, **live plain-English preview** in lime box ("SAVE500 gives ৳500 off on orders over ৳3,000…"). Validation: code + value required, duplicate codes rejected. Footnote tip about capping % coupons.

### 9. Admin Newsletter.dc.html
Count kicker, search, table (Email / Subscribed / remove), **Export CSV** (real client-side blob download), unsubscribe toast.

### 10. Admin Reports.dc.html
Range chips (7/30/90) + Export CSV; KPI cards (Revenue / Orders / New customers / Avg. order value); daily table [Date | Revenue (zero = `#B7BAAD`) | Orders | New customers | Low stock (amber) | **Revenue-share bar** (lime, % of period max)]. Footnote explains the bar.

### 11. Admin Pages.dc.html — block-based page builder (NEW feature)
List: rows (icon tile, title, `/slug · N blocks · updated`, Published/Draft pill) + "New page" lime button.
Builder: Meta card (Title / auto-Slug / Status). **Block canvas**: each block = white card; header row = drag handle (`grip-vertical`, 6-dot, cursor grab) + icon tile + type label (+ "half width" tag) + one-line summary + controls (up/down arrows, duplicate, delete-red, expand). Expanded (open = ink border + soft shadow, `#FCFCF9` editor body) shows the inline editor. **Drag & drop reorder** (HTML5 DnD in prototype — in React use `@dnd-kit` if already present, else keep native) + arrow fallback.
Block types & fields:
- **Heading**: text (Archivo 700 input) + size H1/H2/H3
- **Text**: markdown textarea
- **Image**: upload slot (Cloudinary in prod), alt, caption
- **Carousel**: source segmented control **Images | Products**; Images → slide thumbs + dashed add; Products → product picker; autoplay toggle. (Renders with existing Embla carousel on the storefront.)
- **Products grid**: "★ All featured products" toggle-pill OR **product picker**; columns segmented 2/3/4; "Show prices & buy button" toggle
- **Button**: text, link, style (Lime pill / Ink outline)
- **Offer banner**: live preview (theme bg: Lime `#C9E469`/ink, Dark green `#00240c`/`#EFF5DC`, Ink/paper) + kicker, title, subtitle, coupon code (auto-uppercase), theme select
- **Divider**: no settings
- Blocks with layout: **Block width Full/Half** segmented control ("two half-width blocks sit side by side on desktop").
**Product picker** (used by Products grid + Carousel): bordered panel, search input on top (filters name+slug live, empty state "No products match \"q\""), scrollable wrap of checkable chips (selected = lime border/`#EFF5DC` bg + check), "N selected" count. Feed it from the products API.
"Add a block" palette: dashed card with pill buttons per type. SEO card: SEO title + description (fallback note). Sticky save bar ("Create page"/"Save page"); slug uniqueness validated.
Suggested block JSON (for the later backend): `{ type, ...fields }` per block, page = `{ title, slug, status, seoTitle, seoDesc, blocks: [] }` — matches the prototype's state exactly.

### 12. Admin Settings.dc.html
Sub-navigation (desktop): sticky left rail 212px inside the content area, grouped (Homepage: Hero, Announcement bar, Sections & shelf, Featured spotlight, Trust & promise · Content: Testimonials, FAQ · Store: Contact & social, Shipping, Payments · Site: Navigation, SEO defaults). Two visual variants exist — **use the "card" variant** (white bordered panel, hairline dividers between groups, active item = ink pill with lime icon). Mobile: horizontal chip bar sticky under the top bar.
Sections (one card group at a time, not one endless scroll):
- **Hero**: show toggle; style select (Lime showroom / Dark spotlight / Photo full-bleed); image replace; Highlight card sub-panel (toggle + kicker/title/price); **per-style copy tabs** (badge, title lines 1–2, subtitle, primary/secondary button text+link, footnote; blanks fall back to defaults)
- **Announcement bar**: live preview strip rendered with the chosen colors; bg/text/icons/separator color pickers (swatch + hex input pairs); separator style; scroll speed; "all pages" toggle; separate **Desktop messages** and **Mobile messages** cards (icon select + text + delete per row, dashed "Add message", auto-scroll + show toggles per device)
- **Homepage sections**: grid of toggle rows (Collector Picks, Featured Products, Brands Strip, New Arrivals, Why Choose Us, Collector Promise, Testimonials, Instagram, Newsletter Signup)
- **Shop by shelf**: heading/subtitle + collapsed tile rows (expand → image, label, link, remove) + add
- **Featured spotlight**: product select + override fields (image, badge, brand line, title, description) — blank = product's real value
- **Trust & promise**: "Why choose us" collapsed rows (icon select, title, description) + Collector promise (title, description, banner image, bg/text colors, button text/link)
- **Testimonials / FAQ**: collapsed rows, expand-to-edit, add/remove
- **Contact & social**: email/phone/address; Facebook/Instagram/YouTube/WhatsApp (blank hides icon)
- **Shipping**: zone rows (name, fee, "Prepay required" toggle + badge) + free-shipping threshold (0 disables)
- **Payments**: bKash card (pink `#E2136E` "bK" tile, merchant number, QR replace) + BanglaQR card
- **Navigation**: header links + footer links (collapsed rows) + footer tagline
- **SEO defaults**: title + description + Google-style search preview card
All edits arm the sticky save bar; Save → "Settings saved" toast; Discard reverts.

## Interactions & Behavior (global)
- Repeaters everywhere use **collapsed rows → click to expand one** (chevron rotates 180°, 180ms).
- Toggles: 40×24px (small 36×22), lime when on, white knob, 180ms.
- Transitions: hovers 120–150ms; drawer 220ms; bars/toasts 220–250ms rise+fade.
- Navigating between admin pages = normal router links (prototypes use page loads).
- Buttons: primary = lime pill Archivo 700 (hover `#B9DC4B`); secondary = ink 1.5px outline pill (hover inverts to ink bg/white); danger = `#E5484D`.
- Forms: React Hook Form + Zod; validation failures surface as toasts (copy in prototypes) and never block silently.
- Every destructive/bulk action confirms via its result toast; deletes in prototypes are immediate — add a confirm dialog for production deletes if that's the codebase convention.

## State Management
- Server state: TanStack Query per resource (products, orders, inventory, customers, coupons, subscribers, reports, pages, settings) with optimistic toggle updates where cheap (active switches).
- Local UI state: filters/search/page/selection/expanded-row/dirty-form per screen (component state or small Zustand slices; selection Set of ids).
- Dirty tracking: RHF `isDirty` drives the save bar; discard = `reset()`.
- Settings is one document — load once, edit locally, save whole sections.

## Assets
No binary assets required. Fonts: Archivo + Instrument Sans (Google Fonts — likely already loaded by the storefront). All icons = Lucide. Product/brand images come from the existing Cloudinary pipeline; prototypes show placeholder tiles wherever an image slot exists.

## Files
- `style-guide.md` — the store's design-token source of truth (bundled from the user's upload)
- `designs/Admin *.dc.html` — 12 interactive reference screens (open in a browser; resize to 390px to see every mobile layout)
- `designs/support.js` — runtime the prototypes need to render; not part of the implementation
