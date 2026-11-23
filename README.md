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
cp .env.example .env      # then paste your Neon dev addresses + a JWT_SECRET into .env
cp .env.test.example .env.test   # same for your Neon test branch
npx prisma generate       # writes the database code from prisma/schema.prisma
npx prisma migrate deploy # creates the tables on your dev branch
npm run db:migrate:test   # ...and on your test branch
npm run start:dev         # http://localhost:3000/api/v1/health
```

**2. Client** (in a second terminal)

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, create an account, and you land on **My stokvels**.

**Changing the database:** edit `prisma/schema.prisma`, then run
`npx prisma migrate dev --name <what-changed>` (dev branch) and `npm run db:migrate:test` (test branch).

## Checks

| Command (in `server/`) | What it checks |
| --- | --- |
| `npm test` | Unit tests (fake database, no Neon needed) |
| `npm run test:e2e` | End-to-end tests against your Neon **test** branch, set in `.env.test` (copy `.env.test.example`). They never use `.env` |
| `npm run lint` | Code style and common mistakes |
| `npm run build` | The TypeScript compiles |
