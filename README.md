# ROVE Hire

ROVE Hire is a Next.js internal recruitment tool for managing candidates from resume intake through candidate form submission. This implementation currently covers the HR dashboard and job-opening flows, with persistence moved behind a separate API service.

## Test HR Login

- Email: `hr@rovedashcam.com`
- Password: `rovehire`

## Tech Choices

The frontend uses Next.js App Router with server actions for form flows. The backend lives in `server/` as an Express API connected to Postgres via `pg`; Postgres is a good fit here because candidate, job, and timeline data are relational and need durable querying as the product grows.

Docker Compose runs three services: `web`, `server`, and `postgres`. For a free deployment path, use Render or Railway for the Dockerized web/API services and a free Neon or Supabase Postgres database, then set `DATABASE_URL` and `INTERNAL_API_URL` in the host environment.

## Run Locally

```bash
npm install
npm run dev
```

In another terminal, run the backend locally:

```bash
cd server
npm install
npm run dev
```

Or run the full stack with Docker:

```bash
docker compose up --build
```

The frontend expects the backend at `INTERNAL_API_URL`, defaulting to `http://localhost:4000/api`.
