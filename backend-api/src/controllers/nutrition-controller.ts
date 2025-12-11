import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { HealthProfileService } from '../services/health-profile-service'
import { NutritionCalculator } from '../services/nutrition-calculator'
import { NutritionPlanService } from '../services/nutrition-plan-service'
import { ApiError } from '../middlewares/error-handler'

export class NutritionController {
  private healthProfileService: HealthProfileService
  private nutritionCalculator: NutritionCalculator
  private nutritionPlanService: NutritionPlanService

  constructor() {
    this.healthProfileService = new HealthProfileService()
    this.nutritionCalculator = new NutritionCalculator()
    this.nutritionPlanService = new NutritionPlanService()
  }

  async calculate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const profile = await this.healthProfileService.getByUserId(req.user.id)
      if (!profile) {
        const error: ApiError = new Error('Health profile not found. Please create your profile first.')
        error.statusCode = 404
        error.code = 'PROFILE_NOT_FOUND'
        throw error
      }

      // Проверяем обязательные поля
      const requiredFields = ['age', 'gender', 'weight', 'height', 'activity_level', 'goal']
      const missingFields = requiredFields.filter((field) => !profile[field as keyof typeof profile])

      if (missingFields.length > 0) {
        const error: ApiError = new Error(
          `Missing required profile fields: ${missingFields.join(', ')}`
        )
        error.statusCode = 400
        error.code = 'INCOMPLETE_PROFILE'
        throw error
      }

      const needs = this.nutritionCalculator.calculateFullNeeds(profile)

      // Автоматически создаем или обновляем план питания
      const existingPlan = await this.nutritionPlanService.getByUserId(req.user.id)
      let plan

      if (existingPlan) {
        plan = await this.nutritionPlanService.update(existingPlan.id, {
          calories: needs.calories,
          protein: needs.protein,
          carbs: needs.carbs,
          fats: needs.fats,
        })
      } else {
        plan = await this.nutritionPlanService.createFromCalculation(req.user.id, needs)
      }

      res.json({
        success: true,
        data: {
          calculation: needs,
          plan: {
            id: plan.id,
            calories: plan.calories,
            protein: plan.protein,
            carbs: plan.carbs,
            fats: plan.fats,
            active: plan.active,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

