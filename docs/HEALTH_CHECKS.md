# Health Checks & Monitoring

**Version:** 1.0.0  
**Last Updated:** December 21, 2025

## Table of Contents
1. [Health Check Endpoint](#health-check-endpoint)
2. [Database Health Checks](#database-health-checks)
3. [Redis/Cache Health Checks](#rediscache-health-checks)
4. [System Resource Monitoring](#system-resource-monitoring)
5. [Application Metrics](#application-metrics)
6. [Alerting Rules](#alerting-rules)
7. [CloudWatch Dashboard](#cloudwatch-dashboard)

---

## Health Check Endpoint

### Implementation

Create endpoint at `GET /health` that returns:
- API status
- Database connectivity
- Redis connectivity  
- Memory usage
- Version info

**File:** `backend-api/src/routes/health.ts`

```typescript
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { createClient } from 'redis';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    connections: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
    memory: {
      used: number;
      max: number;
    };
  };
  memory: {
    heapUsed: number;
    heapMax: number;
    percentUsed: number;
  };
  api: {
    requestsPerSecond: number;
    errorRate: number;
  };
}

// Global metrics
let metrics = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
};

// Middleware to track metrics
export function metricsMiddleware(req: Request, res: Response, next: Function) {
  metrics.requestCount++;
  
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      metrics.errorCount++;
    }
  });
  
  next();
}

router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const dbPool = req.app.get('dbPool') as Pool;
    const redisClient = req.app.get('redisClient') as ReturnType<typeof createClient>;
    
    // Check database
    const dbStart = Date.now();
    let dbStatus = 'disconnected';
    let dbResponseTime = 0;
    let dbConnections = 0;
    
    try {
      await dbPool.query('SELECT 1');
      dbStatus = 'connected';
      dbResponseTime = Date.now() - dbStart;
      
      const poolStatus = await dbPool.query('SELECT count(*) FROM pg_stat_activity');
      dbConnections = parseInt(poolStatus.rows[0].count);
    } catch (error) {
      console.error('Database health check failed:', error);
    }
    
    // Check Redis
    const redisStart = Date.now();
    let redisStatus = 'disconnected';
    let redisResponseTime = 0;
    let redisMemory = { used: 0, max: 0 };
    
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        redisStatus = 'connected';
        redisResponseTime = Date.now() - redisStart;
        
        const info = await redisClient.info('memory');
        const lines = info.split('\r\n');
        lines.forEach(line => {
          if (line.startsWith('used_memory:')) {
            redisMemory.used = parseInt(line.split(':')[1]);
          }
          if (line.startsWith('maxmemory:')) {
            redisMemory.max = parseInt(line.split(':')[1]);
          }
        });
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
    
    // System memory
    const heapUsed = process.memoryUsage().heapUsed;
    const heapMax = process.memoryUsage().heapTotal;
    const memoryPercent = (heapUsed / heapMax) * 100;
    
    // Calculate error rate
    const uptime = Date.now() - metrics.startTime;
    const rps = metrics.requestCount / (uptime / 1000);
    const errorRate = metrics.requestCount > 0 
      ? (metrics.errorCount / metrics.requestCount) * 100 
      : 0;
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (dbStatus === 'disconnected' || redisStatus === 'disconnected') {
      overallStatus = 'unhealthy';
    } else if (
      dbResponseTime > 1000 || 
      redisResponseTime > 500 || 
      memoryPercent > 90 ||
      errorRate > 5
    ) {
      overallStatus = 'degraded';
    }
    
    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0.0',
      uptime: Math.floor(uptime / 1000),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus as any,
        responseTime: dbResponseTime,
        connections: dbConnections,
      },
      redis: {
        status: redisStatus as any,
        responseTime: redisResponseTime,
        memory: redisMemory,
      },
      memory: {
        heapUsed,
        heapMax,
        percentUsed: Math.round(memoryPercent),
      },
      api: {
        requestsPerSecond: Math.round(rps),
        errorRate: Math.round(errorRate * 100) / 100,
      },
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 503 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
```

### Integration in Main App

**File:** `backend-api/src/main.ts`

```typescript
import healthRouter, { metricsMiddleware } from './routes/health';
import { Pool } from 'pg';
import { createClient } from 'redis';

const app = express();

// Attach health router FIRST (before other middleware)
app.use('/health', healthRouter);

// Add metrics tracking middleware
app.use(metricsMiddleware);

// Attach database and Redis clients to app
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

app.set('dbPool', dbPool);
app.set('redisClient', redisClient);

// Rest of your app setup...
```

### Testing Health Endpoint

```bash
# Local test
curl http://localhost:3000/health | jq '.'

# Production test
curl https://api.yourdomain.com/health | jq '.'

# With authentication if needed
curl -H "Authorization: Bearer $TOKEN" \
  https://api.yourdomain.com/health | jq '.'
```

Expected healthy response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-21T15:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "environment": "production",
  "database": {
    "status": "connected",
    "responseTime": 5,
    "connections": 15
  },
  "redis": {
    "status": "connected",
    "responseTime": 2,
    "memory": {
      "used": 52428800,
      "max": 1073741824
    }
  },
  "memory": {
    "heapUsed": 156534000,
    "heapMax": 1024000000,
    "percentUsed": 15
  },
  "api": {
    "requestsPerSecond": 125,
    "errorRate": 0.5
  }
}
```

---

## Database Health Checks

### Direct Query Health Check

```bash
#!/bin/bash
# Check database connectivity and performance

DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-individual_sports_nutrition}
DB_USER=${DATABASE_USER:-postgres}

echo "🔍 Checking database health..."

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT NOW();"

if [ $? -eq 0 ]; then
  echo "✅ Database connection OK"
else
  echo "❌ Database connection FAILED"
  exit 1
fi

# Check table count
TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tail -1)
echo "✅ Database tables: $TABLES"

# Check largest tables
echo ""
echo "📊 Largest tables:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
  "SELECT schemaname, tablename, 
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables 
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC 
   LIMIT 5;"

# Check slow queries
echo ""
echo "🐢 Slow queries (> 1 second):"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
  "SELECT query, calls, mean_time 
   FROM pg_stat_statements 
   WHERE mean_time > 1000 
   ORDER BY mean_time DESC LIMIT 5;"

# Check connections
echo ""
echo "🔗 Active connections:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
  "SELECT datname, count(*) as connections 
   FROM pg_stat_activity 
   GROUP BY datname;"
```

### RDS-Specific Checks (AWS)

```bash
#!/bin/bash
# AWS RDS health checks

DB_INSTANCE="prod-postgresql"
REGION="us-east-1"

echo "🔍 Checking RDS instance health..."

# Get RDS status
aws rds describe-db-instances \
  --db-instance-identifier $DB_INSTANCE \
  --region $REGION \
  --query 'DBInstances[0].[DBInstanceStatus, DBInstanceClass, EngineVersion]' \
  --output table

# Get storage usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_INSTANCE \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region $REGION

# Check CPU
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=$DB_INSTANCE \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region $REGION
```

---

## Redis/Cache Health Checks

### Redis CLI Health Check

```bash
#!/bin/bash
# Check Redis health

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

echo "🔍 Checking Redis health..."

# Test connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

if [ $? -ne 0 ]; then
  echo "❌ Redis connection FAILED"
  exit 1
fi

echo "✅ Redis connection OK"

# Get memory stats
echo ""
echo "💾 Memory usage:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO memory

# Get key counts
echo ""
echo "🔑 Database info:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO keyspace

# Check eviction policy
echo ""
echo "⚙️ Eviction policy:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG GET maxmemory-policy

# Monitor top keys (be careful in production)
echo ""
echo "📈 Top keys by memory (first 20):"
redis-cli -h $REDIS_HOST -p $REDIS_PORT --scan \
  --pattern '*' | head -20
```

### ElastiCache Health Check (AWS)

```bash
#!/bin/bash
# AWS ElastiCache health checks

CLUSTER="prod-redis"
REGION="us-east-1"

echo "🔍 Checking ElastiCache cluster health..."

# Get cluster status
aws elasticache describe-cache-clusters \
  --cache-cluster-id $CLUSTER \
  --region $REGION \
  --show-cache-node-info \
  --query 'CacheClusters[0].[CacheClusterStatus, Engine, EngineVersion, CacheNodeType]' \
  --output table

# Get CPU and memory metrics
echo ""
echo "📊 Performance metrics:"

aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=CacheClusterId,Value=$CLUSTER \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region $REGION

aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name DatabaseMemoryUsagePercentage \
  --dimensions Name=CacheClusterId,Value=$CLUSTER \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region $REGION
```

---

## System Resource Monitoring

### Memory Monitoring

```bash
#!/bin/bash
# Monitor system memory in production

echo "🔍 System Memory Check"
echo ""

# Total memory
FREE_MEMORY=$(free -h | grep Mem | awk '{print $7}')
TOTAL_MEMORY=$(free -h | grep Mem | awk '{print $2}')
USED_PERCENT=$(free | grep Mem | awk '{printf("%.0f", ($3/$2) * 100)}')

echo "Memory Usage: $USED_PERCENT%"
echo "Free: $FREE_MEMORY / Total: $TOTAL_MEMORY"

if [ $USED_PERCENT -gt 85 ]; then
  echo "⚠️  WARNING: Memory usage exceeds 85%"
fi

if [ $USED_PERCENT -gt 95 ]; then
  echo "🔴 CRITICAL: Memory usage exceeds 95%"
fi

# Top processes by memory
echo ""
echo "Top 5 processes by memory:"
ps aux --sort=-%mem | head -6 | tail -5
```

### Disk Space Monitoring

```bash
#!/bin/bash
# Monitor disk space

echo "🔍 Disk Space Check"
echo ""

df -h / | tail -1 | awk '{
  print "Disk usage: " $5
  print "Free space: " $4
}'

# Check specific directories
echo ""
echo "Directory sizes:"
du -sh /var/log /opt/api /data/backups 2>/dev/null

# Alert on low space
DISK_USED=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USED -gt 85 ]; then
  echo "⚠️  WARNING: Disk usage exceeds 85%"
fi
```

### CPU & Load Monitoring

```bash
#!/bin/bash
# Monitor CPU and load

echo "🔍 CPU & Load Check"
echo ""

# Current load
echo "Load Average:"
uptime | awk -F'load average:' '{print $2}'

# CPU usage by core
echo ""
echo "CPU Usage per core:"
top -bn1 | head -20 | tail -15

# Processes using most CPU
echo ""
echo "Top 5 processes by CPU:"
ps aux --sort=-%cpu | head -6 | tail -5
```

---

## Application Metrics

### Prometheus Metrics Export

Add Prometheus client to track metrics:

```typescript
// File: src/middleware/metrics.ts

import promClient from 'prom-client';

// Create metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const dbQueryDuration = new promClient.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
});

