# 2026-07-11 — Redesign rollback + fresh machine setup

## What happened this session

1. **CLAUDE.md created** (repo root, currently untracked/uncommitted) — describes the restored dark-theme state.
2. **Storefront redesign fully reverted on `main`.** The light "paper" redesign (design handoff package + Phases 1–5 + backend prep, commits `f97b280`..`610fe1e`) was reverted in a single commit **`929085a`** ("Revert storefront redesign to pre-handoff dark theme"), restoring the tree to `0e57176` (last dark commit, System 11). Done with `git read-tree -u --reset`, not a force-push — history intact.
   - Backup branch **`storefront-redesign`** points at the old tip `610fe1e`. To bring the redesign back: `git revert 929085a` or merge that branch.
   - **`main` is 1 commit ahead of `origin/main` — the revert has NOT been pushed yet.**
   - Reverted along with the visuals: BanglaQR payment method, RestockAlert module, hero variant/highlight-card settings, `design_handoff_diecastbd_storefront/` folder (all recoverable from history).
   - Leftover DB fields from the redesign era (Settings.banglaQrConfig, hero.variant/highlightCard, `restockalerts` collection) are ignored by the restored schemas — harmless, no migration needed.
3. **Fresh checkout was set up to run** (node_modules and .env files were missing):
   - `npm install` run in both apps (`npm ci` fails — lockfiles are slightly out of sync with npm's resolver over two optional `@emnapi/*` deps; pre-existing, not rollback-related; use `npm install`).
   - `frontend/.env` and `backend/.env` created from values the user supplied (gitignored). Real credentials: Atlas, Firebase client + Admin SDK (project `diecastauth`), Cloudinary, Resend. `ADMIN_EMAILS=diecastbd.official@gmail.com`.
   - **Backend runs on PORT=5001, not 5000** — macOS AirPlay Receiver (ControlCenter) listens on 5000 on this machine and intercepts requests with an empty 403. `frontend/.env` `VITE_API_BASE_URL` points at 5001 accordingly. To use 5000 again: disable AirPlay Receiver in System Settings → General → AirDrop & Handoff.

## Verified

- Backend tests 35/35, frontend tests 11/11, `vite build` clean at the rolled-back state.
- Both dev servers run; `GET /api/v1/settings` and `/products` return 200 with the real seeded Atlas data (no re-seed needed).

## Open items / next steps

- Push `main` (revert commit `929085a`) and optionally the `storefront-redesign` branch to GitHub — awaiting user go-ahead.
- CLAUDE.md is still untracked — commit when the user wants.
- Pre-existing project open items: real policy-page copy (Pages seeded empty), bKash live gateway (deferred), production deploy (docs/DEPLOYMENT.md).
