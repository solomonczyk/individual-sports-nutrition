import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err)
  }

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  logger.error('Error occurred', {
    error: message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  res.status(statusCode).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
}

