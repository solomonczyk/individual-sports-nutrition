#!/bin/bash
# Health Check and Monitoring Setup Script
# Sets up health checks, logging, and alerting infrastructure

set -e

# Configuration
PROJECT_ROOT=$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")
LOG_DIR="${LOG_DIR:-/var/log/sports-nutrition}"
METRICS_DIR="${METRICS_DIR:-/var/metrics/sports-nutrition}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
  echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

error() {
  echo -e "${RED}✗ $1${NC}"
}

warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. Create directory structure
setup_directories() {
  log "Creating log and metrics directories..."
  mkdir -p "$LOG_DIR"/{backend-api,ai-service,database}
  mkdir -p "$METRICS_DIR"/{prometheus,grafana}
  success "Directories created"
}

# 2. Health check endpoints
create_health_checks() {
  log "Creating health check files..."
  
  # Database health check
  cat > "$PROJECT_ROOT/scripts/health-check-db.sh" << 'EOF'
#!/bin/bash
# Database health check
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USER:-postgres}
DB_NAME=${DATABASE_NAME:-individual_sports_nutrition}

if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
  # Check if we can query
  if PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo '{"status":"healthy","service":"database","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","checks":{"connection":"ok","query":"ok"}}'
    exit 0
  fi
fi

echo '{"status":"unhealthy","service":"database","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","error":"database_connection_failed"}'
exit 1
EOF
  
  # Redis health check
  cat > "$PROJECT_ROOT/scripts/health-check-redis.sh" << 'EOF'
#!/bin/bash
# Redis health check
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
  # Check memory usage
  MEMORY=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
  echo '{"status":"healthy","service":"redis","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","metrics":{"memory":"'$MEMORY'"}}'
  exit 0
fi

echo '{"status":"unhealthy","service":"redis","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","error":"redis_connection_failed"}'
exit 1
EOF

  # Backend API health check
  cat > "$PROJECT_ROOT/scripts/health-check-api.sh" << 'EOF'
