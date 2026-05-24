#!/usr/bin/env bash
# AutoCareX — One-command local development setup
# Usage: ./scripts/setup.sh

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

echo ""
echo "========================================"
echo "  AutoCareX — Development Setup"
echo "========================================"
echo ""

# ── Check prerequisites ──────────────────────────────────────
log "Checking prerequisites..."

command -v docker &>/dev/null || err "Docker is not installed. Install from https://docker.com"
command -v docker-compose &>/dev/null || err "Docker Compose is not installed."
command -v node &>/dev/null || err "Node.js is not installed. Install from https://nodejs.org"
command -v npm &>/dev/null || err "npm is not installed."

DOCKER_VERSION=$(docker --version | grep -oP '\d+\.\d+' | head -1)
NODE_VERSION=$(node -v | grep -oP '\d+' | head -1)

info "Docker version: $DOCKER_VERSION"
info "Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" -lt 18 ]]; then
  err "Node.js 18+ is required. Current: $NODE_VERSION"
fi

# ── Copy environment files ───────────────────────────────────
log "Setting up environment files..."

if [[ ! -f ".env" ]]; then
  cp .env.example .env
  warn ".env created from .env.example — please update credentials before starting services"
else
  info ".env already exists, skipping"
fi

if [[ ! -f "admin/.env" ]]; then
  cp admin/.env.example admin/.env
  info "admin/.env created"
fi

# ── Install backend dependencies ─────────────────────────────
if [[ -d "backend" ]]; then
  log "Installing backend dependencies..."
  cd backend
  npm ci
  cd ..
  info "Backend dependencies installed"
fi

# ── Install admin panel dependencies ────────────────────────
log "Installing admin panel dependencies..."
cd admin
npm ci --legacy-peer-deps
cd ..
info "Admin panel dependencies installed"

# ── Start Docker services ────────────────────────────────────
log "Starting Docker services (dev mode)..."
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis mailhog

# ── Wait for postgres to be healthy ─────────────────────────
log "Waiting for PostgreSQL to be ready..."
ATTEMPTS=0
until docker-compose exec -T postgres pg_isready -U autocareX -d autocareX &>/dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [[ $ATTEMPTS -ge 30 ]]; then
    err "PostgreSQL did not become ready after 30 seconds"
  fi
  printf "."
  sleep 1
done
echo ""
info "PostgreSQL is ready!"

# ── Run database migrations ──────────────────────────────────
if [[ -d "backend" ]]; then
  log "Running database migrations..."
  cd backend
  DATABASE_URL=$(grep DATABASE_URL ../.env | cut -d= -f2-) npm run migrate 2>/dev/null || \
    warn "Migration command not found — run manually: cd backend && npm run migrate"
  cd ..
fi

# ── Seed development data ────────────────────────────────────
if [[ -d "backend" ]]; then
  log "Seeding development data..."
  cd backend
  DATABASE_URL=$(grep DATABASE_URL ../.env | cut -d= -f2-) npm run seed 2>/dev/null || \
    warn "Seed command not found — run manually: cd backend && npm run seed"
  cd ..
fi

# ── Summary ─────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo -e "  ${GREEN}Services started:${NC}"
echo "    PostgreSQL  → localhost:5432"
echo "    Redis       → localhost:6379"
echo "    pgAdmin     → http://localhost:5050"
echo "    Mailhog     → http://localhost:8025"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo "    1. Start backend:    cd backend && npm run dev"
echo "    2. Start admin:      cd admin && npm run dev"
echo "    3. Admin panel:      http://localhost:3001"
echo "    4. Backend API:      http://localhost:3000"
echo ""
echo -e "  ${BLUE}Or start everything with Docker:${NC}"
echo "    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up"
echo ""
