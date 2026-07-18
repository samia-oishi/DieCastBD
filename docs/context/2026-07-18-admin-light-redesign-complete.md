# 2026-07-18 — Admin light redesign complete (Phases 0–12)

## What was done

All 12 admin screens rebuilt from `design_handoff_admin_light_redesign/` and shipped to `main`, one commit per screen. The admin is now light (shares the storefront `:root` palette + Archivo/Instrument Sans); the dark theme is **deleted**, not toggled off.

Commits this session (newest last):
- `aae4287` phase 8 — Coupons (copy button, live preview)
- `a73c115` phase 9 — Newsletter + Reports (+ `DELETE /admin/newsletter/subscribers/:id`)
- `3ef94b8` phase 10 — Pages block builder (UI-only)
- `9dcf88c` phase 11 — Settings (sticky sub-nav rail)
- phase 12 — cleanup, QA sweep, docs (this commit)

Docs updated: `docs/plan.md` §7 decisions **#82–88** + "Admin light redesign: complete"; `docs/log.md` full phase-by-phase entry; `docs/style-guide.md` §9 rewritten (was "Admin dashboard (dark) tokens", now light, with the shell component list and the table/grid rules).

## Repo / server state

- Branch `main`, all work committed. **Not pushed** — merchant pushes.
- Backend `:5001` (AirPlay owns 5000), frontend `:5173`, both running via `npm run dev`.
- Tests: backend **83/83**, frontend **41/41**, lint clean, both builds clean.
- `@fontsource-variable/geist` removed from `frontend/package.json`.
- QA sweep: all 12 screens × 1440/390/320 — h1 present, zero console errors, no horizontal overflow.

## Pages blocks — DONE (was the "next task", completed same session)

Blocks now persist and render end to end. `blocks[]` on the Page model + Zod discriminated union (`backend/src/modules/pages/page.blocks.js`), admin form wiring, `BlockRenderer` on the storefront, merchant pages at `/<slug>`. Image and carousel-slide blocks upload to Cloudinary via the existing `POST /admin/settings/upload-image`. See `docs/plan.md` #89.

**Known gap, flagged not filled: there is no DELETE route for pages.** The admin can create pages but never remove them — test pages had to be deleted straight from the database. This is the obvious next piece of work (route + controller + validation + confirm dialog in the admin list, mirroring the coupon delete pattern).

## Gotchas carried forward

- **Admin auth is cookie-based** (`req.cookies.accessToken`), NOT a Bearer header — curl needs `-H "Cookie: accessToken=$TOKEN"`. Tokens are 15-min; mint with `signAccessToken` from `backend/src/utils/jwt.js` (module is `jwt.js`, user model is `modules/users/`, both easy to guess wrong).
- **API rate limiter is 15 min/window** — a full Playwright sweep can trip it, and the app surfaces a 429 as a redirect to Sign in. Looks exactly like an expired token; check `curl -o /dev/null -w '%{http_code}'` before debugging auth.
- **`1fr` implies `min-width:auto`** — `grid-cols-[auto_1fr]` rows would not shrink and pushed mobile cards past the viewport. Use `minmax(0,1fr)`. Table `min-w-[Npx]` must be scoped `md:` or it forces mobile to scroll instead of using the stacked row.
- **Build passing ≠ page working.** A dropped import is a runtime ReferenceError with a clean build. Load the page.
- **RHF `values` prop + `isDirty`**: after a successful save `isDirty` stays true with an empty `dirtyFields`. Drive save bars from `dirtyFields`.
- shadcn specificity: `Select` has `data-[size=default]:h-8`; `DialogContent` caps width at base *and* `sm:`. tailwind-merge only dedupes within a variant.
- Settings PATCH replaces whole subtrees — every field must exist in `defaultValues` or it is deleted on save. Never re-seed Settings.

## Still outstanding (unchanged, pre-existing)

Production DB migrations to run at deploy time: announcement-bar `$set` (new shape) and hero `$set hero.image` / `$unset heroBanner` + autoplay fields.
