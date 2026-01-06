import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { ApiError } from './error-handler'

interface CSRFRequest extends Request {
  csrfToken?: string
}

// Simple CSRF protection for non-GET requests
export function csrfProtection(req: CSRFRequest, _res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  // Skip CSRF for API endpoints with Bearer token (JWT handles auth)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return next()
  }

  // Check for CSRF token in header or body
  const token = req.headers['x-csrf-token'] || req.body._csrf

  if (!token) {
    const error: ApiError = new Error('CSRF token missing')
    error.statusCode = 403
    error.code = 'CSRF_TOKEN_MISSING'
    return next(error)
  }

  // In a real implementation, you would validate the token against a stored value
  // For now, we'll do a basic validation
  if (typeof token !== 'string' || token.length < 32) {
    const error: ApiError = new Error('Invalid CSRF token')
    error.statusCode = 403
    error.code = 'INVALID_CSRF_TOKEN'
    return next(error)
  }

  next()
}

// Generate CSRF token endpoint
export function generateCSRFToken(_req: Request, res: Response) {
  const token = crypto.randomBytes(32).toString('hex')
  
  res.json({
    success: true,
    data: {
      csrfToken: token,
    },
  })
}

// Middleware to add CSRF token to response headers
export function addCSRFToken(_req: Request, res: Response, next: NextFunction) {
  const token = crypto.randomBytes(32).toString('hex')
  res.setHeader('X-CSRF-Token', token)
  next()
}