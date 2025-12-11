import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { RecommendationService } from '../services/recommendation-service'
import { ApiError } from '../middlewares/error-handler'

export class RecommendationController {
  private service: RecommendationService

  constructor() {
    this.service = new RecommendationService()
  }

  async getRecommendations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const maxProducts = req.query.maxProducts
        ? parseInt(req.query.maxProducts as string, 10)
        : undefined
      const excludeProductIds = req.query.exclude
        ? (req.query.exclude as string).split(',')
        : undefined

      const recommendations = await this.service.getRecommendations(req.user.id, {
        maxProducts,
        excludeProductIds,
      })

      res.json({
        success: true,
        data: recommendations,
      })
    } catch (error) {
      next(error)
    }
  }

  async checkCompatibility(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const { productId } = req.params
      const result = await this.service.checkCompatibility(productId, req.user.id)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

