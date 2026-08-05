# 2026-08-05 — Checkout address: district + thana dropdowns

## What was asked

> "In checkout page make it more simple instead city add a dropdown with search option The district of bangladesh And then User can select the Thana Based on the district it will show the thana. Remove the zip code from addresss."

Two merchant decisions taken during the work:

- **Area data → "official + city thanas."** 64 districts with their 494 official upazilas, plus the metropolitan thanas for Dhaka and Chattogram so urban customers can find their area. Sourced from public datasets, never from memory.
- **Shipping zone stays manual.** Do *not* derive the zone from the district — `settings.model.js:47-50` documents the invariant that zone names are admin-renamable free text.

## What was done

Complete. Full reasoning in `docs/plan.md` decision **#91**; narrative in `docs/log.md` under the same date.

**New files**

| File | Purpose |
|---|---|
| `frontend/src/lib/bdGeo.js` | 64 districts / 559 thanas + `findDistrict`, `thanasForDistrict`, `isThanaInDistrict` |
| `frontend/src/lib/address.js` | `formatAddressArea` / `formatAddressLine` (the single frontend formatter) |
| `backend/src/utils/address.js` | `formatAddressArea` — same rule for the three emails |
| `frontend/src/components/shared/SearchableSelect.jsx` | in-flow searchable single-select |
| `frontend/src/features/addresses/components/DistrictThanaFields.jsx` | the dependent pair, shared by both forms |
| + 3 test files | `bdGeo.test.js`, `DistrictThanaFields.test.jsx`, `backend/test/unit/address.test.js` |

**Data model.** `thana` added to `Order.shippingAddress` and `Address`. `city` **demoted from required to optional** on both (kept so existing orders/addresses still read). `postalCode` retained in the models but no longer collected or asked for. Display resolves `thana || city` in one helper per app.

**Backend is deliberately looser than the form** — accepts either shape, enforces only `thana || city` via a refine, so a browser tab opened before the deploy can still place an order. `updateAddress` `$unset`s the legacy `city`/`postalCode` once a `thana` arrives.

## Gotchas worth carrying forward

- **`bd-geodata` alone cannot serve Dhaka.** Dhaka district's upazilas are only `Savar, Dhamrai, Keraniganj, Nawabganj, Dohar`. Dhanmondi/Gulshan/Uttara/Banani are absent; "Mirpur" and "Mohammadpur" in the 494 belong to **Kushtia** and **Magura**. The 50 DMP + 16 CMP thanas are merged in from Wikipedia. Every other district has a Sadar upazila, so only these two needed it.
- **The dropdown must not be a floating popover.** Mobile `SheetContent` is `overflow-y-auto` (clips an absolute panel); portalling out escapes the Sheet/Dialog focus trap so the search box can't take focus. Hence the in-flow disclosure.
- **`AddressForm` is not a `<form>`** — it submits on Enter from any INPUT. The select's search box must `stopPropagation()` on Enter, and on Escape too (else Escape closes the whole modal).
- **jsdom has no `scrollIntoView`** — same family as the existing `matchMedia` / `IntersectionObserver` guards.
- **Vite port fallback breaks the API.** If 5173 is taken, Vite serves on 5174, which is **not** in the backend CORS allowlist — the page silently renders "No products match these filters." Not a code bug. Check the port before debugging data.
- **Minting a test JWT: the payload key is `sub`, not `id`.** `authenticate` reads `payload.sub`. An `id`-keyed token authenticates but leaves `req.user.id` undefined, which surfaces as a confusing `actor is required` audit-log validation error on admin deletes.
- Playwright is resolvable only from `frontend/node_modules`, and it is **CJS** — `import pw from "…/playwright/index.js"` then destructure.

## Repo / server state

- Branch `main`, working tree committed. Everything above is in one commit.
- Backend dev server was started on **:5001** during this session (AirPlay owns 5000); a pre-existing Vite dev server runs on **:5173**.
- **Dev database is clean.** The two orders placed for verification were deleted through the admin API (stock returned, analytics recomputed), the guest user they created was removed, and today's rollup was re-derived to `revenue 0 / newCustomers 0`. The merchant's two real orders (28 Jul, 2 Aug) and their single saved address are untouched.
- Backend 140/140, frontend 127/127, lint and build clean.

## Unfinished / carried over

- **Two production DB migrations still pending at deploy time** (from the admin light redesign, see `2026-07-18-admin-light-redesign-complete.md`): the announcement-bar `$set` to the new shape, and the hero `$set hero.image` / `$unset heroBanner` + autoplay fields.
- **Merchant has a large batch of unpushed commits.** They push manually.
- **Flagged, not changed:** `backend/src/emails/orderConfirmation.js` interpolates the customer's address into HTML unescaped, unlike `adminNewOrder.js` and `orderConfirmed.js` which use `escapeHtml`. Low impact (recipient's own data in their own email) but it should be brought in line.
- No new env vars. No migration is needed for this change — `Order.shippingAddress` is a purchase-time snapshot, and old `Address` docs keep working through the `thana || city` fallback.
