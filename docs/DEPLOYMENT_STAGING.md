# Week 1 Staging Deployment Guide

## Overview

This guide covers deploying all Week 1 improvements to the staging environment for validation before production release. Week 1 focuses on **stabilization and safety**:

- ✅ HTTP retry/resilience improvements
- ✅ ML configuration externalization
- ✅ Comprehensive testing infrastructure
- ✅ Database backup/restore automation
- ✅ Monitoring and alerting setup

## Pre-Deployment Checklist

### Code Changes Verified
- [ ] AsyncHTTPClient tests passing locally
- [ ] ML config loads correctly in all services
- [ ] AI-service tests: `pytest tests/` (30+ tests)
- [ ] Backend-api tests: `npm test` (13+ tests)
- [ ] Git commits reviewed and tagged

### Documentation Complete
- [ ] API_CONTRACTS.md finalized
- [ ] TESTING_GUIDE.md reviewed by QA
- [ ] DATABASE_BACKUP_RESTORE.md tested
- [ ] MONITORING_SETUP.md validated
- [ ] All README files updated

### Infrastructure Ready
- [ ] Staging database verified
- [ ] Redis cache accessible
- [ ] Monitoring stack tested locally
- [ ] Backup scripts executable
- [ ] SSL certificates valid (if applicable)

## Deployment Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Preparation | 30 min | Code/doc review, environment setup |
| Pre-deployment | 15 min | Health checks, database backup |
| Deployment | 20 min | Deploy all services |
| Smoke Testing | 30 min | Validate critical paths |
| Monitoring | 2 hours | Watch metrics, alert response |
| Rollback Ready | Ongoing | Monitor for issues |

**Total: ~3.5 hours**

## Step-by-Step Deployment

### Phase 1: Preparation (30 minutes)

#### 1.1 Code Review and Tagging

```bash
# Review all changes
git log --oneline v1.0.0..HEAD

# Create release tag
git tag -a v1.1.0-staging -m "Week 1 Stabilization Release (Staging)"

# Push tag
git push origin v1.1.0-staging
```

#### 1.2 Build Docker Images

```bash
# Build backend-api
docker build -t sports-nutrition-api:v1.1.0-staging backend-api/

# Build ai-service
docker build -t sports-nutrition-ai:v1.1.0-staging ai-service/

# Tag for registry
docker tag sports-nutrition-api:v1.1.0-staging \
  registry.example.com/sports-nutrition-api:v1.1.0-staging

docker tag sports-nutrition-ai:v1.1.0-staging \
  registry.example.com/sports-nutrition-ai:v1.1.0-staging

# Push to registry
docker push registry.example.com/sports-nutrition-api:v1.1.0-staging
docker push registry.example.com/sports-nutrition-ai:v1.1.0-staging
```

#### 1.3 Environment Configuration

```bash
# Copy staging environment
cp .env.example .env.staging

# Edit staging-specific variables
cat > .env.staging << 'EOF'
# Staging Environment
NODE_ENV=staging
ENVIRONMENT=staging
LOG_LEVEL=info
DEBUG=true

# Services
BACKEND_API_PORT=3000
AI_SERVICE_PORT=8000
POSTGRES_PORT=5432
REDIS_PORT=6379

# Database (Staging)
DATABASE_HOST=staging-db.example.com
DATABASE_NAME=individual_sports_nutrition_staging
DATABASE_USER=app_user
DATABASE_PASSWORD=${STAGING_DB_PASSWORD}

# Redis (Staging)
REDIS_HOST=staging-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=${STAGING_REDIS_PASSWORD}

# AI Service Config
AI_REQUEST_TIMEOUT=30000
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY=500

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_URL=http://staging-monitor.example.com:3001
ALERTMANAGER_URL=http://staging-monitor.example.com:9093

# Feature Flags
FEATURE_NEW_SCORING=true
FEATURE_ML_CONFIG=true
FEATURE_FALLBACK_MODE=true
EOF

# Secure password storage
export STAGING_DB_PASSWORD='secure_password_here'
export STAGING_REDIS_PASSWORD='redis_password_here'
```

#### 1.4 Staging Capacity Check

```bash
#!/bin/bash
# Verify staging resources

echo "=== Staging Environment Status ==="

# Check database
psql -h staging-db.example.com -U app_user -d individual_sports_nutrition_staging \
  -c "SELECT version();"

# Check Redis
redis-cli -h staging-redis.example.com ping

# Check disk space
df -h /var/data/staging

# Check memory
free -h

# Expected requirements:
# - Database: 500MB+ space
# - Redis: 256MB+ available
# - Disk: 5GB+ free
# - RAM: 8GB+ available
```

