# Team Handoff & Operations Guide

**Version:** 1.0.0  
**Created:** December 21, 2025  
**Audience:** DevOps, Backend Engineers, Tech Leads

## Table of Contents
1. [Pre-Handoff Checklist](#pre-handoff-checklist)
2. [System Architecture Overview](#system-architecture-overview)
3. [On-Call Runbook](#on-call-runbook)
4. [Common Operations](#common-operations)
5. [Incident Response](#incident-response)
6. [Documentation Index](#documentation-index)
7. [Contact & Escalation](#contact--escalation)

---

## Pre-Handoff Checklist

### Documentation Review (Day 1)
- [ ] Read [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)
- [ ] Read [CICD_PIPELINE.md](CICD_PIPELINE.md)
- [ ] Read [HEALTH_CHECKS.md](HEALTH_CHECKS.md)
- [ ] Read [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md)
- [ ] Review [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)
- [ ] Review [PERFORMANCE_TESTING_GUIDE.md](PERFORMANCE_TESTING_GUIDE.md)
- [ ] Review [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md)

### Access Setup (Day 1)
- [ ] GitHub repository access with write permissions
- [ ] AWS IAM console access (production account)
- [ ] Slack integration for CI/CD notifications
- [ ] PagerDuty account for on-call rotation
- [ ] CloudWatch dashboard access
- [ ] Database admin credentials in 1Password/Vault
- [ ] Docker registry (ghcr.io) credentials
- [ ] SSH keys for direct server access (if applicable)

### Local Environment Setup (Day 2)
```bash
# Clone repository
git clone https://github.com/organization/individual-sports-nutrition.git
cd individual-sports-nutrition

# Setup backend locally
cd backend-api
npm install
cp .env.example .env.local

# Database setup (local)
brew install postgresql
createdb individual_sports_nutrition
npm run db:migrate

# Redis setup (local)
brew install redis
redis-server

# Start development server
npm run dev
```

### System Access Verification (Day 2)
```bash
# Test AWS access
aws sts get-caller-identity

# Test ECS cluster access
aws ecs list-clusters --region us-east-1

# Test database access
psql postgresql://postgres:password@prod-db.rds.amazonaws.com:5432/individual_sports_nutrition -c "SELECT VERSION();"

# Test Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification"}' \
  $SLACK_WEBHOOK
```

### Knowledge Transfer Session (Day 3)
Schedule 1-hour pairing session with outgoing team member:
- [ ] Live walkthrough of CI/CD pipeline
- [ ] Demonstration of deployment process
- [ ] Review of recent incidents and resolutions
- [ ] Q&A on architecture and design decisions

---

## System Architecture Overview

### High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                   │
│              (Web App, Mobile App, External APIs)                │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS/REST
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                  AWS LOAD BALANCER (ALB)                         │
│           ✓ SSL/TLS termination                                  │
│           ✓ Auto-scaling                                         │
│           ✓ Health checks (port 3000/health)                     │
└──────────────────┬───────────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      ↓                         ↓
  ┌─────────────────┐   ┌─────────────────┐
  │ API Container 1 │   │ API Container 2 │  (ECS Fargate)
  │ Node.js 18      │   │ Node.js 18      │  ✓ Auto-scaling
  │ Port 3000       │   │ Port 3000       │  ✓ Health checks
  └────────┬────────┘   └────────┬────────┘  ✓ Rolling updates
           │                     │
           └──────────┬──────────┘
                      │
        ┌─────────────┴─────────────┐
        ↓                           ↓
    ┌────────────────┐      ┌─────────────┐
    │  PostgreSQL    │      │    Redis    │
    │  RDS (Primary) │      │ ElastiCache │
    │  + Standby     │      │   Cluster   │
    │  ✓ Multi-AZ    │      │ ✓ 7GB RAM   │
    │  ✓ Automated   │      │ ✓ Cluster   │
    │    backup      │      │   mode      │
    └────────────────┘      └─────────────┘
```

### Component Details

| Component | Technology | Purpose | Location |
|---|---|---|---|
| **Load Balancer** | AWS ALB | Route traffic, SSL termination | us-east-1a, us-east-1b |
| **API Servers** | Node.js 18, ECS Fargate | Business logic | Container registry |
| **Database** | PostgreSQL 15 RDS | Data persistence | Multi-AZ |
| **Cache** | Redis 7 ElastiCache | Session, rate limit, cache | Multi-AZ |
| **Storage** | S3 | Meal images, backups | us-east-1 |
| **Logging** | CloudWatch | Application logs | CloudWatch Logs |
| **Monitoring** | CloudWatch + Sentry | Metrics, errors | AWS Console |

---

## On-Call Runbook

### Getting Started as On-Call

**Duration:** 1 week rotation  
**Escalation Path:** L1 (on-call) → L2 (tech lead) → L3 (director)

### Daily Checks (Start of Shift)

```bash
#!/bin/bash
# daily-health-check.sh

set -e

echo "=== Daily Health Checks ==="

# 1. Check API health
echo "1️⃣ Checking API health..."
curl -f https://api.yourdomain.com/health | jq '.'

# 2. Check error rates in Sentry
echo "2️⃣ Checking error rates..."
echo "  → Open: https://sentry.io/organizations/your-org/issues/"
echo "  → Check: Any new errors in last 24 hours?"

# 3. Check CloudWatch alarms
echo "3️⃣ Checking CloudWatch alarms..."
aws cloudwatch describe-alarms \
  --query 'MetricAlarms[?StateValue==`ALARM`]' \
  --region us-east-1

# 4. Check ECS service
echo "4️⃣ Checking ECS service..."
aws ecs describe-services \
  --cluster production \
  --services api \
  --region us-east-1

# 5. Check database
echo "5️⃣ Checking database..."
psql -h prod-db.rds.amazonaws.com -U postgres -d individual_sports_nutrition \
  -c "SELECT NOW(); SELECT version();"

echo "✅ All checks passed"
```

### Incident Response Flowchart

```
Incident Reported (Slack/Alert)
│
├─ 1. Acknowledge receipt
│  └─ Post: "Investigating issue..."
│
├─ 2. Assess severity
│  ├─ Critical (API down) → Skip to 4
│  ├─ Major (errors > 5%) → 4
│  ├─ Minor (feature broken) → 5
│  └─ Info (slow response) → 5
│
├─ 3. Check error source
│  ├─ Application errors → check logs in CloudWatch
│  ├─ Database errors → check RDS metrics
│  ├─ Cache errors → check ElastiCache
│  └─ Infrastructure → check ECS/ALB
│
├─ 4. Critical: Execute recovery
│  ├─ Rolling restart: aws ecs update-service --force-new-deployment
│  ├─ Rollback: See ROLLBACK_PROCEDURES.md
│  ├─ Scale down/up: Adjust ECS desired count
│  └─ Clear cache: redis-cli FLUSHALL
│
├─ 5. Update status page
│  └─ https://status.yourdomain.com
│
└─ 6. Post-mortem (next day)
   ├─ Analyze logs and metrics
   ├─ Document root cause
   ├─ Implement fix
   └─ Update runbooks
```

---

## Common Operations

### Deployment Operations

#### Promote develop → main (Release)

```bash
#!/bin/bash
# promote-to-production.sh

set -e

BRANCH="develop"
TARGET="main"

echo "📦 Promoting $BRANCH to $TARGET"

# 1. Fetch latest
git fetch origin

# 2. Create release branch
git checkout -b release/v$(date +%Y.%m.%d) origin/$BRANCH

# 3. Create PR to main
gh pr create \
  --base $TARGET \
  --title "Release: v$(date +%Y.%m.%d)" \
  --body "Automatic release from $BRANCH to $TARGET"

echo "✅ Release PR created"
echo "   → Merge in GitHub to trigger production deployment"
```

#### Manual Deployment (Emergency)

```bash
#!/bin/bash
# manual-deploy.sh - Deploy specific version to production

set -e

VERSION=$1
CLUSTER="production"
TASK_FAMILY="api-production"

if [ -z "$VERSION" ]; then
  echo "Usage: ./manual-deploy.sh v1.2.3"
  exit 1
fi

echo "🚀 Deploying $VERSION to production"

# Get task definition
aws ecs describe-task-definition \
  --task-definition ${TASK_FAMILY} \
  --region us-east-1 \
  --query 'taskDefinition' > task-def.json

# Update image
sed -i "s|ghcr.io/.*:.*|ghcr.io/org/api:$VERSION|g" task-def.json

# Register new task definition
REVISION=$(aws ecs register-task-definition \
  --cli-input-json file://task-def.json \
  --region us-east-1 \
  --query 'taskDefinition.revision' \
  --output text)

# Update service
aws ecs update-service \
  --cluster $CLUSTER \
  --service api \
  --task-definition ${TASK_FAMILY}:${REVISION} \
  --region us-east-1

echo "✅ Deployment initiated"
echo "   Version: $VERSION"
echo "   Task Revision: $REVISION"
```

### Database Operations

#### Database Backup (Manual)

```bash
#!/bin/bash
# backup-database.sh

set -e

DB_INSTANCE="prod-postgresql"
BACKUP_ID="manual-$(date +%Y-%m-%d-%H%M%S)"

echo "💾 Starting database backup..."

aws rds create-db-snapshot \
  --db-instance-identifier $DB_INSTANCE \
  --db-snapshot-identifier $BACKUP_ID \
  --region us-east-1

echo "✅ Backup initiated: $BACKUP_ID"
echo "   Monitor at: https://console.aws.amazon.com/rds/"
```

#### Database Migration (Manual)

```bash
#!/bin/bash
# migrate-database.sh

set -e

DB_HOST=${DATABASE_HOST:-prod-db.rds.amazonaws.com}
MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
  echo "Usage: ./migrate-database.sh 005_my_migration.sql"
  exit 1
fi

echo "🔄 Running migration: $MIGRATION_FILE"

# Create backup before migration
BACKUP_ID="pre-migration-$(date +%s)"
aws rds create-db-snapshot \
  --db-instance-identifier prod-postgresql \
  --db-snapshot-identifier $BACKUP_ID \
  --region us-east-1

echo "   Backup created: $BACKUP_ID"

# Run migration
psql -h $DB_HOST -U postgres -d individual_sports_nutrition \
  -f "database/migrations/$MIGRATION_FILE"

echo "✅ Migration completed"
```

### Cache Operations

#### Clear Redis Cache

```bash
#!/bin/bash
# clear-cache.sh

set -e

REDIS_HOST=${REDIS_HOST:-prod-redis.xxxxx.ng.0001.use1.cache.amazonaws.com}
REDIS_PORT=${REDIS_PORT:-6379}

echo "🗑️  Clearing Redis cache..."

redis-cli -h $REDIS_HOST -p $REDIS_PORT FLUSHALL

echo "✅ Cache cleared"
```

#### Analyze Cache Usage

```bash
#!/bin/bash
# analyze-cache.sh

set -e

REDIS_HOST=${REDIS_HOST:-prod-redis.xxxxx.ng.0001.use1.cache.amazonaws.com}

echo "📊 Cache Analysis"

redis-cli -h $REDIS_HOST INFO memory
redis-cli -h $REDIS_HOST INFO stats
redis-cli -h $REDIS_HOST --scan --pattern '*' | wc -l
```

### Log Analysis

#### View Application Logs

```bash
#!/bin/bash
# tail-logs.sh

set -e

LOG_GROUP="/ecs/api-production"
STREAM_PREFIX="ecs/api-production"

echo "📋 Tailing application logs..."

aws logs tail $LOG_GROUP \
  --log-stream-names "$STREAM_PREFIX" \
  --follow \
  --format short \
  --region us-east-1
```

#### Search Logs for Error

```bash
#!/bin/bash
# search-logs.sh

set -e

LOG_GROUP="/ecs/api-production"
QUERY=$1

if [ -z "$QUERY" ]; then
  echo "Usage: ./search-logs.sh 'ERROR'"
  exit 1
fi

echo "🔍 Searching logs for: $QUERY"

aws logs filter-log-events \
  --log-group-name $LOG_GROUP \
  --filter-pattern "$QUERY" \
  --region us-east-1 \
  --query 'events[*].[timestamp,message]' \
  --output table
```

---

## Incident Response

### Severity Levels

| Level | Impact | Response Time | Action |
|---|---|---|---|
| **P1** | Production down, 100% users affected | 5 min | Page on-call engineer + tech lead |
| **P2** | Service degraded, >10% users affected | 15 min | Page on-call engineer |
| **P3** | Limited impact, <10% users affected | 1 hour | Ticket created, scheduled fix |
| **P4** | Minor issue, no user impact | Next sprint | Backlog item |

### Post-Incident Procedure

1. **Within 1 hour:** Incident report created in Slack (use template below)
2. **Within 24 hours:** Root cause analysis completed
3. **Within 3 days:** Fix implemented and deployed
4. **Within 5 days:** Post-mortem meeting scheduled

#### Incident Report Template

```markdown
# Incident Report: [Title]

**Severity:** P1/P2/P3/P4  
**Duration:** HH:MM  
**Start Time:** [UTC timestamp]  
**End Time:** [UTC timestamp]

## Summary
[1-2 sentence description]

## Impact
- Users affected: [X%]
- Services affected: [List]
- Revenue impact: [If applicable]

## Root Cause
[What caused the issue]

## Timeline
- 14:30 - Alert triggered
- 14:35 - On-call engineer acknowledged
- 14:40 - Root cause identified
- 14:45 - Fix deployed
- 14:50 - System recovered

## Resolution
[How it was fixed]

## Prevention
[Changes to prevent recurrence]

## Action Items
- [ ] Implement fix
- [ ] Add monitoring
- [ ] Update docs
- [ ] Team training
```

---

## Documentation Index

### Critical Documents (Read First)
1. [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) - Infrastructure setup
2. [CICD_PIPELINE.md](CICD_PIPELINE.md) - CI/CD workflow
3. [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md) - Emergency procedures
4. [HEALTH_CHECKS.md](HEALTH_CHECKS.md) - Monitoring setup

### Testing Guides
5. [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md) - End-to-end testing
6. [PERFORMANCE_TESTING_GUIDE.md](PERFORMANCE_TESTING_GUIDE.md) - Performance tests
7. [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) - Baseline metrics

### Architecture Documents
8. [DEPLOYMENT_ENVIRONMENT.md](DEPLOYMENT_ENVIRONMENT.md) - Environment config
9. Backend API README.md - Code structure overview

### Useful External Links
- **GitHub Repository:** https://github.com/organization/repo
- **AWS Console:** https://console.aws.amazon.com
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/
- **Error Tracking:** https://sentry.io
- **Status Page:** https://status.yourdomain.com
- **Slack Channel:** #engineering-incidents

---

## Contact & Escalation

### On-Call Schedule
**PagerDuty:** [Link to schedule]

| Week | L1 On-Call | L2 Tech Lead | L3 Director |
|---|---|---|---|
| Week of Dec 21 | engineer1 | lead1 | director1 |
| Week of Dec 28 | engineer2 | lead1 | director1 |

### Escalation Matrix

```
Initial Issue (On-Call L1)
    ↓ (No resolution in 15 min)
Tech Lead L2
    ↓ (No resolution in 30 min)
Engineering Director L3
    ↓ (No resolution in 1 hour)
CTO / Executive
```

### Communication Channels

| Channel | Purpose | Response Time |
|---|---|---|
| **Slack #incidents** | Real-time incident updates | < 5 min |
| **PagerDuty** | Critical alerts | < 5 min |
| **Email** | Non-urgent notifications | < 1 hour |
| **Status Page** | Public communication | < 15 min |

### Key Contacts

```
🔧 DevOps Lead
   Name: [Name]
   Slack: @devops-lead
   Phone: [Phone]
   Email: [Email]

👨‍💼 Tech Lead
   Name: [Name]
   Slack: @tech-lead
   Phone: [Phone]
   Email: [Email]

🏛️ Engineering Director
   Name: [Name]
   Slack: @eng-director
   Phone: [Phone]
   Email: [Email]

📞 AWS Support (Enterprise)
   Phone: 1-844-AWS-SUPPORT
   Email: support@aws.amazon.com
```

---

## Quick Reference Commands

```bash
# Health checks
curl https://api.yourdomain.com/health | jq '.'

# View logs
aws logs tail /ecs/api-production --follow

# Check ECS status
aws ecs describe-services --cluster production --services api

# Check DB health
psql -h prod-db.rds.amazonaws.com -U postgres -d individual_sports_nutrition -c "SELECT NOW();"

# Restart API service
aws ecs update-service --cluster production --service api --force-new-deployment

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace CustomMetrics \
  --metric-name ErrorRate \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

---

**✅ Handoff Complete**  
**Document Version:** 1.0.0  
**Last Updated:** December 21, 2025  
**Maintainer:** DevOps Team
