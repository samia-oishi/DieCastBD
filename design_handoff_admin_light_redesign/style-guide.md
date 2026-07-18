# DiecastBD — Design System & Style Guide

Hand this file to a designer (or an AI design tool) to create new screens that reuse the
existing tokens. Every value here is extracted from the shipped code
(`frontend/src/index.css` + components), not approximated. The site has **two visual
worlds that never mix**:

| Scope | Theme | Fonts | Feel |
|---|---|---|---|
| **Storefront** (all public pages) | Light "paper" | Archivo (display) + Instrument Sans (body) | Warm paper white, ink text, lime accents, pill shapes, frosted glass |
| **Admin dashboard** (`/admin`) | Dark | Geist (everything) | Near-black neutrals, lime `#a3e635` accent, compact shadcn/ui |

New **customer-facing** screens use the storefront system. New **admin/backend** screens
use the admin system. Never blend them.

---

## 1 · Storefront color tokens

### Brand & core

| Token | Hex | Use |
|---|---|---|
| `brand` | `#A8CD2F` | Primary lime — CTAs, active states, highlights, focus ring |
| `brand-bright` | `#B9DC4B` | Lime hover state |
| `brand-deep` | `#4F6B0B` | Lime-readable-on-light — text on tint surfaces, success text |
| `brand-tint` | `#EFF5DC` | Pale lime surface — selected fills, info banners, "Save ৳X" chips |
| `brand-glow` | `#C9E469` | Bright lime on dark surfaces (active nav item on dark pill) |
| `brand-soft` | `#F1F7DE` | Softer lime surface (TL;DR cards, sign-in banner) |
| `brand-soft-border` | `#DCE9B4` | Border for brand-soft surfaces |
| `ink` | `#101208` | Primary text, dark surfaces (bars, footer, dark buttons) |
| `ink-soft` | `#3A3D33` | Secondary dark text |
| `faint` | `#8A8D80` | Tertiary/placeholder text |
| `paper` | `#FAFAF7` | Page background |
| `tile` | `#F1F2EA` | Muted surface (chips, wells) |
| `line` | `#E7E8E0` | Default border |
| `line-soft` | `#EFEFE9` | Hairline/nested border |
| — (body text on ink) | `#DDDFD2` | Light text on dark bars |
| — (secondary body) | `#6B6E60` | Muted body copy on light (`muted-foreground`) |
| — (link hover) | `#5F7A10` | Unclassed link hover |
| — (ink-hover) | `#2A2E1C` | Hover for ink-filled buttons |

### Semantic / status

| Token | Text | Surface | Use |
|---|---|---|---|
| `warn` | `#B45309` | `#F7EAD6` (`warn-soft`) | Pending, low-stock warnings |
| `ok` | `#4F6B0B` | `#EFF5DC` (`ok-soft`) | Delivered, success |
| `danger` | `#B3261E` | `#F9E3E1` (`danger-soft`) | Cancelled/Refunded, errors, destructive |
| neutral status | `#3A3D33` | `#EFEFE9` | Confirmed/Packed/Shipped |

### Payment brand colors (fixed, never restyle)

bKash magenta `#E2136E` · BanglaQR uses its official red/green mark. Provider logos are
real assets (`src/assets/payments/`), never redrawn.

Charts (light): `#A8CD2F → #8DB423 → #6E9019 → #4F6B0B → #34480A` (lime ramp).

---

## 2 · Typography

**Display font — Archivo** (variable): headings, prices, buttons, wordmark, kickers.
Weights used: 700 (bold), 800 (extrabold); *italic* for brand-voice accents.
**Body font — Instrument Sans** (variable): everything else. Weights 400–700.

| Role | Spec |
|---|---|
| Page title (H1) | Archivo 800, 22px mobile / 30px desktop, tracking `-0.015em`, ink |
| Section heading | Archivo 700–800, 18–24px |
| Card title | 600–700, 12.5–15px, line-height 1.35 |
| Body | Instrument Sans 400–500, 13–14.5px, line-height 1.5–1.55 |
| Small/meta | 11–12.5px, `faint` or `#6B6E60` |
| Kicker/eyebrow | 9.5–10.5px, 600–700, UPPERCASE, tracking `0.06–0.09em`, `faint` |
| Price | Archivo 700–800, tabular feel; strikethrough compare-at in `faint` |
| Chip/badge text | 9–11.5px, 700, uppercase tracking `0.05–0.07em` |

