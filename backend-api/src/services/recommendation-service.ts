import { HealthProfileService } from './health-profile-service'
import { ProductService } from './product-service'
import { ContraindicationRepository } from '../repositories/contraindication-repository'
import { Product, ProductWithTranslation } from '../models/product'
import { HealthProfile } from '../models/health-profile'

export interface ProductRecommendation {
  product: ProductWithTranslation
  score: number
  reasons: string[]
  warnings: string[]
  contraindications: Array<{
    id: string
    name: string
    severity: string
  }>
}

export interface RecommendationOptions {
  maxProducts?: number
  excludeProductIds?: string[]
}

export class RecommendationService {
  private healthProfileService: HealthProfileService
  private productService: ProductService
  private contraindicationRepository: ContraindicationRepository

  constructor() {
    this.healthProfileService = new HealthProfileService()
    this.productService = new ProductService()
    this.contraindicationRepository = new ContraindicationRepository()
  }

  /**
   * Получить рекомендации продуктов для пользователя
   */
  async getRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const profile = await this.healthProfileService.getByUserId(userId)
    if (!profile) {
      throw new Error('Health profile not found')
    }

    // Получаем все доступные продукты
    const { products } = await this.productService.getList({ available: true }, 200, 0)

    // Фильтруем исключенные
    const filteredProducts = options.excludeProductIds
      ? products.filter((p) => !options.excludeProductIds!.includes(p.id))
      : products

    // Оцениваем каждый продукт
    const recommendations = await Promise.all(
      filteredProducts.map((product) => this.evaluateProduct(product, profile))
    )

    // Сортируем по оценке и фильтруем противопоказания
    const sorted = recommendations
      .filter((rec) => {
        // Исключаем продукты с критическими противопоказаниями
        const hasCriticalContraindication = rec.contraindications.some(
          (c) => c.severity === 'high'
        )
        return !hasCriticalContraindication
      })
      .sort((a, b) => b.score - a.score)

