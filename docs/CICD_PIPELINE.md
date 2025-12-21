# CI/CD Pipeline Architecture & Operations

**Version:** 1.0.0  
**Last Updated:** December 21, 2025  
**Status:** Production Ready

## Table of Contents
1. [Pipeline Overview](#pipeline-overview)
2. [Workflow Architecture](#workflow-architecture)
3. [Pipeline Stages](#pipeline-stages)
4. [GitHub Actions Secrets](#github-actions-secrets)
5. [Branch Strategy](#branch-strategy)
6. [Deployment Strategy](#deployment-strategy)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Troubleshooting](#troubleshooting)

---

## Pipeline Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to main/develop/staging                                   │
│  │                                                               │
│  ├─→ ┌──────────────┐                                           │
│  │   │Code Quality  │  (lint, format, TypeScript)              │
│  │   └──────────────┘                                           │
│  │         │                                                    │
│  │  ┌──────┴──────────────────────────┐                        │
│  │  │                                 │                        │
│  │  ├─→ ┌─────────────┐  ┌──────────┐  ┌──────────────┐       │
│  │  │   │Unit Tests   │  │Security  │  │Performance  │       │
│  │  │   │Integration  │  │Scanning  │  │Tests (k6)   │       │
│  │  │   │E2E Tests    │  │(Snyk)    │  │(main only)  │       │
│  │  │   └─────────────┘  └──────────┘  └──────────────┘       │
│  │  │         │                                                │
│  │  ├─→ ┌─────────────────┐                                    │
│  │  │   │Build Docker     │                                    │
│  │  │   │Push to Registry │                                    │
│  │  │   └─────────────────┘                                    │
│  │  │         │                                                │
│  │  └─→ Merge to develop/staging                              │
│  │       │                                                     │
│  │       ├─→ Deploy to Staging (auto)                        │
│  │           └─→ Health checks                               │
│  │                                                           │
│  └─→ Merge to main                                          │
│      │                                                        │
│      ├─→ Deploy to Production (manual approval)             │
│          ├─→ Backup previous version                        │
│          ├─→ Blue-green deployment                          │
│          └─→ Health verification                            │
│                                                              │
│  ✅ Final notification → Slack                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow Architecture

### File Location
**`.github/workflows/backend-ci.yml`** - Main pipeline configuration

### Pipeline Characteristics

| Aspect | Details |
|--------|---------|
| **Trigger Events** | push (main/develop/staging), pull_request |
| **Total Jobs** | 9 (parallel execution where possible) |
| **Estimated Runtime** | 15-25 minutes (depending on test results) |
| **Parallel Jobs** | Code Quality, Tests, Security (all run in parallel) |
| **Sequential Jobs** | Build → Deploy (build must complete first) |
| **Resource Usage** | Ubuntu-latest runners (GitHub-hosted) |

### Job Dependencies

```
Code Quality ┐
            ├─→ Build ─→ Deploy Staging (if develop)
Tests      ├─→ Build
Security   ┘        └─→ Deploy Production (if main + approval)

E2E Tests ────→ (monitors but doesn't block)
Performance ──→ (main branch only, monitors)
```

---

## Pipeline Stages

### 1. Code Quality (Parallel)
**Runs:** On every push and PR  
**Duration:** 3-5 minutes

```bash
Tasks:
✓ ESLint - Code style and error detection
✓ Prettier - Code formatting check
✓ TypeScript - Type checking and compilation
```

**Failure Action:** Blocks further jobs  
**Fix Command:**
```bash
cd backend-api
npm run lint:fix
npm run format
```

### 2. Unit & Integration Tests (Parallel, Matrix)
**Runs:** Node 18.x and 20.x simultaneously  
**Duration:** 8-12 minutes  
**Services:** PostgreSQL 15, Redis 7

```bash
Tasks:
✓ Database migrations (test database)
✓ Unit tests (all modules)
✓ Integration tests (with live database/redis)
✓ Coverage upload to Codecov
```

**Failure Action:** Blocks build  
**Debug Locally:**
```bash
cd backend-api
export DATABASE_URL=postgresql://test:test@localhost:5432/individual_sports_nutrition_test
export REDIS_URL=redis://localhost:6379
npm test
npm run test:integration
```

### 3. Security Scanning (Parallel)
**Runs:** On every push  
**Duration:** 5-8 minutes

```bash
Tasks:
✓ npm audit - Dependency vulnerability scan
✓ Snyk - Advanced security scanning
✓ Trivy - Container image vulnerability scan
```

**Note:** Continues on error (doesn't block) but reports to GitHub Security tab  
**Review Security Issues:**
```bash
cd backend-api
npm audit
npx snyk test
```

### 4. E2E Tests (Parallel)
**Runs:** Only if code-quality + tests pass  
**Duration:** 8-15 minutes  
**Services:** PostgreSQL, Redis, Live API server

```bash
Tasks:
✓ Database migrations
✓ Start API server on port 3000
✓ Run all Playwright tests (Chrome, Firefox, Safari)
✓ Upload test results as artifacts
```

**Failure Action:** Reports but doesn't block deployment (can be enabled)

### 5. Performance Tests (Conditional)
**Runs:** Only on main branch push  
**Duration:** 3-5 minutes

```bash
Tasks:
✓ k6 load test (API endpoints)
✓ Performance baseline comparison
✓ Results stored in artifacts
```

**Note:** Requires running backend on localhost:3000

### 6. Build Docker Image
**Runs:** If all tests pass  
**Duration:** 8-12 minutes

```bash
Tasks:
✓ Docker Buildx setup (multi-platform)
✓ Image metadata extraction (tags, labels)
✓ Build and push to ghcr.io (GitHub Container Registry)
✓ Cache optimization with GitHub Actions cache
```

**Image Tags Applied:**
- `latest` (main branch only)
- `develop` or `staging` (branch name)
- `sha-abc123def` (commit hash)
- `v1.0.0` (semantic tags from releases)

**Example Image:** `ghcr.io/username/api:develop`

### 7. Deploy to Staging (Conditional)
**Runs:** On develop/staging branch push  
**Duration:** 5-8 minutes  
**Requires:** AWS credentials in secrets

```bash
Steps:
1. Configure AWS credentials
2. Update ECS service (force new deployment)
3. Wait for deployment stabilization
4. Verify health endpoint (https://staging-api.yourdomain.com/health)
5. Slack notification
```

**Manual Deployment:**
```bash
aws ecs update-service \
  --cluster staging \
  --service api \
  --force-new-deployment
```

### 8. Deploy to Production (Conditional)
**Runs:** On main branch push (with manual approval)  
**Duration:** 10-15 minutes  
**Requires:** AWS credentials + GitHub environment approval

```bash
Steps:
1. Manual approval from GitHub environment
2. Configure AWS credentials
3. Backup current task definition
4. Update ECS service
5. Wait for deployment (10 min timeout)
6. Verify health (5 retries with 10s intervals)
7. Slack notification with status
```

**Approval Process:**
1. Push to main triggers pipeline
2. Deploy-production job waits at "Require approval"
3. Go to Actions → Deploy-production → Review deployments
4. Click "Approve and deploy"
5. Deployment begins

### 9. Notify Results
**Runs:** Always (success or failure)  
**Duration:** < 1 minute

Sends comprehensive Slack message with:
- All job statuses
- Branch and commit info
- Author information

---

## GitHub Actions Secrets

Required secrets for CI/CD to work:

### Set Up Secrets

Go to: **Settings** → **Secrets and variables** → **Actions**

#### Required Secrets

| Secret Name | Value | Purpose |
|---|---|---|
| **AWS_ACCESS_KEY_ID** | AWS IAM Access Key | ECS deployment |
| **AWS_SECRET_ACCESS_KEY** | AWS IAM Secret Key | ECS deployment |
| **SNYK_TOKEN** | Snyk API token | Security scanning |
| **SLACK_WEBHOOK** | Slack webhook URL | CI/CD notifications |

#### Optional Secrets

| Secret Name | Value | Purpose |
|---|---|---|
| **CODECOV_TOKEN** | Codecov token | Test coverage tracking |
| **SENTRY_AUTH_TOKEN** | Sentry auth token | Error reporting |

### Creating AWS IAM User for CI/CD

```bash
#!/bin/bash
# AWS CLI commands to create CI/CD user

# Create IAM user
aws iam create-user --user-name github-actions-cicd

# Create access key
aws iam create-access-key --user-name github-actions-cicd

# Create policy for ECS deployment
cat > /tmp/ecs-deploy-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeContainerInstances",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSubnets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
        "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole"
      ]
    }
  ]
}
EOF

# Attach policy
aws iam put-user-policy \
  --user-name github-actions-cicd \
  --policy-name ECSDeploymentPolicy \
  --policy-document file:///tmp/ecs-deploy-policy.json
```

### Creating Slack Webhook

1. Go to Slack workspace settings
2. Create Incoming Webhook integration
3. Copy webhook URL
4. Add as `SLACK_WEBHOOK` secret in GitHub

---

## Branch Strategy

### Git Flow Model

```
main (production)
├─ v1.0.0 (tagged releases)
├─ v1.0.1 (hotfix)
└─ stable

develop (staging/pre-production)
├─ feature/user-auth
├─ feature/meal-recommendation
├─ fix/database-connection
└─ chore/dependencies

staging (QA environment)
└─ Pre-release testing
```

### Branch Rules

| Branch | Protections | Auto-Deploy |
|--------|---|---|
| **main** | Require PR + status checks | ✓ Production (approval) |
| **develop** | Require PR + status checks | ✓ Staging (auto) |
| **staging** | Require PR | ✓ Staging (auto) |
| **feature/*** | Allow direct push | ✗ No |
| **hotfix/*** | Require PR | ✗ No |

### Setup Branch Protection

Go to **Settings** → **Branches** → **Add rule**:

**For main branch:**
- ✓ Require a pull request before merging
- ✓ Require status checks to pass
- ✓ Require branches to be up to date
- ✓ Require code reviews: 1 approval

**For develop branch:**
- ✓ Require status checks to pass
- ✓ Require reviews: 1 approval

---

## Deployment Strategy

### Staging Deployment (Automatic)

```
develop/staging branch → Tests pass → Build image → Update ECS → Health check
```

**Features:**
- Automatic on every merge
- No manual approval needed
- Immediate feedback on staging
- Parallel testing (multiple node versions)

### Production Deployment (Manual Approval)

```
main branch → Tests pass → Build image → Manual approval → Update ECS → Health check
```

**Features:**
- Requires explicit approval
- GitHub Environment protection rules
- Previous version backed up
- Blue-green ready
- Health verification (5 retries)

### Blue-Green Deployment

Current setup supports rolling deployments via ECS. For full blue-green:

```bash
# ECS Blue-Green deployment
aws ecs create-service --service-name api-green --task-definition api-green:latest
# Point load balancer to green
# Verify green is healthy
# Keep blue for rollback
```

---

## Monitoring & Alerts

### Pipeline Status Monitoring

**Dashboard:** Actions tab in GitHub  
**Real-time Status:**
```bash
gh run list --repo owner/repo --workflow backend-ci.yml --limit 10
```

### Slack Notifications

Sent at:
- ✅ Code quality checks complete
- ✅ Tests pass/fail
- ✅ Build success/failure
- ✅ Deployment to staging/production
- ✅ Final pipeline summary

### Email Notifications

GitHub automatically emails on:
- Job failure
- Workflow completion (if subscribed)

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Database connection refused" in tests

```bash
Solution:
1. Verify PostgreSQL service is running
2. Check DATABASE_URL format
3. Ensure pg_isready checks pass
4. Check firewall rules for port 5432

# Manual test:
psql postgresql://test:test@localhost:5432/individual_sports_nutrition_test -c "SELECT NOW();"
```

#### Issue: "Failed to push Docker image"

```bash
Solution:
1. Check GITHUB_TOKEN secret (auto-created)
2. Verify image name and registry URL
3. Check Docker login credentials
4. Ensure ghcr.io access is enabled

# Manual push:
docker login ghcr.io -u $GITHUB_ACTOR -p $GITHUB_TOKEN
docker push ghcr.io/owner/repo/api:tag
```

#### Issue: "ECS deployment timeout"

```bash
Solution:
1. Check ECS service for errors
2. Verify task definition is valid
3. Check CloudWatch logs for container issues
4. Verify IAM permissions in AWS
5. Check security groups and network

# Manual check:
aws ecs describe-services --cluster production --services api
aws ecs describe-task-definition --task-definition api-production
aws logs tail /ecs/api-production --follow
```

#### Issue: "E2E tests failing locally but passing in CI"

```bash
Solution:
1. Different Node versions (18 vs 20)
2. Missing environment variables
3. Port conflicts (3000 in use)
4. Browser not installed

# Debug:
cd backend-api
npx playwright install --with-deps
npm run test:e2e
```

#### Issue: "npm ci fails with dependency conflicts"

```bash
Solution:
1. Update package-lock.json
2. Check Node version compatibility
3. Delete node_modules and reinstall

# Manual fix:
cd backend-api
rm -rf node_modules package-lock.json
npm install
```

### Viewing Logs

**GitHub UI:**
1. Go to Actions tab
2. Click on workflow run
3. Click on job
4. View step logs

**Command Line:**
```bash
# List recent runs
gh run list --repo owner/repo --workflow backend-ci.yml

# View specific run
gh run view RUN_ID --log

# Watch live
gh run watch RUN_ID --exit-status
```

---

## Performance Optimization

### Build Time Reduction

- **npm ci** instead of npm install (faster, more reliable)
- **GitHub Actions cache** for node_modules
- **Docker layer caching** via buildx
- **Parallel job execution** (code quality, tests, security simultaneously)

### Cost Optimization

- Jobs timeout after 360 minutes
- Staging auto-deploy only on develop branch
- Performance tests only on main branch
- GitHub-hosted runners (no server cost)

---

## Security

### Secrets Protection

- All secrets encrypted at rest
- Secrets not printed in logs
- Access limited to specific workflows
- Rotation recommended every 90 days

### Image Security

- Trivy scans for vulnerabilities
- Snyk checks dependencies
- Signed container images (optional)
- Minimal base images (alpine)

---

**Status:** ✅ Production Ready  
**Last Tested:** December 21, 2025  
**Next Review:** January 21, 2026