Currency: **৳** with `en-IN` grouping (`৳2,060` — use `formatTaka()`; never hand-format).

---

## 3 · Radius system

Base `--radius: 0.75rem`, and named Tailwind classes are **rescaled** (`rounded-xl` ≈
16.8px, `rounded-2xl` ≈ 21.6px, `rounded-3xl` ≈ 26.4px). **Project rule: storefront
design radii are written as explicit `rounded-[Npx]`;** named classes are reserved for
shadcn primitives. Radii in use:

| Element | Radius |
|---|---|
| Buttons, chips, pills, search fields | `9999px` (full) |
| Product/summary/section cards | `18px` mobile / `20px` desktop |
| Option/method/zone cards, dashed add-tiles, banners | `14px` |
| Detail panels, inner cards | `16px` |
| Inputs (rectangular) | `12px` |
| QR/thumb tiles | `14px` |
| Hero, big feature blocks | `24–26px` |
| Floating dark bars (bottom nav, pay bar) | `22px` |
| Modals/dialogs | `24px` |

---

## 4 · Layout & breakpoints

- Container: `max-w-[1360px]`, padding `px-4` mobile / `px-10` (40px) desktop.
- Single breakpoint that matters: **`md` = 768px** (mobile below, desktop at/above).
  Design mobile at **390px**, desktop at **1440px**; nothing may overflow at 320px.
- Checkout-style two-column: `grid md:grid-cols-[minmax(0,1fr)_372px] gap-[26px]`,
  right column sticky at `top-[98px]` (sticky goes ON the grid item).
- Sticky header offset for any sticky sidebar: `98px`.
- Mobile pages that have their own action bar (PDP, cart, checkout) hide the global
  bottom nav and add bottom padding (`pb-24`) for clearance.

---

## 5 · Elevation, glass & dark surfaces

| Recipe | Spec |
|---|---|
| **Frost header** (light glass) | `bg-[rgba(250,250,247,0.6)]` + `backdrop-filter: blur(24px) saturate(180%)`, border-b `line` |
| **Dark floating pill** (bottom nav / pay bars) | `fixed inset-x-3 bottom-3`, `rounded-[22px]`, `bg-[rgba(13,15,7,0.92)]`, border `white/16`, `backdrop-filter: blur(22px) saturate(160%)`, shadow `0 10px 30px rgba(16,18,8,0.45)`, height ~66px |
| **Glass chip on imagery** | `bg-white/55`, border `white/60`, `blur(10px) saturate(160%)`, shadow `0 2px 10px rgba(16,18,8,0.16)` |
| Card resting | `bg-white`, 1px `line` border, no shadow |
| Card hover (desktop only) | translate-y `-2px` + shadow `0 12px 32px rgba(16,18,8,0.10)`, 180ms ease-out |
| Dialog backdrop | `rgba(16,18,8,0.5)` + blur 4px |

Dark sections (footer, promo banners, announcement bar) sit on `ink #101208` with text
`#DDDFD2`/white and lime accents.

---

## 6 · Storefront component recipes

**Primary CTA (lime pill)** — `rounded-full bg-brand text-ink`, Archivo 700–800,
13–15.5px, height 44–52px, hover `brand-bright`. On dark bars: same lime pill.
**Secondary (ink pill)** — `bg-ink text-white`, hover `#2A2E1C`.
**Outline pill** — `border-[1.5px] border-ink text-ink`, hover fills ink/white.
**Ghost/pill filter chip** — `tile` bg or 1px `line` border, full radius.
Disabled: 35–60% opacity. Min touch target 44px on mobile.

**Inputs** — white bg, 1px `line` border, `rounded-[12px]`, 44px tall, placeholder
`faint`; focus = 2px `brand` ring (offset 2). Labels 12.5–13px semibold ink.

**Option/selection card** (address, zone, payment method) — `rounded-[14px]`, 1.5px
border: `line`-ish `#C9CBBE` unselected → `brand` border + `rgba(168,205,47,0.07)` fill
selected; locked = dashed `#DEDFD6` + `cursor-not-allowed` + `UNAVAILABLE` chip.
**Radio dot** — 18px; selected `border-[5.5px] border-ink bg-brand`; unselected
`border-[1.5px] #C9CBBE`.

