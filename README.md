# Saga Health

A modern Health Savings Account (HSA) custodian app built with Expo React Native. Saga Health enables users to manage their HSA balance, contribute funds, invest in portfolios, submit medical receipts for reimbursement, and explore a health & wellness marketplace — all from a single mobile-first experience.

---

## Project Structure

```
sagahealth-custodian/
└── frontend/               # Expo React Native app + Express dev server
    ├── app/                # File-based routes (Expo Router)
    │   └── (tabs)/         # Bottom tab navigation screens
    ├── components/         # Shared UI components
    ├── constants/          # Theme colors, fonts, and constants
    ├── contexts/           # React context providers
    ├── lib/                # Utility functions and helpers
    ├── server/             # Express dev server (proxies & static serving)
    ├── shared/             # Shared types and database schema
    └── assets/             # Images, fonts, and icons
```

> **Note:** A dedicated backend service is planned but not yet implemented. The `server/` directory currently serves as a lightweight Express development proxy. API routes should be registered in `server/routes.ts` under the `/api` prefix when backend development begins.

---

## Frontend

The frontend is built with **Expo** (React Native) using file-based routing via **Expo Router v6**. It targets iOS, Android, and web.

### Tech Stack

| Category | Technology |
|---|---|
| Framework | Expo ~54 / React Native 0.81 |
| Routing | Expo Router v6 |
| State Management | TanStack React Query v5 |
| Animations | React Native Reanimated v4 |
| Maps | React Native Maps + Expo Location |
| Typography | DM Sans (Google Fonts) |
| Icons | @expo/vector-icons |
| Validation | Zod |
| Database ORM | Drizzle ORM (PostgreSQL) |
| Language | TypeScript |

### Key Screens

| Route | Description |
|---|---|
| `app/(tabs)/index.tsx` | Home dashboard — balance, contributions, recent activity |
| `app/(tabs)/investments.tsx` | Investment portfolio with allocation chart |
| `app/(tabs)/marketplace.tsx` | Health & wellness marketplace (products, apps, services) |
| `app/(tabs)/accounts.tsx` | Account management and receipt tracking |
| `app/onboarding.tsx` | 13-step onboarding flow |
| `app/nearby-services.tsx` | Map of nearby health & wellness providers |
| `app/trade.tsx` | Investment trade execution |
| `app/documents.tsx` | Document management |

### Design System

The app uses a forest green fintech theme inspired by the sage color palette:

- **Primary (Sage):** `#2E5E3F`
- **Background:** `#F4F9F2`
- **Accent:** `#D4A574`
- **Typography:** DM Sans (400, 500, 600, 700)

---

## Backend

> **Coming soon.** The backend service has not yet been implemented.

The `server/` directory contains a minimal Express server used during development for static file serving and proxying. When backend development begins:

- Register API routes in `frontend/server/routes.ts` under the `/api` prefix
- Database schema is defined in `frontend/shared/schema.ts` (Drizzle ORM + PostgreSQL)
- Run `npm run db:push` from `frontend/` to push the schema to your database

Planned backend responsibilities include:
- User authentication and session management
- HSA contribution and transaction tracking
- Receipt and reimbursement processing
- Investment account integration
- Marketplace data and provider services

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (installed automatically via `npx`)
- A PostgreSQL database (for schema/data features)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd sagahealth-custodian/frontend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Database (required for db:push and backend features)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Running Locally

Run the dev server and Expo simultaneously (two terminals):

```bash
# Terminal 1 — Express dev server (port 5000)
npm run server:dev

# Terminal 2 — Expo (port 8081)
npm start
```

Then press:
- `w` to open in a web browser
- `i` to open in iOS Simulator
- `a` to open in Android Emulator
- Scan the QR code with [Expo Go](https://expo.dev/go) to run on a physical device

### Production Build

```bash
# 1. Build the static Expo web bundle
npm run expo:static:build

# 2. Bundle the Express server
npm run server:build

# 3. Run the production server
npm run server:prod
```

### Database

```bash
# Push the Drizzle schema to your PostgreSQL database
npm run db:push
```

---

## Scripts Reference

| Script | Description |
|---|---|
| `npm start` | Start Expo development server |
| `npm run server:dev` | Start Express dev server (port 5000) |
| `npm run expo:static:build` | Build static Expo web bundle |
| `npm run server:build` | Bundle Express server with esbuild |
| `npm run server:prod` | Run bundled production server |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |

---

## Deployment

The project is configured for deployment on **Replit** (CloudRun target) and **Vercel**.

- Replit: workflows are defined in `.replit` — "Start App" runs the backend and frontend in parallel
- Vercel: configuration is in `frontend/vercel.json`
