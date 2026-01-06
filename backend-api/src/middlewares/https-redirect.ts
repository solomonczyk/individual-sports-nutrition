import { Request, Response, NextFunction } from 'express'
import { config } from '../config/env'

export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  // Only enforce HTTPS in production
  if (config.NODE_ENV !== 'production') {
    return next()
  }

  // Check if request is already HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next()
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`
  res.redirect(301, httpsUrl)
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Strict Transport Security
  if (config.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  next()
}