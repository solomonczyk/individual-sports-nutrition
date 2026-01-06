import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth-service'
import { CreateUserInput } from '../models/user'
import { ApiError } from '../middlewares/error-handler'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  preferred_language: z.enum(['sr', 'hu', 'ro', 'en', 'ru', 'uk']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerSchema.parse(req.body)
      const input: CreateUserInput = {
        email: validated.email,
        password: validated.password,
        preferred_language: validated.preferred_language,
      }

      const result = await this.authService.register(input)

      res.status(201).json({
        success: true,
        data: result,
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

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body)
      const result = await this.authService.login({
        email: validated.email,
        password: validated.password,
      })

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = new Error('Validation error')
        apiError.statusCode = 400
        apiError.code = 'VALIDATION_ERROR'
        apiError.message = error.errors.map((e) => e.message).join(', ')
        return next(apiError)
      }

      const apiError: ApiError = error as ApiError
      apiError.statusCode = apiError.statusCode || 401
      apiError.code = apiError.code || 'AUTH_ERROR'
      next(apiError)
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = refreshTokenSchema.parse(req.body)
      const result = await this.authService.refreshToken(validated.refreshToken)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiError: ApiError = new Error('Validation error')
        apiError.statusCode = 400
        apiError.code = 'VALIDATION_ERROR'
        apiError.message = error.errors.map((e) => e.message).join(', ')
        return next(apiError)
      }

      const apiError: ApiError = error as ApiError
      apiError.statusCode = apiError.statusCode || 401
      apiError.code = apiError.code || 'REFRESH_ERROR'
      next(apiError)
    }
  }
}

