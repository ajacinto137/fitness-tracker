#!/bin/sh

set -e

MODE="${1:-start}"

if [ "$MODE" = "dev" ]; then
    DB_HOST="${DB_HOST:-db}"
    DB_PORT="${DB_PORT:-5432}"

    echo "[entrypoint] Waiting for database at ${DB_HOST}:${DB_PORT}..."

    ATTEMPTS=0

    until nc -z "$DB_HOST" "$DB_PORT" >/dev/null 2>&1; do
        ATTEMPTS=$((ATTEMPTS + 1))

        if [ "$ATTEMPTS" -ge 60 ]; then
            echo "[entrypoint] Database did not become reachable in time." >&2
            exit 1
        fi

        sleep 1
    done

    echo "[entrypoint] Database is reachable."
else
    echo "[entrypoint] Production mode — using DATABASE_URL."
fi

echo "[entrypoint] Applying database migrations..."
npx prisma migrate deploy

if [ "$MODE" = "dev" ]; then
    echo "[entrypoint] Starting Next.js in development mode..."
    exec npm run dev -- -H 0.0.0.0
else
    echo "[entrypoint] Starting Next.js in production mode..."
    exec node server.js
fi