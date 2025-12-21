# Database Backup and Restore Guide

## Overview

This guide covers automated backup and restore procedures for the PostgreSQL database used in the Individual Sports Nutrition application. The backup scripts support both Linux/macOS and Windows environments.

## Critical Information

- **Database Name:** `individual_sports_nutrition`
- **Default Retention:** 30 days
- **Backup Location:** `./backups/` (configurable)
- **Compression:** Gzip (.gz format)
- **Metadata:** JSON manifest created with each backup

## Prerequisites

### Linux/macOS
- PostgreSQL client tools (`pg_dump`, `psql`)
- Bash shell
- `gzip` utility
- Write permissions to backup directory

### Windows
- PostgreSQL client tools in PATH (`pg_dump`, `psql`)
- PowerShell 5.0 or later
- Write permissions to backup directory

## Installation

### Linux/macOS

```bash
# Make script executable
chmod +x scripts/backup-postgres.sh

# Optional: Add to cron for automated daily backups at 2 AM
# Edit crontab
crontab -e

# Add line:
0 2 * * * cd /path/to/project && DATABASE_PASSWORD='your_password' ./scripts/backup-postgres.sh backup
```

### Windows

```powershell
# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Create a scheduled task for daily backups at 2 AM
$trigger = New-ScheduledTaskTrigger -At 2:00AM -Daily
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument '-File "C:\path\to\backup-postgres.ps1" -Action backup'
Register-ScheduledTask -TaskName "DatabaseBackup" -Trigger $trigger -Action $action -RunLevel Highest
```

## Quick Start

### Create a Backup

#### Linux/macOS
```bash
# Basic backup (uses environment variables or defaults)
./scripts/backup-postgres.sh backup

# With explicit credentials
DATABASE_PASSWORD='your_password' ./scripts/backup-postgres.sh backup

# With custom settings
DATABASE_HOST='db.example.com' \
DATABASE_USER='admin' \
DATABASE_PASSWORD='password' \
BACKUP_DIR='/mnt/backups' \
./scripts/backup-postgres.sh backup
```

#### Windows
```powershell
# Basic backup
.\scripts\backup-postgres.ps1 -Action backup

# With explicit credentials
.\scripts\backup-postgres.ps1 -Action backup `
  -DatabasePassword 'your_password'

# With custom settings
.\scripts\backup-postgres.ps1 -Action backup `
  -DatabaseHost 'db.example.com' `
  -DatabaseUser 'admin' `
  -DatabasePassword 'password' `
  -BackupDir 'C:\Backups'
```

### List Available Backups

#### Linux/macOS
```bash
./scripts/backup-postgres.sh list
```

#### Windows
```powershell
.\scripts\backup-postgres.ps1 -Action list
```

**Output Example:**
```
Available backups:

  individual_sports_nutrition_20250115_140500.sql.gz  234 MB
  individual_sports_nutrition_20250114_020000.sql.gz  232 MB
  individual_sports_nutrition_20250113_020000.sql.gz  231 MB
```

### Restore from Backup

#### Linux/macOS
```bash
# Restore from specific backup
./scripts/backup-postgres.sh restore backups/individual_sports_nutrition_20250115_140500.sql.gz

# You will be prompted to confirm:
# This will overwrite the current database: individual_sports_nutrition
# Are you sure? (yes/no): yes
```

#### Windows
```powershell
# Restore from specific backup
.\scripts\backup-postgres.ps1 -Action restore `
  -BackupFile 'backups\individual_sports_nutrition_20250115_140500.sql.gz'

# You will be prompted to confirm:
# This will overwrite the current database: individual_sports_nutrition
# Are you sure? (yes/no): yes
```

**IMPORTANT:** 
- The script will decompress the backup automatically
- Restoring will overwrite the entire database
- Always verify you have the correct backup before proceeding

### Verify Backup Integrity

#### Linux/macOS
```bash
./scripts/backup-postgres.sh verify backups/individual_sports_nutrition_20250115_140500.sql.gz
```

#### Windows
```powershell
.\scripts\backup-postgres.ps1 -Action verify `
  -BackupFile 'backups\individual_sports_nutrition_20250115_140500.sql.gz'
