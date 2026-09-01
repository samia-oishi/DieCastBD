# 2026-09-01 — Delivery zone derived from the district (plan.md #100)

Follows `2026-08-05-checkout-district-thana.md` (#96, checkout addresses = Steadfast's
own list) and the courier/admin-order work of #97–#99. Committed as `a8369d2`.
**2 commits unpushed — the user pushes themselves, always.**

## What shipped

Checkout no longer asks Inside Dhaka / Outside Dhaka. It reads the district off the
address and derives the zone.

- `resolveZoneForDistrict()` duplicated in `backend/src/modules/settings/shippingZone.js`
  and `frontend/src/lib/shippingZone.js` — no shared import path exists between the apps.
  Same 8 cases pinned in each suite, including one that renames both zones and asserts
  routing does not move.
- Mapping lives in the **data**: `shippingZones[].districts` + one `isDefault` catch-all.
  Never a string match on the zone name — names are admin-renamable free text.
- **`buildAndSaveOrder` derives it server-side and ignores the client's `shippingZone`.**
  It previously trusted the request body, so a Rangpur address could claim "Inside Dhaka"
  and pay ৳70. Falls back to the submitted name only when the address has no district.
- Admin Settings → Shipping: per-zone district picker + "everywhere else" toggle, beside
  the existing name/fee/prepay controls. Picker hides districts claimed by another zone.
- Admin create-order derives the zone the same way (no manual choice to contradict it).

## Live state

- **Migration APPLIED to the live DB** via `backend/scripts/migrate-zone-districts.mjs`
  (dry-run by default, idempotent, refuses if zone names were edited).
  Live zones now: Inside Dhaka ৳70 COD `["Dhaka City","Dhaka"]` · Outside Dhaka ৳120
  prepay `isDefault`. Additive only — the **deployed** build ignores the new fields, so
  production behaviour is unchanged until the next frontend deploy.
- DB verified back at the known-good figures after testing: **17 orders, 27 users,
  ৳32,390 revenue**, no negative `reservedStock`.

## Gotchas worth keeping

- **"Dhaka City only"** (merchant's words). Dhaka Sub-Urban — Savar, Ashulia, Dhamrai,
  Dohar, Keraniganj, Hemayetpur, Nawabganj — is a *separate Steadfast district* and pays
  the outside rate.
- The Inside zone must keep plain **`"Dhaka"`** in its districts list: two saved addresses
  still store that older name and matching is a literal string compare. The frontend also
  runs `findDistrict()` first (handles "Barisal"→"Barishal", "Chattogram"→"Chittagong",
  and a Dhaka thana typed into the district box); the **backend does not have that table**,
  so on an unrecognised district it falls through to the catch-all. Currently harmless —
  every saved address resolves — but it is the one place the two sides can disagree.
- `GuestAddressForm` calls `onChange` **only when the whole form is valid**. That is why
  the district needed its own `onDistrictChange` prop: the fee must appear the moment the
  district is picked, not after the thana.
- Admin pages can't be driven in the browser here (Firebase login). `ZoneDistricts` is
  exported from `SettingsPage.jsx` purely so `ZoneDistricts.test.jsx` can render it — that
  is the substitute for a browser pass on that screen.

## Bugs this session (all found AFTER lint + 430 tests + both builds passed clean)

1. `setValue` used in the Settings shipping card but never destructured from `useForm` —
   the Shipping tab would have thrown on render. Found by auditing that every identifier
   used in JSX is actually bound. **Do this audit every time; lint does not catch it.**
2. `GuestAddressForm` validity gating (above) — only the browser showed it.
3. Pre-existing since #99: admin create-order read `zone.charge`; the field is `fee`. Every
   zone showed ৳0 delivery and "Rider collects" was understated on every admin-entered
   order. Fixed here.

## Still open

- **One real Steadfast parcel test** — `create_order` books a real collection, so it needs
  the merchant to nominate an order they will cancel in the Steadfast panel. Nothing has
  been created yet.
- Two production DB migrations outstanding from the admin light redesign: announcement-bar
  `$set`, and hero `$unset heroBanner` + autoplay fields.
- Noted, not fixed: `backend/src/emails/orderConfirmation.js` interpolates the customer's
  address into HTML unescaped, unlike the two newer templates.
- Optional, merchant's call: `object-contain` for the 26 clipped product tiles on /shop.

## Standing constraints (do not drop)

- **Never push. Never commit `.env`.** Commit each finished change unprompted and report
  the unpushed count.
- **Never touch SEO / `<head>` / prerender / Core Web Vitals as a side effect** — ask first.
- Backend dev runs on **:5001** (AirPlay owns 5000). Vite falling back to 5174 breaks API
  calls via CORS — free 5173 rather than debugging it.
- Playwright resolves only from `frontend/node_modules` and is CJS: default-import it.
