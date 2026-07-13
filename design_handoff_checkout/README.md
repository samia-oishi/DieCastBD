# Handoff: DiecastBD Checkout Redesign (partial payment / payment rules)

## Overview
This is a redesign of the **Checkout page only** (step 2 of `Cart → Checkout → Done`) for the DiecastBD
store. The goal is a cleaner, mobile-first checkout that makes the **partial-payment / payment-rule**
experience obvious and self-explanatory. The page must adapt to **four backend-driven payment rules** and
render the correct notices, method availability, and amounts for each.

**Hard constraints (do not violate):**
- **Do NOT change the existing flow, routing, or business logic.** This is a front-end / UI reskin of the
  checkout page.
- **Do NOT change the existing site header, site footer, or the mobile bottom navigation bar.** Keep those
  components exactly as they are today — only update the *content/context* inside the checkout page area
  (and, where the bottom nav shows checkout-specific content, only its text/values — not its structure or style).
- **Mobile-first.** Build the mobile layout first, then enhance up to desktop.
- **Pixel-perfect.** Match the spacing, radii, colors, and type in this document exactly.
- Payment methods to support: **Cash on Delivery, bKash, BanglaQR** (no others).

## About the Design Files
The file in this bundle — `Checkout Redesign.dc.html` — is a **design reference created in HTML**. It is a
working prototype that shows the intended look and interactive behavior; it is **not production code to copy
directly**. Your task is to **recreate this design inside the existing DiecastBD codebase** using its
established framework, components, state patterns, and styling conventions. If the checkout page already
exists (it does), refactor its markup/styles to match this spec while leaving its data-fetching, routing,
and submit logic intact.

The prototype contains two options inside one canvas file:
- **`#1a`** — the **desktop** layout (2-column: form left, sticky order summary right).
- **`#1b`** — the **mobile** layout (single column, sticky "Place order" pay bar at the bottom).
Both are the *same design system* at two breakpoints — implement them as **one responsive page**, not two.

The prototype exposes a Tweaks panel with `paymentRule` (`cod | delivery | partial | full`) and
`advanceAmount`. In production these come from the **backend per product / per cart** — see "Payment rule
logic" below. Do not ship a UI toggle for them.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, and interactions are final. Recreate pixel-perfectly
using the codebase's existing libraries and patterns.

---

## Payment rule logic (the core of this task)

The backend assigns each **product** one of four requirements. The **cart/order takes the strictest rule
among its items** (strictness order below, low → high). The order total is `subtotal + shipping`.

| `paymentRule` | Meaning | COD row | "Pay now" minimum | Remainder (cash on delivery) |
|---|---|---|---|---|
| `cod` | Cash on Delivery allowed for the whole order | **enabled, default-selected** | ৳0 (if COD chosen) | full total |
| `delivery` | Delivery charge must be prepaid to confirm | **disabled** | = shipping charge | subtotal |
| `partial` | A part-payment advance reserves the item | **disabled** | = `advanceAmount` (backend value, clamp to ≤ total) | total − advance |
| `full` | Full payment required to confirm | **disabled** | = full total | ৳0 |

