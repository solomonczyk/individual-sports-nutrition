# Monitoring and Alerting Setup Guide

## Overview

This guide covers comprehensive monitoring, logging, and alerting setup for the Sports Nutrition application. The monitoring stack includes:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards  
- **AlertManager** - Alert routing and management
- **Loki** - Log aggregation and query
- **Exporters** - Node, PostgreSQL, Redis metrics
- **Custom Health Checks** - Application-specific monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Applications                            │
│  ┌──────────────┬─────────────┬────────────────┐        │
│  │ Backend API  │ AI Service  │ PostgreSQL/    │        │
│  │ :3000        │ :8000       │ Redis          │        │
│  └──────┬───────┴──────┬──────┴───────┬────────┘        │
└─────────│──────────────│──────────────│─────────────────┘
          │              │              │
    ┌─────▼──────┬──────▼─┬────────────▼──────┐
    │   Custom   │  Node  │  Postgres & Redis │
    │  Metrics   │Exporter│    Exporters      │
    └─────┬──────┴──┬─────┴───────┬──────────┘
          │         │             │
    ┌─────▼─────────▼─────────────▼──────┐
    │        Prometheus :9090             │
    │     (Metrics Storage & Query)       │
    └────────────┬──────────────────────┘
                 │
        ┌────────┴───────────┬──────────────┐
        │                    │              │
    ┌───▼─────┐         ┌───▼────┐    ┌───▼───┐
    │ Grafana  │         │AlertMgr│    │ Loki  │
    │:3001    │         │:9093   │    │:3100  │
    └──────────┘         └────────┘    └───────┘
```

## Prerequisites

- Docker and Docker Compose
- PostgreSQL 15+ (for application)
- Redis (for cache)
- 2GB RAM minimum for monitoring stack
- 10GB disk space for metrics/logs (30-day retention)

## Quick Start

### 1. Run Setup Script

```bash
chmod +x scripts/setup-monitoring.sh
./scripts/setup-monitoring.sh
```

This automatically creates:
- Health check scripts
- Prometheus configuration
- Alerting rules
- Grafana dashboards
- Monitoring service files

### 2. Start Monitoring Stack

```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 3. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **AlertManager**: http://localhost:9093

Default Grafana credentials: `admin` / `admin`

### 4. Run Health Checks

```bash
# Check all services
bash scripts/health-check-db.sh
bash scripts/health-check-redis.sh
bash scripts/health-check-api.sh
bash scripts/health-check-ai.sh

# Continuous monitoring
bash scripts/monitor-services.sh
```

## Metrics Collection

### Backend API Metrics

The backend API exposes metrics on `/metrics` endpoint (port 3000).

Key metrics:
- `http_requests_total` - Total HTTP requests by status/method
- `http_request_duration_seconds` - Request latency histogram
- `http_requests_in_progress` - Current in-flight requests
- `db_query_duration_seconds` - Database query latency
- `cache_hits_total` - Cache hit counter
- `cache_misses_total` - Cache miss counter

### AI Service Metrics

The AI service exposes metrics on `/metrics` endpoint (port 8000).

Key metrics:
- `ml_recommendation_generation_seconds` - Time to generate recommendations
- `ml_scoring_duration_seconds` - Time for product scoring
- `ml_model_reload_total` - Model reload count
- `ai_request_duration_seconds` - AI API request latency
- `ml_cache_hits` - ML cache efficiency

### System Metrics (via Node Exporter)

- `node_cpu_seconds_total` - CPU time breakdown
- `node_memory_*_bytes` - Memory usage (total, available, buffers, cached)
- `node_filesystem_*_bytes` - Disk space usage
- `node_network_*_total` - Network traffic
- `node_processes_running` - Running process count

### Database Metrics (via PostgreSQL Exporter)

- `pg_stat_activity_count` - Active connections by state
- `pg_database_size_bytes` - Database size
- `pg_table_size_bytes` - Individual table sizes
- `pg_index_size_bytes` - Index sizes
- `pg_cache_hit_ratio` - Cache effectiveness
- `pg_database_conflicts_*` - Conflict counts
- `pg_transaction_duration_seconds` - Transaction duration

### Redis Metrics (via Redis Exporter)

- `redis_connected_clients` - Number of connected clients
- `redis_used_memory_bytes` - Memory usage
- `redis_evicted_keys_total` - Evicted key count
- `redis_commands_processed_total` - Command count by type
- `redis_keyspace_*` - Keys by database
- `redis_hit_rate` - Cache hit rate

## Alerting Rules

### Critical Alerts (Immediate Response)

#### ServiceDown
```
Alert: Service {{ job }} is down
Condition: Service fails health check for 2+ minutes
Action: Page on-call engineer
```

#### DiskSpaceLow
```
Alert: Less than 10% disk space available
Condition: Disk usage > 90% for 5+ minutes
Action: Immediate remediation required
```

