import * as Sentry from '@sentry/node'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import { config } from './env'

export function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured, skipping Sentry initialization')
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: config.NODE_ENV,
    integrations: [
      // Add profiling integration
      nodeProfilingIntegration(),
      // Add performance monitoring
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.npm_package_version,
    // Error filtering
    beforeSend(event) {
      // Filter out common non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0]
        if (error?.type === 'ValidationError' || error?.type === 'AuthError') {
          return null // Don't send validation errors to Sentry
        }
      }
      return event
    },
  })
}

export { Sentry }