### Phase 2: Pre-Deployment (15 minutes)

#### 2.1 Create Database Backup

```bash
#!/bin/bash
# Create pre-deployment backup

STAGING_DB_HOST=staging-db.example.com
BACKUP_DIR=/backups/staging

mkdir -p $BACKUP_DIR

echo "Creating pre-deployment database backup..."
BACKUP_FILE="$BACKUP_DIR/individual_sports_nutrition_staging_pre-v1.1.0_$(date +%Y%m%d_%H%M%S).sql.gz"

PGPASSWORD=$STAGING_DB_PASSWORD pg_dump \
  --host=$STAGING_DB_HOST \
  --username=app_user \
  individual_sports_nutrition_staging | \
  gzip > $BACKUP_FILE

echo "✓ Backup created: $BACKUP_FILE"
ls -lh $BACKUP_FILE

# Verify backup
echo "Verifying backup..."
gzip -t $BACKUP_FILE && echo "✓ Backup integrity verified" || echo "✗ Backup corrupted"
```

#### 2.2 Run Health Checks

```bash
#!/bin/bash
# Pre-deployment health checks

echo "=== Pre-Deployment Health Checks ==="

# Database
echo "Checking database..."
bash scripts/health-check-db.sh
if [ $? -ne 0 ]; then echo "✗ Database check failed"; exit 1; fi

# Redis
echo "Checking Redis..."
bash scripts/health-check-redis.sh
if [ $? -ne 0 ]; then echo "✗ Redis check failed"; exit 1; fi

# Current staging services (if running)
echo "Checking current API..."
curl -s http://staging-api.example.com/api/v1/health | jq . || echo "API not currently running (OK)"

echo "Checking current AI Service..."
curl -s http://staging-ai.example.com/health | jq . || echo "AI Service not currently running (OK)"

echo "✓ All pre-deployment checks passed"
```

### Phase 3: Deployment (20 minutes)

#### 3.1 Deploy Backend API

```bash
#!/bin/bash
# Deploy backend-api to staging

REGISTRY=registry.example.com
VERSION=v1.1.0-staging
NAMESPACE=staging

echo "Deploying backend-api version $VERSION..."

# Kubernetes deployment (if using K8s)
kubectl set image deployment/backend-api \
  backend-api=$REGISTRY/sports-nutrition-api:$VERSION \
  -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/backend-api -n $NAMESPACE --timeout=5m

# Verify deployment
kubectl get deployment backend-api -n $NAMESPACE
kubectl get pods -n $NAMESPACE -l app=backend-api

echo "✓ Backend API deployed"
```

**Alternative: Docker Compose**

```bash
#!/bin/bash
# Deploy using docker-compose

cd /opt/staging

# Create backup of current compose
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d_%H%M%S)

# Update images
sed -i "s|sports-nutrition-api:.*|sports-nutrition-api:v1.1.0-staging|g" docker-compose.yml
sed -i "s|sports-nutrition-ai:.*|sports-nutrition-ai:v1.1.0-staging|g" docker-compose.yml

# Deploy
docker-compose pull
docker-compose up -d backend-api

# Wait for readiness
echo "Waiting for backend-api to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3000/api/v1/health > /dev/null; then
    echo "✓ Backend API is ready"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 5
done
```

#### 3.2 Deploy AI Service

```bash
#!/bin/bash
# Deploy ai-service to staging

REGISTRY=registry.example.com
VERSION=v1.1.0-staging

echo "Deploying ai-service version $VERSION..."

# If using containers
docker pull $REGISTRY/sports-nutrition-ai:$VERSION
docker stop sports-nutrition-ai || true
docker rm sports-nutrition-ai || true

docker run -d \
  --name sports-nutrition-ai \
  --restart unless-stopped \
  -p 8000:8000 \
  -v /etc/sports-nutrition/ml_config.json:/app/ml_config.json:ro \
  -e DATABASE_HOST=staging-db.example.com \
  -e REDIS_HOST=staging-redis.example.com \
  -e LOG_LEVEL=info \
  $REGISTRY/sports-nutrition-ai:$VERSION

# Wait for service to be ready
echo "Waiting for AI Service to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✓ AI Service is ready"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 5
done
```

#### 3.3 Deploy Monitoring Stack

