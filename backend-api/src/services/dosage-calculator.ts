import { HealthProfile } from '../models/health-profile'
import { CalculationResult } from './nutrition-calculator'
import { Product } from '../models/product'
import { ProductPackage } from '../models/store'

export interface DosageCalculation {
  product_id: string
  product: Product
  daily_amount_grams: number
  daily_amount_servings: number
  weekly_amount_grams: number
  monthly_amount_grams: number
  recommended_packages: Array<{
    package: ProductPackage
    quantity: number
    duration_days: number
    cost_estimate: number
  }>
}

export interface DosageRequirements {
  product_id: string
  daily_grams: number
  duration_days: number
  frequency_per_week: number // обычно 7 для ежедневного приема
}

export class DosageCalculator {
  /**
   * Рассчитывает точное количество продукта на основе плана питания и типа продукта
   */
  calculateDosage(
    product: Product,
    nutritionalNeeds: CalculationResult,
    profile: HealthProfile,
    _durationDays: number = 30
  ): DosageCalculation {
    const dailyGrams = this.calculateDailyAmount(product, nutritionalNeeds, profile)
    const dailyServings = this.calculateDailyServings(product, dailyGrams)

    // Рассчитываем необходимое количество на период
    const weeklyGrams = dailyGrams * 7
    const monthlyGrams = dailyGrams * 30

    // Определяем рекомендуемые упаковки (будет добавлено позже)
    const recommendedPackages: DosageCalculation['recommended_packages'] = []

    return {
      product_id: product.id,
      product,
      daily_amount_grams: Math.round(dailyGrams * 100) / 100,
      daily_amount_servings: Math.round(dailyServings * 100) / 100,
      weekly_amount_grams: Math.round(weeklyGrams * 100) / 100,
      monthly_amount_grams: Math.round(monthlyGrams * 100) / 100,
      recommended_packages: recommendedPackages,
    }
  }

  /**
   * Рассчитывает дневное количество продукта в граммах
   */
  private calculateDailyAmount(
    product: Product,
    nutritionalNeeds: CalculationResult,
    profile: HealthProfile
  ): number {
    // Базовое количество зависит от типа продукта и потребностей
    let dailyGrams = 0

    switch (product.type) {
      case 'protein':
        // Протеин: рассчитываем исходя из потребности в белке
        const proteinNeeded = nutritionalNeeds.protein
        const productProteinPer100g = product.macros.protein || 0
        if (productProteinPer100g > 0) {
          // Обычно протеин покрывает 50-70% потребности из добавок
          const proteinFromSupplements = proteinNeeded * 0.6
          dailyGrams = (proteinFromSupplements / productProteinPer100g) * 100
        } else {
          // Если нет данных о белке, используем стандартную порцию
          dailyGrams = 30 // стандартная порция протеина
        }
        break

      case 'creatine':
        // Креатин: стандартная дозировка 3-5г в день
        dailyGrams = 5
        break

      case 'amino':
        // Аминокислоты: 5-10г перед/после тренировки
        const workoutDays = profile.activity_level === 'very_high' || profile.activity_level === 'high' ? 6 : 4
        dailyGrams = (workoutDays / 7) * 10 // среднее в день
        break

      case 'pre_workout':
        // Pre-workout: одна порция перед тренировкой
        const workoutFrequency = profile.activity_level === 'very_high' ? 6 : profile.activity_level === 'high' ? 5 : 3
        dailyGrams = (workoutFrequency / 7) * 15 // средняя порция
        break

      case 'post_workout':
        // Post-workout: одна порция после тренировки
        const postWorkoutFrequency = profile.activity_level === 'very_high' ? 6 : profile.activity_level === 'high' ? 5 : 3
        dailyGrams = (postWorkoutFrequency / 7) * 30
        break

      case 'vitamin':
        // Витамины: согласно инструкции, обычно 1-2 таблетки
        dailyGrams = 2
        break

      case 'fat_burner':
        // Жиросжигатели: обычно 1-2 капсулы
        dailyGrams = 1.5
        break

      default:
        // Для других типов используем стандартную порцию
        dailyGrams = product.serving_size ? parseFloat(product.serving_size.toString().replace(/[^0-9.]/g, '')) || 30 : 30
    }

    // Корректировка по весу для некоторых продуктов
    if (profile.weight) {
      if (product.type === 'protein' && profile.goal === 'mass') {
        // Для набора массы может потребоваться больше протеина
        dailyGrams = dailyGrams * 1.2
      } else if (product.type === 'protein' && profile.goal === 'cut') {
        // Для сушки можно немного уменьшить
        dailyGrams = dailyGrams * 0.9
      }
    }

    return Math.max(dailyGrams, 1) // минимум 1г
  }

  /**
   * Рассчитывает количество порций в день
   */
  private calculateDailyServings(product: Product, dailyGrams: number): number {
    if (!product.serving_size) {
      return 1 // по умолчанию 1 порция
    }

    // Парсим размер порции (может быть "30г", "1 scoop", "2 таблетки")
    const servingSize = parseFloat(product.serving_size.toString().replace(/[^0-9.]/g, '')) || 30
    return dailyGrams / servingSize
  }

  /**
   * Рассчитывает необходимое количество упаковок
   */
  calculateRequiredPackages(
    dailyGrams: number,
    durationDays: number,
    packages: ProductPackage[]
  ): Array<{ package: ProductPackage; quantity: number }> {
    if (packages.length === 0) {
      return []
    }

    const totalGramsNeeded = dailyGrams * durationDays
    const recommendations: Array<{ package: ProductPackage; quantity: number }> = []

    for (const pkg of packages) {
      if (pkg.weight_grams && pkg.weight_grams > 0) {
        const packagesNeeded = Math.ceil(totalGramsNeeded / pkg.weight_grams)
        recommendations.push({
          package: pkg,
          quantity: packagesNeeded,
        })
      }
    }

    // Сортируем по стоимости (если есть цены)
    return recommendations.sort((a, b) => {
      // Сначала сортируем по количеству упаковок
      if (a.quantity !== b.quantity) {
        return a.quantity - b.quantity
      }
      // Затем по размеру упаковки (больше размер - лучше)
      const aSize = a.package.weight_grams || 0
      const bSize = b.package.weight_grams || 0
      return bSize - aSize
    })
  }

  /**
   * Рассчитывает требования для всех продуктов в плане
   */
  calculatePlanRequirements(
    products: Product[],
    nutritionalNeeds: CalculationResult,
    profile: HealthProfile,
    durationDays: number
  ): DosageRequirements[] {
    return products.map((product) => {
      const dailyGrams = this.calculateDailyAmount(product, nutritionalNeeds, profile)
      
      // Определяем частоту приема
      let frequencyPerWeek = 7
      if (product.type === 'pre_workout' || product.type === 'post_workout' || product.type === 'amino') {
        const workoutDays = profile.activity_level === 'very_high' ? 6 : profile.activity_level === 'high' ? 5 : 3
        frequencyPerWeek = workoutDays
      }

      return {
        product_id: product.id,
        daily_grams: dailyGrams,
        duration_days: durationDays,
        frequency_per_week: frequencyPerWeek,
      }
    })
  }
}