#!/bin/bash
# Backend API health check
API_URL=${API_URL:-http://localhost:3000}

RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/v1/health" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY"
  exit 0
fi

echo '{"status":"unhealthy","service":"backend-api","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","http_code":'$HTTP_CODE'}'
exit 1
EOF

  # AI Service health check
  cat > "$PROJECT_ROOT/scripts/health-check-ai.sh" << 'EOF'
#!/bin/bash
# AI Service health check
AI_URL=${AI_URL:-http://localhost:8000}

RESPONSE=$(curl -s -w "\n%{http_code}" "$AI_URL/health" 2>/dev/null || echo -e "\n000")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "$BODY"
  exit 0
fi

echo '{"status":"unhealthy","service":"ai-service","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","http_code":'$HTTP_CODE'}'
exit 1
EOF

  chmod +x "$PROJECT_ROOT"/scripts/health-check-*.sh
  success "Health check scripts created"
}

# 3. Logging configuration
setup_logging() {
  log "Setting up logging infrastructure..."
  
  # Create logger configuration for services
  cat > "$PROJECT_ROOT/.env.logging" << 'EOF'
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT_DIR=/var/log/sports-nutrition

# Service-specific log levels
BACKEND_API_LOG_LEVEL=info
AI_SERVICE_LOG_LEVEL=info
DATABASE_LOG_LEVEL=warn

# Log retention
LOG_RETENTION_DAYS=30
LOG_MAX_SIZE_MB=100
EOF

  success "Logging configuration created"
}

# 4. Create monitoring script
create_monitoring_script() {
  log "Creating continuous monitoring script..."
  
  cat > "$PROJECT_ROOT/scripts/monitor-services.sh" << 'EOF'
#!/bin/bash
# Service monitoring script
# Runs health checks and collects metrics

set -e

MONITOR_DIR="/var/metrics/sports-nutrition"
CHECKS_INTERVAL=${CHECKS_INTERVAL:-60}
LOG_FILE="${MONITOR_DIR}/monitor.log"

mkdir -p "$MONITOR_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

run_health_checks() {
  local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local check_results="$MONITOR_DIR/checks_${timestamp}.json"
  
  log "Running health checks..."
  
  # Array to collect results
  declare -a results
  
  # Database check
  if bash scripts/health-check-db.sh > /tmp/db_check.json 2>&1; then
    results+=("$(cat /tmp/db_check.json)")
  else
    results+=('{"status":"unhealthy","service":"database"}')
  fi
  
  # Redis check
  if bash scripts/health-check-redis.sh > /tmp/redis_check.json 2>&1; then
    results+=("$(cat /tmp/redis_check.json)")
  else
    results+=('{"status":"unhealthy","service":"redis"}')
  fi
  
  # API check
  if bash scripts/health-check-api.sh > /tmp/api_check.json 2>&1; then
    results+=("$(cat /tmp/api_check.json)")
  else
    results+=('{"status":"unhealthy","service":"backend-api"}')
  fi
  
  # AI Service check
  if bash scripts/health-check-ai.sh > /tmp/ai_check.json 2>&1; then
    results+=("$(cat /tmp/ai_check.json)")
  else
    results+=('{"status":"unhealthy","service":"ai-service"}')
  fi
  
  # Combine results
  echo "{\"timestamp\":\"$timestamp\",\"checks\":[$(IFS=,; echo "${results[*]}")]}" > "$check_results"
  
  log "Health checks completed: $check_results"
  
  # Alert on failures
  for result in "${results[@]}"; do
    if echo "$result" | grep -q '"status":"unhealthy"'; then
      SERVICE=$(echo "$result" | grep -o '"service":"[^"]*"' | cut -d'"' -f4)
      log "⚠ ALERT: Service unhealthy: $SERVICE"
    fi
  done
}

# Collect system metrics
collect_metrics() {
  local timestamp=$(date +%s)
  
  # CPU usage
  local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
  
  # Memory usage
  local mem_total=$(free -m | awk 'NR==2{print $2}')
  local mem_used=$(free -m | awk 'NR==2{print $3}')
  local mem_percent=$((mem_used * 100 / mem_total))
  
  # Disk usage
  local disk_percent=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
  
  # Write metrics
  cat >> "$MONITOR_DIR/metrics.log" << METRICS
timestamp=$timestamp
cpu_usage=$cpu_usage
memory_usage=$mem_percent
disk_usage=$disk_percent
METRICS
}

# Main loop
log "Starting service monitoring..."
while true; do
  run_health_checks
  collect_metrics
  sleep $CHECKS_INTERVAL
done
EOF

  chmod +x "$PROJECT_ROOT/scripts/monitor-services.sh"
  success "Monitoring script created"
}

# 5. Create Prometheus configuration
setup_prometheus() {
  log "Creating Prometheus configuration..."
  
  mkdir -p "$METRICS_DIR/prometheus"
  
  cat > "$METRICS_DIR/prometheus/prometheus.yml" << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'sports-nutrition'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'localhost:9093'

rule_files:
  - 'rules.yml'

scrape_configs:
  # Backend API metrics
  - job_name: 'backend-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # AI Service metrics
  - job_name: 'ai-service'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  # Database metrics (if using pg_exporter)
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s

  # Redis metrics (if using redis_exporter)
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
    scrape_interval: 30s

  # Node metrics (system)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s
EOF

  success "Prometheus configuration created"
}

# 6. Create alerting rules
setup_alerting() {
  log "Creating alerting rules..."
  
  cat > "$METRICS_DIR/prometheus/rules.yml" << 'EOF'
groups:
  - name: sports-nutrition-alerts
    interval: 30s
    rules:
      # Service availability alerts
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "Service {{ $labels.job }} has been down for more than 2 minutes"

      # High error rate
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is above 5% for the last 5 minutes"

      # High latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "99th percentile latency is above 2 seconds"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (
            node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
          ) / node_memory_MemTotal_bytes > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 85%"

      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space running low"
          description: "Less than 10% disk space available"

      # Database connection errors
      - alert: DatabaseConnectionErrors
        expr: |
          sum(rate(postgres_connection_attempts_total{status="failed"}[5m])) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection errors detected"
          description: "Database connection errors rate exceeds threshold"

      # Redis connectivity
      - alert: RedisDown
        expr: redis_up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Redis is down"
          description: "Cannot connect to Redis server"

      # AI Service latency
      - alert: AIServiceHighLatency
        expr: |
          histogram_quantile(0.95, rate(ai_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI Service latency is high"
          description: "95th percentile latency exceeds 5 seconds"
EOF

  success "Alerting rules created"
}

# 7. Create monitoring dashboard config
setup_grafana() {
  log "Creating Grafana dashboard configuration..."
  
  mkdir -p "$METRICS_DIR/grafana"
  
  cat > "$METRICS_DIR/grafana/dashboards.json" << 'EOF'
{
  "dashboard": {
    "title": "Sports Nutrition Application",
    "uid": "sports-nutrition-main",
    "tags": ["application", "health"],
    "panels": [
      {
        "title": "Service Status",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=~\"backend-api|ai-service|postgres|redis\"}"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "API Latency (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes"
          }
        ]
      },
      {
        "title": "CPU Usage",
        "type": "gauge",
        "targets": [
          {
            "expr": "rate(node_cpu_seconds_total{mode!=\"idle\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_activity_count"
          }
        ]
      },
      {
        "title": "Redis Memory",
        "type": "gauge",
        "targets": [
          {
            "expr": "redis_memory_used_bytes / redis_memory_max_bytes"
          }
        ]
      }
    ]
  }
}
EOF

  success "Grafana dashboard created"
}

