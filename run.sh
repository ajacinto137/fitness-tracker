#!/bin/bash
# Fitness Tracker — one-command local startup.
# Starts Postgres + the Next.js app in Docker, waits for the app to become
# healthy, and prints the local URL.
set -e

cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}==>${NC} $1"; }
warn() { echo -e "${YELLOW}==>${NC} $1"; }
fail() { echo -e "${RED}Error:${NC} $1"; exit 1; }

# --- 1. Check Docker is installed and running ---
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker was not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/ and try again."
fi

if ! docker info >/dev/null 2>&1; then
  fail "Docker is installed but not running. Start Docker Desktop and try again."
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  fail "Docker Compose was not found. It ships with Docker Desktop — try reinstalling it."
fi

# --- 2. Ensure .env exists ---
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    warn ".env not found — creating one from .env.example with a generated auth secret."
    cp .env.example .env
    if command -v openssl >/dev/null 2>&1; then
      SECRET=$(openssl rand -base64 32)
      # Portable in-place sed for macOS (BSD) and Linux (GNU)
      sed -i.bak "s#AUTH_SECRET=.*#AUTH_SECRET=${SECRET}#" .env && rm -f .env.bak
    fi
    warn "Review .env and update POSTGRES_PASSWORD before deploying anywhere shared."
  else
    fail ".env.example is missing — cannot create a default .env."
  fi
fi

# --- 3. Start the stack ---
info "Starting Postgres and the app with Docker Compose..."
$COMPOSE up -d --build

info "Waiting for the database to become healthy..."
ATTEMPTS=0
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($COMPOSE ps -q db)" 2>/dev/null)" = "healthy" ]; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 60 ]; then
    fail "Database did not become healthy in time. Run '$COMPOSE logs db' to investigate."
  fi
  sleep 1
done
info "Database is healthy."

info "Waiting for the app to respond (migrations run automatically on startup)..."
APP_PORT=$(grep -E '^APP_PORT=' .env | cut -d '=' -f2)
APP_PORT=${APP_PORT:-3000}
ATTEMPTS=0
until curl -sf "http://localhost:${APP_PORT}" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 90 ]; then
    warn "The app is taking longer than expected. Check its logs with: $COMPOSE logs -f web"
    break
  fi
  sleep 1
done

echo ""
info "Fitness Tracker is running at: http://localhost:${APP_PORT}"
echo "   Stop it anytime with: $COMPOSE down"
echo "   Seed sample data with: $COMPOSE exec web npm run db:seed"
echo ""
