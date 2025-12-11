import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { DosageCalculator } from '../services/dosage-calculator'
import { HealthProfileService } from '../services/health-profile-service'
import { NutritionPlanService } from '../services/nutrition-plan-service'
import { RecommendationService } from '../services/recommendation-service'
import { PriceComparisonService } from '../services/price-comparison-service'
import { ApiError } from '../middlewares/error-handler'

export class DosageController {
  private dosageCalculator: DosageCalculator
  private healthProfileService: HealthProfileService
  private nutritionPlanService: NutritionPlanService
  private recommendationService: RecommendationService
  private priceComparisonService: PriceComparisonService

  constructor() {
    this.dosageCalculator = new DosageCalculator()
    this.healthProfileService = new HealthProfileService()
    this.nutritionPlanService = new NutritionPlanService()
    this.recommendationService = new RecommendationService()
    this.priceComparisonService = new PriceComparisonService()
  }

  /**
   * Рассчитать дозировку для рекомендованных продуктов
   */
  async calculateDosages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const durationDays = parseInt(req.query.duration_days as string, 10) || 30
      const productIds = req.query.product_ids
        ? (req.query.product_ids as string).split(',')
        : undefined

      // Получаем профиль и план
      const profile = await this.healthProfileService.getByUserId(req.user.id)
      if (!profile) {
        const error: ApiError = new Error('Health profile not found')
        error.statusCode = 404
        throw error
      }

      const plan = await this.nutritionPlanService.getByUserId(req.user.id)
      if (!plan || !plan.protein || !plan.calories) {
        const error: ApiError = new Error('Nutrition plan not found. Please calculate your nutrition needs first.')
        error.statusCode = 404
        error.code = 'PLAN_NOT_FOUND'
        throw error
      }

      // Получаем рекомендованные продукты или используем указанные
      let products: Array<{ id: string; name_key: string; type: string; macros: any; serving_size: string | null }>
      if (productIds) {
        // TODO: получать продукты по ID
        products = []
      } else {
        const recommendations = await this.recommendationService.getRecommendations(req.user.id, {
          maxProducts: 10,
        })
        products = recommendations.map((rec) => rec.product)
      }

      // Рассчитываем дозировки
      const nutritionalNeeds = {
        calories: plan.calories || 0,
        protein: plan.protein || 0,
        carbs: plan.carbs || 0,
        fats: plan.fats || 0,
        bmr: 0,
        tdee: 0,
        method: 'calculated',
      }

      const dosages = products
        .filter((p) => 'id' in p && 'type' in p && 'macros' in p)
        .map((product: any) =>
          this.dosageCalculator.calculateDosage(product, nutritionalNeeds, profile, durationDays)
        )

      return res.json({
        success: true,
        data: {
          dosages,
          duration_days: durationDays,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Получить варианты покупки с расчетом цен (как e-ponuda/t-commerce)
   */
  async getShoppingOptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const durationDays = parseInt(req.query.duration_days as string, 10) || 30

      // Получаем профиль и план
      const profile = await this.healthProfileService.getByUserId(req.user.id)
      if (!profile) {
        const error: ApiError = new Error('Health profile not found')
        error.statusCode = 404
        throw error
      }

      const plan = await this.nutritionPlanService.getByUserId(req.user.id)
      if (!plan) {
        const error: ApiError = new Error('Nutrition plan not found')
        error.statusCode = 404
        throw error
      }

      // Получаем рекомендованные продукты
      const recommendations = await this.recommendationService.getRecommendations(req.user.id, {
        maxProducts: 10,
      })
      const products = recommendations.map((rec) => rec.product)

      if (products.length === 0) {
        res.json({
          success: true,
          data: {
            options: [],
            message: 'No products found for recommendations',
          },
        })
        return
      }

      // Рассчитываем требования
      const nutritionalNeeds = {
        calories: plan.calories || 0,
        protein: plan.protein || 0,
        carbs: plan.carbs || 0,
        fats: plan.fats || 0,
        bmr: 0,
        tdee: 0,
        method: 'calculated',
      }

      const requirements = this.dosageCalculator.calculatePlanRequirements(
        products,
        nutritionalNeeds,
        profile,
        durationDays
      )

      // Находим оптимальные варианты покупки
      const options = await this.priceComparisonService.findOptimalShoppingOptions(
        requirements,
        products
      )

      res.json({
        success: true,
        data: {
          options,
          duration_days: durationDays,
          requirements: requirements.map((req) => ({
            product_id: req.product_id,
            product_name: products.find((p) => p.id === req.product_id)?.name_key,
            daily_grams: req.daily_grams,
            duration_days: req.duration_days,
            frequency_per_week: req.frequency_per_week,
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

export class PriceComparisonController {
  private priceComparisonService: PriceComparisonService

  constructor() {
    this.priceComparisonService = new PriceComparisonService()
  }

  /**
   * Сравнить цены одного продукта в разных магазинах
   */
  async compareProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = (req as any).params?.productId as string
      const packageId = (req as any).query?.package_id as string | undefined
      
      if (!productId) {
        const error: ApiError = new Error('Product ID is required')
        error.statusCode = 400
        return next(error)
      }

      const comparisons = await this.priceComparisonService.compareProductPrices(
        productId,
        packageId || null
      )

      res.json({
        success: true,
        data: comparisons,
      })
    } catch (error) {
      next(error)
    }
  }
}