```

**Output Example:**
```
✓ Backup file is valid. Size: 234MB
✓ Gzip integrity check passed
```

### Cleanup Old Backups

#### Linux/macOS
```bash
# Remove backups older than 30 days
./scripts/backup-postgres.sh cleanup

# Custom retention period
RETENTION_DAYS=14 ./scripts/backup-postgres.sh cleanup
```

#### Windows
```powershell
# Remove backups older than 30 days
.\scripts\backup-postgres.ps1 -Action cleanup

# Custom retention period
.\scripts\backup-postgres.ps1 -Action cleanup -RetentionDays 14
```

## Environment Variables

Set environment variables to avoid repeating credentials:

```bash
# Linux/macOS
export DATABASE_NAME='individual_sports_nutrition'
export DATABASE_USER='postgres'
export DATABASE_PASSWORD='your_secure_password'
export DATABASE_HOST='localhost'
export DATABASE_PORT='5432'
export BACKUP_DIR='./backups'

# Then run backups
./scripts/backup-postgres.sh backup
```

```powershell
# Windows (in PowerShell profile)
$env:DATABASE_NAME = 'individual_sports_nutrition'
$env:DATABASE_USER = 'postgres'
$env:DATABASE_PASSWORD = 'your_secure_password'
$env:DATABASE_HOST = 'localhost'
$env:DATABASE_PORT = '5432'
$env:BACKUP_DIR = 'C:\Backups'

# Then run backups
.\scripts\backup-postgres.ps1 -Action backup
```

## Automated Backups

### Linux/macOS with Cron

Create a backup script wrapper:

```bash
#!/bin/bash
# scripts/cron-backup.sh
cd /path/to/project
export DATABASE_PASSWORD='your_password'
export DATABASE_HOST='production-db.example.com'
export BACKUP_DIR='/var/backups/sports-nutrition'
./scripts/backup-postgres.sh backup >> /var/log/db-backup.log 2>&1
```

Add to crontab:
```bash
crontab -e

# Daily backup at 2:00 AM
0 2 * * * /path/to/scripts/cron-backup.sh

# Backup every 6 hours
0 */6 * * * /path/to/scripts/cron-backup.sh

# Weekly full backup and cleanup on Sunday at 3 AM
0 3 * * 0 /path/to/scripts/cron-backup.sh && RETENTION_DAYS=60 /path/to/scripts/backup-postgres.sh cleanup
```

### Windows with Task Scheduler

Create a batch file wrapper:

```batch
:: scripts\backup-task.bat
@echo off
cd /d C:\path\to\project
set DATABASE_PASSWORD=your_password
set DATABASE_HOST=production-db.example.com
set BACKUP_DIR=C:\Backups\sports-nutrition
powershell.exe -File scripts\backup-postgres.ps1 -Action backup >> C:\Logs\db-backup.log 2>&1
```

Create scheduled task:

```powershell
# Run PowerShell as Administrator
$action = New-ScheduledTaskAction -Execute 'C:\path\to\backup-task.bat'
$trigger = New-ScheduledTaskTrigger -At 2:00AM -Daily
$settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable -StartWhenAvailable
Register-ScheduledTask -TaskName "SportsNutritionDBBackup" -Action $action `
  -Trigger $trigger -Settings $settings -RunLevel Highest
```

Monitor execution:
```powershell
# View task status
Get-ScheduledTaskInfo -TaskName "SportsNutritionDBBackup"

# View task history
Get-ScheduledTask -TaskName "SportsNutritionDBBackup" | Get-ScheduledTaskInfo
```

## Disaster Recovery Procedures

### Complete Database Loss Scenario

**Timeline:** ~15-30 minutes depending on backup size

