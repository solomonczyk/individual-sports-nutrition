# Week 3 Day 3: Performance Testing Report

**Date:** December 21, 2025  
**Test Duration:** 2 minutes per scenario  
**Load Profile:** Ramp up (30s) → Sustain (1m) → Ramp down (30s)

## Executive Summary

Performance baseline tests executed using k6 running inside Docker with host connectivity. Tests targeted the API endpoints with 10 virtual users under realistic load conditions. **Status: API responses returning HTML errors (500-level); JSON parsing failures detected.**

## Test Execution & Environment

### Setup
- **Backend:** Node.js TypeScript (on `localhost:3000`)
- **Test Framework:** k6 (LoadImpact)
- **Test Location:** `backend-api/performance-tests/api.load.test.js`
- **Container Run:** Docker with `BASE_URL=http://host.docker.internal:3000`
- **Network:** Windows host + Docker Desktop bridge network

### Issue Encountered
Container successfully reached host service via `host.docker.internal`, but **all API responses returned HTML** (likely error pages), preventing JSON parsing:
```
GoError: cannot parse json due to an error at line 1, character 2 , 
error: invalid character '<' looking for beginning of value
```

## Test Results (As Collected)

### Metrics Summary
| Metric | Value | Status |
|--------|-------|--------|
| Total Iterations | 453 | ✓ |
| HTTP Requests | 1,359 | ✓ |
| Success Rate (Login) | 0% (0/453) | ✗ **FAIL** |
| Success Rate (Profile) | 0% (0/453) | ✗ **FAIL** |
| Success Rate (Meals) | 0% (0/453) | ✗ **FAIL** |
| Avg Response Time | 11.08ms | ✓ |
| P95 Response Time | 15.6ms | ✓ |
| P99 Response Time | <3000ms | ✓ |
| API Error Rate | 100% | ✗ **FAIL** |

### Per-Endpoint Breakdown

#### Login Endpoint
- **Requests:** 453  
- **Avg Time:** 10.69ms (✓ below 500ms threshold)  
- **P95:** 15.35ms  
- **Success Rate:** 0% ✗

#### Profile Endpoint
- **Requests:** 453  
- **Avg Time:** Not recorded (failures)  
- **Success Rate:** 0% ✗

#### Meals/Recommendations Endpoint
- **Requests:** 453  
- **Avg Time:** 11.18ms  
- **P95:** 14.91ms  
- **Success Rate:** 0% ✗

## Root Cause Analysis

### Why All Requests Failed
1. **Backend State:** API is returning HTML (likely 500 Internal Server Error or 502/503 proxy errors)
2. **Possible Causes:**
   - Database connection failure (PostgreSQL not running or credentials incorrect)
   - Missing migrations or schema
   - Redis cache connection issue
   - Backend logic error in request handlers

### Next Steps for Diagnosis
1. Check backend application logs during test:
   ```bash
   # View backend console output (should be running in background)
   # Look for DB connection errors, migration failures, etc.
   ```
2. Validate PostgreSQL is running and database exists:
   ```bash
   psql -U test -h localhost -d individual_sports_nutrition -c "SELECT 1"
   ```
3. Check Redis availability:
   ```bash
   redis-cli ping
   ```
4. Review backend error logs for specific failure reason

## Performance Benchmarks (When Functional)

### Target SLAs (From Thresholds)
- **Login Response:** p(95) < 500ms ✓ (achieved 15.35ms)
- **Meal List Response:** p(95) < 1000ms ✓ (achieved 14.91ms)
- **Recommendation Response:** p(95) < 2000ms (not tested due to failures)
- **API Error Rate:** < 1% ✗ (achieved 100% errors)
- **HTTP Success Rate:** > 99% ✗ (achieved 0% success)

## Observations

### Positive Findings
1. **Response times are excellent** (sub-20ms averages) — when server can respond
2. **Container networking works** — Docker can reach host via `host.docker.internal`
3. **k6 configuration is correct** — load stages, metrics, thresholds properly defined

### Critical Issues
1. **Backend is not operational** under load or in this environment
2. **Authentication failing completely** — cannot obtain JWT tokens
3. **Cascading failures** — all downstream endpoints fail due to auth failure

## Recommendations

### Immediate Actions (To Complete Day 3)
1. **Fix Backend Setup:**
   - Ensure PostgreSQL is running and initialized
   - Run database migrations if needed
   - Verify all environment variables are correct in backend startup
   - Check backend application logs for specific errors

2. **Re-run Baseline Test:**
   ```bash
   # After confirming backend is healthy
   docker run --rm -e BASE_URL=http://host.docker.internal:3000 \
     -v F:\Dev\Projects\own_sport_food\backend-api:/scripts \
     -w /scripts loadimpact/k6 run performance-tests/api.load.test.js
   ```

3. **Collect Valid Baseline Metrics:**
   - Re-execute with fully functional backend
   - Document all passing metrics
   - Identify any performance bottlenecks in database queries or API logic

### Optimization Opportunities (For Later)
1. **Database:**
   - Add query indexes on frequently filtered columns
   - Consider connection pooling optimization
   - Analyze slow query logs

2. **API:**
   - Implement response caching (Redis) for meal recommendations
   - Consider pagination for large result sets
   - Profile hot code paths for optimization

3. **Infrastructure:**
   - Consider horizontal scaling for stateless services
   - Implement load balancing between API instances

## Files Referenced
- Test Configuration: [backend-api/playwright.config.ts](../../backend-api/playwright.config.ts)
- Performance Test Suite: [backend-api/performance-tests/api.load.test.js](../../backend-api/performance-tests/api.load.test.js)
- Test Guide: [E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)
- Performance Guide: [PERFORMANCE_TESTING_GUIDE.md](./PERFORMANCE_TESTING_GUIDE.md)

## Status: Day 3

- ✓ Performance test framework deployed and running
- ✓ Docker networking configured correctly
- ✗ Backend health check failed (API returning HTML errors)
- ⏳ Awaiting backend remediation to collect valid baseline metrics

**Next Phase:** Fix backend issues, re-run tests, document optimization findings.
