import { Response, NextFunction } from 'express'
import { HealthProfileService } from '../services/health-profile-service'
import { CreateHealthProfileInput, UpdateHealthProfileInput } from '../models/health-profile'
import { AuthRequest } from '../middlewares/auth'
import { ApiError } from '../middlewares/error-handler'
import { z } from 'zod'

const createHealthProfileSchema = z.object({
  age: z.number().int().min(1).max(150).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  activity_level: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  goal: z.enum(['mass', 'cut', 'maintain', 'endurance']).optional(),
  allergies: z.array(z.string()).optional(),
  diseases: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
})

export class HealthProfileController {
  private service: HealthProfileService

  constructor() {
    this.service = new HealthProfileService()
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const profile = await this.service.getByUserId(req.user.id)
      
      res.json({
        success: true,
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const validated = createHealthProfileSchema.parse(req.body)
      const input: CreateHealthProfileInput = validated

      const profile = await this.service.create(req.user.id, input)

      res.status(201).json({
        success: true,
        data: profile,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = new Error('Validation error')
        apiError.statusCode = 400
        apiError.code = 'VALIDATION_ERROR'
        apiError.message = error.errors.map((e) => e.message).join(', ')
        return next(apiError)
      }
      next(error)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const validated = createHealthProfileSchema.partial().parse(req.body)
      const input: UpdateHealthProfileInput = validated

      const profile = await this.service.update(req.user.id, input)

      res.json({
        success: true,
        data: profile,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = new Error('Validation error')
        apiError.statusCode = 400
        apiError.code = 'VALIDATION_ERROR'
        apiError.message = error.errors.map((e) => e.message).join(', ')
        return next(apiError)
      }
      next(error)
    }
  }
}

