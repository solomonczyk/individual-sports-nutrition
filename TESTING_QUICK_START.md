# 🚀 Quick Start Testing Guide

## Installation & Setup (First Time Only)

### Backend Setup
```bash
cd backend-api
npm install
npx playwright install
```

### Install k6
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

---

## Running Tests

### 1️⃣ Start Backend
```bash
cd backend-api
npm run dev
```
Backend runs on: `http://localhost:3000`

### 2️⃣ Run Unit Tests
```bash
cd backend-api
npm test                    # All unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### 3️⃣ Run E2E Tests
```bash
cd backend-api

# All E2E tests
npm run test:e2e

# In browser (see what's happening)
npm run test:e2e:headed

# Debug mode (step by step)
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### 4️⃣ Run Performance Tests
```bash
cd backend-api

# Standard load (10 users, 1 min)
k6 run performance-tests/api.load.test.js

# Custom load
VUS=50 DURATION=5m k6 run performance-tests/api.load.test.js

# Database operations
k6 run performance-tests/database.load.test.js

# Save results
k6 run --out json=results.json performance-tests/api.load.test.js
```

### 5️⃣ Run All Tests
```bash
cd backend-api
npm run test:all  # Unit + E2E
```

---

## Mobile App Tests

### Setup
```bash
cd mobile-app
npm install
```

### Run Tests
```bash
npm test                 # All tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage
```

---

## Performance Test Profiles

### Light Load (Quick Check)
```bash
k6 run backend-api/performance-tests/api.load.test.js
# 10 users, 1 minute
```

### Normal Load (Production Baseline)
```bash
VUS=50 DURATION=5m k6 run backend-api/performance-tests/api.load.test.js
# 50 users, 5 minutes
```

### Heavy Load (Stress Test)
```bash
VUS=100 DURATION=10m k6 run backend-api/performance-tests/api.load.test.js
# 100 users, 10 minutes
```

---

## Understanding Results

### E2E Test Report
```bash
npm run test:e2e:report

# Opens: playwright-report/index.html
# Shows:
# - Test results
# - Screenshots on failure
# - Videos on failure
# - Detailed timing
```

### Performance Test Output
```
Key Metrics:
- http_req_duration: Average response time
- p(95): 95th percentile (important for tail latency)
- http_req_failed: Error rate (should be < 1%)
- http_reqs_per_sec: Throughput

Example "PASS":
✓ p(95) < 500ms
✓ Error rate < 1%
✓ All checks passed

Example "FAIL":
✗ p(95) > 500ms (degraded)
✗ Error rate > 1% (too high)
✗ Checks < 90% (issues found)
```

---

## Common Scenarios

### Run Everything (Full Test Suite)
```bash
cd backend-api

echo "=== Unit Tests ==="
npm test

echo "=== E2E Tests ==="
npm run test:e2e

echo "=== Performance Tests ==="
k6 run performance-tests/api.load.test.js
```

### Before Deployment
```bash
cd backend-api

# 1. Unit tests must pass
npm test || exit 1

# 2. E2E tests must pass
npm run test:e2e || exit 1

# 3. Performance must meet baseline
k6 run performance-tests/api.load.test.js || exit 1

echo "✅ All tests passed - Ready to deploy"
```

### Debugging Failing Test
```bash
# Find failing test
npm run test:e2e

# Run just that test
npx playwright test -g "test name"

# Debug mode
npx playwright test --debug

# View failure details
npm run test:e2e:report
```

### Performance Optimization
```bash
# 1. Get baseline
k6 run --out json=baseline.json performance-tests/api.load.test.js

# 2. Make changes
# ... apply optimizations ...

# 3. Test again
k6 run --out json=optimized.json performance-tests/api.load.test.js

# 4. Compare results
# Check if p(95) improved and errors decreased
```

---

## Test Statistics

