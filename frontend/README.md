# DiecastBD Frontend

React 19 + Vite storefront and admin panel for DiecastBD.

## Setup

```bash
npm install
cp .env.example .env   # then fill in real Firebase values
npm run dev
```

## Structure

- `src/app/` — router, root providers, layouts (Public, Auth, Admin)
- `src/features/` — one folder per business domain (auth, products, cart, checkout, admin/*, ...), each owning its own components/hooks/api/schemas
- `src/components/ui/` — shadcn-generated primitives (Radix + Tailwind)
- `src/components/shared/` — cross-feature composed components
- `src/stores/` — Zustand (client-only state: cart, auth session, UI)
- `src/lib/` — axios instance, TanStack Query client, Firebase client init
- `src/assets/logo/` — brand logo goes here

## Design system

- Dark theme is fixed brand identity, not a toggle — all tokens live in `src/index.css` (`:root`), no light-mode variant
- Primary color is the brand lime (`--primary` in `src/index.css`); the logo lives in `src/assets/logo/`
- shadcn/ui is the primary component layer; DaisyUI is scoped to Rating/Steps/Loading only (see Phase 0 architecture doc)
- Routes are code-split (`React.lazy`) so storefront visitors never download admin code

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm test` — run the Vitest suite (jsdom + React Testing Library); `npm run test:watch` for watch mode

## Deployment

See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the full runbook (Vercel setup, env
vars, and the committed `vercel.json` for SPA fallback / sitemap proxy / COOP header).
