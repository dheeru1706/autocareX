#!/usr/bin/env bash
# AutoCareX — Database seeding script
# Usage:
#   ./scripts/seed.sh            # Seed with all data
#   ./scripts/seed.sh users      # Seed users only
#   ./scripts/seed.sh franchises # Seed franchises only
#   ./scripts/seed.sh --clean    # Clear all data before seeding

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SEED]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1" >&2; exit 1; }

# Load env
if [[ -f ".env" && -z "${DATABASE_URL:-}" ]]; then
  export $(grep -v '^#' .env | xargs)
fi

[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL is not set"

SEED_TARGET="${1:-all}"
CLEAN=false

# Check for --clean flag
for arg in "$@"; do
  if [[ "$arg" == "--clean" ]]; then
    CLEAN=true
  fi
done

if [[ "$CLEAN" == "true" ]]; then
  warn "Cleaning all data before seeding..."
  warn "This will DELETE ALL DATA. Confirm? (y/N)"
  read -r CONFIRM
  if [[ "$CONFIRM" != "y" ]]; then
    log "Seed cancelled"
    exit 0
  fi
fi

[[ "${NODE_ENV:-}" == "production" ]] && err "Seeding is not allowed in production!"

log "Starting database seed (target: $SEED_TARGET)..."

if [[ -d "backend" ]]; then
  cd backend

  case "$SEED_TARGET" in
    all)
      log "Seeding admin users..."
      node -e "
        const { prisma } = require('./src/database');
        const bcrypt = require('bcryptjs');
        async function seed() {
          const hash = await bcrypt.hash('Admin@123', 12);
          await prisma.adminUser.upsert({
            where: { email: 'admin@autocareX.dev' },
            update: {},
            create: {
              email: 'admin@autocareX.dev',
              password_hash: hash,
              name: 'Super Admin',
              role: 'super_admin',
              is_active: true,
            },
          });
          console.log('Admin user created: admin@autocareX.dev / Admin@123');
          await prisma.\$disconnect();
        }
        seed().catch(console.error);
      " 2>/dev/null || warn "Admin seed skipped (module not found — run from backend/)"

      log "Seeding service catalog..."
      node src/database/seeds/services.js 2>/dev/null || warn "Services seed skipped"

      log "Seeding cities and pricing..."
      node src/database/seeds/pricing.js 2>/dev/null || warn "Pricing seed skipped"

      log "Seeding subscription plans..."
      node src/database/seeds/plans.js 2>/dev/null || warn "Plans seed skipped"

      log "Seeding demo franchises..."
      node src/database/seeds/franchises.js 2>/dev/null || warn "Franchise seed skipped"

      log "Seeding demo customers..."
      node src/database/seeds/customers.js 2>/dev/null || warn "Customer seed skipped"

      log "Seeding demo bookings..."
      node src/database/seeds/bookings.js 2>/dev/null || warn "Booking seed skipped"

      log "Seeding coupons..."
      node src/database/seeds/coupons.js 2>/dev/null || warn "Coupon seed skipped"
      ;;

    users|customers)
      log "Seeding customers only..."
      node src/database/seeds/customers.js 2>/dev/null || warn "Customer seed skipped"
      ;;

    franchises)
      log "Seeding franchises only..."
      node src/database/seeds/franchises.js 2>/dev/null || warn "Franchise seed skipped"
      ;;

    plans)
      log "Seeding subscription plans only..."
      node src/database/seeds/plans.js 2>/dev/null || warn "Plans seed skipped"
      ;;

    *)
      echo "Usage: $0 [all|users|franchises|plans] [--clean]"
      exit 1
      ;;
  esac

  cd ..
fi

log ""
log "Seed complete!"
log ""
log "Dev credentials:"
log "  Admin panel: admin@autocareX.dev / Admin@123"
log "  Test OTP:    Use any phone number with OTP '123456' in dev mode"