```bash
#!/bin/bash
# Deploy monitoring infrastructure

cd /opt/staging

# Copy monitoring configuration
cp docker-compose.monitoring.yml docker-compose.monitoring.staging.yml

# Adjust for staging
sed -i "s|'localhost'|'staging'|g" docker-compose.monitoring.staging.yml

# Deploy
docker-compose -f docker-compose.monitoring.staging.yml up -d

# Verify
docker-compose -f docker-compose.monitoring.staging.yml ps

echo "✓ Monitoring stack deployed"
echo "  - Prometheus: http://staging-monitor.example.com:9090"
echo "  - Grafana: http://staging-monitor.example.com:3001"
echo "  - AlertManager: http://staging-monitor.example.com:9093"
```

### Phase 4: Smoke Testing (30 minutes)

#### 4.1 API Endpoint Testing

```bash
#!/bin/bash
# Smoke tests for API endpoints

set -e

BASE_URL="http://staging-api.example.com/api/v1"

echo "=== Running Smoke Tests ==="

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s $BASE_URL/health | jq . || exit 1
echo "✓ PASS"

# Test 2: Recommendations endpoint
echo "Test 2: Get Recommendations"
curl -s \
  -H "X-User-ID: test-user-123" \
  "$BASE_URL/recommendations?goal=weight_loss&activity_level=moderate" | \
  jq '.data | length > 0' || exit 1
echo "✓ PASS"

# Test 3: Nutrition calculation
echo "Test 3: Nutrition Calculation"
curl -s \
  -H "X-User-ID: test-user-123" \
  "$BASE_URL/nutrition/calculate?age=30&weight=80&height=180&gender=M&activity_level=moderate" | \
  jq '.bmr > 0 and .tdee > 0' || exit 1
echo "✓ PASS"

# Test 4: AI recommendations
echo "Test 4: AI Recommendations"
curl -s -X POST \
  -H "X-User-ID: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "dietary_preferences": ["vegetarian"],
    "allergies": ["peanut"],
    "meal_count": 3
  }' \
  $BASE_URL/recommendations/ai | \
  jq '.recommendations | length > 0' || exit 1
echo "✓ PASS"

# Test 5: Meal plan generation
echo "Test 5: Meal Plan Generation"
curl -s -X POST \
  -H "X-User-ID: test-user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "meals_per_day": 3,
    "dietary_preferences": ["vegetarian"],
    "duration_days": 7
  }' \
  $BASE_URL/meal-plan/generate/ai | \
  jq '.meal_plan[0].meals | length > 0' || exit 1
echo "✓ PASS"

echo ""
echo "=== All Smoke Tests Passed ==="
```

#### 4.2 AI Service Testing

```bash
#!/bin/bash
# AI Service smoke tests

set -e

BASE_URL="http://staging-ai.example.com"

echo "=== AI Service Smoke Tests ==="

# Test 1: Health check
echo "Test 1: Health Check"
curl -s $BASE_URL/health | jq '.status == "healthy"' || exit 1
echo "✓ PASS"

# Test 2: Product scoring
echo "Test 2: Product Scoring"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "activity_level": "moderate",
    "products": [
      {"id": "prod_123", "name": "Chicken Breast", "calories": 165, "protein": 31, "fat": 3.6, "carbs": 0}
    ]
  }' \
  $BASE_URL/score-products | \
  jq '.scored_products[0].score > 0' || exit 1
echo "✓ PASS"

# Test 3: Meal planning
echo "Test 3: Meal Planning"
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "meals_per_day": 3,
    "calorie_target": 2000,
    "available_products": [
      {"id": "prod_1", "name": "Chicken", "calories": 165},
      {"id": "prod_2", "name": "Rice", "calories": 130}
    ]
  }' \
  $BASE_URL/plan-meals | \
  jq '.meals | length > 0' || exit 1
echo "✓ PASS"

echo ""
echo "=== All AI Service Tests Passed ==="
```

#### 4.3 Database Connectivity Testing

```bash
#!/bin/bash
# Database connection testing

echo "=== Database Tests ==="

STAGING_DB_HOST=staging-db.example.com

# Test 1: Connection
echo "Test 1: Database Connection"
pg_isready -h $STAGING_DB_HOST -U app_user || exit 1
echo "✓ PASS"

# Test 2: Query execution
echo "Test 2: Query Execution"
PGPASSWORD=$STAGING_DB_PASSWORD psql \
  -h $STAGING_DB_HOST \
  -U app_user \
  -d individual_sports_nutrition_staging \
  -c "SELECT COUNT(*) as user_count FROM users;" || exit 1
echo "✓ PASS"

# Test 3: Data integrity
echo "Test 3: Data Integrity"
PGPASSWORD=$STAGING_DB_PASSWORD psql \
  -h $STAGING_DB_HOST \
  -U app_user \
  -d individual_sports_nutrition_staging \
  << EOF || exit 1
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM meals) as meals,
  (SELECT COUNT(*) FROM meal_plans) as meal_plans;
EOF
echo "✓ PASS"

echo ""
echo "=== All Database Tests Passed ==="
```

