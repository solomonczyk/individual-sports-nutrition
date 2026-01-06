import { Request, Response } from 'express'
import { cacheService } from '../services/cache-service'
import { pool } from '../config/database'

export class HealthController {
  async healthCheck(_req: Request, res: Response) {
    const startTime = Date.now()
    
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: false,
      redis: false,
      responseTime: 0,
    }

    try {
      // Check database connection
      const dbResult = await pool.query('SELECT 1')
      checks.database = dbResult.rowCount === 1
    } catch (error) {
      checks.database = false
    }

    try {
      // Check Redis connection
      checks.redis = await cacheService.healthCheck()
    } catch (error) {
      checks.redis = false
    }

    checks.responseTime = Date.now() - startTime

    // Determine overall health
    const isHealthy = checks.database // Redis is optional
    const statusCode = isHealthy ? 200 : 503

    if (!isHealthy) {
      checks.status = 'error'
    }

    return res.status(statusCode).json(checks)
  }

  async readiness(_req: Request, res: Response) {
    try {
      // Check if all critical services are ready
      const dbResult = await pool.query('SELECT 1')
      const isDatabaseReady = dbResult.rowCount === 1

      if (isDatabaseReady) {
        return res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        })
      } else {
        return res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'Database not ready',
        })
      }
    } catch (error) {
      return res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database connection failed',
      })
    }
  }

  async liveness(_req: Request, res: Response) {
    // Simple liveness check - if we can respond, we're alive
    return res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  }
}