1. **Assess the situation** (2 min)
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   # or
   pg_isready -h localhost
   ```

2. **Stop the application** (1 min)
   ```bash
   # Stop backend-api
   pm2 stop backend-api
   # Stop ai-service
   pm2 stop ai-service
   ```

3. **Verify backups** (2 min)
   ```bash
   ./scripts/backup-postgres.sh list
   ./scripts/backup-postgres.sh verify backups/individual_sports_nutrition_20250115_140500.sql.gz
   ```

4. **Restore database** (10-20 min depending on size)
   ```bash
   # Drop and recreate database (if needed)
   psql -U postgres -c "DROP DATABASE IF EXISTS individual_sports_nutrition;"
   psql -U postgres -c "CREATE DATABASE individual_sports_nutrition OWNER postgres;"
   
   # Restore from backup
   ./scripts/backup-postgres.sh restore backups/individual_sports_nutrition_20250115_140500.sql.gz
   ```

5. **Verify data integrity** (5 min)
   ```bash
   # Check table counts
   psql -U postgres -d individual_sports_nutrition << EOF
   SELECT 'users' as table_name, COUNT(*) as row_count FROM users
   UNION ALL
   SELECT 'products', COUNT(*) FROM products
   UNION ALL
   SELECT 'meals', COUNT(*) FROM meals
   UNION ALL
   SELECT 'meal_plans', COUNT(*) FROM meal_plans;
   EOF
   ```

6. **Start services** (1 min)
   ```bash
   pm2 start backend-api
   pm2 start ai-service
   ```

7. **Validate application** (2 min)
   ```bash
   # Check health endpoints
   curl http://localhost:3000/api/v1/health
   curl http://localhost:8000/health
   ```

### Partial Data Loss (Specific Tables)

1. **Export table from backup:**
   ```bash
   # Decompress backup
   gunzip -c backups/individual_sports_nutrition_20250115_140500.sql.gz > /tmp/backup.sql
   
   # Extract specific table
   grep -A 10000 "CREATE TABLE products" /tmp/backup.sql | \
   grep -B 10000 "CREATE TABLE" | head -n -1 > /tmp/products.sql
   ```

2. **Restore specific table:**
   ```bash
   # Drop corrupted table
   psql -U postgres -d individual_sports_nutrition -c "DROP TABLE products CASCADE;"
   
   # Restore from backup
   psql -U postgres -d individual_sports_nutrition < /tmp/products.sql
   ```

### Point-in-Time Recovery (Pending WAL Configuration)

**Note:** Requires WAL (Write-Ahead Logging) archiving configuration. See deployment documentation.

## Monitoring and Alerting

### Log File Monitoring

Check backup logs for errors:

```bash
# View recent backups
tail -f backups/backup.log

# Check for errors
grep ERROR backups/backup.log