### Phase 5: Monitoring Setup (30 minutes)

#### 5.1 Verify Monitoring Stack

```bash
#!/bin/bash
# Verify monitoring is working

echo "=== Monitoring Stack Verification ==="

# Check Prometheus
echo "Checking Prometheus..."
curl -s http://staging-monitor.example.com:9090/-/healthy | grep -q "OK" && \
  echo "✓ Prometheus is healthy" || echo "✗ Prometheus failed"

# Check AlertManager
echo "Checking AlertManager..."
curl -s http://staging-monitor.example.com:9093/-/healthy | grep -q "OK" && \
  echo "✓ AlertManager is healthy" || echo "✗ AlertManager failed"

# Check Grafana
echo "Checking Grafana..."
curl -s http://staging-monitor.example.com:3001/api/health | jq '.database == "ok"' && \
  echo "✓ Grafana is healthy" || echo "✗ Grafana failed"

# Verify metrics are being collected
echo "Checking metric collection..."
curl -s 'http://staging-monitor.example.com:9090/api/v1/query?query=up' | \
  jq '.data.result | length > 0' && \
  echo "✓ Metrics are being collected" || echo "✗ No metrics"

echo ""
echo "=== Monitoring Stack Ready ==="
echo "Dashboards:"
echo "  - Main: http://staging-monitor.example.com:3001/d/sports-nutrition-main"
echo "  - Prometheus: http://staging-monitor.example.com:9090"
echo "  - AlertManager: http://staging-monitor.example.com:9093"
```

#### 5.2 Test Alerting

```bash
#!/bin/bash
# Test alert routing

echo "=== Testing Alert Configuration ==="

# Trigger test alert in Prometheus
curl -X POST http://staging-monitor.example.com:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "status": "firing",
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert from staging deployment",
      "description": "This is a test to verify alerting is working"
    },
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }]'

echo "✓ Test alert sent"
echo "Check: http://staging-monitor.example.com:9093 for alert receipt"
echo "Check: Email/Slack for notification delivery"
```

### Phase 6: 2-Hour Monitoring Period

#### 6.1 Real-Time Monitoring

```bash
#!/bin/bash
# Monitor services in real-time

echo "=== Starting 2-Hour Monitoring Period ==="
echo "Monitoring until: $(date -d '+2 hours' '+%H:%M:%S')"

# Create monitoring log
MONITOR_LOG="staging-deployment-$(date +%Y%m%d_%H%M%S).log"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Health checks
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://staging-api.example.com/api/v1/health)
  AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://staging-ai.example.com/health)
  DB_STATUS=$(pg_isready -h staging-db.example.com -U app_user 2>&1 | grep "accepting" > /dev/null && echo "200" || echo "500")
  
  # Log status
  echo "[$TIMESTAMP] API: $API_STATUS | AI: $AI_STATUS | DB: $DB_STATUS" | tee -a $MONITOR_LOG
  
  # Check for errors
  if [ "$API_STATUS" != "200" ] || [ "$AI_STATUS" != "200" ] || [ "$DB_STATUS" != "200" ]; then
    echo "[$TIMESTAMP] ⚠ WARNING: Service health degraded" | tee -a $MONITOR_LOG
  fi
  
  sleep 60
done
```

#### 6.2 Log Monitoring

```bash
#!/bin/bash
# Monitor application logs for errors

echo "=== Monitoring Application Logs ==="

# Follow backend-api logs
echo "Backend API logs:"
tail -f /var/log/sports-nutrition/backend-api/error.log | \
  while read line; do
    echo "[$(date '+%H:%M:%S')] API ERROR: $line"
  done &

# Follow AI service logs
echo "AI Service logs:"
tail -f /var/log/sports-nutrition/ai-service/error.log | \
  while read line; do
    echo "[$(date '+%H:%M:%S')] AI ERROR: $line"
  done &

# Follow Prometheus alerts
echo "Active alerts:"
watch -n 10 'curl -s http://staging-monitor.example.com:9090/api/v1/alerts | jq ".data.alerts | select(length > 0)"'
```