#### DatabaseConnectionErrors
```
Alert: Database connection errors detected
Condition: Error rate > 0.1/min for 2+ minutes
Action: Check database status, network connectivity
```

#### RedisDown
```
Alert: Redis is down
Condition: No response from Redis for 2+ minutes
Action: Restart Redis, check for memory issues
```

### Warning Alerts (2-hour response)

#### HighErrorRate
```
Alert: Error rate above 5%
Condition: 5xx errors > 5% of total requests for 5+ minutes
Action: Review error logs, check dependency services
```

#### HighLatency
```
Alert: API latency p99 > 2 seconds
Condition: p99 latency > 2s for 5+ minutes
Action: Profile services, check resource usage
```

#### HighMemoryUsage
```
Alert: Memory usage above 85%
Condition: Memory > 85% for 5+ minutes
Action: Check for memory leaks, scale resources
```

#### AIServiceHighLatency
```
Alert: AI Service latency p95 > 5 seconds
Condition: p95 latency > 5s for 5+ minutes
Action: Check model loading, optimize inference
```

## Health Checks

### Database Health Check

```bash
bash scripts/health-check-db.sh
```

Checks:
- PostgreSQL is accessible
- Database exists and is queryable
- Returns JSON with status

Response (healthy):
```json
{
  "status": "healthy",
  "service": "database",
  "timestamp": "2025-01-15T14:30:00Z",
  "checks": {
    "connection": "ok",
    "query": "ok"
  }
}
```

### Redis Health Check

```bash
bash scripts/health-check-redis.sh
```

Checks:
- Redis responds to PING
- Memory usage is not critical

Response (healthy):
```json
{
  "status": "healthy",
  "service": "redis",
  "timestamp": "2025-01-15T14:30:00Z",
  "metrics": {
    "memory": "45M"
  }
}
```

### Backend API Health Check

```bash
bash scripts/health-check-api.sh
```

Checks:
- Backend API responds on port 3000
- `/api/v1/health` returns 200
- Service metadata is present

### AI Service Health Check

```bash
bash scripts/health-check-ai.sh
```

Checks:
- AI Service responds on port 8000
- `/health` returns 200
- ML models are loaded

## Log Aggregation (Loki)

### View Logs in Grafana

1. In Grafana, click "Explore"
2. Select "Loki" as data source
3. Use LogQL to query logs:

```logql
# All error logs
{job="backend-api", level="error"}

# Specific service
{job="ai-service"}

# By container name
{container_name=~"sports-nutrition.*"}

# Time range: 1 hour
sum(rate({job="backend-api"}[1h]))
```

### Application Logging Setup

Ensure applications log to:
- **Backend API**: `/var/log/sports-nutrition/backend-api/*.log`
- **AI Service**: `/var/log/sports-nutrition/ai-service/*.log`
- **Database**: `/var/log/sports-nutrition/database/*.log`

Configure in application:
```javascript
// backend-api/src/config/logger.ts
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.json(),
  transports: [
    new transports.File({ 
      filename: '/var/log/sports-nutrition/backend-api/error.log',
      level: 'error'
    }),
    new transports.File({ 
      filename: '/var/log/sports-nutrition/backend-api/combined.log'
    })
  ]
});
```

## Grafana Dashboards

### Built-in Dashboards

**Sports Nutrition Application (Main)**
- Service Status (up/down indicators)
- Request Rate (req/sec by endpoint)
- Error Rate (% of 5xx responses)
- API Latency (p50, p95, p99)
- Memory Usage (system and per-service)
- CPU Usage (system and per-service)
- Database Connections (active, idle, waiting)
- Redis Memory (used vs available)

### Custom Dashboard Creation

1. Click "+" → "Dashboard"
2. Click "Add new panel"
3. Select metric:
   ```promql
   rate(http_requests_total[5m])
   ```
4. Configure visualization (Graph, Gauge, Stat, etc.)
5. Set alerts on panel

### Example Queries

**Request rate by endpoint:**
```promql
sum(rate(http_requests_total[5m])) by (path)
```

**Error rate percentage:**
```promql
100 * (
  sum(rate(http_requests_total{status=~"5.."}[5m]))
  /
  sum(rate(http_requests_total[5m]))
)
```

**Database connection pool usage:**
```promql
pg_stat_activity_count / pg_max_connections
```

**Cache hit rate:**
```promql
cache_hits_total / (cache_hits_total + cache_misses_total)
```

## Alerting Configuration

### Setup AlertManager Email Notifications

Create `docker/monitoring/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_auth_username: 'alerts@example.com'
  smtp_auth_password: '${SMTP_PASSWORD}'
  smtp_from: 'alerts@example.com'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default'
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
      repeat_interval: 5m
    - match:
        severity: warning
      receiver: 'warning-alerts'
      repeat_interval: 1h

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'

  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@example.com'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#critical-alerts'
        title: 'Critical Alert'

  - name: 'warning-alerts'
    email_configs:
      - to: 'team@example.com'
```

