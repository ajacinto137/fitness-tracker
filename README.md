# Fitness Tracker

A clean, mobile-first web app for tracking **body weight** and **strength training**. Built with Next.js, TypeScript, PostgreSQL, and Prisma, and designed to run locally in Docker with a straightforward path to production.

Two things this app is for:

- **Weight** — log your body weight daily, see your trend (with a 7-day moving average) and recent entries.
- **Lifting** — build an exercise library, create routines, run fast workouts with "previous performance" always visible, and track progression (heaviest weight, estimated 1RM, volume) per exercise.

Nothing else. No calorie tracking, no social features, no cardio.

---

## 1. Architecture

- **Framework:** Next.js 16 (App Router), TypeScript in strict mode, React 19.
- **Database:** PostgreSQL 16, accessed through Prisma ORM with a fully relational schema (no JSON blobs for workout data).
- **Auth:** NextAuth (Auth.js) v5 with the Credentials provider, bcrypt password hashing, JWT sessions. Route protection is enforced in `src/proxy.ts` (Next's routing middleware) for both pages and API routes.
- **Styling:** Tailwind CSS v4, a small dark-charcoal design system (see `src/app/globals.css`), `lucide-react` icons.
- **Charts:** Recharts, wrapped in a shared `ProgressChart` component used by both the Weight trend chart and the per-exercise progression chart.
- **Validation:** Zod schemas shared between client forms and API route handlers — every mutation is validated server-side regardless of what the client sends.
- **Containers:** A single multi-stage `Dockerfile` (`dev`, `builder`, `runner` targets) and two Compose files — `docker-compose.yml` for local development (hot reload) and `docker-compose.prod.yml` as a production reference.

All data is relational and scoped by `userId`. Every API route re-derives the current user from the session server-side and checks ownership before reading or writing — the frontend never decides who is allowed to see what.

### Folder structure

```
prisma/
  schema.prisma          Database schema (source of truth)
  migrations/             Generated SQL migrations
  seed.ts                 Development seed data

docker/
  entrypoint.sh           Waits for Postgres, runs migrations, starts the app

src/
  auth.ts                 NextAuth configuration
  proxy.ts                Route protection (login-gates everything except /login, /register)
  middleware.ts            (renamed to proxy.ts — Next.js 16 convention)

  app/
    login/, register/     Public auth pages
    (app)/                 Authenticated shell (bottom nav + toast provider)
      weight/              Weight tab
      lifting/             Lifting dashboard, exercises, routines, workouts, history
      settings/            Profile, units, export, logout
    api/                   Route handlers — one folder per resource

  components/
    ui/                    Button, Card, Input, Sheet, ConfirmDialog, Toast, EmptyState
    nav/                   BottomNav, TopBar, SubPageHeader
    charts/                ProgressChart, TimeRangeTabs
    weight/                Weight screen + log/edit sheet
    lifting/                Exercise library, routines, active workout, history
    settings/               Settings screen

  lib/
    prisma.ts              Prisma client singleton
    validation.ts           Zod schemas
    calculations.ts          1RM (Epley), volume, moving average, PR math
    units.ts / date.ts       LB↔KG conversion, timezone-safe date handling
    workout-service.ts        Previous-performance lookup, PR detection
    exercise-detail.ts, workout-detail.ts   Shared data loaders (used by pages and API routes)
    api.ts                   requireUserId(), consistent error handling
    csv.ts                   CSV export helper
```

### Database schema overview

```
User ──1:1── UserSettings (units: LB | KG)
User ──1:N── BodyWeightEntry
User ──1:N── Exercise (name, muscleGroup, description, notes)
User ──1:N── WorkoutRoutine ──1:N── WorkoutRoutineExercise ──N:1── Exercise
                                     (order, targetSets, targetReps)
User ──1:N── Workout (name, startedAt, finishedAt, notes, optional routineId)
              └─1:N── WorkoutExercise (order, notes) ──N:1── Exercise
                        └─1:N── WorkoutSet (setNumber, weightKg, reps, completed)
User ──1:N── PersonalRecord (type: HEAVIEST_WEIGHT | ESTIMATED_1RM | WORKOUT_VOLUME)
```

Notes on the design:

- Weight is always stored in **kilograms** internally; the display unit (LB/KG) is a per-user setting applied at the edges (API in/out), so switching units never touches historical data.
- Deleting a `WorkoutRoutine` cascades to its `WorkoutRoutineExercise` rows only — it never touches past `Workout` records (a routine is just a template).
- Deleting an `Exercise` is blocked (`onDelete: Restrict`) if it's referenced by any `WorkoutExercise`, so your training history can never be silently destroyed. You can still delete exercises that have no workout history.
- `PersonalRecord` rows are append-style: a new row is written each time a record is broken, so the PR history for an exercise is itself a small timeline.

---

## 2. Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- macOS, Linux, or Windows with WSL2
- Nothing else — Node.js and PostgreSQL both run inside containers.

To install Docker Desktop: download it from the link above, open the installer, and start Docker Desktop once before continuing. On macOS/Windows you'll see a whale icon in the menu bar/tray once it's running.

---

## 3. Running it locally

### One-command start

```bash
./run.sh
```

On macOS you can also double-click **`run.command`** in Finder.

This script checks that Docker is installed and running, creates a `.env` from `.env.example` if you don't have one yet (generating a random auth secret for you), starts Postgres and the app with Docker Compose, waits for both to become healthy, and prints the URL.

Once it's done:

**App:** http://localhost:3000

The database starts empty. To load sample data (a test user, an exercise library, three routines, ~8 weeks of workouts, and two months of weight entries):

```bash
docker compose exec web npm run db:seed
```

**Test login:** `test@example.com` / `password123`

### Manual start

```bash
cp .env.example .env      # then edit values as needed
docker compose up -d --build
docker compose exec web npm run db:seed   # optional
```

### Stopping

```bash
docker compose down          # stops containers, keeps your data
docker compose down -v       # ⚠️ also deletes the Postgres volume — all data is lost
```

### Rebuilding after a dependency change

```bash
docker compose up -d --build
```

### Everyday workflow

- Edit files under `src/` — the `web` container mounts your working directory, so `next dev` picks up changes immediately (no rebuild needed for code changes).
- Changing `prisma/schema.prisma`? Create a migration (see below) — the running container doesn't apply schema changes automatically until you do.
- Changing `package.json`? Rebuild the image (`docker compose up -d --build`) so the new dependency actually gets installed in the container.

---

## 4. Database migrations

Prisma migrations are the source of truth for the schema. Run these from your host machine (they use the `DATABASE_URL` in `.env`, which points at `localhost:<POSTGRES_PORT>` — the Postgres port exposed by Docker Compose):

```bash
# Create a new migration after editing prisma/schema.prisma
npx prisma migrate dev --name describe_your_change

# Apply pending migrations without prompting to create new ones (used in production/CI)
npx prisma migrate deploy

# Reset your LOCAL DEV database: drops all data, reapplies every migration, then seeds
npx prisma migrate reset
```

> ⚠️ **`prisma migrate reset` is destructive.** Only run it against your local development database. Never run it against a production `DATABASE_URL`. `migrate deploy` is the only command that should ever touch a production database, and the app container already runs it automatically on every startup (see `docker/entrypoint.sh`) — you don't need to run it by hand in production.

Seeding:

```bash
docker compose exec web npm run db:seed
# or, running Prisma commands from your host instead of inside the container:
npm run db:seed
```

Accessing Postgres directly:

```bash
docker compose exec db psql -U fitness -d fitness_tracker
```

(`fitness` / `fitness_tracker` are the defaults in `.env.example` — use whatever you set for `POSTGRES_USER` / `POSTGRES_DB`.)

---

## 5. Environment variables

All variables are documented in `.env.example`. Copy it to `.env` and fill it in — `.env` is gitignored and must never be committed.

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials Docker Compose uses to initialize the Postgres container. |
| `POSTGRES_PORT` | Host port Postgres is exposed on (defaults to `5433` to avoid clashing with a Postgres instance you might already have on `5432`). |
| `DATABASE_URL` | Connection string used by Prisma CLI commands run from your host (`localhost:<POSTGRES_PORT>`). Inside Docker, Compose overrides this automatically to point at the `db` service — you don't need to keep the two in sync. |
| `AUTH_SECRET` | Secret used to sign session tokens. Generate one with `openssl rand -base64 32`. **Required** — the app won't start safely without it. |
| `AUTH_URL` | The public URL the app is served from. Update this when you deploy. |
| `APP_PORT` | Host port the Next.js app is exposed on (defaults to `3000`). |
| `NODE_ENV` | `development` locally, `production` when deployed. |

---

## 6. Troubleshooting

**"Docker was not found" / "Docker is not running"**
Install and open Docker Desktop, wait for it to fully start (whale icon steady, not animating), then re-run `./run.sh`.

**Port already in use (`5433` or `3000`)**
Something else on your machine is using that port. Change `POSTGRES_PORT` or `APP_PORT` in `.env` and re-run.

**"Can't reach database server" in the app logs**
The `web` container waits for Postgres to be reachable before starting, but if you interrupted a previous run mid-startup, containers can end up in a stale state. Run `docker compose down && docker compose up -d --build`.

**Migrations seem out of date / schema errors**
Run `npx prisma migrate deploy` (or, in dev, `npx prisma migrate dev`) — the container also does this automatically on every restart, so `docker compose restart web` will re-apply anything pending.

**Changed a dependency and it's not picking up**
`docker compose up -d --build` — code changes hot-reload, but new `node_modules` need a rebuild.

**Totally stuck / want a clean slate (local dev only)**
```bash
docker compose down -v   # wipes the database
docker compose up -d --build
npx prisma migrate deploy
docker compose exec web npm run db:seed
```

---

## 7. Deploying to production

The same `Dockerfile` has a `runner` target built for production: a minimal image running Next.js's standalone output. `docker-compose.prod.yml` is a working reference for running it alongside Postgres on a single server:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

For a real deployment:

1. Use a managed Postgres instance (or a persistent volume you actually back up) rather than the throwaway local volume.
2. Set `AUTH_SECRET` to a freshly generated secret (never reuse the dev one) and `AUTH_URL` to your real domain.
3. Put the app behind a reverse proxy / load balancer that terminates HTTPS (Caddy, nginx, or your platform's built-in TLS).
4. Migrations run automatically on container start via `docker/entrypoint.sh` (`prisma migrate deploy`) — just make sure `DATABASE_URL` points at your production database before the container starts.
5. Never commit `.env` or run `prisma migrate reset` / `docker compose down -v` against production.

The app has no dependency on the local filesystem beyond the Next.js build output, so it's a straightforward fit for any container host (a VPS with Docker, Fly.io, Railway, Render, etc.) once you have a Postgres instance to point it at.

---

## 8. Known limitations / next steps

- No automated test suite — this was validated with `tsc`, ESLint, a production build, and a full manual pass through every flow (register, login, log/edit/delete weight, build a routine, run a workout with PR detection, finish, view history, export CSV, multi-user data isolation). Adding Playwright/Vitest coverage would be the natural next step.
- Dark mode is the only theme, by design (per the brief) — no light-mode toggle.
- No password-reset/email-verification flow. Registration and login are covered; account recovery is not.
- No rate limiting on `/api/auth/register` or the credentials login — fine for personal/self-hosted use, worth adding (e.g. via a reverse-proxy rule or a library like `@upstash/ratelimit`) before exposing this publicly.
- Exercise deletion is intentionally blocked once an exercise has workout history, to protect past data — there's no "archive" concept, so those exercises stay in the library.
# fitness-tracker
