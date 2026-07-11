# Phase 10 — Full QA pass — DONE. Storefront redesign v2 COMPLETE.

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`. Branch: **main**.
Final phase of the storefront redesign. All 11 phases (0–10) shipped + committed.

## QA results
- **Both apps green**: frontend 17/17, backend 35/35, both builds clean, lint warnings-only (no errors).
- **Admin dark-theme regression**: `scripts/verify-theme-split.mjs` **PASS** — admin tokens byte-identical, storefront `:root` light values correct, fonts split (Archivo storefront / Geist admin).
- **320px overflow sweep** across all storefront routes: all OK after fixing the two that failed.
- **Order-placement regression**: fresh buy-now guest+COD → landed on confirmation (cleaned up the test order + released stock afterward).
- **Fabricated-content audit**: no hardcoded testimonials/reviews/lorem in the storefront.
- **Inline-currency audit**: storefront uses `formatTaka` (en-IN); the only inline `৳`+`toLocaleString` left is in `admin/*` (its own en-US convention, separate surface) — acceptable.

## Fixes made in Phase 10
- **Auth 320px overflow** (`AuthShell`): grid used `minmax(360px,1fr)` → overflowed at 320 on login/register (brand panel is `hidden md:flex`). Changed to `grid-cols-1 md:grid-cols-2`. (commit `c21647e`)
- **Deleted dead `checkout/components/OrderSummary.jsx`** (unused; checkout uses `CheckoutSummary`).

## Docs finalized
- `docs/plan.md` §7: decisions **42–49** (theme split, radius-scale gotcha, OrderTracker, design-copy-vs-CMS-policies, Radix Select key fix, contact email-or-phone, Page.tldr/youtube, checkout/auth shells) + "Storefront redesign v2: complete" summary.
- `docs/log.md`: appended the full "Storefront Redesign v2 (Phases 0–10)" narrative (what shipped, exit gates, 5 real bugs found+fixed, backend touched).
- `CLAUDE.md`: updated the stale "main is the reverted dark storefront" note → main is now the light redesign v2; admin stays dark; radius-scale gotcha called out.

## Standing gotchas (carry forward)
- **Radius**: `index.css` inflates named `rounded-*` (`rounded-3xl`=26.4px) — use explicit `rounded-[Npx]` for storefront design radii; named utilities are for shadcn primitives.
- **Lucide brand icons** (Facebook/Instagram/Youtube) don't exist in this version — use `components/shared/SocialIcons`.
- **Never re-seed `Settings`** (wipes real admin data incl. bkashConfig merchant 01764250814) — use direct DB `$set`.
- Backend on **:5001** (AirPlay owns 5000). `npm install`, not `npm ci`.
- Playwright fullPage pins sticky/fixed bars to the first viewport (capture artifact).

## Open / recommended (not blockers)
- A real **logged-in Firebase E2E** pass on auth + guest-cart merge (only stub-verified headless).
- The 4 policy pages are seeded with the design's copy — **merchant should replace with genuine legal text** (editable via Admin → Pages).
- One manual **logged-in bKash order** (only guest+bKash was exit-gate-verified; the logged-in path shares the same mutation).
- Deferred admin editability: announcement-bar segments array, footer payment pills (storefront works via hardcoded fallbacks).
- Deploy is still the only remaining pre-existing task (see `docs/DEPLOYMENT.md`).