export const cacheHitRate = new promClient.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_name'],
});

// Middleware to track metrics
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

// Export metrics endpoint
export function metricsEndpoint(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
}
```

### Key Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| **HTTP Latency (p95)** | > 500ms | Warning |
| **HTTP Latency (p99)** | > 1000ms | Critical |
| **Error Rate** | > 1% | Warning |
| **Error Rate** | > 5% | Critical |
| **Database Query Time** | > 1s | Warning |
| **Redis Response Time** | > 500ms | Warning |
| **Memory Usage** | > 80% | Warning |
| **Memory Usage** | > 90% | Critical |
| **Disk Usage** | > 80% | Warning |
| **Disk Usage** | > 95% | Critical |
| **CPU Usage** | > 70% | Warning |
| **CPU Usage** | > 90% | Critical |

---

## Alerting Rules

### CloudWatch Alarms

```bash
#!/bin/bash
# Create CloudWatch alarms for production

API_NAME="api-production"
SNS_TOPIC="arn:aws:sns:us-east-1:xxx:production-alerts"

# Alert: High Error Rate
aws cloudwatch put-metric-alarm \
  --alarm-name "$API_NAME-high-error-rate" \
  --alarm-description "Alert when error rate exceeds 1%" \
  --metric-name ErrorRate \
  --namespace CustomMetrics \
  --statistic Average \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_TOPIC

