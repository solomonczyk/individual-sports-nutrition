# Performance Testing Guide - Sport & Food App

## Overview

This guide covers performance testing using **k6** - a modern load testing tool.

**Status:** 2 comprehensive performance test suites created
**Framework:** k6 (Grafana's Load Testing Tool)
**Test Types:** Load, Spike, Stress, Endurance
**Metrics:** Response times, throughput, error rates

---

## What Is Performance Testing?

Performance testing measures how your system behaves under load:

| Test Type | Goal | Load | Duration | Use Case |
|-----------|------|------|----------|----------|
| **Load Test** | Baseline performance | Realistic | 1-5 min | Production readiness |
| **Spike Test** | Handle sudden load | 10x normal | 1-2 min | Peak traffic handling |
| **Stress Test** | Find breaking point | Increasing | 5-10 min | System limits |
| **Endurance Test** | Memory leaks | Normal | 1+ hours | Stability |

---

## Test Structure

### File Organization
```
backend-api/performance-tests/
├── api.load.test.js              # API load test (7 endpoints)
└── database.load.test.js          # Database operation test (5 scenarios)
```

### api.load.test.js (7 Endpoints Tested)
```
1. Authentication (Login)
   - Test: POST /api/auth/login
   - Metric: < 500ms (95th percentile)

2. User Profile
   - Test: GET /api/users/profile
   - Metric: < 1000ms (95th percentile)

3. Meal Recommendations
   - Test: GET /api/meals?limit=10
   - Metric: < 1000ms (95th percentile)

4. AI Recommendations
   - Test: GET /api/recommendations
   - Metric: < 2000ms (95th percentile)

5. Product Search
   - Test: GET /api/products?search=...
   - Metric: < 1000ms (95th percentile)

6. Meal Planning
   - Test: POST /api/meal-plan/meals
   - Metric: < 1000ms (95th percentile)

7. Nutrition Summary
   - Test: GET /api/nutrition/summary
   - Metric: < 1000ms (95th percentile)
```

### database.load.test.js (5 Database Scenarios)
```
1. Complex Query
   - Test: Filter products with multiple conditions
   - Metric: < 500ms

2. Batch Insert
   - Test: Add 5 meals in single request
   - Metric: < 2000ms

3. Pagination
   - Test: Retrieve 50 items with sorting
   - Metric: < 1000ms

4. Aggregation
   - Test: Calculate daily nutrition totals
   - Metric: < 500ms

5. Large Dataset Search
   - Test: Search 100 results from large dataset
   - Metric: < 1000ms
```

---

## Installation & Setup

### 1. Install k6

**Windows (Chocolatey)**
```powershell
choco install k6
```

**macOS (Homebrew)**
```bash
brew install k6
```

**Linux**
```bash
sudo apt-get install k6
```

**Or Docker**
```bash
docker pull grafana/k6
```

### 2. Verify Installation
```bash
k6 version
# Should output: k6 v0.47.0 or similar
```

### 3. Backend Setup
```bash
# Ensure backend is running
npm run dev

# In another terminal
npm run test:load
```

---

## Running Performance Tests

### Run Load Test
```bash
# Run API load test
k6 run performance-tests/api.load.test.js

# Run with custom parameters
k6 run -e BASE_URL=http://localhost:3000 \
          -e VUS=50 \
          -e DURATION=5m \
          performance-tests/api.load.test.js
```

### Run Database Test
```bash
k6 run performance-tests/database.load.test.js
```

### Run with Grafana Cloud (Optional)
```bash
# Connect to Grafana Cloud for visualization
k6 run -o cloud performance-tests/api.load.test.js
```

### Different Load Profiles

**Light Load (10 users, 1 minute)**
```bash
VUS=10 DURATION=1m k6 run performance-tests/api.load.test.js
```

**Normal Load (50 users, 5 minutes)**
```bash
VUS=50 DURATION=5m k6 run performance-tests/api.load.test.js
```

**Heavy Load (100+ users)**
```bash
VUS=100 DURATION=10m k6 run performance-tests/api.load.test.js
```

**Spike Test (Sudden load spike)**
```bash
# Edit playwright.config.ts, uncomment spikeOptions
k6 run --config spikeOptions performance-tests/api.load.test.js
```

**Stress Test (Increase until breaking)**
```bash
# Edit playwright.config.ts, uncomment stressOptions
k6 run --config stressOptions performance-tests/api.load.test.js
```

---

## Understanding Results

### Standard Output
```
          /\      |‾‾| /‾‾/‾‾/    /‾/   /‾/
     /\  /  \     |  |/  /  /    /  /  /  /
    /  \/    \    |     (  (    /  /__/  /
   /          \   |  |\  \  \  /________/
  / __________ \  |__| \__\__\

execution: local
...
checks.........................: 95.23%
duration........................: 1m10s
data_received....................: 2.3 MB
data_sent........................: 1.1 MB
http_req_blocked.................: avg=2.32ms
http_req_connecting.............: avg=0.87ms
http_req_duration................: avg=182.34ms
http_req_failed..................: 1.23%
http_req_receiving...............: avg=12.23ms
http_req_sending.................: avg=5.12ms
http_req_tls_handshaking.........: avg=0.00ms
http_req_waiting.................: avg=164.99ms
http_reqs........................: 1234
http_reqs_per_sec................: 17.6
iteration_duration...............: avg=12.3s
iterations........................: 100
...
```

### Key Metrics Explained

| Metric | Meaning | Good Range |
|--------|---------|-----------|
| **http_req_duration** | Total response time | < 500ms (avg) |
| **p(95)** | 95th percentile | Important for tail latency |
| **http_req_failed** | Error rate | < 1% |
| **http_reqs_per_sec** | Throughput | Should match expected |
| **checks** | Pass rate | > 95% |
| **iteration_duration** | Full user workflow | Depends on test |

### Interpreting p(95)
```
p(95)<500 means:
- 95% of requests completed in < 500ms
- Only 5% took longer (acceptable)
- If > 500ms: may need optimization
```

---

## Performance Baselines

### Acceptable Thresholds

**API Endpoints**
```
Login:                p(95) < 500ms
Get Profile:          p(95) < 1000ms
List Meals:           p(95) < 1000ms
AI Recommendations:   p(95) < 2000ms
Product Search:       p(95) < 1000ms
Add to Plan:          p(95) < 1000ms
Nutrition Summary:    p(95) < 1000ms
```

**Database Operations**
```
Simple Queries:       p(95) < 500ms
Batch Insert (5x):    p(95) < 2000ms
Pagination (50 items) p(95) < 1000ms
Aggregation:          p(95) < 500ms
Large Search (100x):  p(95) < 1000ms
```

**Overall Error Rate**
```
< 1% HTTP errors acceptable
> 1% indicates issues
> 5% indicates critical problems
```

---

## Advanced Testing Scenarios

### 1. Realistic User Behavior
```javascript
// Simulate real user patterns
export default function () {
  // 50% of users do this
  if (Math.random() < 0.5) {
    // Common path
  } else {
    // Uncommon path
  }
}
```

### 2. Think Time
```javascript
// Users spend time reading
sleep(5); // 5 seconds between actions
```

### 3. Ramp-up Strategy
```javascript
stages: [
  { duration: '5m', target: 50 },   // Gradually add users
  { duration: '10m', target: 50 },  // Maintain load
  { duration: '5m', target: 0 },    // Gradually remove
]
```

### 4. Data Parameterization
```javascript
// Use different data per user
const users = [
  { email: 'user1@test.com', ... },
  { email: 'user2@test.com', ... },
];

const user = users[__VU % users.length];
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check firewall
# Ensure port 3000 is accessible
```

### High Error Rate
```bash
# Check backend logs
npm run dev

# Check if database is running
# Check authentication tokens are valid
```

### Memory Issues
```bash
# Limit virtual users
k6 run -e VUS=10 api.load.test.js

# Run shorter test
k6 run -e DURATION=1m api.load.test.js
```

### Tests Running Too Slow
```bash
# Check if backend is overloaded
# Reduce VUS (virtual users)
# Check database query performance

# View backend metrics
curl http://localhost:3000/metrics
```

---

## Optimization Workflow

### 1. Identify Bottleneck
```bash
# Run load test
k6 run performance-tests/api.load.test.js

# Check which endpoint is slowest
# (Look for highest http_req_duration)
```

### 2. Analyze Issue
```bash
# Options:
# - Add database index
# - Cache results
# - Optimize query
# - Add CDN
# - Scale vertically/horizontally
```

### 3. Verify Fix
```bash
# Run test again
k6 run performance-tests/api.load.test.js

# Compare results
# p(95) should decrease
# Error rate should stay < 1%
```

### 4. Set Threshold
```javascript
thresholds: {
  'http_req_duration': ['p(95)<400'], // New target
}
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Performance Tests
on: [push]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: grafana/k6-action@v0.2.0
        with:
          filename: performance-tests/api.load.test.js
          cloud: false  # Set to true for Grafana Cloud
```

### Pre-deployment Check
```bash
#!/bin/bash
# Run performance test
k6 run performance-tests/api.load.test.js --out json=results.json

# Check if thresholds passed
if [ $? -eq 0 ]; then
  echo "Performance OK - Ready to deploy"
  exit 0
else
  echo "Performance issue detected"
  exit 1
fi
```

---

## Real-World Scenarios

### Scenario 1: Lunch Hour Spike
```javascript
// 10x normal traffic for 30 minutes
stages: [
  { duration: '5m', target: 100 },    // Ramp up
  { duration: '30m', target: 100 },   // Sustained high load
  { duration: '5m', target: 10 },     // Back to normal
]
```

### Scenario 2: New Feature Launch
```javascript
// Spike when feature goes live
stages: [
  { duration: '1m', target: 10 },     // Normal
  { duration: '1m', target: 200 },    // Spike
  { duration: '2m', target: 200 },    // Sustained
  { duration: '1m', target: 10 },     // Back to normal
]
```

### Scenario 3: Cache Failure
```javascript
// Test what happens without cache
stages: [
  { duration: '2m', target: 50 },
  { duration: '5m', target: 50 },     // Expect p(95) to increase
  { duration: '2m', target: 0 },
]
```

---

## Metrics to Monitor

### Application Metrics
- Response time (p50, p95, p99)
- Throughput (requests/sec)
- Error rate (%)
- Success rate (%)

### System Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network bandwidth

### Database Metrics
- Query time
- Connection pool usage
- Lock wait time
- Slow queries

---

## Performance Report Template

```markdown
# Performance Test Results

## Test Configuration
- Virtual Users: 50
- Duration: 5m
- Date: 2024-01-15

## Key Results
- Avg Response Time: 182ms
- p95 Response Time: 420ms
- Error Rate: 0.8%
- Throughput: 17.6 req/s

## Per-Endpoint Results
| Endpoint | Avg | p95 | Error |
|----------|-----|-----|-------|
| Login | 150ms | 320ms | 0.2% |
| Meals | 220ms | 540ms | 1.2% |
| Recommendations | 350ms | 780ms | 0.5% |

## Recommendations
- ✅ All endpoints meet SLA
- ⚠️ Meals endpoint close to limit, consider optimization
- ✅ Error rate acceptable

## Next Steps
- Monitor in production
- Set up continuous performance testing
- Re-test after optimizations
```

---

## Quick Commands

```bash
# Run standard load test
k6 run performance-tests/api.load.test.js

# Run with specific parameters
k6 run -e VUS=100 -e DURATION=10m performance-tests/api.load.test.js

# Run and save results
k6 run --out json=results.json performance-tests/api.load.test.js

# View results
cat results.json | jq '.'

# Docker
docker run -i grafana/k6 run - < performance-tests/api.load.test.js
```

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 API Reference](https://k6.io/docs/javascript-api/)
- [Grafana Cloud](https://grafana.com/cloud/)
- [Performance Best Practices](https://k6.io/docs/how-to/)

---

**Last Updated:** Week 3, Day 2
**Status:** Performance testing framework created
**Next:** Run tests and optimize based on results
