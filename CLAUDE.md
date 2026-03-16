# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SagaHealth Custodian is an HSA (Health Savings Account) custodian app. It is a monorepo with:
- **`frontend/`** — Expo React Native app
- **`backend/`** — Python FastAPI app (in active development)

## Commands

### Frontend (`frontend/`)

```bash
python ../run_dev.py      # Start Expo (8081) + FastAPI (8000) concurrently
npm run dev               # Alias for the above (calls run_dev.py)
npm run api:dev           # Start FastAPI backend only (port 8000)
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix lint issues
npm run db:push           # Push Drizzle schema to PostgreSQL
```

Run a single lint check on a file:
```bash
npx eslint app/some-file.tsx
```

### Backend (`backend/`)

```bash
poetry install            # Install dependencies
poetry run uvicorn sagahealth_custodian_api.app:app --reload  # Run dev server
poetry run pytest         # Run all tests
poetry run pytest tests/test_foo.py  # Run a single test file
poetry run pytest -k "test_name"     # Run a single test by name
```

## Architecture

### Frontend

- **Routing**: Expo Router v6 (file-based). Routes live in `frontend/app/`. Tab screens are under `app/(tabs)/`.
- **State**: React Context (`frontend/contexts/HSAContext`) for global app state; TanStack React Query v5 for server data fetching.
- **Database**: Drizzle ORM with PostgreSQL. Schema is in `frontend/shared/schema.ts`. Requires `DATABASE_URL` env var.
- **Design system**: Forest green theme. Colors and typography constants in `frontend/constants/`.
- **Path aliases**: `@/*` → `frontend/*`, `@shared/*` → `frontend/shared/*`

### Backend

- **Framework**: FastAPI with Poetry.
- **Entry point**: `backend/sagahealth_custodian_api/app.py`
- **Tests**: pytest with `asyncio_mode = "auto"`. Use `httpx` for async HTTP client testing.

### Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `DATABASE_URL` | Frontend (Drizzle) | PostgreSQL connection string |

## Conventions

### Idempotency Keys

Idempotency keys for Lynx API requests **must be generated on the client (frontend)** and passed through to the backend. This ensures that if a network failure causes a retry, the same key is reused and the operation is not duplicated. Never generate idempotency keys on the backend, as a server-side retry or re-render would produce a new key and lose the idempotency guarantee.
