# Production Deployment Guide

**Version:** 1.0.0  
**Last Updated:** December 21, 2025  
**Status:** Ready for Production Deployment

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Infrastructure Requirements](#infrastructure-requirements)
3. [Deployment Architecture](#deployment-architecture)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Security Review
- [ ] All secrets stored in environment variables (no hardcoded credentials)
- [ ] Database passwords meet complexity requirements (min 16 characters)
- [ ] JWT secret is unique and >= 32 characters
- [ ] SSL/TLS certificates valid for domain
- [ ] CORS policy configured for frontend domains only
- [ ] Rate limiting enabled on public endpoints
- [ ] API keys rotated and non-production keys revoked

### Code Quality
- [ ] All unit tests passing (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Performance tests baseline established (`npm run test:perf`)
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Code review completed by 2+ team members
- [ ] All PRs merged to `main` branch

### Infrastructure
- [ ] Production PostgreSQL database provisioned
- [ ] Redis cache cluster provisioned
- [ ] Domain name registered and DNS configured
- [ ] SSL/TLS certificate obtained (Let's Encrypt or CA)
- [ ] Load balancer configured
- [ ] Backup solution configured
- [ ] Monitoring and alerting setup complete

### Data Preparation
- [ ] Database backups in place
- [ ] Migration scripts tested on staging
- [ ] Initial seed data prepared and validated
- [ ] Rollback plan documented and tested

---

## Infrastructure Requirements

### Minimum Resources (Small Scale - 10k DAU)

| Component | Specification | Rationale |
|-----------|---------------|-----------|
| **API Servers** | 2x t3.medium (2 CPU, 4GB RAM) | High availability + auto-scaling |
| **PostgreSQL** | db.t3.medium (2 CPU, 4GB RAM) | Handles ~1000 concurrent connections |
| **Redis** | cache.t3.small (1 CPU, 1.5GB) | Session + cache layer |
| **Load Balancer** | AWS ALB or equivalent | Distribute traffic, SSL termination |
| **Storage** | 100GB PostgreSQL + 20GB backups | Data + daily incremental backups |
| **Network** | VPC with public + private subnets | Security segmentation |

### Recommended Resources (Production - 100k+ DAU)

| Component | Specification | Rationale |
|-----------|---------------|-----------|
| **API Servers** | 3-5x t3.large (2 CPU, 8GB RAM) | Horizontal scaling, rolling updates |
| **PostgreSQL** | db.r5.xlarge (4 CPU, 32GB RAM) | Handles 5000+ concurrent connections |
| **Redis Cluster** | 3x cache.r5.large | High availability, replication |
| **Load Balancer** | ALB with auto-scaling | Distribute 1000s of requests/sec |
| **Storage** | 500GB+ PostgreSQL + 100GB backups | Retention policy: 30-day backups |
| **CDN** | CloudFront or Cloudflare | Static assets, API caching |

---

## Deployment Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Users                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
        ┌──────────────────────────┐
        │   Load Balancer (ALB)    │
        │  • SSL Termination       │
        │  • Traffic Distribution  │
        │  • Health Checks         │
        └────────┬─────────────────┘
                 │
        ┌────────┴──────────┐
        ▼                   ▼
    ┌────────┐          ┌────────┐
    │ API #1 │          │ API #2 │  (Auto-scaling group)
    │ TS/Node│          │ TS/Node│
    │:3000   │          │:3000   │
    └────┬───┘          └────┬───┘
         │                   │
    ┌────┴───────────────────┴────┐
    │     Redis Cache Cluster      │
    │  (Session + Rate Limiting)   │
    └────────┬─────────────────────┘
             │
    ┌────────▼──────────────┐
    │  PostgreSQL Database  │
    │  (Primary + Standby)  │
    │  • Automated Backups  │
    │  • Point-in-time RTO  │
    └───────────────────────┘
```

### Component Responsibilities

**Load Balancer (ALB)**
- Route HTTPS traffic to healthy instances
- Perform SSL/TLS termination
- Health check: GET `/health` every 30 seconds
- Auto-scale API servers based on CPU/memory

**API Servers**
- Run Node.js/TypeScript application
- Connect to PostgreSQL and Redis
- Handle business logic and API endpoints
- Report metrics to monitoring system

**PostgreSQL**
- Primary database for all persistent data
- Standby replica for failover (RTO < 1 minute)
- Automated backups: daily + 30-day retention
- Point-in-time recovery enabled

**Redis**
- Cache layer for frequently accessed data
- Session store for JWT tokens
- Rate limiting counters
- Pub/sub for real-time updates

---

## Step-by-Step Deployment

### Phase 1: Environment Preparation

#### 1.1 Set Up Infrastructure

**AWS Example (Terraform or CloudFormation):**
```bash
# 1. Create VPC, subnets, security groups
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# 2. Create security groups
aws ec2 create-security-group --group-name api-sg --vpc-id vpc-xxx
aws ec2 authorize-security-group-ingress --group-id sg-xxx --protocol tcp --port 3000 --source-group sg-xxx

# 3. Create RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier prod-postgresql \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username postgres \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 100 \
  --backup-retention-period 30

# 4. Create ElastiCache Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id prod-redis \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-nodes 1
```

#### 1.2 Prepare Environment Variables

Create `.env.production` file (never commit to git):

```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@prod-db.region.rds.amazonaws.com:5432/individual_sports_nutrition
DB_PASSWORD=<GENERATE_STRONG_PASSWORD>
DB_POOL_SIZE=20
DB_POOL_TIMEOUT=30000

# Cache
REDIS_URL=redis://:${REDIS_PASSWORD}@prod-redis.region.cache.amazonaws.com:6379/0
REDIS_PASSWORD=<GENERATE_STRONG_PASSWORD>
REDIS_TTL=3600

# Authentication
JWT_SECRET=<GENERATE_32_CHAR_RANDOM_STRING>
JWT_EXPIRES_IN=7d

# Security
CORS_ORIGIN=https://www.yourdomain.com,https://yourdomain.com
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
LOG_LEVEL=info

# Optional: Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<SENDGRID_API_KEY>
```

**Store in AWS Secrets Manager or similar:**
```bash
aws secretsmanager create-secret \
  --name prod/api-env \
  --secret-string file://env.json
```

### Phase 2: Database Setup

#### 2.1 Run Migrations

```bash
# Connect to production database
psql postgresql://postgres:${DB_PASSWORD}@prod-db.region.rds.amazonaws.com:5432/individual_sports_nutrition

# Run migrations in order
psql -f database/migrations/001_initial_schema.sql
psql -f database/migrations/002_stores_and_prices.sql
psql -f database/migrations/003_ingredients_and_meals.sql
psql -f database/migrations/004_serbian_localization.sql

# Verify schema
\dt  # List tables
\d meals  # Describe meals table
```

#### 2.2 Seed Initial Data

```bash
# If you have seed scripts
npm run seed:production

# Or manually insert essential data
psql -f database/seeders/initial_data.sql
```

#### 2.3 Create Database Backups

```bash
# Create baseline backup
pg_dump -h prod-db.region.rds.amazonaws.com -U postgres individual_sports_nutrition > backup_$(date +%Y%m%d_%H%M%S).sql

# Enable automated backups (usually done via AWS console)
# Backup retention: 30 days
# Backup window: 03:00 UTC daily
```

### Phase 3: Application Deployment

#### 3.1 Build Docker Image

```bash
cd backend-api

# Build image
docker build -t individual-sports-nutrition:1.0.0 .

# Tag for registry (e.g., ECR)
docker tag individual-sports-nutrition:1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/individual-sports-nutrition:1.0.0

# Push to registry
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/individual-sports-nutrition:1.0.0
```

#### 3.2 Deploy to Kubernetes / ECS / App Engine

**Example: AWS ECS with Fargate**

```bash
# Create ECS task definition
cat > task-definition.json <<EOF
{
  "family": "api-production",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/individual-sports-nutrition:1.0.0",
      "portMappings": [{"containerPort": 3000}],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/api-production",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster production \
  --service-name api \
  --task-definition api-production:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=DISABLED}"

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/production/api \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name api-scaling \
  --service-namespace ecs \
  --resource-id service/production/api \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}"
```

**Example: Docker Compose (Single Server)**

```bash
# On production server
cd /opt/individual-sports-nutrition

# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  api:
    image: individual-sports-nutrition:1.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
    depends_on:
      - postgres
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

volumes:
  postgres_data:
EOF

# Start services
docker-compose up -d

# Verify
docker-compose logs -f api
```

#### 3.3 Configure Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name api-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-protocol HTTP \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 2

# Create ALB
aws elbv2 create-load-balancer \
  --name api-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-alb

# Create listener (HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Post-Deployment Verification

### Phase 1: Immediate Checks (First 5 minutes)

```bash
# 1. Verify API is responding
curl -I https://api.yourdomain.com/health
# Expected: HTTP 200 OK

# 2. Check application logs
docker logs <container_id>
# Expected: "Server started on port 3000"

# 3. Verify database connectivity
curl https://api.yourdomain.com/api/health
# Expected: { "status": "healthy", "database": "connected", "redis": "connected" }

# 4. Check load balancer status
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...
# Expected: HealthState = healthy for all targets
```

### Phase 2: Functional Tests (5-30 minutes)

```bash
# Run E2E tests against production (if available)
npm run test:e2e -- --baseURL=https://api.yourdomain.com

# Manual API tests
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"..."}'

# Verify JWT token works
JWT_TOKEN=$(curl -X POST https://api.yourdomain.com/api/auth/login ... | jq -r .token)
curl -H "Authorization: Bearer $JWT_TOKEN" https://api.yourdomain.com/api/profile
```

### Phase 3: Performance Baseline (30+ minutes)

```bash
# Run k6 performance tests against production
k6 run -e BASE_URL=https://api.yourdomain.com \
  --vus 50 --duration 5m \
  backend-api/performance-tests/api.load.test.js

# Expected results:
# - p95 response time < 500ms
# - error rate < 1%
# - successful auth tokens
```

### Phase 4: Monitoring Setup Verification

```bash
# Verify CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=api Name=ClusterName,Value=production \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average,Maximum

# Verify alerting is active
aws cloudwatch describe-alarms --alarm-names api-high-cpu api-high-errors

# Check logs in CloudWatch
aws logs tail /ecs/api-production --follow
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| **API Response Time (p95)** | > 1000ms | Page on-call, investigate DB queries |
| **Error Rate** | > 1% | Page on-call, check logs for exceptions |
| **Database Connections** | > 80% of pool | Page on-call, add connection scaling |
| **CPU Usage** | > 80% | Auto-scale, reduce batch job load |
| **Memory Usage** | > 85% | Page on-call, investigate memory leak |
| **Disk Space** | > 80% | Page on-call, expand storage |
| **Redis Evictions** | > 0/sec | Increase Redis memory or TTL |

### Alert Configuration (CloudWatch)

```bash
# High CPU alert
aws cloudwatch put-metric-alarm \
  --alarm-name api-high-cpu \
  --alarm-description "API CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:prod-alerts

# High error rate alert
aws cloudwatch put-metric-alarm \
  --alarm-name api-high-errors \
  --alarm-description "API error rate > 1%" \
  --metric-name ErrorRate \
  --namespace API \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:xxx:prod-alerts
```

### Log Aggregation (ELK / Datadog / New Relic)

```bash
# Example: Send logs to Datadog
npm install --save @datadog/browser-logs

# In application
import { datadogRum } from '@datadog/browser-rum'
datadogRum.init({
  applicationId: 'xxx',
  clientToken: 'yyy',
  site: 'datadoghq.com',
  service: 'api',
  env: 'production',
  version: '1.0.0',
})
```

---

## Troubleshooting

### Issue: Deployment Fails with Connection Timeout

**Symptoms:** ECS tasks fail to connect to RDS

**Solutions:**
1. Verify security group rules allow port 5432 from API servers
2. Check RDS is in correct VPC and subnet
3. Verify database credentials in secrets manager
4. Check VPC routing table for database subnet

```bash
# Test connectivity
docker exec <container> psql -h <db-host> -U postgres -c "SELECT 1"
```

### Issue: API Returns 503 Service Unavailable

**Symptoms:** All requests return 503 errors

**Solutions:**
1. Check application logs: `docker logs <container>`
2. Verify database connectivity: `curl /health`
3. Verify Redis connectivity: Check REDIS_URL in environment
4. Check load balancer target health: `aws elbv2 describe-target-health`

```bash
# View detailed error
curl -v https://api.yourdomain.com/health
```

### Issue: High Memory Usage / Crashes

**Symptoms:** ECS tasks restart frequently

**Solutions:**
1. Check for memory leaks: `node --inspect=0.0.0.0:9229 src/index.ts`
2. Increase container memory allocation
3. Check for N+1 database queries in logs
4. Profile with clinic.js: `clinic doctor -- node src/index.ts`

### Issue: Database Connection Pool Exhausted

**Symptoms:** "ECONNREFUSED" or "no more connections available"

**Solutions:**
1. Increase `DB_POOL_SIZE` in environment
2. Check for connection leaks in code
3. Monitor active connections: `SELECT count(*) FROM pg_stat_activity`
4. Increase database max_connections parameter

```sql
-- Check current connections
SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;

-- Increase max connections (requires restart)
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

---

## Rollback Procedures

See [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md) for detailed rollback steps.

**Quick Rollback:**
```bash
# Revert to previous image
aws ecs update-service \
  --cluster production \
  --service api \
  --force-new-deployment

# Or redeploy specific version
aws ecs update-service \
  --cluster production \
  --service api \
  --task-definition api-production:1 \
  --force-new-deployment
```

---

## Additional Resources

- [Database Migrations Guide](./docs/database/MIGRATIONS.md)
- [Health Checks & Monitoring](./HEALTH_CHECKS.md)
- [Rollback Procedures](./ROLLBACK_PROCEDURES.md)
- [Environment Configuration](./DEPLOYMENT_ENVIRONMENT.md)
- [CI/CD Pipeline](./CICD_PIPELINE.md)

---

**Status:** ✅ Production Ready  
**Last Review:** December 21, 2025  
**Next Review:** Q1 2026
