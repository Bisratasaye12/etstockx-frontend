# EtStockX Frontend

Web client for **EtStockX**, a digital stock exchange and brokerage platform focused on pre-trade coordination and ECMA-aligned workflows. This repository implements the investor, broker, and administrator experiences against the EtStockX ASP.NET Core API.

## Overview

The application is a production-oriented [Next.js](https://nextjs.org/) 15 project using the App Router, TypeScript, and a Feature-Sliced Design–inspired layout. It integrates **Auth.js (NextAuth v5)** with the backend’s JWT IAM endpoints, **TanStack Query** for server state, and **next-intl** for English and Amharic.

For a deeper view of folders, auth flow, and API integration, see **[Architecture](docs/ARCHITECTURE.md)**.

## Features

- User registration, email verification, and credential login (including MFA-ready login payload)
- Role-aware navigation and route protection (Client, Broker/Dealer, Admin)
- Client profile completion, investor activation flow, watchlist management, broker directory
- Broker profile editing and admin broker verification queue (where the API exposes it)
- Localized UI (`/en`, `/am`) with a locale switcher
- API proxy path in development (`/api/backend/*` → EtStockX API) plus optional backend CORS

## Requirements

- **Node.js** ≥ 20.9 (aligned with Next.js 15 and Tailwind CSS 4)
- **npm** 10+ (or compatible package manager)
- Running **EtStockX-Backend** (sibling API repository) or a compatible deployment for full auth and profile flows

## Getting started

### 1. Install dependencies

```bash
npm ci
```

### 2. Environment variables

Copy the example file and fill in secrets:

```bash
cp .env.example .env.local
```

| Variable                          | Purpose                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| `API_URL`                         | Base URL for server-side calls (NextAuth, refresh route). Default: `http://localhost:5163` |
| `NEXT_PUBLIC_API_URL`             | Browser Axios base URL. Default: `/api/backend` (same-origin rewrite to `API_URL`)         |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Auth.js encryption secret (e.g. `openssl rand -base64 32`)                                 |
| `NEXTAUTH_URL`                    | Public site URL (e.g. `http://localhost:3000` in dev)                                      |

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you will be redirected to a locale such as `/en`.

### 4. Point at the API

Ensure the backend is running (default HTTP port **5163** in development). If you change ports, update `API_URL` and keep `next.config.ts` rewrites consistent.

## Scripts

| Command                      | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `npm run dev`                | Dev server (Turbopack)                         |
| `npm run build`              | Production build                               |
| `npm run start`              | Start production server                        |
| `npm run lint`               | ESLint (zero warnings)                         |
| `npm run format`             | Prettier write                                 |
| `npm run format:check`       | Prettier check                                 |
| `npm test`                   | Jest unit tests                                |
| `npm run test:e2e`           | Playwright tests                               |
| `npm run openapi`            | Regenerate OpenAPI types (API must be running) |
| `ANALYZE=true npm run build` | Bundle analyzer (when configured)              |

## Project structure (summary)

- `src/app/` — Routes, layouts, API routes for auth
- `src/features/` — Auth, profiles, admin, and placeholder slices for trade/market/messaging
- `src/shared/` — UI kit, API client, i18n, providers, Redux store
- `src/entities/` — Domain type stubs and re-exports
- `e2e/` — Playwright specs
- `docs/ARCHITECTURE.md` — Full architecture description

## Continuous integration

GitHub Actions (see `.github/workflows/ci.yml`) runs lint, format check, unit tests, production build, and Playwright smoke tests. CI sets `AUTH_SECRET` / `NEXTAUTH_SECRET` for deterministic builds and E2E.

## Contributing

1. Create a branch from `main` (or your team’s integration branch).
2. Keep changes focused; match existing patterns in `features/` and `shared/`.
3. Run `npm run lint`, `npm run format:check`, and `npm test` before opening a PR.
4. Pre-commit hooks (Husky + lint-staged) run ESLint and Prettier on staged files.

## License

This project is developed as part of an academic capstone. All rights reserved unless otherwise stated by the authors.

For testing branch ruleset
