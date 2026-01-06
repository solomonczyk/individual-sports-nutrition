import request from 'supertest'
import express from 'express'
import { apiLimiter, authLimiter } from '../rate-limit'

describe('Rate Limiting Middleware', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
  })

  describe('apiLimiter', () => {
    beforeEach(() => {
      app.use('/api', apiLimiter)
      app.get('/api/test', (req, res) => {
        res.json({ success: true })
      })
    })

    it('should allow requests within limit', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200)

      expect(response.body).toEqual({ success: true })
      expect(response.headers['ratelimit-limit']).toBeDefined()
      expect(response.headers['ratelimit-remaining']).toBeDefined()
    })

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200)

      expect(response.headers['ratelimit-limit']).toBe('100')
      expect(parseInt(response.headers['ratelimit-remaining'])).toBeLessThanOrEqual(100)
    })

    // Note: Testing actual rate limiting requires multiple requests
    // which might be flaky in CI environments
  })

  describe('authLimiter', () => {
    beforeEach(() => {
      app.use('/auth', authLimiter)
      app.post('/auth/login', (req, res) => {
        res.json({ success: true })
      })
    })

    it('should allow auth requests within limit', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200)

      expect(response.body).toEqual({ success: true })
      expect(response.headers['ratelimit-limit']).toBe('5')
    })

    it('should have stricter limits than API limiter', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(200)

      expect(parseInt(response.headers['ratelimit-limit'])).toBeLessThan(100)
    })
  })

  describe('Rate limit exceeded', () => {
    beforeEach(() => {
      // Create a very strict limiter for testing
      const testLimiter = require('express-rate-limit')({
        windowMs: 60 * 1000, // 1 minute
        max: 1, // Only 1 request per minute
        message: {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        standardHeaders: true,
        legacyHeaders: false,
      })

      app.use('/test', testLimiter)
      app.get('/test/endpoint', (req, res) => {
        res.json({ success: true })
      })
    })

    it('should return 429 when rate limit is exceeded', async () => {
      // First request should succeed
      await request(app)
        .get('/test/endpoint')
        .expect(200)

      // Second request should be rate limited
      const response = await request(app)
        .get('/test/endpoint')
        .expect(429)

      expect(response.body.error).toContain('Rate limit')
    })
  })
})