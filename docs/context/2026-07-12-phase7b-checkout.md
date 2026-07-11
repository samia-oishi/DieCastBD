# Phase 7b — Checkout — done & verified

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`.
Branch: **main** (per-phase commits, not pushed unless asked). Continues from `2026-07-11-redesign-v2-progress.md` (Phases 0–7a done).

## What was built (Phase 7b — Checkout `/checkout` vs `DiecastBD Checkout.dc.html`)
Restyled AROUND the preserved submission logic (mode branching + `useCreateOrderMutation` payloads kept). New/changed files:
- `features/checkout/CheckoutPage.jsx` — rewritten. Progress stepper header, "Checkout" title, guest "Have an account?" banner, 3 numbered cards, desktop sticky summary / mobile summary-on-top + sticky place-order bar. Submission logic intact: buy-now via router state (`location.state.buyNowItem`), guest vs user branch, phone sourced from `selectedAddress.phone` (user) or `guestData.phone` (guest), coupon from `cartStore`, on success `clearCoupon()` + navigate to ORDER_CONFIRMATION.
- `features/checkout/schemas/checkoutSchema.js` — removed standalone `phone` (sourced from address); added `banglaqr` to paymentMethod enum + `banglaQrReference` with conditional refine (required when banglaqr); bkashTransactionId required when bkash.
- New components: `CheckoutSteps.jsx` (Cart ✓ → 2 Checkout → 3 Done), `parts.jsx` (NumberedCard, RadioCard, RadioDot, FieldBox, inputCls), `DeliveryOptions.jsx` (zones radio cards), `PaymentMethods.jsx` (COD/bKash/BanglaQR; selected expands — bKash pink chip + QR + copyable number from `bkashConfig` + txn input; BanglaQR from `banglaQrConfig` + reference input), `GuestAddressForm.jsx` (inline RHF+Zod, reports valid values up via onChange), `CheckoutSummary.jsx` (desktop/mobile variants).
- `AddressSelector.jsx` — restyled saved-address radio cards + dashed add-new (logged-in path).

## Exit gate — 4 real dev orders (PASSED)
All landed on `/order-confirmation` with correct totals, all guest (isGuest User), all `pending`:
- **guest+COD** `DBD-20260711-EBF629` — Card Protector Folding Blister ৳1,800 + ship ৳60 = **৳1,860**.
- **guest+bKash** `DBD-20260711-1E83C5` — HW F1 Gold Label ৳2,500 + ৳60 = **৳2,560**, txn `TXNVERIFY777` stored.
- **guest+BanglaQR** `DBD-20260711-96FD2C` — same item = **৳2,560**, `banglaQrReference: BQR-VERIFY-888` stored.
- **buy-now guest+COD** `DBD-20260711-4D2ECB` — Hot Wheels Ferrari 5-Pack ৳3,200 + ৳60 = **৳3,260** (via PDP "Buy now" → router state, never touched cart).
- ⚠️ **Deviation from plan**: plan said "logged-in+bKash"; did **guest+bKash** instead (Firebase login impractical headless). The bKash payment path is fully exercised; the logged-in path shares the exact same `createOrderMutation` and only swaps `guestInfo`/`shippingAddress` for `addressId` (code-verified in CheckoutPage). Worth a manual logged-in order before launch.

## Bug found & fixed during the gate (real, not test-only)
Product `MGT-TS01` (MINI GT Supra A80 Top Secret) had **`salePrice: 0`** (manual admin test data — seed & Inventory.md both have price 2600, no sale). The order money path used `salePrice ?? product.price`, so `0 ?? 2600 = 0` → a ৳0 order. Fixes:
1. **Data**: `$unset` salePrice on MGT-TS01 (now price 2600, no sale). Reseed-safe (seed never set it).
2. **Code** `backend/src/modules/orders/order.service.js:37` — changed the shared `reserveStockForItems` price to mirror the model's own effective-price rule (`product.model.js:77`): `salePrice != null && salePrice < price ? salePrice : price`. A stray salePrice of 0 can never again turn a paid product into a free order. This is the single shared order-pricing line (all order paths use it).
- Cleaned up: deleted the 2 pre-fix ৳0 test orders and released their held Supra stock (Supra back to stock 2 / reserved 0 / avail 2).

## ⚠️ Latent fragility still open (flag for Phase 9 / 10)
The **frontend display** effective-price still trips on a stray `salePrice: 0`:
- `salePrice ?? price` in `FeaturedSpotlight.jsx`, `CheckoutPage.toBuyNowLineItem`, `cart/api/useCart.js`, `RestockAlertDialog.jsx`.
- `onSale = salePrice != null && salePrice < price` (ProductCard, CartLineItem, admin ProductsPage, PDP) → **true for 0** (shows "on sale for ৳0").
- Backend validation allows it: `salePrice: z.coerce.number().min(0)` and model `min: 0`.
- **Best fix (deferred)**: treat a sale as `salePrice != null && salePrice > 0 && salePrice < price` everywhere (a small shared `effectivePrice(product)` helper), and make the admin ProductForm / validation coerce `0`/empty → `null`. The backend order total is now safe regardless; this is display-consistency + prevention-at-source.

## Verification status
- Frontend tests 17/17, backend tests 35/35, frontend build clean (~480KB), lint warnings-only (removed 2 I introduced).
- Screenshots: `frontend/qa/phase7b-checkout/built-390.png` (clean, ৳2,560), `built-1440.png`, `confirmation-1440.png`.

## Post-review fixes (user feedback after 7b)
- **Dedicated checkout header** (`features/checkout/components/CheckoutHeader.jsx`) replaces the storefront nav on `/checkout`, matching the design exactly: desktop = logo · centered progress stepper · auth actions (guest: Sign in + Create account lime pill; user: name + Sign out pill); mobile = back button + "Checkout" title app bar. Wired in `PublicLayout` via `isCheckout` (renders CheckoutHeader instead of SiteHeader). CheckoutPage body now shows the stepper mobile-only (centered) and the H1/subtitle desktop-only (mobile title lives in the app bar).
- **User dropdown in SiteHeader** (`UserMenu`): signed-in user's name (ink pill + chevron) opens a menu → My account, My orders, Wishlist, **Admin dashboard (staff/admin only)**, Sign out (red). Uses `useLogoutMutation`. Verified: admin sees the dashboard link, customer does not.
- **Sign out is now reachable** from: the header dropdown (desktop), the checkout header (desktop), and the Account page (`ProfileForm` got a Sign out button — mobile users reach it via the bottom-nav Account tab). Previously sign-out existed nowhere in the UI.

## Next: Phase 8a — Order Placed + My Orders + Order Detail
Note: the current `OrderConfirmationPage` already renders correctly (green check, order#, StatusChip, tracker, items, address, summary, CTAs) but is still OLD styling — Phase 8a restyles it to the design + swaps DaisyUI `OrderStatusStepper` → custom `OrderTracker` (migrate the stepper test).

## Gotchas (unchanged)
- Never re-seed Settings. Backend :5001. `npm install` not `npm ci`. Playwright fullPage pins fixed/sticky elements (the mobile place-order bar overlaps content in captures) — artifact, not a bug.
