# Phase 9 (part 1) — Static pages + Policies — done

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`. Branch: **main**.
Continues from `2026-07-12-phase8c-auth.md`. Phase 9 has 3 sub-phases (static / policies / admin); **static + policies are done**, admin remains.

## 9a — Static pages (committed `e9541c8`)
- **Contact** (`about-contact/ContactPage.jsx`): "Talk to a collector" + channel cards (Email, Instagram from settings-or-design-default; WhatsApp only when `socialLinks.whatsapp` is set — no fabricated number), Follow card (fb/ig/yt via shared `SocialIcons`), order-ID note, and a message form (Name, **Email or phone**, **Order ID optional**, Message). **Backend contact endpoint extended**: `contact` accepts email-or-phone (existing `isEmail`/`isBdPhone`), `orderId` optional; email template shows both + replyTo only for email-shaped contacts. Frontend `contactSchema` → `phoneOrEmailSchema`.
- **FAQ** (`FaqPage.jsx`): custom accordion (plus/minus circles, single-open, first open) + "Still stuck?" CTA. **Seeded the design's 6 Q&A into `settings.faqs`** (replaced the junk test entry).
- **About** (`AboutPage.jsx`): "Collectors first. Always." hero, dark collector-promise card + image placeholder, 4-card "why choose us", lime CTA. Static brand copy = shipped content.
- Lucide brand icons (Facebook/Instagram/Youtube) don't exist in this lucide version — use `components/shared/SocialIcons` (Facebook/Instagram/YouTube/WhatsApp) instead. **Remember this for any social-icon work.**

## 9b — Policy pages (committed `5248db0`)
- **`PageView.jsx`** rebuilt to the design: POLICY kicker, title, "Last updated {Mon YYYY}", **switcher chips** (Shipping/Refunds/Privacy/Terms), **TL;DR card** (from `page.tldr`), styled prose from CMS `content`, dark contact CTA, graceful empty state. Body is **CMS-only** (never hardcoded in the component).
- **Backend**: added `Page.tldr` (model + create/update validation + create controller). Update controller already spreads `req.body`.
- **Seeded** the design's policy copy (content HTML `<h2>+<p>` per section, plus tldr) into all 4 CMS pages and set `isPublished: true` — so they render real content while the frontend stays CMS-driven. (Pages were previously unpublished + empty → 404.)

## 9c — Admin wiring — DONE (committed `a8fa99a`, `8781acd`)
- **Settings editor** (`admin/settings/SettingsPage.jsx`): added **hero style select** (variant), **hero highlight card** (enabled + kicker/title/price), **BanglaQR** payment section (accountInfo + QR upload via generalized `QrImageField`), and **socialLinks.youtube** field. Backend: added `socialLinks.youtube` (model + validation); `SiteFooter` now prefers the admin youtube value. Model already had variant/highlightCard/banglaQrConfig + validation accepted them — only the UI was missing.
  - **Gotcha fixed**: switched the form to RHF `values: settings` (reactive) and added `key={field.value}` to the hero-style `Select` — Radix Select doesn't display an async-loaded controlled value otherwise (register inputs synced fine; only the Select showed its placeholder). Verified it now shows "Lime showroom".
- **Inventory** (`admin/inventory/InventoryPage.jsx`): new **Alerts** column showing `restockAlertCount` (already returned by `GET /admin/inventory`); clicking opens a **RestockAlertsDialog** listing waiting contacts via `GET /admin/inventory/:id/restock-alerts` (added `getProductRestockAlerts` + `useProductRestockAlerts`).

## 9c — remaining backlog (DEFERRED — low value, storefront works via fallbacks)
- Announcement **segments array** (AnnouncementBar hardcodes 3 design segments; `Settings.announcementBar` is still single text+isActive).
- Footer **payment pills** (SiteFooter hardcodes COD/bKash/BanglaQR).
These are storefront hardcodes with working defaults; fold into a follow-up if the merchant needs to edit them.

## (superseded) 9c original notes
The admin is the dark-themed surface (`[data-theme="diecastbd-admin"]`, shadcn/Geist). Needs, per plan + backlog:
- Settings editor: **hero variant select** (`homepageSections.hero.variant`: lime-showroom/dark-spotlight/photo-fullbleed) + **highlightCard** fields + **banglaQrConfig** (QR image upload + reference) fields.
- Inventory: **restock-alert count + list** (RestockAlert module was restored in Phase 0).
- Dynamic-content backlog (from Phase-2 snapshot): announcement **segments array** (`Settings.announcementBar`), **`socialLinks.youtube`** field (model has fb/ig/whatsapp; footer/contact hardcode the design youtube URL), footer **payment pills**.
- Storefront already works without these (values set via direct DB or design fallbacks); this is admin control + the customizability the user asked for.
- Verification is harder here (dark theme, admin auth) — do a baseline admin screenshot first (Phase-1 discipline) and regression-check the dark theme after.

## Verification (9a/9b)
Screenshots in `frontend/qa/phase9/`: contact-1440/390, faq-1440, about-1440, policy-1440 — all match the design. Backend 35/35, frontend build clean, tests 17/17, lint clean.

## Next
Phase 9c (admin wiring) then Phase 10 (full QA). Awaiting go-ahead on admin.