**Badges** — pill, uppercase: `NEW`/info = ink bg + white text; `SALE` = brand bg + ink
text; soft chips = `brand-tint` bg + `brand-deep` text.
**StatusChip** — pill, bold 10.5–11.5px: pending `#B45309/#F7EAD6`, delivered
`#4F6B0B/#EFF5DC`, cancelled/refunded `#B3261E/#F9E3E1`, intermediates `#3A3D33/#EFEFE9`.

**Product card** — white, `rounded-[18/20px]`, image area 205px mobile / 300px desktop
on white, 2-line clamped title with fixed min-height, price row pinned to bottom
baseline, round ink `+` quick-add (30–32px). Sold out: 55% paper overlay + `SOLD OUT`
pill + outline "Notify me".

**Section card** (numbered forms) — white, `rounded-[16-20px]`, numbered ink circle +
Archivo title; 16px padding mobile / 22–26px desktop.

**Empty states** — never fabricate content: icon (lucide, 1.25–1.6 stroke, `faint`),
short line, optional CTA.

---

## 7 · Iconography & imagery

- **Lucide icons only.** Stroke 1.5–2.2; sizes 13–17px inline, 24–40px feature/empty.
- Admin-selectable icons come from the curated map in
  `src/components/shared/settingsIcons.js` (ShieldCheck, Package, Truck, Sparkles,
  Award, Clock, Heart, Star, Megaphone, Tag, Gift, BadgeCheck, Zap) — extend-only.
- Brand marks (bKash, BanglaQR, socials) are real assets, never redrawn or approximated.
- Product imagery: white background, centered (Cloudinary `c_pad,b_white,ar_1:1`).

---

## 8 · Motion

- Micro-interactions 150–200ms ease-out (hover lifts, color transitions); slides 300ms;
  no motion longer than 500ms except marquees/carousels.
- Marquee (announcement bar): linear infinite, pauses on hover, honors
  `prefers-reduced-motion` (disabled).
- Desktop-only hover effects — never rely on hover on touch.

---

## 9 · Admin dashboard (dark) tokens

Everything under `/admin`. Font: **Geist** for all roles. Radius base `0.5rem` (use
shadcn named radii here — `rounded-lg` cards, `rounded-md` fields). Compact density,
shadcn/ui components as-is.

| Token | Value |
|---|---|
| background | `#0a0a0a` |
| card / popover | `#141414` |
| secondary / accent surface | `#1f1f1f` |
| muted surface | `#1a1a1a` |
| foreground | `#fafafa` |
| muted-foreground | `#a1a1aa` |
| **primary (lime)** | `#a3e635` on `#0a0a0a` |
| border | `oklch(1 0 0 / 10%)` (white @ 10%) |
| input border | white @ 15% |
| ring | `#a3e635` |
| destructive | `#ef4444` |
| warning | `#fbbf24` |
| info | `#38bdf8` |
| sidebar | `#0d0d0d`, active item `#1a1a1a`, accent `#a3e635` |
| charts | `#a3e635 → #84cc16 → #65a30d → #4d7c0f → #3f6212` |

Admin patterns: page = `h1` Geist 24px + top-right primary action; content in
`SectionCard`s (`#141414`, 1px white/10 border, title + muted description); tables with
muted headers and hover rows; repeatable rows = bordered box + trash icon + "Add"
outline button; toggles = shadcn Switch; status via the same StatusChip; destructive
flows always confirm via AlertDialog listing consequences.

---

## 10 · Component libraries & conventions (for implementers)

- **shadcn/ui** (Radix) is the primitive layer; **DaisyUI only** for Rating/Steps/Loading.
- State: TanStack Query (server), Zustand (client-only). Forms: RHF + Zod.
  BD phone: `01[3-9]XXXXXXXX`.
- Toasts: react-hot-toast. SEO: Helmet.
- **No fabricated content** — testimonials/FAQs/policies render real Settings/Pages data
  and hide when empty.
- Focus-visible: 2px ring in theme ring color, offset 2 — on every interactive element.

## 11 · Voice & microcopy

Short, collector-warm, benefit-first. One doubt per line; state the exact problem;
never restate numbers already visible on screen. Examples of the register: "Pay the
rider when your order arrives." · "Hand-verified authentic · Collector-grade packing" ·
"Keep the cash ready — the rider will call ahead."