# Alert: High Latency (p95)
aws cloudwatch put-metric-alarm \
  --alarm-name "$API_NAME-high-latency-p95" \
  --alarm-description "Alert when p95 latency exceeds 500ms" \
  --metric-name ResponseTimeP95 \
  --namespace CustomMetrics \
  --statistic Average \
  --period 300 \
  --threshold 500 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 3 \
  --alarm-actions $SNS_TOPIC

# Alert: Database Connection Pool Exhausted
aws cloudwatch put-metric-alarm \
  --alarm-name "$API_NAME-db-connections-high" \
  --alarm-description "Alert when database connections exceed 80" \
  --metric-name DatabaseConnections \
  --namespace CustomMetrics \
  --statistic Maximum \
  --period 60 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_TOPIC

# Alert: Memory Usage High
aws cloudwatch put-metric-alarm \
  --alarm-name "$API_NAME-memory-usage-high" \
  --alarm-description "Alert when memory usage exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace CustomMetrics \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions $SNS_TOPIC
```

### Prometheus Alerting Rules

**File:** `infra/prometheus/alert-rules.yml`

```yaml
groups:
  - name: api.rules
    interval: 30s
    rules:
      # Alert on high error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      # Alert on high latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "p95 latency is {{ $value }}s"
      
      # Alert on database issues
      - alert: DatabaseSlow
        expr: rate(db_query_duration_seconds_bucket{le="+Inf"}[5m]) > 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Database queries are slow"
          description: "Some queries are taking > 1s"
```

---

## CloudWatch Dashboard

**File:** `infra/cloudwatch-dashboard.json`

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["CustomMetrics", "ResponseTime", {"stat": "Average"}],
          [".", "ResponseTimeP95", {"stat": "Average"}],
          [".", "ResponseTimeP99", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Response Times"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["CustomMetrics", "ErrorRate"],
          [".", "SuccessRate"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "API Error Rates"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "CPUUtilization", {"dimensions": {"DBInstanceIdentifier": "prod-postgresql"}}],
          [".", "DatabaseConnections"],
          [".", "ReadLatency"],
          [".", "WriteLatency"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Database Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["CustomMetrics", "MemoryUtilization"],
          [".", "CPUUtilization"],
          ["AWS/EC2", "DiskUtilization"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "System Resources"
      }
    }
  ]
}
```

---

**Status:** ✅ Ready for Production  
**Last Updated:** December 21, 2025
