# Stokvel Manager

A web app that helps South African stokvels keep a trusted record of payments and payouts.
Design docs: [docs/design/](docs/design/).

| Folder | What it is |
| --- | --- |
| `server/` | The API: NestJS + Prisma, talking to a PostgreSQL database on [Neon](https://neon.tech) |
| `client/` | The website: React + TypeScript, built with Vite |
| `.github/workflows/ci.yml` | Checks lint, tests and build on every push |

## Run it locally

You need Node 22. You don't need Docker: the database lives on Neon.

**1. Server**

```bash
cd server
npm install
cp .env.example .env      # then paste your two Neon addresses into .env
npx prisma generate       # writes the database code from prisma/schema.prisma
npm run start:dev         # http://localhost:3000/api/v1/health
```

**2. Client** (in a second terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

The page should show **Server: ok** and **Database: up**.

## Checks

| Command (in `server/`) | What it checks |
| --- | --- |
| `npm test` | Unit tests (fake database, no Neon needed) |
| `npm run test:e2e` | End-to-end tests against your Neon **test** branch, set in `.env.test` (copy `.env.test.example`). They never use `.env` |
| `npm run lint` | Code style and common mistakes |
| `npm run build` | The TypeScript compiles |
