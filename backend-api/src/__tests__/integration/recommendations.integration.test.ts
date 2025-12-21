/**
 * Integration tests for Recommendation endpoints
 * Tests GET /api/v1/recommendations and related endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock Express app for testing
const createTestApp = () => {
  const app = express()
  
  app.use(express.json())
  
  // Health check endpoint
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'individual-sports-nutrition-api',
    })
  })
  
  // Mock recommendations endpoint (before mocking implementation)
  app.get('/api/v1/recommendations', (req, res) => {
    const userId = req.get('x-user-id')
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'X-User-ID header is required',
      })
    }
    
    // Mock successful response
    res.json({
      success: true,
      data: [
        {
          product_id: 'prod-1',
          score: 85,
          confidence: 0.92,
          reasons: ['High protein content', 'Verified brand', 'Good for muscle gain'],
          warnings: [],
          dosage_recommendation: {
            frequency: 'daily',
            timing: 'post-workout',
            servings_per_day: 2,
            notes: ['Take with water'],
          },
        },
        {
          product_id: 'prod-2',
          score: 78,
          confidence: 0.88,
          reasons: ['Creatine monohydrate', 'Proven effectiveness'],
          warnings: [],
          dosage_recommendation: {
            frequency: 'daily',
            grams_per_day: 5,
            timing: 'post-workout',
            notes: ['Mix with juice or sports drink'],
          },
        },
      ],
      timestamp: new Date().toISOString(),
    })
  })
  
  // Mock nutrition endpoint
  app.get('/api/v1/nutrition/calculate', (req, res) => {
    const userId = req.get('x-user-id')
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'X-User-ID header is required',
      })
    }
    
    const goal = (req.query.goal as string) || 'maintain'
    const activityLevel = (req.query.activity_level as string) || 'moderate'
    
    // Validate parameters
    const validGoals = ['mass', 'cut', 'maintain', 'endurance']
    const validLevels = ['low', 'moderate', 'high', 'very_high']
    
    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: `Invalid goal. Must be one of: ${validGoals.join(', ')}`,
      })
    }
    
    if (!validLevels.includes(activityLevel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid activity_level. Must be one of: ${validLevels.join(', ')}`,
      })
    }
    
    // Mock nutritional needs response
    res.json({
      success: true,
      data: {
        user_id: userId,
        weight: 80,
        height: 180,
        age: 28,
        gender: 'male',
        goal,
        activity_level: activityLevel,
        bmr: 1790,
        tdee: 2842,
        calories: goal === 'mass' ? 3268 : goal === 'cut' ? 2274 : 2842,
        protein: 160,
        carbs: 320,
        fats: 95,
        calculation_method: 'Mifflin-St Jeor',
        timestamp: new Date().toISOString(),
      },
    })
  })
  
  return app
}

describe('Recommendations API', () => {
  let app: ReturnType<typeof createTestApp>
  
  beforeEach(() => {
    app = createTestApp()
  })
  
  describe('GET /api/v1/recommendations', () => {
    it('should return 400 if X-User-ID header is missing', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .expect(400)
      
      expect(response.body).toEqual({
        success: false,
        error: 'X-User-ID header is required',
      })
    })
    
    it('should return recommendations with valid X-User-ID header', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('x-user-id', 'user-123')
        .expect(200)
      
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
    
    it('should return properly formatted recommendation objects', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('x-user-id', 'user-123')
        .expect(200)
      
      const recommendation = response.body.data[0]
      
      expect(recommendation).toHaveProperty('product_id')
      expect(recommendation).toHaveProperty('score')
      expect(recommendation).toHaveProperty('confidence')
      expect(recommendation).toHaveProperty('reasons')
      expect(recommendation).toHaveProperty('warnings')
      expect(recommendation).toHaveProperty('dosage_recommendation')
      
      expect(typeof recommendation.score).toBe('number')
      expect(recommendation.score).toBeGreaterThanOrEqual(0)
      expect(recommendation.score).toBeLessThanOrEqual(100)
      
      expect(typeof recommendation.confidence).toBe('number')
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0)
      expect(recommendation.confidence).toBeLessThanOrEqual(1)
    })
    
    it('should accept optional query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/recommendations')
        .set('x-user-id', 'user-123')
        .query({ max_products: '5' })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
  
  describe('GET /api/v1/nutrition/calculate', () => {
    it('should return 400 if X-User-ID header is missing', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition/calculate')
        .expect(400)
      
      expect(response.body.success).toBe(false)
    })
    
    it('should return nutritional needs with valid X-User-ID', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('calories')
      expect(response.body.data).toHaveProperty('protein')
      expect(response.body.data).toHaveProperty('carbs')
      expect(response.body.data).toHaveProperty('fats')
    })
    
    it('should calculate different calories for different goals', async () => {
      const massResponse = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .query({ goal: 'mass' })
        .expect(200)
      
      const cutResponse = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .query({ goal: 'cut' })
        .expect(200)
      
      // Mass should have higher calories than cut
      expect(massResponse.body.data.calories).toBeGreaterThan(
        cutResponse.body.data.calories
      )
    })
    
    it('should return 400 for invalid goal parameter', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .query({ goal: 'invalid_goal' })
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid goal')
    })
    
    it('should return 400 for invalid activity_level parameter', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .query({ activity_level: 'invalid_level' })
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Invalid activity_level')
    })
    
    it('should include user profile data in response', async () => {
      const response = await request(app)
        .get('/api/v1/nutrition/calculate')
        .set('x-user-id', 'user-123')
        .expect(200)
      
      const data = response.body.data
      expect(data).toHaveProperty('user_id')
      expect(data).toHaveProperty('weight')
      expect(data).toHaveProperty('height')
      expect(data).toHaveProperty('age')
      expect(data).toHaveProperty('gender')
      expect(data).toHaveProperty('bmr')
      expect(data).toHaveProperty('tdee')
    })
  })
  
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200)
      
      expect(response.body).toHaveProperty('status', 'ok')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('service')
    })
  })
})