# 8. Create Docker Compose for monitoring stack
setup_monitoring_stack() {
  log "Creating monitoring stack Docker Compose..."
  
  cat > "$PROJECT_ROOT/docker-compose.monitoring.yml" << 'EOF'
version: '3.8'

services:
  # Prometheus - Metrics collection
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./docker/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./docker/monitoring/rules.yml:/etc/prometheus/rules.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - monitoring
    restart: unless-stopped

  # AlertManager - Alert management
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    volumes:
      - ./docker/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager_data:/alertmanager
    ports:
      - "9093:9093"
    networks:
      - monitoring
    restart: unless-stopped

  # Grafana - Visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/monitoring/grafana/dashboards.json:/etc/grafana/provisioning/dashboards/main.json:ro
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring
    restart: unless-stopped

  # Node Exporter - System metrics
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring
    restart: unless-stopped

  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:${DATABASE_PASSWORD:-postgres}@postgres:5432/individual_sports_nutrition?sslmode=disable"
    ports:
      - "9187:9187"
    depends_on:
      - postgres
    networks:
      - monitoring
    restart: unless-stopped

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    environment:
      REDIS_ADDR: "redis:6379"
    ports:
      - "9121:9121"
    depends_on:
      - redis
    networks:
      - monitoring
    restart: unless-stopped

  # Loki - Log aggregation
  loki:
    image: grafana/loki:latest
    container_name: loki
    volumes:
      - ./docker/monitoring/loki-config.yml:/etc/loki/local-config.yml:ro
      - loki_data:/loki
    ports:
      - "3100:3100"
    networks:
      - monitoring
    restart: unless-stopped

  # Promtail - Log forwarder to Loki
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - ./docker/monitoring/promtail-config.yml:/etc/promtail/config.yml:ro
      - /var/log/sports-nutrition:/var/log/sports-nutrition:ro
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring
    restart: unless-stopped

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
    driver: local
  alertmanager_data:
    driver: local
  grafana_data:
    driver: local
  loki_data:
    driver: local
EOF

  success "Monitoring stack Docker Compose created"
}

# 9. Create systemd service for monitoring
setup_systemd_service() {
  log "Creating systemd service for monitoring..."
  
  cat > "$PROJECT_ROOT/scripts/sports-nutrition-monitor.service" << 'EOF'
[Unit]
Description=Sports Nutrition Monitoring Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/project
ExecStart=/bin/bash scripts/monitor-services.sh
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  success "Systemd service created"
}

# Main execution
main() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}  Sports Nutrition Monitoring Setup${NC}"
  echo -e "${BLUE}========================================${NC}\n"
  
  setup_directories
  create_health_checks
  setup_logging
  create_monitoring_script
  setup_prometheus
  setup_alerting
  setup_grafana
  setup_monitoring_stack
  setup_systemd_service
  
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}  Setup Complete!${NC}"
  echo -e "${GREEN}========================================${NC}\n"
  
  echo -e "Next steps:\n"
  echo "1. ${YELLOW}Start monitoring services:${NC}"
  echo "   docker-compose -f docker-compose.monitoring.yml up -d\n"
  
  echo "2. ${YELLOW}Access dashboards:${NC}"
  echo "   - Prometheus: http://localhost:9090"
  echo "   - Grafana: http://localhost:3001 (default: admin/admin)"
  echo "   - AlertManager: http://localhost:9093\n"
  
  echo "3. ${YELLOW}Run monitoring script:${NC}"
  echo "   bash scripts/monitor-services.sh &\n"
  
  echo "4. ${YELLOW}View logs:${NC}"
  echo "   tail -f /var/log/sports-nutrition/monitor.log\n"
}

main
