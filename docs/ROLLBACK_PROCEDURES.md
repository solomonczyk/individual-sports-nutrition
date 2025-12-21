# Rollback Procedures

**Version:** 1.0.0  
**Last Updated:** December 21, 2025  
**Critical Document:** Keep printed copy in war room

## Table of Contents
1. [Rollback Decision Criteria](#rollback-decision-criteria)
2. [Pre-Rollback Checklist](#pre-rollback-checklist)
3. [Quick Rollback (< 5 minutes)](#quick-rollback--5-minutes)
4. [Full Rollback (< 15 minutes)](#full-rollback--15-minutes)
5. [Database Rollback](#database-rollback)
6. [Incident Communication](#incident-communication)

---

## Rollback Decision Criteria

**IMMEDIATE ROLLBACK if any of these occur:**

| Condition | Action | SLA |
|-----------|--------|-----|
| **API Response Time p95 > 2000ms** | Rollback | 5 min |
| **Error Rate > 5%** | Rollback | 5 min |
| **Database Connection Failures** | Rollback | 5 min |
| **Authentication Broken** | Rollback | 5 min |
| **Data Corruption Detected** | Rollback + Restore | 15 min |
| **Security Vulnerability Disclosed** | Rollback + Patch | 10 min |

**DO NOT ROLLBACK if:**
- Issues are in UI/frontend (does not require API rollback)
- Minor features are disabled (can be fixed with feature flags)
- Issues only affect specific user segment < 1%

---

## Pre-Rollback Checklist

**Before initiating ANY rollback:**

- [ ] Notify on-call team via Slack/PagerDuty
- [ ] Post update to status page: "Investigating issue..."
- [ ] Identify rollback approver (Tech Lead / On-Call Engineer)
- [ ] Have previous stable version identified
- [ ] Have database backup location confirmed
- [ ] Notify customer support team
- [ ] Document issue in incident log with timestamp

**Rollback approver must confirm before proceeding.**

---

## Quick Rollback (< 5 minutes)

### For ECS Deployment

**Scenario:** Recent deploy caused issues, need to revert to previous version

```bash
#!/bin/bash
# rollback.sh - Quick rollback script

set -e

CLUSTER="production"
SERVICE="api"
PREVIOUS_TASK_DEFINITION="api-production:25"  # Adjust version number

echo "🔄 Starting rollback to ${PREVIOUS_TASK_DEFINITION}..."

# 1. Update service to use previous task definition
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $PREVIOUS_TASK_DEFINITION \
  --force-new-deployment \
  --region us-east-1

echo "✅ Service update initiated"

# 2. Wait for deployment to complete
DEPLOYMENT_ID=$(aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region us-east-1 \
  --query 'services[0].deployments[0].id' \
  --output text)

echo "⏳ Waiting for rollback to complete..."
sleep 10

# 3. Monitor rollback progress
for i in {1..30}; do
  RUNNING=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region us-east-1 \
    --query 'services[0].deployments[0].runningCount' \
    --output text)
  
  DESIRED=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region us-east-1 \
    --query 'services[0].desiredCount' \
    --output text)
  
  echo "Progress: $RUNNING/$DESIRED tasks running"
  
  if [ "$RUNNING" -eq "$DESIRED" ]; then
    echo "✅ Rollback complete!"
    break
  fi
  
  sleep 5
done

# 4. Verify health
echo "🔍 Verifying API health..."
HEALTH=$(curl -s https://api.yourdomain.com/health | jq -r .status)
if [ "$HEALTH" = "healthy" ]; then
  echo "✅ API is healthy"
else
  echo "❌ API health check failed!"
  exit 1
fi

echo "✅ Rollback successful"
```

**Run:**
```bash
chmod +x rollback.sh
./rollback.sh
```

### For Docker Compose (Single Server)

```bash
#!/bin/bash
# Single server rollback

set -e

cd /opt/individual-sports-nutrition

echo "🔄 Rolling back Docker Compose services..."

# Stop current version
docker-compose down

# Checkout previous version from Git
git checkout v1.0.0

# Start previous version
docker-compose up -d

# Wait for health
sleep 5

# Verify
curl -f http://localhost:3000/health || exit 1

echo "✅ Rollback successful"
```

---

## Full Rollback (< 15 minutes)

### If Database Changes Involved

**Scenario:** Deploy included database migration that caused issues

```bash
#!/bin/bash
# Full rollback with database recovery

set -e

CLUSTER="production"
SERVICE="api"
PREVIOUS_VERSION="api-production:24"
DB_BACKUP_DATE="2025-12-21"

echo "🔴 FULL ROLLBACK INITIATED"
echo "   Previous Version: $PREVIOUS_VERSION"
echo "   DB Backup Date: $DB_BACKUP_DATE"

# 1. STOP INCOMING TRAFFIC
echo "1️⃣ Stopping traffic to API..."
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/api-targets/xxx \
  --health-check-enabled-metadata '{"enabled": false}'

sleep 5

# 2. DRAIN EXISTING CONNECTIONS
echo "2️⃣ Draining active connections..."
aws elbv2 modify-target-group-attributes \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/api-targets/xxx \
  --attributes Key=deregistration_delay.timeout_seconds,Value=30

# 3. RESTORE DATABASE
echo "3️⃣ Restoring database from backup..."

# List available backups
BACKUPS=$(aws rds describe-db-snapshots \
  --db-instance-identifier prod-postgresql \
  --query 'DBSnapshots[?SnapshotCreateTime>=`2025-12-20`]|[0].DBSnapshotIdentifier' \
  --output text)

echo "Available backup: $BACKUPS"

# Restore from snapshot (creates new instance)
RESTORE_ID="prod-postgresql-restore-$(date +%s)"
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier $RESTORE_ID \
  --db-snapshot-identifier $BACKUPS

echo "⏳ Restoring database (this may take 5-10 minutes)..."

# Wait for restore
MAX_WAIT=600
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier $RESTORE_ID \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text)
  
  if [ "$STATUS" = "available" ]; then
    echo "✅ Database restored"
    break
  fi
  
  echo "⏳ Status: $STATUS (waited ${ELAPSED}s)"
  sleep 10
  ELAPSED=$((ELAPSED + 10))
done

# Get new database endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $RESTORE_ID \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# 4. UPDATE APPLICATION CONFIG
echo "4️⃣ Updating API configuration..."

aws secretsmanager update-secret \
  --secret-id prod/api/database-url \
  --secret-string "postgresql://postgres:password@$NEW_ENDPOINT:5432/individual_sports_nutrition"

# 5. REVERT APPLICATION CODE
echo "5️⃣ Reverting to previous version..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $PREVIOUS_VERSION \
  --force-new-deployment \
  --region us-east-1

echo "⏳ Waiting for application rollback..."
sleep 30

# Monitor rollback
for i in {1..20}; do
  RUNNING=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region us-east-1 \
    --query 'services[0].deployments[0].runningCount' \
    --output text)
  
  DESIRED=$(aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region us-east-1 \
    --query 'services[0].desiredCount' \
    --output text)
  
  if [ "$RUNNING" -eq "$DESIRED" ]; then
    echo "✅ Application reverted"
    break
  fi
  
  sleep 5
done

# 6. RE-ENABLE TRAFFIC
echo "6️⃣ Re-enabling traffic..."
aws elbv2 modify-target-group \
  --target-group-arn arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/api-targets/xxx \
  --health-check-enabled-metadata '{"enabled": true}'

sleep 10

# 7. VERIFY HEALTH
echo "7️⃣ Verifying system health..."
HEALTH=$(curl -s https://api.yourdomain.com/health)
echo "Health check: $HEALTH"

if echo "$HEALTH" | grep -q "healthy"; then
  echo "✅ FULL ROLLBACK SUCCESSFUL"
else
  echo "❌ Health check failed!"
  exit 1
fi

# 8. CLEANUP
echo "8️⃣ Cleanup: Keeping restored database as new primary"
echo "   Restored DB ID: $RESTORE_ID"
echo "   Previous DB ID: prod-postgresql"
echo "   Manual action: Switch DNS/RDS endpoint when ready"
```

---

## Database Rollback

### Point-in-Time Recovery (PITR)

**If data corruption detected:**

```bash
#!/bin/bash
# Restore from point-in-time backup (AWS RDS)

set -e

# Determine restore time (typically a few minutes before issue occurred)
RESTORE_TIME="2025-12-21T14:30:00Z"  # Before the problematic migration

echo "🔄 Starting PITR restore to $RESTORE_TIME"

# Create new instance from PITR
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier prod-postgresql \
  --target-db-instance-identifier prod-postgresql-pitr-$(date +%s) \
  --restore-time $RESTORE_TIME \
  --use-latest-restorable-time false

echo "⏳ PITR restore initiated (5-10 minutes)..."

# Wait for restore
sleep 60

# Verify data integrity
psql -h <new-db-endpoint> -U postgres -d individual_sports_nutrition -c "SELECT COUNT(*) FROM meals;"

# After verification, update application to use new database
# Then delete old database after confirming
```

### MySQL/PostgreSQL Backup Restore

**Manual restore from SQL dump:**

```bash
# List backups
ls -lh /backups/database/

# Restore specific backup
pg_restore -h prod-db.rds.amazonaws.com \
  -U postgres \
  -d individual_sports_nutrition \
  /backups/database/backup_2025-12-21_14-00-00.sql

# Verify restore
psql -h prod-db.rds.amazonaws.com -U postgres -d individual_sports_nutrition -c "SELECT version();"
```

---

## Incident Communication

### Notification Template

**Slack:**
```
🚨 INCIDENT: Potential production issue detected

Service: API (api.yourdomain.com)
Time: 2025-12-21 14:35 UTC
Impact: All users unable to authenticate

Action: Initiating rollback to v1.0.0
ETA: 5 minutes

Updates will be posted here every 2 minutes.

@on-call-team @tech-lead
```

### Post-Rollback Status Update

```
✅ ROLLBACK COMPLETE

Service: API
Rollback Time: 4 minutes 32 seconds
Previous Version: v1.0.0
Status: HEALTHY

All users can now:
✅ Log in
✅ View meal recommendations
✅ Update profile

Incident Postmortem: Scheduled for tomorrow at 10 AM

Thank you for your patience.
```

---

## Monitoring During Rollback

```bash
#!/bin/bash
# Monitor rollback in real-time

watch -n 2 'curl -s https://api.yourdomain.com/health | jq .'
```

Expected output during successful rollback:
```json
{
  "status": "healthy",
  "database": "healthy",
  "redis": "healthy",
  "version": "1.0.0"
}
```

---

## Critical Contacts

Create and maintain this list in your war room:

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| **On-Call Engineer** | - | - | @on-call-team |
| **Tech Lead** | - | - | @tech-lead |
| **Database Admin** | - | - | @dba |
| **DevOps Lead** | - | - | @devops |
| **Director of Engineering** | - | - | @eng-director |
| **AWS Support** | - | 1-844-AWS-SUPPORT | - |

---

## Practice Rollbacks

**Schedule quarterly rollback drills:**

1. Notify team: "Rolling back v2.0.0 → v1.0.0 in staging"
2. Execute rollback script
3. Verify health checks pass
4. Measure time taken
5. Document any issues encountered
6. Update procedures based on learnings

**Target:** Complete rollback in < 5 minutes

---

**Status:** ✅ Ready for Production  
**Last Tested:** December 21, 2025  
**Next Drill:** Q1 2026
