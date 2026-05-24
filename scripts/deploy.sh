#!/usr/bin/env bash
# AutoCareX — Production Deployment Script
# Usage:
#   ./scripts/deploy.sh                         # Deploy current commit
#   ./scripts/deploy.sh --skip-tests            # Skip CI checks
#   ./scripts/deploy.sh --rollback <sha>        # Rollback to specific commit
#   ./scripts/deploy.sh --env staging           # Deploy to staging

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

log()      { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
info()     { echo -e "${BLUE}[INFO]${NC}   $1"; }
warn()     { echo -e "${YELLOW}[WARN]${NC}   $1"; }
err()      { echo -e "${RED}[ERROR]${NC}  $1" >&2; exit 1; }
header()   { echo -e "\n${BOLD}━━━ $1 ━━━${NC}\n"; }

# ── Parse arguments ──────────────────────────────────────────
ENV="production"
SKIP_TESTS=false
ROLLBACK_SHA=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-tests) SKIP_TESTS=true; shift ;;
    --env) ENV="$2"; shift 2 ;;
    --rollback) ROLLBACK_SHA="$2"; shift 2 ;;
    *) err "Unknown argument: $1" ;;
  esac
done

# ── Load config ──────────────────────────────────────────────
[[ -f ".env" ]] && export $(grep -v '^#' .env | xargs) || true

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION:-ap-south-1}.amazonaws.com"
IMAGE_TAG="${ROLLBACK_SHA:-$(git rev-parse HEAD)}"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S UTC")

header "AutoCareX Deployment — $ENV"
info "Git SHA:     $IMAGE_TAG"
info "Environment: $ENV"
info "Timestamp:   $TIMESTAMP"
info "Deployed by: $(whoami)"

# ── Confirm production deploy ────────────────────────────────
if [[ "$ENV" == "production" && -z "$CI" ]]; then
  echo ""
  warn "You are about to deploy to PRODUCTION!"
  warn "Git commit: $(git log --oneline -1)"
  echo ""
  read -rp "Type 'deploy' to confirm: " CONFIRM
  [[ "$CONFIRM" != "deploy" ]] && { log "Deployment cancelled."; exit 0; }
fi

# ── Check prerequisites ──────────────────────────────────────
header "Pre-flight Checks"

command -v aws &>/dev/null || err "AWS CLI not installed"
command -v docker &>/dev/null || err "Docker not installed"

# Verify AWS credentials
aws sts get-caller-identity &>/dev/null || err "AWS credentials not configured"
log "AWS credentials: OK"

# Verify ECR access
aws ecr describe-repositories --repository-names autocareX-backend &>/dev/null || \
  err "Cannot access ECR repository"
log "ECR access: OK"

# ── Run tests (unless skipped) ───────────────────────────────
if [[ "$SKIP_TESTS" == "false" ]]; then
  header "Running Tests"
  cd backend && npm test && cd ..
  log "All tests passed"
else
  warn "Tests SKIPPED (--skip-tests flag set)"
fi

# ── Build & push Docker images ───────────────────────────────
if [[ -z "$ROLLBACK_SHA" ]]; then
  header "Building Docker Images"

  # Login to ECR
  log "Logging into ECR..."
  aws ecr get-login-password --region "${AWS_REGION:-ap-south-1}" | \
    docker login --username AWS --password-stdin "$ECR_REGISTRY"

  # Build and push backend
  log "Building backend image..."
  docker build \
    -t "$ECR_REGISTRY/autocareX-backend:$IMAGE_TAG" \
    -t "$ECR_REGISTRY/autocareX-backend:latest" \
    --build-arg NODE_ENV=production \
    ./backend

  log "Pushing backend image..."
  docker push "$ECR_REGISTRY/autocareX-backend:$IMAGE_TAG"
  docker push "$ECR_REGISTRY/autocareX-backend:latest"

  # Build and push admin
  log "Building admin panel image..."
  docker build \
    -t "$ECR_REGISTRY/autocareX-admin:$IMAGE_TAG" \
    -t "$ECR_REGISTRY/autocareX-admin:latest" \
    --build-arg "VITE_API_URL=https://api.autocareX.in/api/v1" \
    ./admin

  log "Pushing admin panel image..."
  docker push "$ECR_REGISTRY/autocareX-admin:$IMAGE_TAG"
  docker push "$ECR_REGISTRY/autocareX-admin:latest"

  log "Images pushed to ECR successfully"