# Monitor backup size trends
ls -lh backups/*.sql.gz | awk '{print $6, $9}' | sort -k2
```

### Backup Size Warnings

Configure alerts for unusually large backups:

```bash
#!/bin/bash
# Alert if backup exceeds 500MB
BACKUP_FILE=$1
MAX_SIZE=$((500 * 1024 * 1024))
ACTUAL_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")

if [ "$ACTUAL_SIZE" -gt "$MAX_SIZE" ]; then
  echo "WARNING: Backup size exceeds threshold: $(numfmt --to=iec $ACTUAL_SIZE)"
  # Send alert to monitoring system
fi
```

### Backup Frequency Monitoring

Ensure backups are running:

```bash
#!/bin/bash
# Alert if no backup in last 26 hours
LATEST_BACKUP=$(ls -t backups/*.sql.gz 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backups found!"
  exit 1
fi

BACKUP_AGE_SECONDS=$(($(date +%s) - $(stat -f%m "$LATEST_BACKUP" 2>/dev/null || stat -c%Y "$LATEST_BACKUP")))
if [ "$BACKUP_AGE_SECONDS" -gt 93600 ]; then  # 26 hours
  echo "WARNING: Latest backup is $(($BACKUP_AGE_SECONDS / 3600)) hours old"
  exit 1
fi
```

## Storage and Archive Strategy

### Backup Tiering

```
Active Backups (0-7 days):   Daily retention in ./backups/
Archive Tier (7-30 days):    Weekly full backup to cloud storage
Long-term (30+ days):        Monthly backup to cold storage
```

### S3/Cloud Storage

```bash
#!/bin/bash
# Upload backup to S3
BACKUP_FILE=$1
aws s3 cp "$BACKUP_FILE" s3://sports-nutrition-backups/$(date +%Y/%m)/ --storage-class GLACIER

# Cleanup local backup
rm "$BACKUP_FILE"
```

### Disk Space Management

Monitor backup directory:

```bash
#!/bin/bash
BACKUP_DIR='./backups'
MAX_USAGE_PERCENT=80
USAGE=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$MAX_USAGE_PERCENT" ]; then
  echo "WARNING: Backup directory usage at ${USAGE}%"
  # Trigger cleanup
  RETENTION_DAYS=14 ./scripts/backup-postgres.sh cleanup
fi
```

## Testing and Validation

### Regular Restore Testing (Monthly)

```bash
#!/bin/bash
# Test restore on non-production environment
TEST_DB='individual_sports_nutrition_test'

# Create test database
psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# Restore backup
psql -U postgres -d $TEST_DB < <(gunzip -c backups/$(ls -t backups/*.sql.gz | head -1))

# Run validation queries
psql -U postgres -d $TEST_DB << EOF
  SELECT COUNT(*) as total_users FROM users;
  SELECT COUNT(*) as total_products FROM products;
  SELECT COUNT(*) as total_meals FROM meals;
EOF

# Cleanup
psql -U postgres -c "DROP DATABASE $TEST_DB;"
```

### Backup Integrity Checks

```bash
#!/bin/bash
# Scheduled integrity check
for backup in backups/*.sql.gz; do
  echo "Checking: $(basename $backup)"
  if gzip -t "$backup" 2>/dev/null; then
    echo "  ✓ Integrity OK"
  else
    echo "  ✗ CORRUPTED"
    # Alert and remove corrupted backup
  fi
done
```

## Troubleshooting

### Issue: pg_dump: connection failed

**Solution:** Verify credentials and network connectivity
```bash
# Test connection
psql -h localhost -U postgres -d individual_sports_nutrition -c "SELECT 1"

# Check PostgreSQL status
sudo systemctl status postgresql

# Verify PostgreSQL is listening
sudo netstat -plnt | grep 5432
```

### Issue: Backup file is empty

**Solution:** Check permissions and disk space
```bash
# Check disk space
df -h backup_directory/

# Check file permissions
ls -la backups/

# Verify database size
psql -U postgres -d individual_sports_nutrition -c "SELECT pg_size_pretty(pg_database_size('individual_sports_nutrition'));"
```

### Issue: Restore fails with permission errors

**Solution:** Run restore with correct user
```bash
# Use postgres user for restore
sudo -u postgres psql -d individual_sports_nutrition < backup.sql

# Or set PGUSER environment variable
export PGUSER=postgres
./scripts/backup-postgres.sh restore backups/backup.sql.gz
```

### Issue: Gzip decompression fails

**Solution:** Re-create backup or check file integrity
```bash
# Test gzip file
gzip -t backup.sql.gz

# If corrupt, re-create or restore from earlier backup
./scripts/backup-postgres.sh list
./scripts/backup-postgres.sh verify older_backup.sql.gz
```

## Compliance and Security

### Sensitive Data Handling

- **Encrypt backups in transit:** Use SSH/SFTP for remote backups
- **Encrypt backups at rest:** Use encrypted volumes or encrypted S3
- **Limit backup access:** Set restrictive file permissions (600)
- **Audit backup access:** Log all backup operations

### Compliance Checklist

- [ ] Backups automated and running daily
- [ ] Backup retention policy documented (30 days minimum)
- [ ] Restore procedures tested monthly
- [ ] Disaster recovery plan updated quarterly
- [ ] Access to backups restricted to authorized personnel
- [ ] Backup logs monitored for failures
- [ ] Off-site backups maintained (if applicable)

## Related Documentation

- [Server Setup Guide](./deployment/server-setup.md)
- [CI/CD Pipeline](../infra/ci-cd/)
- [Monitoring Setup](./deployment/monitoring-setup.md) (Pending - Day 4)
- [Emergency Response Playbook](./deployment/emergency-playbook.md) (Pending)

## Support and Escalation

For backup/restore issues:

1. **Check logs:** Review `backups/backup.log`
2. **Verify database:** Run connection tests
3. **Test restore:** Perform test restore to validate backup
4. **Escalate:** Contact database administrator if needed

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial backup/restore guide | DevOps |
| TBD | WAL archiving setup | TBD |
| TBD | Cloud storage integration | TBD |
