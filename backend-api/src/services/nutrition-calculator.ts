import { HealthProfile } from '../models/health-profile'

export interface NutritionalNeeds {
  calories: number
  protein: number
  carbs: number
  fats: number
}

export interface CalculationResult extends NutritionalNeeds {
  bmr: number // Basal Metabolic Rate
  tdee: number // Total Daily Energy Expenditure
  method: string
}

export class NutritionCalculator {
  /**
   * Рассчитывает BMR (Basal Metabolic Rate) по формуле Mifflin-St Jeor
   * Более точная формула чем Harris-Benedict
   */
  calculateBMR(profile: HealthProfile): number {
    if (!profile.age || !profile.weight || !profile.height || !profile.gender) {
      throw new Error('Missing required profile data: age, weight, height, gender')
    }

    const weight = profile.weight
    const height = profile.height
    const age = profile.age

    if (profile.gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5
    } else if (profile.gender === 'female') {
      return 10 * weight + 6.25 * height - 5 * age - 161
    } else {
      // Для 'other' используем среднее значение
      const maleBMR = 10 * weight + 6.25 * height - 5 * age + 5
      const femaleBMR = 10 * weight + 6.25 * height - 5 * age - 161
      return (maleBMR + femaleBMR) / 2
    }
  }

  /**
   * Рассчитывает TDEE (Total Daily Energy Expenditure) с учетом уровня активности
   */
  calculateTDEE(bmr: number, activityLevel: HealthProfile['activity_level']): number {
    const activityMultipliers = {
      low: 1.2, // Сидячий образ жизни
      moderate: 1.55, // Умеренная активность (тренировки 3-5 раз в неделю)
      high: 1.725, // Высокая активность (тренировки 6-7 раз в неделю)
      very_high: 1.9, // Очень высокая активность (тяжелые тренировки 2 раза в день)
    }

    const multiplier = activityLevel
      ? activityMultipliers[activityLevel]
      : activityMultipliers.moderate

    return Math.round(bmr * multiplier)
  }

  /**
   * Рассчитывает потребности в калориях с учетом цели
   */
  calculateCalories(profile: HealthProfile): CalculationResult {
    const bmr = this.calculateBMR(profile)
    const tdee = this.calculateTDEE(bmr, profile.activity_level)

    let calories = tdee
    let goalAdjustment = 0

    if (profile.goal === 'mass') {
      goalAdjustment = 300 // Избыток калорий для набора массы
      calories = tdee + goalAdjustment
    } else if (profile.goal === 'cut') {
      goalAdjustment = -500 // Дефицит калорий для сушки
      calories = Math.max(tdee + goalAdjustment, bmr * 1.1) // Минимум 110% от BMR
    } else if (profile.goal === 'endurance') {
      goalAdjustment = 200 // Небольшой избыток для выносливости
      calories = tdee + goalAdjustment
    }
    // 'maintain' - используем TDEE без изменений

    return {
      bmr: Math.round(bmr),
      tdee,
      calories: Math.round(calories),
      protein: 0,
      carbs: 0,
      fats: 0,
      method: 'mifflin_st_jeor',
    }
  }

  /**
   * Рассчитывает потребности в БЖУ (белки, жиры, углеводы) на основе калорий и цели
   */
  calculateMacros(calories: number, profile: HealthProfile): NutritionalNeeds {
    if (!profile.weight) {
      throw new Error('Weight is required for macro calculation')
    }

    const weight = profile.weight

    let proteinPerKg: number
    let fatPercentage: number

    if (profile.goal === 'mass') {
      proteinPerKg = 2.2 // Высокий белок для набора массы
      fatPercentage = 0.25 // 25% от калорий из жиров
    } else if (profile.goal === 'cut') {
      proteinPerKg = 2.5 // Очень высокий белок для сохранения мышц при сушке
      fatPercentage = 0.20 // 20% из жиров
    } else if (profile.goal === 'endurance') {
      proteinPerKg = 1.8
      fatPercentage = 0.30 // Больше жиров для энергии
    } else {
      // maintain
      proteinPerKg = 2.0
      fatPercentage = 0.25
    }

    // Расчет белков (1г = 4 ккал)
    const protein = Math.round(weight * proteinPerKg)
    const proteinCalories = protein * 4

    // Расчет жиров (1г = 9 ккал)
    const fatCalories = calories * fatPercentage
    const fats = Math.round(fatCalories / 9)

    // Расчет углеводов (1г = 4 ккал) - оставшиеся калории
    const remainingCalories = calories - proteinCalories - fatCalories
    const carbs = Math.round(remainingCalories / 4)

    return {
      calories,
      protein,
      carbs,
      fats,
    }
  }

  /**
   * Полный расчет потребностей (калории + БЖУ)
   */
  calculateFullNeeds(profile: HealthProfile): CalculationResult {
    const calcResult = this.calculateCalories(profile)
    const macros = this.calculateMacros(calcResult.calories, profile)

    return {
      ...calcResult,
      ...macros,
    }
  }
}