fi

# ── Deploy to server ─────────────────────────────────────────
header "Deploying to $ENV Server"

EC2_HOST="${PROD_EC2_HOST:-}"
EC2_USER="${PROD_EC2_USER:-ubuntu}"
SSH_KEY="${PROD_EC2_SSH_KEY_PATH:-~/.ssh/autocareX-prod.pem}"

if [[ "$ENV" == "staging" ]]; then
  EC2_HOST="${STAGING_EC2_HOST:-}"
  SSH_KEY="${STAGING_EC2_SSH_KEY_PATH:-~/.ssh/autocareX-staging.pem}"
fi

[[ -z "$EC2_HOST" ]] && err "${ENV^^}_EC2_HOST is not set in .env"
[[ ! -f "$SSH_KEY" ]] && err "SSH key not found: $SSH_KEY"

log "Connecting to $EC2_HOST..."

ssh -i "$SSH_KEY" \
  -o StrictHostKeyChecking=no \
  -o ConnectTimeout=10 \
  "$EC2_USER@$EC2_HOST" \
  IMAGE_TAG="$IMAGE_TAG" ECR_REGISTRY="$ECR_REGISTRY" AWS_REGION="${AWS_REGION:-ap-south-1}" \
  'bash -s' <<'REMOTE_SCRIPT'
  set -e

  echo "=== Starting deploy on $(hostname) ==="
  cd /opt/autocareX

  # Login to ECR
  aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_REGISTRY

  # Pull new images
  docker pull $ECR_REGISTRY/autocareX-backend:$IMAGE_TAG
  docker pull $ECR_REGISTRY/autocareX-admin:$IMAGE_TAG
  docker tag $ECR_REGISTRY/autocareX-backend:$IMAGE_TAG autocareX-backend:latest
  docker tag $ECR_REGISTRY/autocareX-admin:$IMAGE_TAG autocareX-admin:latest

  # Run migrations
  echo "Running migrations..."
  docker-compose run --rm backend node src/database/migrate.js

  # Restart backend (rolling)
  docker-compose up -d --no-deps --scale backend=2 backend
  sleep 15

  # Health check
  for i in $(seq 1 12); do
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
      echo "Backend healthy (attempt $i)"
      break
    fi
    echo "Waiting for backend... ($i/12)"
    sleep 5
  done

  docker-compose up -d --no-deps --scale backend=1 backend
  docker-compose up -d --no-deps admin
  docker-compose exec -T nginx nginx -s reload

  echo "=== Deploy complete on $(hostname) ==="
REMOTE_SCRIPT

# ── Smoke tests ──────────────────────────────────────────────
header "Post-Deploy Smoke Tests"

sleep 8

API_URL="https://api.autocareX.in"
ADMIN_URL="https://admin.autocareX.in"

if [[ "$ENV" == "staging" ]]; then
  API_URL="https://api-staging.autocareX.in"
  ADMIN_URL="https://admin-staging.autocareX.in"
fi

log "Testing API health endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
[[ "$STATUS" != "200" ]] && err "API health check FAILED (HTTP $STATUS)"
log "API health: OK (HTTP 200)"

log "Testing Admin panel..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL")
[[ "$STATUS" != "200" ]] && err "Admin panel FAILED (HTTP $STATUS)"
log "Admin panel: OK (HTTP 200)"

# ── Cleanup old images ───────────────────────────────────────
log "Cleaning up old Docker images locally..."
docker images "$ECR_REGISTRY/autocareX-backend" --format "{{.ID}} {{.CreatedAt}}" | \
  sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true
docker images "$ECR_REGISTRY/autocareX-admin" --format "{{.ID}} {{.CreatedAt}}" | \
  sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi 2>/dev/null || true

# ── Slack notification ───────────────────────────────────────
if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  COMMIT_MSG=$(git log --oneline -1)
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    -d "{\"text\":\"✅ *$ENV Deploy Successful*\n\`${IMAGE_TAG:0:8}\` — $COMMIT_MSG\nDeployed by: $(whoami) at $TIMESTAMP\"}" \
    &>/dev/null || true
fi

header "Deploy Complete!"
info "Environment:  $ENV"
info "Image SHA:    $IMAGE_TAG"
info "API:          $API_URL"
info "Admin:        $ADMIN_URL"
info "Completed at: $(date -u)"
