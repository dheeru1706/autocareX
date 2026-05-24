# AutoCareX — Deployment Guide

## AWS Infrastructure

```
AWS Region: ap-south-1 (Mumbai)
VPC: 10.0.0.0/16

Subnets:
  Public:  10.0.1.0/24 (AZ-a), 10.0.2.0/24 (AZ-b) — ALB, NAT Gateway
  Private: 10.0.3.0/24 (AZ-a), 10.0.4.0/24 (AZ-b) — EC2, RDS, ElastiCache
```

### Services Used

| Service | Purpose | Spec |
|---------|---------|------|
| EC2 (Auto Scaling) | Application servers | t3.medium (2 vCPU, 4GB) × 2-6 |
| RDS PostgreSQL 15 | Primary database | db.r6g.large, Multi-AZ |
| RDS Read Replica | Read-heavy queries | db.r6g.large |
| ElastiCache Redis 7 | Cache + sessions | cache.r6g.large, 2 nodes |
| S3 | File storage | Standard storage class |
| CloudFront | CDN for S3 | Price Class 200 |
| ALB | Load balancer | Application Load Balancer |
| Route53 | DNS | Hosted zone + health checks |
| ACM | SSL certificates | Auto-renewed |
| ECR | Docker image registry | Private repository |
| CloudWatch | Monitoring + alerts | Custom dashboards |
| SNS | Alert notifications | Email + Slack via webhook |
| SES | Transactional email | Verified domain |

---

## Initial Server Setup

```bash
# On fresh EC2 Ubuntu 22.04 instance
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install AWS CLI
sudo snap install aws-cli --classic

# Configure AWS credentials
aws configure

# Create app directory
sudo mkdir -p /opt/autocareX
sudo chown ubuntu:ubuntu /opt/autocareX

# Clone repo
cd /opt/autocareX
git clone https://github.com/your-org/autocareX.git .

# Configure environment
cp .env.example .env
nano .env  # Fill in all values
```

---

## SSL Certificate Setup

```bash
# Using Let's Encrypt via Certbot
sudo apt install certbot -y

# Obtain certificates (HTTP challenge — temporarily open port 80)
sudo certbot certonly --standalone \
  -d api.autocareX.in \
  -d admin.autocareX.in \
  -d autocareX.in \
  --email ssl@autocareX.in \
  --agree-tos \
  --non-interactive

# Certificates are stored at:
# /etc/letsencrypt/live/api.autocareX.in/fullchain.pem
# /etc/letsencrypt/live/api.autocareX.in/privkey.pem

# Copy to docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.autocareX.in/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/api.autocareX.in/privkey.pem docker/nginx/ssl/

# Auto-renewal cron
echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/api.autocareX.in/*.pem /opt/autocareX/docker/nginx/ssl/ && docker-compose -f /opt/autocareX/docker-compose.yml exec nginx nginx -s reload" | sudo crontab -
```

---

## Database Migration Process

```bash
# 1. Always take a backup before migrating
./scripts/migrate.sh backup

# 2. Run migrations
./scripts/migrate.sh run

# 3. Verify
./scripts/migrate.sh status

# In CI/CD (see deploy-prod.yml), migrations run automatically:
docker-compose run --rm backend node src/database/migrate.js
```

### Rollback a migration

```bash
# Roll back last migration
docker-compose exec backend npx prisma migrate resolve --rolled-back <migration_name>

# Or manually apply rollback SQL
docker-compose exec postgres psql -U autocareX -d autocareX -f rollbacks/20240523_rollback.sql
```

---

## Zero-Downtime Deployment

The `deploy-prod.yml` workflow implements blue-green-style rolling restarts:

```bash
# 1. Pull new images (no downtime)
docker pull $ECR_REGISTRY/autocareX-backend:$IMAGE_TAG

# 2. Run migrations before switching traffic
docker-compose run --rm backend node src/database/migrate.js

# 3. Scale to 2 backend instances briefly
docker-compose up -d --no-deps --scale backend=2 backend
sleep 15  # Let new instance warm up

# 4. Health-check loop (waits for healthy)
for i in $(seq 1 10); do
  curl -sf http://localhost:3000/health && break
  sleep 5
done

# 5. Scale back to 1
docker-compose up -d --no-deps --scale backend=1 backend

# 6. Restart admin (no traffic interruption due to nginx caching)
docker-compose up -d --no-deps admin

# 7. Reload nginx config gracefully
docker-compose exec nginx nginx -s reload
```

---

## Rollback Procedure

```bash
# SSH into production server
ssh -i prod.pem ubuntu@$PROD_EC2_HOST

cd /opt/autocareX

# List available images in ECR
aws ecr list-images --repository-name autocareX-backend --region ap-south-1 \
  --query 'imageIds[*].imageTag' --output table

# Roll back to previous commit SHA
PREVIOUS_TAG=abc1234def  # Previous known-good commit SHA

docker pull $ECR_REGISTRY/autocareX-backend:$PREVIOUS_TAG
docker tag $ECR_REGISTRY/autocareX-backend:$PREVIOUS_TAG autocareX-backend:latest

docker-compose up -d --no-deps backend
docker-compose up -d --no-deps admin
docker-compose exec nginx nginx -s reload

# If database rollback needed:
docker-compose exec backend npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Monitoring Setup (CloudWatch)

### Custom Metrics Dashboard

```bash
# Install CloudWatch agent on EC2
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Start with config
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/autocareX/docker/cloudwatch-config.json -s
```

### Alerts configured:

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Utilization | >80% for 5min | Scale out + SNS alert |
| Memory Usage | >85% | SNS alert |
| API Response Time (p95) | >2000ms | SNS alert |
| Database Connections | >80% of max | SNS alert |
| ReplicaLag | >2s | SNS alert |
| Error Rate (5xx) | >1% | SNS alert |
| Redis Memory | >80% | SNS alert |

### Application Logs

```bash
# Tail logs in real-time
docker-compose logs -f backend
docker-compose logs -f nginx

# All logs shipped to CloudWatch Logs:
# Log groups:
#   /autocareX/backend
#   /autocareX/nginx/access
#   /autocareX/nginx/error
#   /autocareX/worker
```

---

## Backup Strategy

### Database Backups

```bash
# Automated via AWS RDS
# - Automated daily snapshots: retained 7 days
# - Manual snapshot before every deploy
# - Point-in-time recovery: up to 7 days (5-minute granularity)

# Manual backup
aws rds create-db-snapshot \
  --db-instance-identifier autocareX-prod \
  --db-snapshot-identifier autocareX-prod-pre-deploy-$(date +%Y%m%d)
```

### File Storage Backups

```bash
# S3 Versioning: enabled on autocareX-uploads bucket
# Cross-region replication: ap-south-1 → us-east-1

# S3 Lifecycle rules:
# - Current version: Standard
# - Noncurrent versions: transition to Glacier after 90 days
# - Delete noncurrent after 365 days
```

### Backup Verification

```bash
# Weekly automated restore test (runs every Sunday 2 AM IST)
# Restores to a test RDS instance and verifies row counts
# Alerts on failure via SNS
```

---

## Performance Tuning

### PostgreSQL (RDS)

```sql
-- Key parameters (set via RDS parameter group)
max_connections = 200
shared_buffers = 4GB        -- 25% of RAM
effective_cache_size = 12GB -- 75% of RAM
work_mem = 64MB
maintenance_work_mem = 1GB
wal_buffers = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1      -- SSD storage
```

### Nginx

```nginx
worker_processes auto;         # = number of CPU cores
worker_connections 2048;
keepalive_timeout 65;
keepalive_requests 1000;
```
