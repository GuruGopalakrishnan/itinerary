# Itinerary Studio

Create client itineraries fast by reusing a library of destination templates — paste a short day-by-day itinerary once per destination, then generate a new itinerary for any client in seconds by picking the destination, setting the trip duration, and entering the client's name.

## Stack

React (Vite) frontend + Node/Express backend + SQLite via `@libsql/client` (same as `leadmgt`, works locally as a file DB and on [Turso](https://turso.tech) in production).

## Getting started

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5175
- Backend API: http://localhost:4100

`npm run dev` starts both together. Use `npm run dev:web` / `npm run dev:server` to run them separately.

## How it works

1. **Templates** — add a destination once (name, route, default duration, day-by-day notes).
2. **New Itinerary** — pick a destination template, adjust the duration if needed, enter the client's name, and generate.
3. **Dashboard** — every itinerary is tracked by client, destination, duration, and status (Draft / Sent / Confirmed).

## Deployment

Not deployed yet. For a production database, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars (see `leadmgt` for the same pattern) — without them it falls back to a local SQLite file at `server/itinerary.db`.
