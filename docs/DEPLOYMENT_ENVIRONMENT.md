# Environment Configuration Guide

**Version:** 1.0.0  
**Last Updated:** December 21, 2025

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Environment-Specific Configurations](#environment-specific-configurations)
3. [Secrets Management](#secrets-management)
4. [Configuration Validation](#configuration-validation)
5. [Troubleshooting](#troubleshooting)

---

## Environment Variables

All configuration is managed through environment variables. Never commit secrets to Git.

### Core Server Configuration

```bash
# Application Mode
NODE_ENV=production                    # development, staging, production
PORT=3000                              # Server listening port
API_VERSION=v1                         # API version prefix
LOG_LEVEL=info                         # debug, info, warn, error

# Deployment
DEPLOYMENT_ENV=aws                     # aws, gcp, azure, docker, local
REGION=us-east-1                       # AWS region or equivalent
SERVICE_NAME=api                       # Service/application name
INSTANCE_ID=api-prod-001              # Unique instance identifier
```

### Database Configuration

```bash
# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_HOST=prod-db.region.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<STRONG_RANDOM_PASSWORD>
DB_NAME=individual_sports_nutrition

# Connection Pool
DB_POOL_SIZE=20                        # Connections to maintain
DB_POOL_MAX=30                         # Maximum concurrent connections
DB_POOL_TIMEOUT=30000                  # Timeout in ms
DB_IDLE_TIMEOUT=60000                  # Idle connection timeout

# Migrations
DB_MIGRATE_ON_START=false              # Auto-run migrations on startup (false in prod)
DB_MIGRATION_TIMEOUT=300000            # Migration timeout in ms
```

### Redis / Cache Configuration

```bash
# Redis Connection
REDIS_URL=redis://:password@host:6379/0
REDIS_HOST=prod-redis.region.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<STRONG_RANDOM_PASSWORD>
REDIS_DB=0                             # Database number

# Cache Behavior
REDIS_TTL=3600                         # Default cache TTL in seconds (1 hour)
REDIS_MAX_RETRIES=3                    # Connection retry attempts
REDIS_SOCKET_TIMEOUT=10000             # Socket timeout in ms
REDIS_SOCKET_KEEPALIVE=true            # Keep alive probes

# Cache Keys Prefix
REDIS_KEY_PREFIX=isf:prod:            # Namespace for all keys
```

### Authentication & Security

```bash
# JWT Configuration
JWT_SECRET=<32_CHAR_RANDOM_STRING>     # Never expose, store in secrets manager
JWT_ALGORITHM=HS256                    # HS256, RS256
JWT_EXPIRES_IN=7d                      # Token expiration: 7 days
JWT_REFRESH_TOKEN_EXPIRES=30d          # Refresh token: 30 days

# CORS & Security
CORS_ORIGIN=https://www.yourdomain.com,https://yourdomain.com
CORS_CREDENTIALS=true                  # Allow cookies in CORS requests
CORS_MAX_AGE=86400                     # Preflight cache in seconds

# Rate Limiting
RATE_LIMIT_WINDOW=15m                  # Time window for rate limit
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window per IP
RATE_LIMIT_STORE=redis                 # redis, memory
```

### Monitoring & Observability

```bash
# Error Tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1          # 10% of transactions for tracing

# Performance Monitoring
APM_ENABLED=true                       # Application Performance Monitoring
APM_SERVICE_NAME=api
APM_SERVER_URL=https://apm-server:8200

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_PATH=/health
HEALTH_CHECK_TIMEOUT=5000              # ms
```

### Email & Communication

```bash
# SMTP Configuration (Optional)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<SENDGRID_API_KEY>
SMTP_FROM=noreply@yourdomain.com
SMTP_TIMEOUT=10000

# Email Templates
EMAIL_WELCOME_ENABLED=true
EMAIL_RESET_PASSWORD_ENABLED=true
EMAIL_VERIFICATION_ENABLED=true
```

### Feature Flags

```bash
# Feature Control
FEATURE_MEAL_RECOMMENDATIONS=true
FEATURE_SOCIAL_SHARING=false           # Disabled until implementation
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_AI_MEAL_PLANNING=true

# Beta Features
BETA_MEAL_OPTIMIZATION=false
BETA_VOICE_COMMANDS=false
```

---

## Environment-Specific Configurations

### Development Environment

```bash
# .env.development
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DB_MIGRATE_ON_START=true

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/individual_sports_nutrition
REDIS_URL=redis://localhost:6379/0

JWT_SECRET=dev-secret-key-do-not-use-in-production
JWT_EXPIRES_IN=30d

CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=1000           # Lenient for development

SENTRY_DSN=                             # Disabled in development
APM_ENABLED=false
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
DB_MIGRATE_ON_START=false              # Migrations handled separately

DATABASE_URL=postgresql://user:pass@staging-db.rds.amazonaws.com:5432/individual_sports_nutrition
REDIS_URL=redis://staging-redis.cache.amazonaws.com:6379/0

JWT_SECRET=<UNIQUE_STAGING_SECRET>     # Different from production
JWT_EXPIRES_IN=14d

CORS_ORIGIN=https://staging.yourdomain.com
RATE_LIMIT_MAX_REQUESTS=500

SENTRY_DSN=https://xxxxx@sentry.io/staging
SENTRY_ENVIRONMENT=staging
APM_ENABLED=true
APM_TRACES_SAMPLE_RATE=0.5             # 50% sampling for staging
```

### Production Environment

```bash
# .env.production (NEVER commit to Git)
NODE_ENV=production
PORT=3000
LOG_LEVEL=info                         # Never use debug in production
DB_MIGRATE_ON_START=false

DATABASE_URL=postgresql://user:pass@prod-db.rds.amazonaws.com:5432/individual_sports_nutrition
REDIS_URL=redis://prod-redis.cache.amazonaws.com:6379/0

JWT_SECRET=<LONG_RANDOM_STRING>        # Store in AWS Secrets Manager
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://www.yourdomain.com,https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=100

SENTRY_DSN=https://xxxxx@sentry.io/production
SENTRY_ENVIRONMENT=production
APM_ENABLED=true
APM_TRACES_SAMPLE_RATE=0.01            # 1% sampling for production
```

---

## Secrets Management

### AWS Secrets Manager

**Store sensitive values (not in .env):**

```bash
# Create secret
aws secretsmanager create-secret \
  --name prod/api/database-url \
  --secret-string 'postgresql://user:pass@host:5432/db'

aws secretsmanager create-secret \
  --name prod/api/jwt-secret \
  --secret-string 'your-256-bit-random-secret'

aws secretsmanager create-secret \
  --name prod/api/redis-password \
  --secret-string 'your-redis-password'

# Retrieve in application
import * as secretsManager from '@aws-sdk/client-secrets-manager'

const client = new secretsManager.SecretsManagerClient({ region: 'us-east-1' })
const secret = await client.send(
  new secretsManager.GetSecretValueCommand({ SecretId: 'prod/api/jwt-secret' })
)
```

### HashiCorp Vault

```bash
# Write secrets
vault kv put secret/prod/api \
  database_url="postgresql://..." \
  jwt_secret="..." \
  redis_password="..."

# Read in application
import * as vault from 'node-vault'

const vaultClient = vault({
  endpoint: 'https://vault.example.com',
  token: process.env.VAULT_TOKEN
})

const secret = await vaultClient.read('secret/data/prod/api')
```

### Environment Best Practices

1. **Never store secrets in version control**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use different secrets for each environment**
   - Development: Less restrictive secrets
   - Staging: Same structure as production
   - Production: Highest security standards

3. **Rotate secrets regularly**
   - JWT_SECRET: Every 90 days
   - Database passwords: Every 90 days
   - API keys: Every 60 days

4. **Audit secret access**
   - Log who accessed secrets and when
   - Alert on unauthorized access attempts

---

## Configuration Validation

### Startup Validation

```typescript
// src/config/validate.ts
import Joi from 'joi'

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().default(3000),
  
  DATABASE_URL: Joi.string().required(),
  DB_POOL_SIZE: Joi.number().default(20),
  
  REDIS_URL: Joi.string().required(),
  REDIS_TTL: Joi.number().default(3600),
  
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  CORS_ORIGIN: Joi.string().required(),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
  
  SENTRY_DSN: Joi.string().optional().uri(),
}).unknown()

export function validateConfig() {
  const { error, value } = envVarsSchema.validate(process.env)
  
  if (error) {
    throw new Error(`Config validation error: ${error.message}`)
  }
  
  return value
}

// Usage in application startup
const config = validateConfig()
```

### Health Check Endpoint

```typescript
// src/routes/health.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION,
    checks: {
      database: 'unchecked',
      redis: 'unchecked',
      memory: 'unchecked'
    }
  }

  // Check database
  try {
    await db.query('SELECT 1')
    health.checks.database = 'healthy'
  } catch (err) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  // Check Redis
  try {
    await redis.ping()
    health.checks.redis = 'healthy'
  } catch (err) {
    health.checks.redis = 'unhealthy'
    health.status = 'degraded'
  }

  // Check memory
  const memUsage = process.memoryUsage()
  if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
    health.checks.memory = 'warning'
    health.status = 'degraded'
  } else {
    health.checks.memory = 'healthy'
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(health)
})
```

---

## Troubleshooting

### Issue: Invalid Environment Variable

**Error:** `Config validation error: PORT must be a number`

**Solution:**
```bash
# Check current value
echo $PORT

# Set correct type
export PORT=3000  # Not "3000" string
```

### Issue: Database Connection String Format

**Error:** `ECONNREFUSED - connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# PostgreSQL format must be
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Valid example:
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/individual_sports_nutrition

# Common mistakes:
# ❌ DATABASE_URL=postgresql://localhost:5432/dbname  (missing credentials)
# ❌ DATABASE_URL=postgres://...  (missing 'ql')
# ❌ DATABASE_URL=mysql://...  (wrong database type)
```

### Issue: Redis Connection Timeout

**Error:** `Error: Redis connection timeout`

**Solution:**
```bash
# Test Redis connectivity
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
# Expected: PONG

# Check format
REDIS_URL=redis://:password@host:6379/0

# If password empty
REDIS_URL=redis://host:6379/0
```

---

**Status:** ✅ Complete  
**Last Review:** December 21, 2025