Rules and derived values (mirror the prototype's `renderVals`):

```
codAllowed   = rule === 'cod'
min          = rule === 'delivery' ? shipping
             : rule === 'partial'  ? Math.min(advanceAmount, total)
             : /* full */            total
// when COD is not allowed and method is a digital one, the customer may still choose to pay in full.
selectorVisible = method !== 'cod' && (rule === 'delivery' || rule === 'partial')
plan         = selectorVisible ? (userChoice: 'advance' | 'full') : 'full'
payNow       = method === 'cod' ? 0 : (plan === 'full' ? total : min)
due          = total - payNow          // "cash on delivery" remainder
```

**Method behavior:**
- If `codAllowed` is false, the COD method row is shown **disabled** (dashed border, `cursor:not-allowed`,
  an `UNAVAILABLE` chip) and cannot be selected. Default the selection to **bKash**.
- If `codAllowed` is true, COD is selectable and is the **default** method. Selecting COD hides the
  bKash/BanglaQR detail panel and sets `payNow = 0`, `due = total`.
- Selecting bKash or BanglaQR opens the **payment details panel** (QR placeholder + reference input). Only
  bKash shows the "Send Money to `01764 250 814`" row with a Copy button.

**"What are you paying now?" selector** (only when `selectorVisible`): two cards side-by-side (stacked on
mobile):
- Card A — **`MINIMUM TO CONFIRM`** badge (lime), title `Pay ৳{min} now`, sub `৳{total−min} in cash at your door`.
- Card B — **`NOTHING DUE LATER`** badge (grey), title `Pay ৳{total} now`, sub `Nothing to pay on delivery`.
Selected card: `2px solid #101208`, bg `#FAFAF7`. Unselected: `1px solid #E7E8E0`, bg `#fff`.

When the selector is NOT visible but a digital method is chosen (i.e. `full` rule, or `cod` rule paying
digitally), show a single static note instead of the two cards:
- `full` rule: `Full payment of ৳{total} confirms this order — nothing due on delivery.`
- otherwise: `You're paying the full ৳{total} now — nothing due on delivery.`

**Split bar** (below the selector): a horizontal 8px (mobile 7px) track, 3px gap, radius 99.
- Segment "now": `width = max(4, round(payNow/total*100))%`, background `#A8CD2F`.
- Segment "due": `flex:1`, background `#E3E4DA`, **hidden when `due === 0`**.
- Legend under it: `● Pay now ৳{payNow}` (lime dot) and, when `due>0`, `● Cash on delivery ৳{due}` (grey dot `#D8DACC`).

---

## Exact UX copy (use verbatim)

**Page:** H1 `Checkout` · sub `Address, delivery, then how you'd like to pay — two minutes, tops.`

**Scenario banner** (lime `#EFF5DC` panel with shield icon), by rule:
- **cod** — title: `Cash on Delivery works for this whole order.`
  body: `Nothing to pay until it reaches your door. Prefer to settle now? bKash and BanglaQR work too — your call.`
- **delivery** — title: `One small step to confirm — prepay the delivery charge.`
  body: `This order ships once the ৳{shipping} delivery charge lands. Pay it via bKash or BanglaQR, and hand the remaining ৳{subtotal} to the rider in cash.`
- **partial** — title: `A ৳{min} advance reserves your piece.`
  body: `The Supra A80 is an import pre-order, so we confirm it with a part payment. Pay ৳{min} now via bKash or BanglaQR — the remaining ৳{total−min} is cash on delivery.`
- **full** — title: `This piece needs full payment to confirm.`
  body: `Reserved imports are secured with the full ৳{total} before they ship. The upside: nothing left to pay at your door.`

*(Replace "the Supra A80"/"this piece" with the actual triggering product name(s) from the cart in production.)*

**COD method sub-text:**
- allowed: `Pay ৳{total} in cash when your order arrives`
- locked: `Not available for this order — the {product} must be confirmed with a payment first`  · chip: `UNAVAILABLE`

**bKash row:** title `bKash` · sub `Send Money or scan — done in under a minute` (mobile: `Send Money or scan — under a minute`)
**BanglaQR row:** title `BanglaQR` · sub `Scan & pay from any bank or MFS app`

**Payment panel:**
- bKash — title `Pay with bKash` · hint `Scan in the bKash app, or Send Money to the number below` · QR caption `bKash QR`
- BanglaQR — title `Pay with BanglaQR` · hint `Scan with any bank or MFS app that supports BanglaQR` · QR caption `BanglaQR`
- bKash send-money row: `or Send Money to  01764 250 814` + button `Copy` (→ `Copied!` for 1.6s)
- Reference field label: bKash `bKash Transaction ID` (placeholder `e.g. 9HK2XXXXXX`) / QR `Payment reference` (placeholder `Reference from your app receipt`)
- Reference helper:
  - bKash: `Paste the Transaction ID from your bKash confirmation SMS — we match your payment instantly and reserve your piece.`
  - QR: `Enter the reference from your banking app receipt so we can match your payment instantly.`

**Delivery zones:** `Inside Dhaka` — `৳60` — `At your door in 24–48 hours` · `Outside Dhaka` — `৳120` — `2–4 days, fully tracked` · note textarea placeholder `Anything for the rider? Landmark, preferred time…`

**Order summary:** heading `Your order` · chip `1 item` · line items `Subtotal`, `Shipping · {zone}` · coupon placeholder `Coupon code` + button `Apply` · `Total` · split box rows `Pay now` / `Cash on delivery` · trust line `Hand-verified authentic · Collector-grade packing` · fine print `By placing this order you agree to our Terms & Refund Policy.`

**CTA button:**
- COD: `Place order · ৳{total} due on delivery` · sub `Keep the exact amount ready — our rider will call before arriving.`
- digital, due>0: `Pay ৳{payNow} & place order` · sub `৳{due} remains — hand it to the rider in cash when your order arrives.`
- digital, due=0: `Pay ৳{payNow} & place order` · sub `All settled — just receive and unbox.`
- Mobile pay bar: big amount `৳{payNow}` + caption `pay now · ৳{total} total` + button `Place order`.

---

## Layout

### Mobile (base, ~390px)
Single column, 16px page padding, 12px gaps between cards. Order: **Deliver to** (address, collapsed with a
`Change` pill) → **Delivery** (stacked zone cards) → **Payment** (banner → 3 method rows → detail panel) →
**Order summary** card. A **sticky bottom pay bar** (`position:sticky; bottom:0`) sits above the existing
mobile bottom nav — it shows `৳{payNow}`, the `pay now · total` caption, and a lime `Place order` button.
Cards: `border:1px solid #E7E8E0; border-radius:16px; padding:16px`. Step badges 22px, section titles
Archivo 15px/700.

### Desktop (≥ ~980px)
Two columns: `grid-template-columns: minmax(0,1fr) 372px; gap:26px; align-items:start`. Left column = the
three stacked section cards (`border-radius:20px; padding:22px 26px`). Right column = **sticky order summary**
(`position:sticky; top:20px; border-radius:20px; padding:22px 24px`). No bottom pay bar on desktop — the CTA
lives in the summary. Body padding `30px 36px 44px`. H1 Archivo 30px/800.

Radios (all selection controls): 18px circle; selected = `border:5.5px solid #101208; background:#A8CD2F`;
unselected = `1.5px solid #C9CBBE; background:#fff`; disabled border `#DEDFD6`. Selected option cards get
`1.5px solid #A8CD2F` + `background rgba(168,205,47,.07)`.

---

## Interactions & Behavior
- **Select delivery zone** → updates shipping (৳60/৳120), recomputes total, `min` (for `delivery` rule),
  `payNow`, `due`, banner amounts, split bar, CTA — everywhere, live.
- **Select payment method** → COD (if allowed) collapses the detail panel & sets payNow=0; bKash/QR open the
  panel and swap copy/QR caption/reference field accordingly.
- **Select pay plan** (advance vs full) → recomputes payNow/due, split bar, summary box, CTA — live.
- **Copy button** → copies `01764250814` to clipboard, label flips to `Copied!` for 1600ms.
- **Coupon Apply**, **Add address**, **Change** → wire to existing handlers; visual states only in the mock.
- All transitions: `border-color/background .15s ease`; split bar width `.25s ease`.

## State Management
Local component state: `method ('cod'|'bkash'|'qr')`, `plan ('advance'|'full')`, `zone ('inside'|'outside')`,
`copied (bool)`. Inputs from backend/cart: `paymentRule`, `advanceAmount`, `subtotal`, line items, saved
addresses. Everything else is derived (see "Payment rule logic"). Guard: if `method==='cod'` but COD is not
allowed, coerce to `'bkash'`.

## Design Tokens
- **Backgrounds:** page `#EDECE5` (prototype canvas) → use the app's real page bg; card/surface `#fff`; inset/sub-surface `#FAFAF7`; tint `#EFF5DC`; chip grey `#F1F2EA`.
- **Ink / text:** primary `#101208`; body-muted `#6B6E60`; faint `#8A8D80`; placeholder/disabled `#A2A499`; on-dark muted `#A9AC9F`.
- **Brand lime:** `#A8CD2F` (primary action; hover `#B9DC4B`); deep lime text/icon `#4F6B0B` / `#5F7A10`; light `#C9E469`.
- **bKash brand:** `#E2136E` (magenta chip, white italic text).
- **Borders:** `#E7E8E0` (default), `#EFEFE9` (divider), `#C9CBBE` (dashed), `#DEDFD6` (disabled). Split-bar due `#E3E4DA`; grey dot `#D8DACC`.
- **Radius:** pills `999px`; small cards `14px`; mobile cards `16px`; desktop section cards `20px`; inputs/QR `12–14px`; method rows `16px`; chips `8px` (bKash `6–8px`).
- **Shadow:** cards essentially flat; container `0 1px 3px rgba(16,18,8,.06)`.
- **Type:** headings **Archivo** (700/800, italic logo, letter-spacing ≈ -0.015em); body **Instrument Sans** (400–700). Eyebrow/label = 11–12px, weight 700, letter-spacing .06–.14em, uppercase, color `#8A8D80`. Sizes: H1 30px desktop / 22px mobile; section title 17/15px; body 13.5–14.5px; sub/help 12–13px.
- **Spacing:** card padding 16px (mobile) / 22–26px (desktop); gaps 8–12px inner, 12–18px between cards; page padding 16px (mobile) / 30–36px (desktop).

## Assets
- **Icons** are inline SVGs (shield/check, plus, lock, QR grid, arrow). Reuse the codebase's existing icon set to match these.
- **QR code** is a dashed placeholder in the mock — render the real bKash/BanglaQR code in production.
- **Logo** — the mock uses a text wordmark `DIECASTBD`; use the real logo asset already in the app header (do not change the header).
- No raster images required beyond the product thumbnail (already in the cart data).

## Files
- `Checkout Redesign.dc.html` — the hifi design reference (option `#1a` desktop, `#1b` mobile). Open in a
  browser to inspect exact styles, interactions, and the four payment-rule states. To see each rule, the
  prototype uses a Tweaks panel (`paymentRule`, `advanceAmount`); in production these are backend-driven.

---
*Recreate these designs in the existing DiecastBD checkout page using the app's own framework and components.
Keep header, footer, mobile bottom nav, routing, and submit logic unchanged — only the checkout page content
and its payment-rule UI change.*