### Setup Slack Notifications

In AlertManager config:
```yaml
slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
    channel: '#alerts'
    title: '{{ .CommonAnnotations.summary }}'
    text: '{{ .CommonAnnotations.description }}'
    send_resolved: true
```

## Performance Tuning

### Prometheus Retention

Default retention is 30 days. To modify:

```bash
# Edit docker-compose.monitoring.yml
command:
  - '--storage.tsdb.retention.time=7d'  # Reduce to 7 days
  # or
  - '--storage.tsdb.retention.size=50GB'  # Limit to 50GB
```

### Reduce Scrape Interval

Default is 30 seconds. To reduce storage:

```yaml
# prometheus.yml
global:
  scrape_interval: 60s  # Increase from 30s
  evaluation_interval: 60s
```

### Optimize Query Performance

Add rate limits:
```yaml
global:
  query_log_dir: '/prometheus/query_log'
  query_timeout: 2m
```

## Backup and Disaster Recovery

### Backup Prometheus Data

```bash
# Backup on-disk storage
tar -czf prometheus_backup_$(date +%Y%m%d).tar.gz \
  /path/to/prometheus/data

# Upload to cloud storage
aws s3 cp prometheus_backup_*.tar.gz s3://backups/
```

### Backup Grafana Dashboards

```bash
# Export all dashboards
curl -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  http://localhost:3001/api/search | \
  jq '.[] | .uid' | \
  xargs -I {} curl -H "Authorization: Bearer $GRAFANA_API_TOKEN" \
  http://localhost:3001/api/dashboards/uid/{} > dashboards_backup.json
```

## Troubleshooting

### Prometheus Not Scraping Metrics

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify endpoint is accessible
curl http://localhost:3000/metrics

# Check Prometheus logs
docker-compose -f docker-compose.monitoring.yml logs prometheus
```

### Missing Metrics

1. Verify application exports metrics
2. Check scrape config in prometheus.yml
3. Verify network connectivity between Prometheus and target
4. Check for firewall rules

### Alerts Not Firing

1. Verify alert rules in prometheus/rules.yml
2. Check AlertManager is running and configured
3. Test rule with Prometheus UI: `http://localhost:9090/alerts`
4. Verify notification channel configuration

### High Disk Usage

```bash
# Check Prometheus data size
du -sh /path/to/prometheus/data

# Reduce retention
docker-compose -f docker-compose.monitoring.yml down
# Edit docker-compose.monitoring.yml to reduce retention
docker-compose -f docker-compose.monitoring.yml up -d

# Or delete old data
rm -rf /path/to/prometheus/data/wal
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/monitoring-check.yml
name: Monitoring Health Check

on:
  schedule:
    - cron: '*/15 * * * *'

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Database Health
        run: bash scripts/health-check-db.sh
      
      - name: Redis Health
        run: bash scripts/health-check-redis.sh
      
      - name: Backend API Health
        run: bash scripts/health-check-api.sh
      
      - name: AI Service Health
        run: bash scripts/health-check-ai.sh
      
      - name: Alert on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Health check failed"}'
```

## Security Considerations

### Secure Prometheus

```yaml
# docker-compose.monitoring.yml
prometheus:
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
  # Don't expose directly to internet
  ports:
    - "127.0.0.1:9090:9090"
```

### Secure Grafana

1. Change default admin password
2. Enable HTTPS:
   ```yaml
   grafana:
     environment:
       GF_SERVER_PROTOCOL: https
       GF_SERVER_CERT_FILE: /etc/grafana/cert.pem
       GF_SERVER_CERT_KEY: /etc/grafana/key.pem
   ```
3. Implement RBAC (Role-Based Access Control)
4. Use API tokens instead of passwords

### Secure AlertManager

1. Use HTTPS for webhook endpoints
2. Validate webhook signatures
3. Limit AlertManager access to internal network

## Related Documentation

- [Database Backup/Restore Guide](./DATABASE_BACKUP_RESTORE.md)
- [Testing Guide](../backend-api/TESTING_GUIDE.md)
- [Server Setup Guide](./deployment/server-setup.md)
- [Project Analysis Report](./PROJECT_ANALYSIS_REPORT.md)

## Support

For monitoring issues:
1. Check logs: `docker-compose -f docker-compose.monitoring.yml logs -f`
2. Verify all services are running: `docker-compose -f docker-compose.monitoring.yml ps`
3. Test health checks manually: `bash scripts/health-check-*.sh`
4. Review alerting rules in Prometheus UI

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial monitoring setup guide | DevOps |
| TBD | Kubernetes monitoring integration | TBD |
| TBD | Custom dashboards for business metrics | TBD |
