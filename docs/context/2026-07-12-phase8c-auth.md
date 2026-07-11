# Phase 8c — Auth pages — done

Plan: `~/.claude/plans/read-design-handoff-diecastbd-storefront-swirling-snail.md`. Branch: **main**.
Continues from `2026-07-12-phase8b-account-wishlist.md`.

## What was built (vs `DiecastBD Sign In.dc.html` + `DiecastBD Create Account.dc.html`)
- **`features/auth/components/AuthShell.jsx`** — split-screen shell: brand panel + centered form column (`grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))]`, so it stacks brand-on-top on mobile). Two brand variants inline: **signin** (lime radial-gradient panel, "Your shelf, one sign-in away." + 3-perk checklist + "100% authentic · COD · bKash · BanglaQR"), **register** (dark ink panel, "JOIN THE COLLECTORS" kicker, "Serious metal. Serious shelf." + paragraph + HW Premium/MINI GT pills). Wordmark links home. Optional `back` link prop.
- **`features/auth/components/authParts.jsx`** — `authInputCls` (white bg, 12px radius), `AuthField` (label + optional action + error), `PasswordInput` (eye show/hide toggle), **`PasswordStrengthMeter`** (4 lime/gray segments; score = len≥8 + upper&lower + digit + (symbol|len≥12)), `AuthSubmit` (lime pill), `OrDivider`, `GoogleButton` ("G" wordmark + text).
- **LoginForm / RegisterForm / ForgotPasswordForm** rewritten to the design using AuthShell + authParts. **All Firebase mutation logic preserved verbatim** (`useLoginMutation`/`useRegisterMutation`/`useGoogleLoginMutation`/`useForgotPasswordMutation`, `redirect` param, `getAuthErrorMessage`). Forgot-password keeps its success state (mail-check icon + "Check your email").
- **`AuthLayout`** simplified to a scroll-reset + suspense boundary (each page renders its own full-screen AuthShell now).
- **Schema change**: removed **confirmPassword** from `registerSchema` + the register form — the design has no confirm field (relies on the eye toggle + strength meter). Register mutation already only sends `{name,email,password}`.

## Exit gate — guest-cart merge
Could NOT run a real E2E (headless Firebase login isn't practical). Instead verified the flow is **preserved**: `CartMergeOnLogin` (drains guest cart → `mergeCart` on the logged-out→logged-in transition) and all auth mutations are **untouched this phase** (only form presentation changed) — confirmed via `git status`. **Recommend a manual pass**: guest adds items → sign in → cart shows merged items.

## Verification
- Screenshots in `frontend/qa/phase8c/`: login-1440/390, register-1440 (strength meter = 3 bars for "Abcd1234"), forgot-1440 — all match. Mobile stacks the brand panel on top.
- Build clean, tests 17/17, lint clean.

## Next: Phase 9 — Static pages, PolicyLayout, admin wiring
Contact, FAQ (accordion), About; PolicyLayout + TLDRCard for the 4 flat policy routes (CMS Pages only — no hardcoded policy copy); admin: hero-variant select + highlightCard + banglaQrConfig fields, restock-alert count/list. Plus the dynamic-content backlog from the Phase-2 snapshot (announcement segments array, socialLinks.youtube, footer payment pills).
