# 2026-07-11 — Storefront redesign v2 (Phase 0 complete)
vbhghgk
Full plan: `/Users/niaz/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`.
Rebuilding the light "paper" storefront **from scratch** (not reusing the reverted `storefront-redesign` frontend), governed by `design_handoff_diecastbd_storefront/` (.dc.html = pixel source of truth). Mobile-first, pixel-perfect, hard stop after each page for user review.

## Branch & commits
- Working branch: **`storefront-redesign-v2`** (off `main` 929085a).
- `59af2f4` chore: design handoff bundle + CLAUDE.md + docs/context.
- `47447a3` restore: backend restock-alert + banglaqr + hero settings (16 files, zero drift from `storefront-redesign`).
- Phase 0 tooling commit: scripts + radio-group + playwright devDep (pending).

## Phase 0 results (backend restore verified)
- Backend boots on **:5001** (AirPlay owns 5000). Frontend :5173.
- Restock-alert endpoint works: `POST /products/:id/restock-alert` → 201 new + 201 idempotent duplicate. `{product,contact}` unique index already correct — **no syncIndexes needed**.
- `Settings.hero.variant` set to **`lime-showroom`** (user's chosen default) via direct DB update.
- `bkashConfig` has REAL admin data (merchant 01764250814 + QR image) — keep.
- `banglaQrConfig` is undefined (unconfigured — admin sets in Phase 9; expected, no-fabrication pattern).
- ⚠️ **`hero.highlightCard` holds leftover TEST data**: kicker "MINI GT", title "ROXY GT 991 PORSCHE", price 200, enabled:true. It WILL render on lime-showroom. Flagged to user — not deleted (admin content). Decide in Phase 4/9.
- `autoplayInterval` is 3 (leftover, irrelevant now that carousel hero is dropped).

## Tooling added (frontend/)
- `scripts/visual-compare.mjs` — Playwright: built-390/1440 + ref-390/1440 + 320px overflow check → `frontend/qa/<phase>/`. Reference via `file://` (encoded spaces). VALIDATED: reference .dc.html renders fully through chromium (support.js runtime works, glass blur renders).
- `scripts/interaction-smoke.mjs` — 390px: bottom-nav nav, filter sheet, embla advance, sticky-bar/bottom-nav presence. Uses data-testids (`mobile-bottom-nav`, `data-embla-next`, `data-embla-track`) that Phase 2+ components must set.
- `playwright` devDep + chromium installed. `qa/` gitignored.
- `components/ui/radio-group.jsx` added (unified `radix-ui` import, for checkout cards).

## Next: Phase 1 — tokens/fonts/theme split
- Capture admin baseline screenshots BEFORE editing index.css (admin regression is risk #1).
- `:root` = README light tokens; `[data-theme="diecastbd-admin"]` = current dark values (incl. Geist); AdminLayout sets the attribute. Two DaisyUI themes.
- Fonts: `@fontsource/archivo` + `@fontsource/instrument-sans` (self-hosted). Geist stays for admin.
- Exit gate: admin before/after screenshots identical. Storefront will look half-broken (expected).

## Gotchas
- Never re-seed Settings (wipes real admin data — bkashConfig, hero choices).
- Interaction-smoke expects data-testids that don't exist until Phase 2 builds the shell.
- Lockfile has known drift (npm install churn); use `npm install` not `npm ci`.