## Rollback Procedure

If issues are detected during monitoring:

### Quick Rollback (< 5 minutes)

```bash
#!/bin/bash
# Quick rollback to previous version

echo "=== INITIATING ROLLBACK ==="

# Restore compose file
cp docker-compose.yml.backup-$(ls -t docker-compose.yml.backup-* | head -1 | cut -d- -f2-) \
  docker-compose.yml

# Restart services with previous version
docker-compose pull
docker-compose up -d

# Verify rollback
echo "Waiting for services to be ready..."
sleep 30
bash scripts/smoke-test.sh

if [ $? -eq 0 ]; then
  echo "✓ Rollback completed successfully"
else
  echo "✗ Rollback verification failed - CHECK MANUALLY"
  exit 1
fi
```

### Database Rollback

```bash
#!/bin/bash
# Restore from pre-deployment backup

BACKUP_FILE="/backups/staging/individual_sports_nutrition_staging_pre-v1.1.0_*.sql.gz"

echo "=== DATABASE ROLLBACK ==="
echo "Restoring from: $(ls -t $BACKUP_FILE | head -1)"

PGPASSWORD=$STAGING_DB_PASSWORD psql \
  -h staging-db.example.com \
  -U app_user \
  -d individual_sports_nutrition_staging \
  < <(gunzip -c $(ls -t $BACKUP_FILE | head -1))

echo "✓ Database restored"
```

## Success Criteria

### All of the following must be true:

- [ ] All API endpoints responding with 200 status
- [ ] AI Service generating recommendations
- [ ] Database queries completing < 500ms
- [ ] No error rate spikes (< 0.5%)
- [ ] No database connection errors
- [ ] Redis cache functioning
- [ ] Monitoring alerts configured and tested
- [ ] Backup/restore procedures verified
- [ ] No memory leaks detected (stable usage over 2 hours)
- [ ] CPU usage stable (< 70%)

## Post-Deployment

### 1. Sign-Off

```bash
# Document successful deployment
cat > /opt/staging/DEPLOYMENT_LOG.md << 'EOF'
# Staging Deployment: v1.1.0-staging

**Date:** $(date)
**Duration:** 3.5 hours
**Status:** ✓ SUCCESSFUL

## Tests Passed
- API smoke tests: 5/5 ✓
- AI service tests: 3/3 ✓
- Database tests: 3/3 ✓
- Monitoring verification: ✓
- 2-hour stability monitoring: ✓

## Issues Encountered
None

## Rollback Status
No rollback needed

## Next Steps
1. Schedule production deployment
2. Update release notes
3. Notify stakeholders
EOF
```

### 2. Notification

Email template:
```
Subject: Staging Deployment Complete - v1.1.0-staging

Staging deployment of Week 1 stabilization improvements completed successfully.

✓ All smoke tests passed
✓ Monitoring and alerting configured
✓ 2-hour stability period completed

Testing for 48 hours on staging. Production deployment scheduled for [DATE].

Visit: http://staging-api.example.com/api/v1/health
Monitoring: http://staging-monitor.example.com:3001

- Backend API v1.1.0-staging
- AI Service v1.1.0-staging
- Database Backup: functional
- Monitoring Stack: operational
```

### 3. Schedule Production Deployment

```bash
# Create calendar event
# Title: Production Deployment - Week 1 Stabilization
# Time: [Scheduled date/time]
# Duration: 4 hours
# Attendees: DevOps, Backend Lead, DBA, On-call Engineer
# 
# Agenda:
# 1. Final staging validation (30 min)
# 2. Pre-deployment backup (15 min)
# 3. Production deployment (30 min)
# 4. Smoke testing (30 min)
# 5. Monitoring (2 hours)
# 6. Sign-off and documentation (15 min)
```

## Related Documentation

- [Week 1 Action Plan](./PROJECT_ANALYSIS_REPORT.md#week-1-stabilization)
- [Testing Guide](../backend-api/TESTING_GUIDE.md)
- [Monitoring Setup](./MONITORING_SETUP.md)
- [Database Backup/Restore](./DATABASE_BACKUP_RESTORE.md)
- [API Contracts](./API_CONTRACTS.md)

## Support

For deployment issues during staging:
1. Check application logs
2. Review monitoring dashboards
3. Run health checks manually
4. Escalate to DevOps team if needed
5. Initiate rollback if critical issues found

---

**Deployment completed by:** [Name]
**Date:** [Date]
**Time:** [Time]
**Sign-off:** ✓