    // Возвращаем топ продуктов
    const maxProducts = options.maxProducts || 10
    return sorted.slice(0, maxProducts)
  }

  /**
   * Оценить продукт для пользователя
   */
  private async evaluateProduct(
    product: ProductWithTranslation,
    profile: HealthProfile
  ): Promise<ProductRecommendation> {
    let score = 50 // Базовый балл
    const reasons: string[] = []
    const warnings: string[] = []

    // Проверяем противопоказания
    const contraindications = await this.contraindicationRepository.findByProductId(product.id)

    // Проверяем соответствие заболеваний пользователя противопоказаниям
    const userDiseases = profile.diseases || []
    const matchingContraindications = contraindications.filter((contra) => {
      // Упрощенная проверка (в реальности нужна более сложная логика)
      return userDiseases.some((disease) =>
        contra.name_key.toLowerCase().includes(disease.toLowerCase()) ||
        disease.toLowerCase().includes(contra.name_key.toLowerCase())
      )
    })

    if (matchingContraindications.length > 0) {
      // Снижаем оценку за противопоказания
      matchingContraindications.forEach((contra) => {
        if (contra.severity === 'high') {
          score -= 100 // Критическое противопоказание - исключаем продукт
          warnings.push(`High severity contraindication: ${contra.name_key}`)
        } else if (contra.severity === 'medium') {
          score -= 30
          warnings.push(`Medium severity contraindication: ${contra.name_key}`)
        } else {
          score -= 10
          warnings.push(`Low severity contraindication: ${contra.name_key}`)
        }
      })
    }

    // Оценка по цели пользователя
    if (profile.goal) {
      score += this.scoreByGoal(product, profile.goal, reasons)
    }

    // Оценка по типу продукта и активности
    if (profile.activity_level) {
      score += this.scoreByActivityLevel(product, profile.activity_level, reasons)
    }

    // Бонус за наличие бренда
    if (product.brand?.verified) {
      score += 5
      reasons.push('Verified brand')
    }

    return {
      product,
      score: Math.max(0, score), // Не отрицательный балл
      reasons,
      warnings,
      contraindications: contraindications.map((c) => ({
        id: c.id,
        name: c.name_key,
        severity: c.severity,
      })),
    }
  }

  /**
   * Оценка продукта по цели пользователя
   */
  private scoreByGoal(product: Product, goal: string, reasons: string[]): number {
    let score = 0

    switch (goal) {
      case 'mass':
        // Для набора массы важны белки и калории
        if (product.type === 'protein') {
          score += 20
          reasons.push('High protein for muscle mass gain')
        }
        if (product.type === 'creatine') {
          score += 15
          reasons.push('Creatine supports muscle growth')
        }
        if (product.macros.calories > 200) {
          score += 10
          reasons.push('High calorie content')
        }
        break

      case 'cut':
        // Для сушки важны белки и низкие калории
        if (product.type === 'protein' && product.macros.calories < 150) {
          score += 20
          reasons.push('Low-calorie protein for cutting')
        }
        if (product.type === 'fat_burner') {
          score += 15
          reasons.push('Fat burner for cutting phase')
        }
        if (product.macros.fats < 5) {
          score += 5
          reasons.push('Low fat content')
        }
        break

      case 'endurance':
        // Для выносливости важны углеводы и аминокислоты
        if (product.type === 'amino') {
          score += 20
          reasons.push('Amino acids for endurance')
        }
        if (product.type === 'pre_workout') {
          score += 15
          reasons.push('Pre-workout for performance')
        }
        if (product.macros.carbs > 30) {
          score += 10
          reasons.push('High carb content for energy')
        }
        break

      case 'maintain':
        // Для поддержания сбалансированный состав
        if (product.type === 'protein') {
          score += 15
          reasons.push('Protein for maintenance')
        }
        if (product.type === 'vitamin') {
          score += 10
          reasons.push('Vitamins for overall health')
        }
        break
    }

    return score
  }

  /**
   * Оценка продукта по уровню активности
   */
  private scoreByActivityLevel(
    product: Product,
    activityLevel: string,
    reasons: string[]
  ): number {
    let score = 0

    switch (activityLevel) {
      case 'very_high':
      case 'high':
        // Высокая активность - нужны восстановительные продукты
        if (product.type === 'post_workout') {
          score += 15
          reasons.push('Post-workout recovery support')
        }
        if (product.type === 'amino') {
          score += 10
          reasons.push('Amino acids for recovery')
        }
        break

      case 'moderate':
        // Умеренная активность - стандартные рекомендации
        if (product.type === 'protein') {
          score += 5
        }
        break

      case 'low':
        // Низкая активность - минимум добавок
        if (product.type === 'vitamin') {
          score += 10
          reasons.push('Vitamins for low activity')
        }
        break
    }

    return score
  }

  /**
   * Проверить совместимость продукта с профилем здоровья
   */
  async checkCompatibility(
    productId: string,
    userId: string
  ): Promise<{ compatible: boolean; warnings: string[]; contraindications: any[] }> {
    const profile = await this.healthProfileService.getByUserId(userId)
    if (!profile) {
      return { compatible: true, warnings: [], contraindications: [] }
    }

    const product = await this.productService.getById(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const contraindications = await this.contraindicationRepository.findByProductId(productId)
    const userDiseases = profile.diseases || []
    const userMedications = profile.medications || []

    const warnings: string[] = []
    const matchingContraindications = contraindications.filter((contra) => {
      const matchesDisease = userDiseases.some((disease) =>
        contra.name_key.toLowerCase().includes(disease.toLowerCase())
      )
      const matchesMedication = userMedications.some((med) =>
        contra.name_key.toLowerCase().includes(med.toLowerCase())
      )
      return matchesDisease || matchesMedication
    })

    matchingContraindications.forEach((contra) => {
      if (contra.severity === 'high') {
        warnings.push(`CRITICAL: ${contra.name_key} - High severity contraindication`)
      } else {
        warnings.push(`WARNING: ${contra.name_key} - ${contra.severity} severity`)
      }
    })

    const hasCriticalContraindication = matchingContraindications.some(
      (c) => c.severity === 'high'
    )

    return {
      compatible: !hasCriticalContraindication,
      warnings,
      contraindications: matchingContraindications.map((c) => ({
        id: c.id,
        name: c.name_key,
        severity: c.severity,
      })),
    }
  }
}