### What You're Running
```
Unit Tests:           152 tests
E2E Tests:            74+ tests
Performance Tests:    2 test suites (7 endpoints + 5 DB ops)
Mobile Tests:         50+ tests

Total Coverage:       82-85%
Total Time:           ~5-10 minutes
```

### Critical Paths Tested
```
✅ User Registration
✅ User Login
✅ Health Profile Setup
✅ Meal Planning
✅ Shopping & Checkout
✅ API Performance
✅ Database Efficiency
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### "Playwright tests won't run"
```bash
# Reinstall browsers
npx playwright install

# Run with verbose output
npx playwright test --reporter=list
```

### "k6 connection refused"
```bash
# Check backend is running
curl http://localhost:3000/health

# Check port
netstat -an | grep 3000
```

### "Tests run too slow"
```bash
# Reduce VUS for k6
k6 run -e VUS=5 performance-tests/api.load.test.js

# Run fewer E2E tests
npx playwright test --project=chromium
```

---

## CI/CD Integration

### GitHub Actions (Automatic)
Tests run automatically on:
- ✅ Push to main
- ✅ Pull requests
- ✅ Scheduled daily (if configured)

### Manual Trigger
```bash
# Run all tests locally before pushing
npm run test:all
```

---

## Documentation

### Quick Guides
- [E2E Testing](./docs/E2E_TESTING_GUIDE.md)
- [Performance Testing](./docs/PERFORMANCE_TESTING_GUIDE.md)
- [API Documentation](./docs/OPENAPI_GUIDE.md)

### Detailed Information
- [Week 3 Summary](./WEEK3_TWO_DAYS_SUMMARY.md)
- [Project Status](./PROJECT_STATUS.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)

---

## Next Steps

### After Tests Pass ✅
1. Review results
2. Check coverage metrics
3. Commit changes
4. Deploy to staging

### If Tests Fail ❌
1. Review error details
2. Check logs
3. Fix issues
4. Re-run tests
5. Verify fix works

---

## Commands Reference

```bash
# Quick Start
npm run dev                    # Start backend
npm test                       # Unit tests
npm run test:e2e              # E2E tests
k6 run performance-tests/api.load.test.js  # Performance

# Full Test Suite
npm run test:all              # Unit + E2E

# Reports
npm run test:coverage         # Coverage report
npm run test:e2e:report       # E2E HTML report

# Debug
npm run test:e2e:debug        # Interactive debug
npm run test:e2e:headed       # See browser
npx playwright test --debug   # Step through

# Performance Variations
VUS=10 DURATION=1m k6 run performance-tests/api.load.test.js    # Light
VUS=50 DURATION=5m k6 run performance-tests/api.load.test.js    # Normal
VUS=100 DURATION=10m k6 run performance-tests/api.load.test.js  # Heavy
```

---

## ✅ Checklist Before Deployment

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Performance within baseline
- [ ] Coverage > 80%
- [ ] No console errors
- [ ] No failed assertions
- [ ] All endpoints responding
- [ ] Database queries fast (< 500ms)

---

## 📊 Success Indicators

### ✅ All Green
```
✓ 152 unit tests pass
✓ 74+ E2E tests pass
✓ Performance p(95) < threshold
✓ Error rate < 1%
✓ Coverage > 80%
→ Ready to deploy
```

### ⚠️ Some Issues
```
! 1-2 tests failing
! Performance slightly above threshold
! Coverage < 80%
→ Fix issues before deploying
```

### ❌ Major Issues
```
✗ Multiple tests failing
✗ Performance significantly degraded
✗ Coverage < 70%
✗ Error rate > 5%
→ Do not deploy - investigate first
```

---

## 🎯 Your Testing Journey

1. **Installation** ← You are here
2. **Run Tests** ← Execute the tests
3. **Review Results** ← Understand the output
4. **Fix Issues** ← Address any failures
5. **Deploy Confidently** ← Go to production

**Next Command:**
```bash
npm run dev
```

Then in another terminal:
```bash
npm test
```

Good luck! 🚀
