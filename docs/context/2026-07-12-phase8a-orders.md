# Phase 8a — Order Placed + My Orders + Order Detail — done

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`. Branch: **main**.
Continues from `2026-07-12-phase7b-checkout.md` (checkout + project-wide radius audit done).

## What was built (vs `DiecastBD Order Placed.dc.html` + `DiecastBD My Orders.dc.html`)
- **`components/shared/OrderTracker.jsx`** — custom Tailwind fulfillment tracker, **replaces the DaisyUI `OrderStatusStepper`** (deleted). 5 steps (Pending→Confirmed→Packed→Shipped→Delivered); steps ≤ current are lime + checked, rest hollow rings, connector lines gray (matches the design — no lime progress line). Terminal states (cancelled/refunded) → danger banner. Responsive 20px (mobile) / 26px (desktop) circles. Migrated `OrderStatusStepper.test.jsx` → **`OrderTracker.test.jsx`** (same 5 cases; done-count via `[data-done="true"]`). Test count unchanged (17/17).
- **`features/orders/components/OrderReceipt.jsx`** — rewritten to the design: order-head card (number + date·payment + StatusChip + OrderTracker) then a grid — Items card + Address card (pin icon, zone name) on the left, Summary card on the right (desktop) / inline total + stacked buttons (mobile). Shared by confirmation + detail so they never drift.
- **`OrderConfirmationPage.jsx`** — success header ("Order placed — nice pick." + lime check) + OrderReceipt. Still guest-safe (router-state order, no fetch). Exports `OrderSuccessHeader`.
- **`OrderDetailPage.jsx`** — OrderReceipt minus the success header, with a "← My orders" back link. (No design file exists for detail; reuses Order Placed sections per plan.)
- **`OrdersPage.jsx`** — "My orders" H1 + subtitle, filter chips (All/Active/Delivered/Cancelled), order cards. Desktop = row (number+chip · date·items — names · total · chevron → detail). Mobile = card with contextual footer CTA: **Track order** (active) / **Buy again** (delivered → `addItem` per line + toast) / **Details** (cancelled/refunded). Empty state + skeletons.
- **`StatusChip`** (from Phase 3) reused everywhere; **`OrderStatusBadge` deleted**. Admin order pages (`features/admin/orders/OrderDetailPage.jsx` + `OrdersPage.jsx`) updated to use `OrderTracker` + `StatusChip` (they rendered fine in the dark admin theme; full admin restyle is still Phase 9).

## Deviations / notes (flag to user)
- **Header**: these pages keep the normal storefront `SiteHeader` (with the new user dropdown), not the design's slimmed "Shop / My orders" nav. Consistent + functional; not a dedicated header like checkout.
- **Address "estimated delivery" date**: the design shows "Inside Dhaka · estimated delivery Jul 12–13". We show the **zone name** (derived by matching `order.shippingFee` → `settings.shippingZones[].fee`) but **not a fabricated delivery-date range** (no-fabrication rule; we don't store/compute an ETA date). Zone name renders correctly ("Inside Dhaka").
- **Item brand**: design shows "MINI GT · Qty 1"; order items don't store brand, so we show "Qty N" only.
- **Buy again** is mobile-only (matches the design — desktop rows just have the chevron → detail).

## Verification
- Screenshots in `frontend/qa/phase8a/`: confirm-1440/390, orders-1440/390, detail-1440 — all match the design (tracker, chips, contextual CTAs, summary). Confirmation captured via a **real buy-now order** (৳3,260, landed correctly); orders/detail via stubbed `/auth/me` + `/orders`.
- Build clean (~467KB), tests 17/17, lint clean.

## Next: Phase 8b — Account + Wishlist
`AccountPage` (desktop hub grid / mobile app-style menu), address components, `WishlistPage` (ProductCard grid, filled lime hearts, Add to cart / Notify me, empty state). Note: ProfileForm already got a Sign out button in the Phase 7b header work.
