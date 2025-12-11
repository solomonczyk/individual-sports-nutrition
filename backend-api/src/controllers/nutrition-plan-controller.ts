import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { NutritionPlanService } from '../services/nutrition-plan-service'
import { ApiError } from '../middlewares/error-handler'

export class NutritionPlanController {
  private service: NutritionPlanService

  constructor() {
    this.service = new NutritionPlanService()
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const plan = await this.service.getByUserId(req.user.id)

      res.json({
        success: true,
        data: plan,
      })
    } catch (error) {
      next(error)
    }
  }
}

