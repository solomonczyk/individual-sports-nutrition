import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

interface PerformanceRequest extends Request {
  startTime?: number
}

export function performanceMonitoring(req: PerformanceRequest, res: Response, next: NextFunction) {
  req.startTime = Date.now()

  // Override res.end to capture response time
  const originalEnd = res.end.bind(res)
  
  res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
    const responseTime = Date.now() - (req.startTime || Date.now())
    
    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      })
    }

    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: res.statusCode,
      })
    }

    // Set response time header only if headers haven't been sent
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${responseTime}ms`)
    }

    // Call original end method
    return originalEnd(chunk, encoding, callback)
  }

  next()
}

export function memoryMonitoring(_req: Request, _res: Response, next: NextFunction) {
  const memUsage = process.memoryUsage()
  
  // Log memory usage if it's high (> 500MB)
  if (memUsage.heapUsed > 500 * 1024 * 1024) {
    logger.warn('High memory usage detected', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    })
  }

  next()
}