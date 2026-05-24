#!/usr/bin/env bash
# AutoCareX — Database migration runner
# Usage:
#   ./scripts/migrate.sh              # Run pending migrations
#   ./scripts/migrate.sh backup       # Backup before migrate
#   ./scripts/migrate.sh status       # Show migration status
#   ./scripts/migrate.sh rollback     # Rollback last migration

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[MIGRATE]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}    $1"; }
err()  { echo -e "${RED}[ERROR]${NC}   $1" >&2; exit 1; }

COMMAND="${1:-run}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Load .env if not in Docker
if [[ -f ".env" && -z "${DATABASE_URL:-}" ]]; then
  export $(grep -v '^#' .env | xargs)
fi

[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL is not set"

case "$COMMAND" in
  backup)
    log "Taking database backup before migration..."
    mkdir -p backups

    if command -v pg_dump &>/dev/null; then
      pg_dump "$DATABASE_URL" --no-owner --no-acl \
        -f "backups/autocareX_pre_migrate_${TIMESTAMP}.sql"
      log "Backup saved: backups/autocareX_pre_migrate_${TIMESTAMP}.sql"
    elif docker-compose ps postgres &>/dev/null; then
      docker-compose exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-autocareX}" \
        -d "${POSTGRES_DB:-autocareX}" \
        --no-owner --no-acl \
        > "backups/autocareX_pre_migrate_${TIMESTAMP}.sql"
      log "Backup saved via Docker: backups/autocareX_pre_migrate_${TIMESTAMP}.sql"
    else
      warn "Could not backup — pg_dump not available and Docker not running"
    fi
    ;;

  run)
    log "Running database migrations..."

    if [[ -d "backend" ]]; then
      cd backend
      if [[ -f "node_modules/.bin/prisma" ]]; then
        npx prisma migrate deploy
        log "Prisma migrations applied successfully"
      elif [[ -f "src/database/migrate.js" ]]; then
        node src/database/migrate.js
        log "Custom migrations applied successfully"
      else
        err "No migration tool found. Expected Prisma or src/database/migrate.js"
      fi
      cd ..
    else
      err "backend/ directory not found"
    fi
    ;;

  status)
    log "Checking migration status..."
    if [[ -d "backend" ]]; then
      cd backend
      npx prisma migrate status 2>/dev/null || \
        node -e "const db = require('./src/database'); db.query('SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10').then(console.log)"
      cd ..
    fi
    ;;

  rollback)
    warn "Rolling back last migration..."
    warn "This is a destructive operation! Have you taken a backup? (y/N)"
    read -r CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
      log "Rollback cancelled"
      exit 0
    fi

    if [[ -d "backend" ]]; then
      cd backend
      LAST_MIGRATION=$(npx prisma migrate status 2>/dev/null | grep "✔" | tail -1 | awk '{print $2}')
      if [[ -n "$LAST_MIGRATION" ]]; then
        log "Rolling back: $LAST_MIGRATION"
        npx prisma migrate resolve --rolled-back "$LAST_MIGRATION"
        log "Rollback complete. Apply rollback SQL manually if needed: migrations/${LAST_MIGRATION}/rollback.sql"
      else
        warn "No migrations found to rollback"
      fi
      cd ..
    fi
    ;;

  *)
    echo "Usage: $0 [run|backup|status|rollback]"
    exit 1
    ;;
esac
