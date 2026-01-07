import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { initSentry, Sentry } from './config/sentry'
import { config } from './config/env'
import { logger } from './utils/logger'
import { errorHandler } from './middlewares/error-handler'
import { notFoundHandler } from './middlewares/not-found'
import { apiLimiter } from './middlewares/rate-limit'
import { httpsRedirect, securityHeaders } from './middlewares/https-redirect'
import { performanceMonitoring, memoryMonitoring } from './middlewares/performance'
import { cacheService } from './services/cache-service'
import routes from './routes'

// Initialize Sentry before importing anything else
initSentry()

const app = express()

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1)

// Sentry request handler must be the first middleware (only if Sentry is initialized)
if (process.env.SENTRY_DSN) {
  // In newer Sentry versions, use setupExpressErrorHandler for both request and error handling
  Sentry.setupExpressErrorHandler(app)
}

// HTTPS redirect and security headers
app.use(httpsRedirect)
app.use(securityHeaders)

// Performance monitoring
app.use(performanceMonitoring)
app.use(memoryMonitoring)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))

// Enable gzip compression
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
}))

const allowedOrigins = ['http://localhost:3001', 'http://localhost:8081']
logger.info('Configuring CORS', { allowedOrigins })

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Apply rate limiting to all API routes
app.use(`/api/${config.API_VERSION}`, apiLimiter)
app.use(`/api/${config.API_VERSION}`, routes)
app.use(notFoundHandler)

// Sentry error handler must be before other error handlers (only if Sentry is initialized)
// Note: In newer Sentry versions, error handling is set up with setupExpressErrorHandler above
app.use(errorHandler)

const PORT = parseInt(config.PORT, 10)

// Initialize Redis connection
cacheService.connect().catch((error) => {
  logger.warn('Failed to connect to Redis, continuing without cache', { error })
})

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    env: config.NODE_ENV,
    apiVersion: config.API_VERSION,
  })
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error })
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  await cacheService.disconnect()
  process.exit(0)
})

