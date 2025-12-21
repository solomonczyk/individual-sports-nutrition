/**
 * Health Check tests for basic API functionality
 */

import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'

const createApp = () => {
  const app = express()
  
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'individual-sports-nutrition-api',
    })
  })
  
  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' })
  })
  
  return app
}

describe('API Health Check', () => {
  it('should respond with 200 status', async () => {
    const app = createApp()
    
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200)
    
    expect(response.body.status).toBe('ok')
  })
  
  it('should return valid timestamp', async () => {
    const app = createApp()
    
    const response = await request(app).get('/api/v1/health')
    
    expect(response.body.timestamp).toBeDefined()
    // Check if it's a valid ISO date string
    expect(new Date(response.body.timestamp).getTime()).toBeGreaterThan(0)
  })
  
  it('should include service name in response', async () => {
    const app = createApp()
    
    const response = await request(app).get('/api/v1/health')
    
    expect(response.body.service).toBe('individual-sports-nutrition-api')
  })
  
  it('should return 404 for non-existent endpoints', async () => {
    const app = createApp()
    
    const response = await request(app)
      .get('/api/v1/non-existent')
      .expect(404)
    
    expect(response.body).toHaveProperty('error')
  })
})
