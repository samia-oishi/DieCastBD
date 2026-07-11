# DiecastBD Landing — Developer Handoff

Design sources: `DiecastBD Landing Final.dc.html`, `DiecastBD Shop.dc.html`, `DiecastBD Product Details.dc.html` (all responsive; resize or use the `previewMode` tweak). Same functionality as your current pages — only the frontend changes.

**Shop page** — sticky filter sidebar (brand/category pills, series select, price range, in-stock toggle, Clear all), search + sort toolbar, responsive card grid, sold-out → Notify me, pagination + "Showing x–y of N". Mobile: search bar, Filters/sort/brand chip row (filters open your sheet/drawer), 2-col grid, pagination, bottom nav (Shop active).

**Product details** — breadcrumb, sticky gallery (main + 3 thumbs), buy panel: brand/SKU + wishlist/share, badges, price + save chip, low-stock urgency line (#B45309), qty stepper (max = stock), lime Add to cart, ink "Buy now — pay on delivery", reassurance card (delivery ETA / payments / authenticity), description, spec rows, feature checklist; Related + Recently viewed carousels (Embla). Mobile: back app bar, sticky bottom buy bar (qty + "Add to cart · price") replacing bottom nav on this route.

## Tokens (Tailwind v4 `@theme`)

```css
@theme {
  --color-brand: #A8CD2F;        /* primary lime */
  --color-brand-bright: #B9DC4B; /* lime hover */
  --color-brand-deep: #4F6B0B;   /* lime text on light (AA) */
  --color-brand-tint: #EFF5DC;   /* lime icon-circle bg */
  --color-brand-glow: #C9E469;   /* active tab on dark nav */
  --color-ink: #101208;          /* near-black */
  --color-ink-soft: #3A3D33;     /* body text */
  --color-muted: #6B6E60;        /* secondary text */
  --color-faint: #8A8D80;        /* kickers / meta */
  --color-paper: #FAFAF7;        /* page bg */
  --color-tile: #F1F2EA;         /* image tile bg */
  --color-line: #E7E8E0;         /* borders */
  --font-display: "Archivo", sans-serif;      /* 700/800, italic accents; headings + wordmark */
  --font-sans: "Instrument Sans", sans-serif; /* 400–700 body */
}
```

- Hero/featured lime panel: `radial-gradient(120% 140% at 85% 0%, #BADD4D 0%, #A8CD2F 52%, #9CC12A 100%)`
- Radii: pills `9999px`, cards `20px`, small cards `18px`, panels `28px` (mobile `24px`)
- Card hover: `translateY(-2px)` + `0 12px 32px rgba(16,18,8,.10)`, 180ms ease
- Breakpoint: bottom nav + app-bar layout below `md` (768px); desktop header above

## Component inventory → src/components/landing/

- `AnnouncementBar` — static strings, ink bg
- `SiteHeader` — sticky, blur; nav: New arrivals, Hot Wheels Premium, MINI GT, Accessories; wishlist + cart (badge = cart count from Zustand) + Sign in. Remove Admin from public nav.
- `HeroPanel` — static copy + hero image (Cloudinary); price chip overlay optional
- `CategoryTiles` — 3 tiles → routes: `/shop?brand=hot-wheels-premium`, `/shop?brand=mini-gt`, `/shop?category=accessories`
- `SectionHeader` — title + sub + "View all" link (lime underline) + optional prev/next arrow pair (Embla `scrollPrev`/`scrollNext`)
- `ProductCarousel` — Embla (align:start, no loop) with snap; slide width 316px desktop / 172px mobile; used by Collector Picks + New Arrivals (both breakpoints); hide native scrollbar
- `FeaturedSpotlight` — 2-col grid: large spotlight card (330px image, kicker/title/desc, price + Add to cart) + column of 3 horizontal row cards (124×112 thumb, title, price, quick-add); stacks spotlight-then-rows on mobile
- `ProductCard` — props: `{ brand, title, price, oldPrice?, isNew?, onSale?, inStock, image, slug }`
  - badges: NEW = ink pill, SALE = lime pill (top-left); wishlist = white circle (top-right)
  - in stock: price + ink circle quick-add (hover lime-deep)
  - sold out: 55% paper overlay + "SOLD OUT" pill; price muted; **Notify me** outline pill → your restock-alert endpoint
- `FeaturedBanner` — ink panel, lime eyebrow + CTA
- `TrustGrid` — 4 static cards (authentic / packing / delivery / payments)
- `TestimonialCard` — 5 lime stars, quote, name · "Verified collector, City" (render only approved reviews; hide section if empty)
- `SiteFooter` — ink bg, newsletter (Resend subscribe), SHOP/HELP columns, payment pills (COD · bKash · BanglaQR), ghost "DIECASTBD" watermark (`overflow-hidden`, `text-white/[.045]`, italic 800)
- `MobileBottomNav` — fixed, `inset-x-3 bottom-3 h-[66px] rounded-[22px] bg-ink z-50`; tabs Home `/`, Shop `/shop`, Saved `/wishlist`, Cart `/cart` (lime badge), Account `/account`; active = `#C9E469` icon+label (NavLink); inactive `#7B7E70`. Hidden `md:hidden`... i.e. `flex md:hidden`.
- `MobileAppBar` — sticky logo + cart, `md:hidden`

## Data wiring (existing backend, TanStack Query)

- Collector Picks → your curated/featured endpoint (Embla carousel; 6 slides in the mock)
- Featured Products → featured-flag endpoint: item[0] = spotlight, items[1..3] = row cards
- New Arrivals → products sorted by createdAt (Embla carousel; 6 slides in the mock)
- Featured banner CTA → premium-line collection route
- Testimonials → reviews (approved), Instagram section: **dropped** (was empty placeholders)
- Newsletter → subscribe endpoint, toast via React Hot Toast
- Currency: `৳` + `toLocaleString('en-IN')` style grouping

## Notes

- Icons are Lucide equivalents: `heart, shopping-bag, shield-check, package, truck, wallet, house, layout-grid, user, plus, arrow-right, star`
- Framer Motion: card hover lift + badge fade-in are the only intended motions; keep it restrained
- Image slots in the design = your Cloudinary product images (`object-cover`, tile bg `--color-tile` behind transparent PNGs)
- A11y: 44px+ targets on mobile nav/quick-add; ink-on-lime and ink-on-paper pass AA; add `aria-label` to icon-only buttons
