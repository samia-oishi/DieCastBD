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
- Primary color (lime) is a placeholder until the real logo lands in `src/assets/logo/` — swap `--primary` in `src/index.css` at that point
- shadcn/ui is the primary component layer; DaisyUI is scoped to Rating/Steps/Loading only (see Phase 0 architecture doc)

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
