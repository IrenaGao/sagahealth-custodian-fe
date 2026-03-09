# Saga Health

A modern Health Savings Account (HSA) custodian app built with Expo React Native. Saga Health enables users to manage their HSA balance, contribute funds, invest in portfolios, submit medical receipts for reimbursement, and explore a health & wellness marketplace — all from a single mobile-first experience.

---

## Project Structure

```
sagahealth-custodian/
├── frontend/               # Expo React Native app + Express dev server
│   ├── app/                # File-based routes (Expo Router)
│   │   └── (tabs)/         # Bottom tab navigation screens
│   ├── components/         # Shared UI components
│   ├── constants/          # Theme colors, fonts, and constants
│   ├── contexts/           # React context providers
│   ├── lib/                # Utility functions and helpers
│   ├── server/             # Express dev server (proxies & static serving)
│   ├── shared/             # Shared types and database schema
│   └── assets/             # Images, fonts, and icons
└── backend/                # FastAPI service (Lynx API integration)
```

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

The backend is a **FastAPI** (Python) service located in `backend/`. It handles all communication with the [Lynx API](https://docs.lynx-fh.com/reference/introduction). The Express server in `frontend/server/` proxies Lynx-related requests to this service.

### Prerequisites

- [Python](https://www.python.org/) 3.11+
- [Poetry](https://python-poetry.org/)

### Setup

```bash
cd backend
poetry install
```

### Running

```bash
# From frontend/ — starts Express (port 5000) + FastAPI (port 8000) together
npm run dev

# Or start FastAPI alone
npm run api:dev
```

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

```bash
npm run dev
```

This starts all three services concurrently:
- **Expo** dev server (port 8081)
- **Express** dev server (port 5000)
- **FastAPI** backend (port 8000)

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
| `npm run dev` | Start Expo (8081) + Express (5000) + FastAPI (8000) concurrently |
| `npm run server:dev` | Start Express dev server only (port 5000) |
| `npm run api:dev` | Start FastAPI backend only (port 8000) |
| `npm run expo:static:build` | Build static Expo web bundle |
| `npm run server:build` | Bundle Express server with esbuild |
| `npm run server:prod` | Run bundled production server |
| `npm run db:push` | Push Drizzle schema to database |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |

---

## Deployment

The project is configured for deployment on **Vercel**.

- Vercel: configuration is in `frontend/vercel.json`
