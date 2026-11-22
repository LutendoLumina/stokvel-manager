# US-00 Walking skeleton

## The problem

Before building features, we needed proof that every part of the app is connected: website → server → database. A "walking skeleton" is the thinnest app that runs from end to end. It's like a house frame with the water and electricity connected before any rooms are built. If something is wired wrong, we find out now, not in the middle of US-06.

## The characters

- **`server/src/main.ts`**: the front door. Starts the server, loads `.env`, and puts every route under `/api/v1`.
- **`server/src/app.setup.ts`**: the shared settings (like the `/api/v1` prefix), so the tests run the app exactly like the real thing.
- **`server/src/app.module.ts`**: the table of contents. Lists every feature module in the app.
- **`server/src/prisma/prisma.service.ts`**: the one phone line to the database. Everyone shares it.
- **`server/src/health/health.controller.ts`**: answers `GET /api/v1/health`.
- **`server/prisma/schema.prisma`**: the map of the database. It's empty for now; tables arrive story by story.
- **`server/prisma.config.ts`**: tells the Prisma command-line tool where the database is.
- **`server/.env`**: your Neon passwords. Lives only on your laptop, never in git.
- **`server/.env.test`** + **`server/test/setup-e2e.ts`**: the e2e tests' own database (your Neon `test` branch). The setup file refuses to run if the tests would hit your dev database.
- **`client/src/App.tsx`**: the page that asks the server "are you healthy?" and shows the answer.
- **`client/vite.config.ts`**: the "proxy", a forwarding address that sends `/api` requests to the server.
- **`.github/workflows/ci.yml`**: the robot that checks every push on GitHub's computers.

## What happens, step by step

Thandi opens the app in her browser.

1. The browser loads the page from Vite (`client/`), and **`App.tsx`** runs. Its `useEffect` calls `fetch('/api/v1/health')`.
2. Vite sees the request starts with `/api`. **`vite.config.ts`** forwards it to `http://localhost:3000`.
3. NestJS (started by **`main.ts`**) receives `GET /api/v1/health`. The `api/v1` part comes from **`app.setup.ts`**, and `health` matches **`HealthController`**.
4. The controller asks **`PrismaService`** to run `SELECT 1`, the smallest question you can ask a database.
5. `PrismaService` sends it to Neon, using the `DATABASE_URL` from **`.env`**.
6. Neon answers, so the controller returns `{ "status": "ok", "database": "up" }`.
7. **`App.tsx`** gets a 200 and shows **Server: ok, Database: up**.

## Tools we used and why

- **NestJS**: a framework that organises the server into modules, controllers and services. Without it, we'd hand-wire every route and object ourselves.
- **Prisma + `@prisma/adapter-pg`**: Prisma turns TypeScript calls into SQL and keeps a history of database changes ("migrations"). The adapter is the driver that actually talks to Postgres; Prisma 7 requires one. Without them, we'd write raw SQL strings and track changes by hand.
- **Neon**: Postgres in the cloud. Without it, we'd install Postgres or run Docker on your laptop.
- **Vite + React**: Vite serves the page and reloads it instantly when you save. React builds the screen from components. Without them, we'd update the HTML by hand.
- **Vitest + Supertest**: Vitest runs our tests. Supertest sends pretend HTTP requests to the app. Without them, we'd test by clicking around and hoping.
- **GitHub Actions**: runs our checks on every push, using a throwaway Postgres on GitHub's machine. Without it, broken code could land on `main` unnoticed.
- **`process.loadEnvFile`**: built into Node 22, so we didn't need the `dotenv` library.

## What could go wrong

- **Wrong Neon password or no `.env`:** the database check fails. The server still starts, but `/health` returns **503** in our standard error shape, and the page shows **Database: down**.
- **Neon is slow or unreachable:** we give up after 5 seconds (`connectionTimeoutMillis`) instead of hanging forever.
- **The server isn't running:** `fetch` fails, and the page shows **Server: not reachable**.
- **Tests wiping your dev data:** e2e tests read only `.env.test`. If it's missing, or holds the same address as `.env`, `setup-e2e.ts` stops the tests with a clear message.
- **Leaking the password:** `.env` is in `.gitignore`. We commit `.env.example` (fake values) instead.
- **Forgetting `npx prisma generate`:** the server won't compile, because the Prisma code doesn't exist yet. The README and CI both run it.

## Interview questions

1. **What is a walking skeleton and why build one first?**
   The smallest version of the app that touches every layer: UI, API, database and CI. It finds setup and wiring problems early, while they're cheap to fix.
2. **Why does your health check query the database instead of just returning "ok"?**
   A server can be running but unable to reach its database. Asking `SELECT 1` proves the whole chain works, so monitoring tools learn about real outages.
3. **Why two Neon URLs, pooled and direct?**
   The pooled one lets many requests share a few connections, which suits the running app. Migrations need a single direct connection, so the Prisma CLI uses `DIRECT_URL`.

## Quiz me

1. If you delete `configureApp(app)` from `main.ts`, what URL would the health check move to, and which test would catch it?
2. Why does the unit test pass without any database, while the e2e test needs one?
3. Where does CI get its database from, and why don't we give it your Neon address?
