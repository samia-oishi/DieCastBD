# 2026-09-20 — Transactional email: real Reply-To, and a logo in the header

## What was done

Commit `eec40d3`. Two changes to how the backend sends mail through Resend.

1. **No more no-reply.** All five Resend call sites (`adminNewOrder`, `contactMessage`,
   `orderConfirmation`, `orderConfirmed`, `restockAlert` — the task assumed three) now
   import from a new single source of truth, `backend/src/emails/sender.js`:
   `from: "DiecastBD <orders@diecastbd.com>"`, `replyTo: "diecastbd.official@gmail.com"`.
2. **Logo in the customer-facing templates**, served from the backend's own
   `public/email-logo.png` at `api.diecastbd.com`.

## Current state

- Working tree clean, committed on `main`, **not pushed** (user always pushes).
- Backend suite green: 289 tests, 25 files.
- `backend/public/email-logo.png` — 336×90 opaque RGB, from
  `frontend/src/assets/logo/diecastbdDark.png` (1152×168): the wordmark resized to
  144×21 and composited onto a `#0a0a0a` plate with 12px display padding (PIL).
  Displayed at 168×45.

## Gotchas worth keeping

- **`EMAIL_FROM` is gone on purpose.** `config/env.js` validated it with Zod `.email()`,
  which rejects the display-name form `Name <addr>` — so the correct sender was
  unsettable, and setting it would have failed the fail-fast boot. Removed from
  `env.js`, `.env.example` and `DEPLOYMENT.md`, with a comment where it was. A
  leftover `EMAIL_FROM` in the Vercel dashboard is now simply ignored.
- **`From` must stay on `diecastbd.com`.** The inbox is a Gmail one, but pointing
  `From` at it breaks DKIM/DMARC alignment against the verified root domain.
  `replyTo` is the only thing that should carry the Gmail address. Switch it to
  `hello@diecastbd.com` once that mailbox exists — `sender.js` carries the TODO.
- **`contactMessage.js` deliberately keeps its own dynamic `replyTo`** (the customer
  who wrote in). Do not flatten it into the shared constant.
- **`vercel.json` needs `config.includeFiles: ["public/**"]`.** `@vercel/node` bundles
  by static analysis and cannot see a runtime `express.static` path — without this the
  logo file is not in the lambda at all and the URL 404s.
- **`express.static` is mounted above the `connectDB` gate** in `app.js`, same reasoning
  as `/health`: the logo must render when Mongo is unreachable.
- **Sizing is arithmetic, not taste.** Master wordmark is 48:7, so "~120px wide" needs
  17.5px height; `width="120" height="18"` is a ~3% vertical stretch on a wordmark.
  The wordmark is 144×21. Width/height are HTML **attributes** — Outlook ignores CSS
  sizing and would draw the source at full size.
- **Gmail mobile dark mode inverts this template** — verified on a real phone: the
  white card renders dark and the `#0a0a0a` header cell renders WHITE. The wordmark is
  white-on-dark, so it would vanish. Fix: the plate is baked into the PNG, because Gmail
  recolours inline styles but NOT image pixels. `<meta name="color-scheme">` is not
  available — every template here is a bare fragment with no `<head>`. If someone later
  wraps these in a full HTML document, add that meta and the plate could be dropped.
- The **SPA-fallback trap applies to the storefront host, not this one**: any path on
  `diecastbd.com` returns the index.html shell with HTTP 200, so a 200 there proves
  nothing. `api.diecastbd.com` 404s unknown paths properly (verified locally).

## Unfinished / next session

- **The production logo URL cannot 200 until this deploys.** Until then the emailed
  `<img>` resolves to nothing and Gmail draws the alt text. After the user pushes:
  `curl -sI https://api.diecastbd.com/email-logo.png | grep -i content-type` must say
  `image/png` (if it says `text/html` or 404s, suspect `includeFiles`).
- Then open the test mail in Gmail and confirm the logo draws, is not stretched, and
  Reply addresses `diecastbd.official@gmail.com`.
- Test sends already made to `diecastbd.official@gmail.com` via the real code path
  (`sendOrderConfirmationEmail`): two, Resend id `01a0bff2-f14e-777c-ae25-09c514877d3a`.
  Both predate the deploy and predate the plate, so both show a broken-image
  placeholder. Re-send after deploying to confirm the logo actually draws.
- Optional cleanup: delete the now-ignored `EMAIL_FROM` from the Vercel dashboard.

## Notes

- Nothing was written to the live database — the test send read one real order with a
  single `findOne` and sent to the owner's own address.
- Two remaining repo matches for "noreply" are both correct: a dated historical entry in
  `docs/log.md` (rewriting it would falsify the chronological log), and a regression
  guard in `orderEmails.test.js` asserting the string is *absent*.
- Recorded as decision #103 in `docs/plan.md` §7 and an entry in `docs/log.md`.
hello