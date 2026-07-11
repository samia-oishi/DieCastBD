# Phase 8b — Account + Wishlist — done

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`. Branch: **main**.
Continues from `2026-07-12-phase8a-orders.md`.

## Wishlist (`DiecastBD Wishlist.dc.html`)
- **`features/wishlist/components/WishlistCard.jsx`** (new) — the design's wishlist card variant: lime-filled **heart** (removes via `useToggleWishlistMutation`), NEW/SALE badges, sold-out overlay, and a **text action button** — ink "Add to cart" (`useAddToCart`) or outline "Notify me" (RestockAlertDialog). Desktop = price + button inline; mobile = price then full-width button. (Distinct from the shop `ProductCard`, which uses a white heart + icon-only add button.)
- **`WishlistPage.jsx`** rewritten: "My wishlist" H1 + "N pieces on your radar…" subtitle, responsive grid (desktop `minmax(250px,1fr)` / mobile 2-col), desktop hint line ("Tap the heart to remove…"), skeleton + empty state.

## Account (`DiecastBD Account.dc.html`)
- **`AccountPage.jsx`** fully rewritten (was just `<ProfileForm/>`). Desktop = profile card (initials avatar, name, email·phone, "Collector since {Mon YYYY}" from `createdAt`) + hub grid (Recent order → order detail, Wishlist → /wishlist, Addresses, Account details, Help dark card) + delete-account strip. Mobile = profile row + recent-order strip + two menu-list cards (My orders / Wishlist(count) / Addresses / Account details ; Help&FAQ / Contact / Policies) + Sign out pill + Delete account.
- Interactions wired: **Edit account details** (Dialog → name/phone via `useUpdateProfileMutation`), **Add/Edit address** (Dialog → `AddressForm`, which now takes `defaultValues` + `submitLabel` for edit via `useCreate/UpdateAddressMutation`), **Delete account** (AlertDialog → `useDeactivateAccountMutation`), **Sign out** (`useLogoutMutation`).
- Deleted the now-orphaned `features/account/components/ProfileForm.jsx`.

## Deviations (no-fabrication rule)
- **Notifications toggles OMITTED** — the design shows "The drop list" / "Order updates by SMS" switches, but the backend `User` model has **no notification-preference fields**, so a toggle couldn't persist. Left out rather than faking it. (Add `User.notificationPrefs` + settings if this is wanted — then restore the card.)
- **"Sign-in: Google account"** row replaced with **Phone** — the `User` model stores no auth-provider field.
- Header/footer: normal storefront `SiteHeader` + slim footer (not the design's slim "Shop / My orders / Wishlist" nav). Consistent with the rest.
- "Collector since" uses `user.createdAt`; addresses treat the **first** address as default (no `isDefault` field on the schema).

## Verification
- Screenshots in `frontend/qa/phase8b/`: account-1440/390, wishlist-1440/390 — all match. Captured via stubbed `/auth/me` + `/orders` + `/wishlist` + `/addresses`.
- Build clean, tests 17/17, lint clean.

## Next: Phase 8c — Auth pages (Sign In / Create Account)
`AuthLayout` split-screen brand panel; `LoginPage`, `RegisterPage` (+ PasswordStrengthMeter), `ForgotPasswordPage`. Firebase logic + `CartMergeOnLogin` untouched; **exit gate = guest-cart → login → merged-cart verification**. Designs: `DiecastBD Sign In.dc.html`, `DiecastBD Create Account.dc.html`.
