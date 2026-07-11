# Storefront redesign v2 — running progress & backlog

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`.
**Working branch is now `main`** (user moved it here 2026-07-11; commit directly to main, per-phase commits, not pushed to origin unless asked). Design content from `.dc.html` files is the real shipped content ([[redesign-use-design-content]]).

## Phases done (committed to main)
- **Phase 0** `079affd` — backend restore (restock-alert, banglaqr, hero settings) + Playwright QA tooling + radio-group. Backend on :5001, frontend :5173.
- **Phase 1** `1859d44` — light paper tokens at `:root`, Archivo+Instrument Sans fonts, admin dark theme scoped under `[data-theme="diecastbd-admin"]` (verified byte-identical via scripts/verify-theme-split.mjs).
- **Phase 2** `ffab386` — shared shell: SiteHeader (frosted desktop nav + mobile app bar), SiteFooter (big/slim), MobileBottomNav, route-aware PublicLayout, AnnouncementBar restyle, controlled CartDrawer, NewsletterForm footer variant, Container 1360px, formatTaka helper, YouTube icon. Old Footer.jsx deleted. Verified at 390/1440, bottom-nav nav smoke passes.

## Data changes to live Settings (dev DB)
- `hero.variant` → `lime-showroom` (user's chosen default).
- `navigation.headerLinks` → design's 4 brand links (New arrivals / Hot Wheels Premium / MINI GT / Accessories with /shop deep-links).
- ⚠️ `hero.highlightCard` still has leftover TEST data ("ROXY GT 991 PORSCHE / ৳200") — decide in Phase 4.

## Phase 4 done — Home
- `ffab386`..HEAD: HeroSection (3 variants, lime default, highlight card), ShopByShelf, FeaturedSpotlight (spotlight+rows), PremiumShelfBanner, TrustStrip, TestimonialsSection, ProductCarousel (native scroll, Container-aligned). Deleted BrandsStrip/CollectorPromise/Instagram/NewsletterSection (dead). Backend: added `location` to testimonial schema+validation.
- Data updates: highlightCard → design example (Supra A80 / 2600); testimonials → design's 3 (Rafid/Tanvir/Nusrat + cities), replacing keyboard-mash test junk; collectorPromise → design's Premium Shelf copy ("Limited runs. Real metal. Gone fast.").
- ⚠️ **Flag to user**: (1) hero text is design-default (image is admin-editable; full hero-text editability is Phase 9). (2) shop-by-shelf tiles for MINI GT + Accessories have NO images (brand.logo/category.image not set) — render empty tile bg; HW Premium tile shows its logo. (3) testimonials are design examples — user should replace with genuine reviews before launch.

## Standing rules (from user feedback — apply to EVERY phase)
- **Follow the .dc.html markup strictly** — read per-breakpoint values from the design file; never approximate/average mobile+desktop.
- **Mobile is the priority.** Verify 390px first, always.
- Section **subtitles are desktop-only** (hidden on mobile) — SectionHeader already does this.
- All horizontal carousels need **click-drag** (useDragScroll) + **scroll-pl-4** (scroll-padding-left:16px) so snap doesn't pull the first card flush to x=0.
- **Announcement bar is hidden on mobile** (hidden md:flex) — keep it that way.
- Carousel card sizes differ mobile vs desktop (mobile 210w/172h/r18/13px title/36px add; desktop 316w/240h/r20/15px/32px).

## Backend customizability backlog (build in Phase 9 admin wiring)
User chose "Dynamic content editable" — make genuinely changeable content admin-editable, design copy = seeded default, static brand copy stays hardcoded.
- [ ] AnnouncementBar: extend `Settings.announcementBar` to editable **segments array** (currently single `text`+`isActive`; component hardcodes 3 design segments as default). File: `components/shared/AnnouncementBar.jsx`.
- [ ] Socials: add `youtube` to `Settings.socialLinks` (backend has fb/ig/whatsapp; design shows fb/ig/youtube). Files: `settings.model.js`/`validation`, `SiteFooter.jsx` (currently hardcodes youtube design URL).
- [ ] Footer payment pills (COD/bKash/BanglaQR): make an editable list or derive from enabled payment methods. File: `SiteFooter.jsx` (currently hardcoded `PAYMENTS`).
- [ ] Footer newsletter heading ("The drop list" / sub copy): decide editable vs static.
- (append new hardcoded-dynamic content here as later phases build it)

## Next: Phase 3 — product primitives
ProductCard, ProductCarousel, QtyStepper, StatusChip, SectionHeader, RestockAlertDialog (desktop dialog / mobile bottom-sheet via useMediaQuery), useRestockAlertMutation, Seo, lib/validators (bdPhoneSchema, phoneOrEmailSchema), lib/cloudinary (cloudinaryCard). Vitest for card states / stepper clamp / status map.

## Gotchas
- Never re-seed Settings (wipes real admin data). Use direct DB `$set` for data changes.
- Backend :5001 (AirPlay owns 5000). Use `npm install` not `npm ci` (lockfile drift).
- interaction-smoke expects data-testids: `mobile-bottom-nav` (done), `data-embla-next`/`data-embla-track` (Phase 3 carousel must set these).
- Playwright fullPage screenshots pin fixed elements (bottom nav) to first-viewport position — a capture artifact, not a bug.
