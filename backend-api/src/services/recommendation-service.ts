import { HealthProfileService } from './health-profile-service'
import { ProductService } from './product-service'
import { ContraindicationRepository } from '../repositories/contraindication-repository'
import { AIServiceClient } from './ai-service-client'
import { NutritionCalculator, CalculationResult } from './nutrition-calculator'
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
  private aiServiceClient: AIServiceClient
  private nutritionCalculator: NutritionCalculator

  constructor() {
    this.healthProfileService = new HealthProfileService()
    this.productService = new ProductService()
    this.contraindicationRepository = new ContraindicationRepository()
    this.aiServiceClient = new AIServiceClient()
    this.nutritionCalculator = new NutritionCalculator()
  }

  /**
   * Получить рекомендации продуктов для пользователя
   * Использует улучшенный алгоритм оценки с учетом индивидуальных потребностей
   */
  async getRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const profile = await this.healthProfileService.getByUserId(userId)
    if (!profile) {
      throw new Error('Health profile not found')
    }

    // Рассчитываем индивидуальные потребности пользователя
    let nutritionalNeeds: CalculationResult | null = null
    try {
      nutritionalNeeds = this.nutritionCalculator.calculateFullNeeds(profile)
    } catch (error) {
      // Если не удалось рассчитать, продолжаем без индивидуальных потребностей
      console.warn('Could not calculate nutritional needs, using default scoring')
    }

    // Получаем все доступные продукты
    const { products } = await this.productService.getList({ available: true }, 200, 0)

    // Фильтруем исключенные
    const filteredProducts = options.excludeProductIds
      ? products.filter((p) => !options.excludeProductIds!.includes(p.id))
      : products

    // Оцениваем каждый продукт с учетом индивидуальных потребностей
    const recommendations = await Promise.all(
      filteredProducts.map((product) => this.evaluateProduct(product, profile, nutritionalNeeds))
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
   * Улучшенная версия с учетом индивидуальных потребностей
   */
  private async evaluateProduct(
    product: ProductWithTranslation,
    profile: HealthProfile,
    nutritionalNeeds: CalculationResult | null = null
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

    // Оценка по цели пользователя (улучшенная с учетом индивидуальных потребностей)
    if (profile.goal) {
      score += this.scoreByGoal(product, profile.goal, reasons, nutritionalNeeds)
    }

    // Оценка по типу продукта и активности
    if (profile.activity_level) {
      score += this.scoreByActivityLevel(product, profile.activity_level, reasons)
    }

    // Оценка по индивидуальным потребностям в макронутриентах
    if (nutritionalNeeds) {
      score += this.scoreByNutritionalNeeds(product, nutritionalNeeds, profile, reasons)
    }

    // Бонус за наличие бренда
    if (product.brand?.verified) {
      score += 5
      reasons.push('Verified brand')
    }

    // Бонус за качество продукта (если есть информация о качестве)
    if (product.brand?.premium) {
      score += 3
      reasons.push('Premium quality product')
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
   * Улучшенная версия с учетом индивидуальных потребностей
   */
  private scoreByGoal(
    product: Product,
    goal: string,
    reasons: string[],
    nutritionalNeeds: CalculationResult | null = null
  ): number {
    let score = 0
    const macros = product.macros

    switch (goal) {
      case 'mass':
        // Для набора массы важны белки и калории
        if (product.type === 'protein') {
          score += 20
          reasons.push('High protein for muscle mass gain')
          
          // Дополнительный бонус если белок соответствует индивидуальным потребностям
          if (nutritionalNeeds && macros.protein > 0) {
            const dailyProtein = nutritionalNeeds.protein
            const proteinContribution = macros.protein / dailyProtein
            // Оптимально: 10-25% дневной нормы белка на порцию
            if (proteinContribution >= 0.10 && proteinContribution <= 0.25) {
              score += 8
              reasons.push(`Provides ${Math.round(proteinContribution * 100)}% of daily protein needs`)
            } else if (proteinContribution > 0.25 && proteinContribution <= 0.40) {
              score += 5
            }
          }
        }
        if (product.type === 'creatine') {
          score += 15
          reasons.push('Creatine supports muscle growth')
        }
        // Более точная оценка калорийности для набора массы
        if (macros.calories >= 200 && macros.calories <= 400) {
          score += 10
          reasons.push('Optimal calorie content for mass gain')
        } else if (macros.calories > 400) {
          score += 5
        }
        break

      case 'cut':
        // Для сушки важны белки и низкие калории
        if (product.type === 'protein' && macros.calories < 150) {
          score += 20
          reasons.push('Low-calorie protein for cutting')
        } else if (product.type === 'protein') {
          score += 15
          reasons.push('High protein for cutting')
        }
        if (product.type === 'fat_burner') {
          score += 15
          reasons.push('Fat burner for cutting phase')
        }
        // Штраф за высокую калорийность
        if (macros.calories > 250) {
          score -= 5
        } else if (macros.calories <= 150) {
          score += 8
          reasons.push('Low calorie content')
        }
        if (macros.fats < 5) {
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
        // Углеводы важны для выносливости
        if (macros.carbs >= 30 && macros.carbs <= 60) {
          score += 12
          reasons.push('Optimal carb content for energy')
        } else if (macros.carbs > 30) {
          score += 8
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
        // Сбалансированный состав макронутриентов
        const hasProtein = macros.protein > 15
        const hasCarbs = macros.carbs > 10
        if (hasProtein && hasCarbs) {
          score += 5
          reasons.push('Balanced macronutrient profile')
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
        // Более высокие потребности в белке при высокой активности
        if (product.type === 'protein' && product.macros.protein >= 25) {
          score += 8
          reasons.push('High protein content ideal for high activity')
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
        // Низкокалорийные продукты для низкой активности
        if (product.macros.calories < 150) {
          score += 5
        }
        break
    }

    return score
  }

  /**
   * Оценка продукта на основе индивидуальных потребностей в макронутриентах
   */
  private scoreByNutritionalNeeds(
    product: Product,
    nutritionalNeeds: CalculationResult,
    profile: HealthProfile,
    reasons: string[]
  ): number {
    let score = 0
    const macros = product.macros
    const dailyProtein = nutritionalNeeds.protein
    const dailyCalories = nutritionalNeeds.calories

    // Оценка белка: насколько продукт покрывает дневные потребности
    if (macros.protein > 0 && dailyProtein > 0) {
      const proteinContribution = macros.protein / dailyProtein
      
      // Оптимальный диапазон: 10-25% дневной нормы на порцию
      if (proteinContribution >= 0.10 && proteinContribution <= 0.25) {
        score += 12
        reasons.push(`Provides ${Math.round(proteinContribution * 100)}% of daily protein`)
      } else if (proteinContribution > 0.25 && proteinContribution <= 0.40) {
        score += 8
        reasons.push(`High protein: ${Math.round(proteinContribution * 100)}% of daily needs`)
      } else if (proteinContribution >= 0.05 && proteinContribution < 0.10) {
        score += 5
      }
    }

    // Оценка калорийности относительно цели
    if (dailyCalories > 0 && macros.calories > 0) {
      const calorieContribution = macros.calories / dailyCalories
      
      if (profile.goal === 'cut') {
        // Для сушки: низкая калорийность лучше
        if (calorieContribution <= 0.08) {
          score += 8
          reasons.push('Low calorie content suitable for cutting')
        } else if (calorieContribution > 0.15) {
          score -= 5 // Штраф за высокую калорийность при сушке
        }
      } else if (profile.goal === 'mass') {
        // Для набора массы: умеренная-высокая калорийность
        if (calorieContribution >= 0.10 && calorieContribution <= 0.20) {
          score += 8
          reasons.push('Optimal calorie content for mass gain')
        }
      }
    }

    // Оценка баланса макронутриентов
    const totalMacros = macros.protein + macros.carbs + macros.fats
    if (totalMacros > 0) {
      const proteinRatio = macros.protein / totalMacros
      const carbRatio = macros.carbs / totalMacros
      
      // Для белка: оптимальный диапазон 30-50% от макронутриентов
      if (proteinRatio >= 0.30 && proteinRatio <= 0.50) {
        score += 5
      }
      
      // Для углеводов: хороший баланс с белком
      if (profile.goal === 'endurance' && carbRatio >= 0.40) {
        score += 5
        reasons.push('High carb ratio ideal for endurance')
      }
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

