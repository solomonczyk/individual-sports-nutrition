# Week 3 Day 2 - Performance Testing Framework ✅

## What Was Created Today

### 🎯 Performance Testing Framework
Created complete performance testing infrastructure using **k6** (Grafana's load testing tool).

### 📊 Performance Test Files (2 suites)

**1. api.load.test.js** - API Endpoints Performance
```javascript
Virtual Users: 10-100 (configurable)
Duration: 1 minute + ramp up/down
Endpoints tested:
  ✅ Login (POST /api/auth/login) - p(95) < 500ms
  ✅ User Profile (GET /api/users/profile) - p(95) < 1000ms
  ✅ Meal List (GET /api/meals) - p(95) < 1000ms
  ✅ AI Recommendations (GET /api/recommendations) - p(95) < 2000ms
  ✅ Product Search (GET /api/products) - p(95) < 1000ms
  ✅ Add to Meal Plan (POST /api/meal-plan/meals) - p(95) < 1000ms
  ✅ Nutrition Summary (GET /api/nutrition/summary) - p(95) < 1000ms

Metrics tracked:
  - Response times (avg, p95, p99)
  - Error rates (< 1%)
  - Throughput (requests/sec)
  - Individual endpoint performance
```

**2. database.load.test.js** - Database Operation Performance
```javascript
Virtual Users: 20 (configurable)
Duration: 1 minute + ramp up/down
Scenarios tested:
  ✅ Complex Query - Products with filters - p(95) < 500ms
  ✅ Batch Insert - Add 5 meals at once - p(95) < 2000ms
  ✅ Pagination - Get 50 items with sorting - p(95) < 1000ms
  ✅ Aggregation - Daily nutrition totals - p(95) < 500ms
  ✅ Large Dataset Search - 100 results - p(95) < 1000ms

Metrics tracked:
  - Query performance
  - Batch operation efficiency
  - Pagination overhead
  - Aggregation time
  - Full table search time
```

### 📚 Documentation
**PERFORMANCE_TESTING_GUIDE.md** (600+ lines)
- Installation & setup instructions
- Running different test types (load, spike, stress)
- Understanding k6 metrics
- Performance baselines & thresholds
- Advanced testing scenarios
- Troubleshooting guide
- CI/CD integration
- Optimization workflow
- Real-world scenarios

### 🔧 Test Features

**Load Test Profiles**
```
Light Load:   10 VUS × 1 minute
Normal Load:  50 VUS × 5 minutes
Heavy Load:   100+ VUS × 10 minutes
Spike Test:   10→100 VUS sudden increase
Stress Test:  100→300 VUS increasing limit
```

**Automatic Thresholds**
```
✅ Login time: p(95) < 500ms
✅ API time: p(95) < 1000ms
✅ Batch operations: p(95) < 2000ms
✅ Database queries: p(95) < 500ms
✅ Error rate: < 1%
```

**Metrics Collected**
```
- http_req_duration (response time)
- http_req_failed (error rate)
- http_reqs_per_sec (throughput)
- Custom trends (per endpoint)
- Custom counters (per operation)
- Custom rates (error tracking)
```

---

## How to Use

### Installation
```bash
# Windows (Chocolatey)
choco install k6

# macOS
brew install k6

# Linux
sudo apt-get install k6

# Verify
k6 version
```

### Run API Load Test
```bash
# Standard (10 users, 1 min)
k6 run backend-api/performance-tests/api.load.test.js

# Custom load (50 users, 5 min)
VUS=50 DURATION=5m k6 run backend-api/performance-tests/api.load.test.js

# Heavy load (100 users)
VUS=100 DURATION=10m k6 run backend-api/performance-tests/api.load.test.js
```

### Run Database Test
```bash
k6 run backend-api/performance-tests/database.load.test.js
```

### View Results
```bash
# Save as JSON
k6 run --out json=results.json backend-api/performance-tests/api.load.test.js

# Analyze results
cat results.json | jq '.metrics'
```

### Cloud Integration (Optional)
```bash
# Run with Grafana Cloud visualization
k6 run -o cloud backend-api/performance-tests/api.load.test.js
```

---

## Test Statistics

| Metric | Load Test | DB Test | Total |
|--------|-----------|---------|-------|
| Endpoints | 7 | - | 7 |
| Scenarios | 1 | 5 | 6 |
| Virtual Users | 10-100 | 20 | Configurable |
| Duration | 1-5m | 1-5m | 2-10m total |

---

## Understanding Results

### Example Output
```
checks.........................: 95.23%
http_req_duration................: avg=182.34ms p(95)=420ms
http_req_failed..................: 1.23%
http_reqs_per_sec................: 17.6
iterations........................: 100
```

### Interpreting p(95)
```
p(95) < 500ms means:
- 95% of requests completed in < 500ms
- Only 5% took longer (acceptable tail)
- Critical for user experience
```

### Success Criteria
```
✅ Pass if:
  - p(95) < threshold
  - Error rate < 1%
  - All checks pass

❌ Fail if:
  - p(95) > threshold
  - Error rate > 5%
  - Checks < 90%
```

---

## Performance Baselines

**Established Thresholds:**
```
API Login:           p(95) < 500ms
API Endpoints:       p(95) < 1000ms
AI Recommendations:  p(95) < 2000ms
DB Queries:          p(95) < 500ms
Batch Insert (5x):   p(95) < 2000ms
Error Rate:          < 1% acceptable
```

---

## Integration Points

### Before Running Tests
1. ✅ Start backend server
   ```bash
   npm run dev
   ```

2. ✅ Ensure database is running
   ```bash
   # Check PostgreSQL
   psql postgres
   ```

3. ✅ Verify test users exist
   ```sql
   SELECT * FROM users WHERE email LIKE 'user%@test.com';
   ```

### After Running Tests
1. 📊 Save results
   ```bash
   k6 run --out json=results-$(date +%s).json api.load.test.js
   ```

2. 📈 Compare with baseline
   - Previous run: baseline
   - Current run: current
   - Calculate improvement/degradation

3. 🔍 Investigate if failed
   - Check backend logs
   - Check database slow queries
   - Check system resources

---

## Optimization Examples

### If Login Slow (> 500ms)
```
Possible causes:
1. Database lookup slow → Add index on email
2. Password hash slow → Optimize bcrypt cost
3. JWT generation slow → Cache tokens
4. Network latency → Check connection pool

Solution:
1. Add database index
2. Run test again
3. Verify improvement
```

### If Meal List Slow (> 1000ms)
```
Possible causes:
1. Missing database index → Add index on user_id
2. N+1 query problem → Use JOINs
3. No caching → Add Redis cache
4. Large dataset → Add pagination

Solution:
1. Check slow query log
2. Optimize query with EXPLAIN
3. Add cache layer
4. Run test again
```

### If Error Rate High (> 1%)
```
Possible causes:
1. Connection pool exhausted → Increase pool size
2. Memory leak → Check memory usage
3. Database locks → Check transaction isolation
4. API rate limiting → Increase limits

Solution:
1. Monitor system resources
2. Check error logs
3. Increase pool/limits
4. Run test again
```

---

## Tomorrow's Tasks (Week 3 Day 3)

✅ **Run Performance Tests**
- Execute load test with increasing load
- Document baseline metrics
- Identify optimization opportunities

✅ **Optimization**
- Fix identified bottlenecks
- Add indexes/caches as needed
- Re-run tests to verify

✅ **Performance Report**
- Create PERFORMANCE_REPORT.md
- Document baseline & optimized metrics
- Include recommendations

---

## Current Week 3 Status

```
Week 3 Progress:
├─ Day 1: ✅ E2E Framework (COMPLETE)
│   ├─ Playwright setup
│   ├─ 74+ E2E tests
│   └─ E2E_TESTING_GUIDE.md
├─ Day 2: ✅ Performance Framework (COMPLETE)
│   ├─ k6 setup
│   ├─ 2 performance test suites
│   └─ PERFORMANCE_TESTING_GUIDE.md
├─ Day 3: ⏳ Run & Optimize (NEXT)
│   ├─ Execute performance tests
│   ├─ Identify bottlenecks
│   └─ Create optimization report
├─ Day 4: ⏳ Deployment Guide (PENDING)
└─ Day 5: ⏳ Handoff Documentation (PENDING)
```

---

## Overall Project Status

```
✅ Week 1 (Stabilization) - 55+ tests
✅ Week 2 (Testing & Documentation) - 202+ tests
⏳ Week 3 (Deployment & Handoff)
   ├─ Day 1: ✅ E2E Testing (74+ tests)
   ├─ Day 2: ✅ Performance Testing (2 suites)
   ├─ Day 3: ⏳ Run & Optimize (NEXT)
   ├─ Day 4: ⏳ Production Deploy
   └─ Day 5: ⏳ Team Handoff

Total: 276+ tests, 85%+ coverage, 21+ docs
```

---

## Key Links

📚 **Documentation**
- [Performance Testing Guide](../docs/PERFORMANCE_TESTING_GUIDE.md)
- [E2E Testing Guide](../docs/E2E_TESTING_GUIDE.md)

🧪 **Test Files**
- [API Load Test](./backend-api/performance-tests/api.load.test.js)
- [Database Test](./backend-api/performance-tests/database.load.test.js)

📖 **Guides**
- [k6 Documentation](https://k6.io/docs/)
- [k6 Best Practices](https://k6.io/docs/how-to/)

---

**Status:** Week 3 Day 2 Complete ✅  
**Next:** Week 3 Day 3 - Run tests and optimize  
**Progress:** ~66% through Week 3  

Continue? Run:
```bash
k6 run backend-api/performance-tests/api.load.test.js
```
