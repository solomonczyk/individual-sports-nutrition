import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { MealPlanGenerator } from '../services/meal-plan-generator'
import { DailyMealPlanRepository } from '../repositories/daily-meal-plan-repository'
import { ApiError } from '../middlewares/error-handler'
import { GenerateMealPlanInput } from '../models/meal'
import { z } from 'zod'

const generateMealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferences: z
    .object({
      cuisine_types: z.array(z.string()).optional(),
      exclude_ingredients: z.array(z.string()).optional(),
      meal_times: z
        .object({
          breakfast: z.string().optional(),
          lunch: z.string().optional(),
          dinner: z.string().optional(),
          snacks: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
})

export class MealPlanController {
  private generator: MealPlanGenerator
  private repository: DailyMealPlanRepository

  constructor() {
    this.generator = new MealPlanGenerator()
    this.repository = new DailyMealPlanRepository()
  }

  /**
   * Генерирует дневной план питания
   */
  async generateDailyPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const validated = generateMealPlanSchema.parse(req.body)
      const input: GenerateMealPlanInput = validated

      const plan = await this.generator.generateDailyMealPlan(req.user.id, input)

      res.json({
        success: true,
        data: plan,
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

  /**
   * Получает дневной план питания
   */
  async getDailyPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const dateStr = req.params.date || req.query.date
      if (!dateStr || typeof dateStr !== 'string') {
        const error: ApiError = new Error('Date parameter is required (YYYY-MM-DD)')
        error.statusCode = 400
        throw error
      }

      const date = new Date(dateStr)
      if (isNaN(date.getTime())) {
        const error: ApiError = new Error('Invalid date format. Use YYYY-MM-DD')
        error.statusCode = 400
        throw error
      }

      const plan = await this.repository.findFullByUserIdAndDate(req.user.id, date)

      if (!plan) {
        res.json({
          success: true,
          data: null,
          message: 'Meal plan not found for this date',
        })
        return
      }

      res.json({
        success: true,
        data: plan,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Генерирует недельный план питания
   */
  async generateWeeklyPlan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const startDateStr = req.body.start_date || req.query.start_date
      if (!startDateStr || typeof startDateStr !== 'string') {
        const error: ApiError = new Error('start_date parameter is required (YYYY-MM-DD)')
        error.statusCode = 400
        throw error
      }

      const startDate = new Date(startDateStr)
      if (isNaN(startDate.getTime())) {
        const error: ApiError = new Error('Invalid date format. Use YYYY-MM-DD')
        error.statusCode = 400
        throw error
      }

      const preferences = req.body.preferences || {}

      const plans = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        try {
          const plan = await this.generator.generateDailyMealPlan(req.user.id, {
            date: dateStr,
            preferences,
          })
          plans.push(plan)
        } catch (error) {
          // Логируем ошибку, но продолжаем для остальных дней
          console.error(`Failed to generate plan for ${dateStr}:`, error)
        }
      }

      res.json({
        success: true,
        data: {
          start_date: startDateStr,
          plans,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

