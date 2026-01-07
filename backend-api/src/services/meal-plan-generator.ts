import { HealthProfileService } from './health-profile-service'
import { NutritionPlanService } from './nutrition-plan-service'
import { MealRepository } from '../repositories/meal-repository'
import { DailyMealPlanRepository } from '../repositories/daily-meal-plan-repository'
import { RecommendationService } from './recommendation-service'
import { MacroNutrients } from '../models/ingredient'
import { GenerateMealPlanInput, DailyMealPlanFull } from '../models/meal'

export class MealPlanGenerator {
  private healthProfileService: HealthProfileService
  private nutritionPlanService: NutritionPlanService
  private mealRepository: MealRepository
  private dailyMealPlanRepository: DailyMealPlanRepository
  private recommendationService: RecommendationService

  constructor() {
    this.healthProfileService = new HealthProfileService()
    this.nutritionPlanService = new NutritionPlanService()
    this.mealRepository = new MealRepository()
    this.dailyMealPlanRepository = new DailyMealPlanRepository()
    this.recommendationService = new RecommendationService()
  }

  /**
   * Генерирует дневной план питания с распределением по приемам пищи
   */
  async generateDailyMealPlan(
    userId: string,
    input: GenerateMealPlanInput
  ): Promise<DailyMealPlanFull> {
    // Получаем план питания пользователя
    const nutritionPlan = await this.nutritionPlanService.getByUserId(userId)
    if (!nutritionPlan || !nutritionPlan.calories) {
      const error = new Error('Nutrition plan not found. Please calculate your nutrition needs first.') as any
      error.statusCode = 404
      error.code = 'PLAN_NOT_FOUND'
      throw error
    }

    const profile = await this.healthProfileService.getByUserId(userId)
    if (!profile) {
      const error = new Error('Health profile not found') as any
      error.statusCode = 404
      throw error
    }

    // Распределяем калории и БЖУ по приемам пищи
    // Используем сербское распределение (главный прием пищи в обед)
    const serbianDistribution = {
      breakfast: { calories: (nutritionPlan.calories || 0) * 0.25, protein: (nutritionPlan.protein || 0) * 0.25, carbs: (nutritionPlan.carbs || 0) * 0.25, fats: (nutritionPlan.fats || 0) * 0.25 },
      lunch: { calories: (nutritionPlan.calories || 0) * 0.40, protein: (nutritionPlan.protein || 0) * 0.40, carbs: (nutritionPlan.carbs || 0) * 0.40, fats: (nutritionPlan.fats || 0) * 0.40 },
      dinner: { calories: (nutritionPlan.calories || 0) * 0.30, protein: (nutritionPlan.protein || 0) * 0.30, carbs: (nutritionPlan.carbs || 0) * 0.30, fats: (nutritionPlan.fats || 0) * 0.30 },
      snacks: { calories: (nutritionPlan.calories || 0) * 0.05, protein: (nutritionPlan.protein || 0) * 0.05, carbs: (nutritionPlan.carbs || 0) * 0.05, fats: (nutritionPlan.fats || 0) * 0.05 }
    }

    const distribution = {
      breakfast: serbianDistribution.breakfast,
      lunch: serbianDistribution.lunch,
      dinner: serbianDistribution.dinner,
      snacks: [serbianDistribution.snacks, serbianDistribution.snacks],
    }

    // Приоритет сербской кухни при подборе блюд
    const preferences = input.preferences || {}
    if (!preferences.cuisine_types) {
      preferences.cuisine_types = ['serbian', 'balkan']
    } else if (!preferences.cuisine_types.includes('serbian')) {
      preferences.cuisine_types.unshift('serbian') // Добавляем сербскую в начало
    }

    // Добавляем аллергии из профиля пользователя в исключенные ингредиенты
    if (profile.allergies && profile.allergies.length > 0) {
      if (!preferences.exclude_ingredients) {
        preferences.exclude_ingredients = []
      }
      // Добавляем аллергии, если их еще нет в списке
      profile.allergies.forEach((allergy) => {
        if (!preferences.exclude_ingredients!.some((ex) => ex.toLowerCase() === allergy.toLowerCase())) {
          preferences.exclude_ingredients!.push(allergy)
        }
      })
    }

    const date = new Date(input.date)

    // Проверяем, существует ли уже план на эту дату
    let dailyPlan = await this.dailyMealPlanRepository.findByUserIdAndDate(userId, date)

    if (dailyPlan) {
      // Обновляем существующий план
      // TODO: можно добавить логику обновления
    } else {
      // Создаем новый план
      dailyPlan = await this.dailyMealPlanRepository.create(
        userId,
        nutritionPlan.id,
        date,
        {
          calories: nutritionPlan.calories || 0,
          protein: nutritionPlan.protein || 0,
          carbs: nutritionPlan.carbs || 0,
          fats: nutritionPlan.fats || 0,
          micronutrients: {},
        }
      )
    }

    // Подбираем блюда для каждого приема пищи
    // Используем стандартное сербское расписание, если не указано иное
    const defaultSerbianTimes = {
      breakfast: '08:00',
      lunch: '14:00',
      dinner: '20:00',
      snack1: '10:30',
      snack2: '16:30'
    }
    const mealTimes = input.preferences?.meal_times || {
      breakfast: defaultSerbianTimes.breakfast,
      lunch: defaultSerbianTimes.lunch,
      dinner: defaultSerbianTimes.dinner,
      snacks: [defaultSerbianTimes.snack1, defaultSerbianTimes.snack2],
    }

    let orderIndex = 1
    const selectedMealIds: string[] = [] // Для отслеживания разнообразия

    // Завтрак
    const breakfastMeal = await this.selectMeal(
      'breakfast',
      distribution.breakfast,
      preferences,
      selectedMealIds
    )
    if (breakfastMeal) {
      selectedMealIds.push(breakfastMeal.id)
      const servings = this.calculateServings(breakfastMeal.total_macros, distribution.breakfast)
      await this.dailyMealPlanRepository.addMeal(
        dailyPlan.id,
        breakfastMeal.id,
        'breakfast',
        mealTimes.breakfast || '08:00',
        servings,
        orderIndex++
      )
    }

    // Обед (главный прием пищи в Сербии) 
    const lunchMeal = await this.selectMeal('lunch', distribution.lunch, preferences, selectedMealIds)
    if (lunchMeal) {
      selectedMealIds.push(lunchMeal.id)
      const servings = this.calculateServings(lunchMeal.total_macros, distribution.lunch)
      await this.dailyMealPlanRepository.addMeal(
        dailyPlan.id,
        lunchMeal.id,
        'lunch',
        mealTimes.lunch || '13:00',
        servings,
        orderIndex++
      )
    }

    // Ужин
    const dinnerMeal = await this.selectMeal('dinner', distribution.dinner, preferences, selectedMealIds)
    if (dinnerMeal) {
      selectedMealIds.push(dinnerMeal.id)
      const servings = this.calculateServings(dinnerMeal.total_macros, distribution.dinner)
      await this.dailyMealPlanRepository.addMeal(
        dailyPlan.id,
        dinnerMeal.id,
        'dinner',
        mealTimes.dinner || '19:00',
        servings,
        orderIndex++
      )
    }

    // Перекусы
    for (let i = 0; i < distribution.snacks.length && i < (mealTimes.snacks?.length || 0); i++) {
      const snackMeal = await this.selectMeal('snack', distribution.snacks[i], preferences, selectedMealIds)
      if (snackMeal) {
        selectedMealIds.push(snackMeal.id)
        const servings = this.calculateServings(snackMeal.total_macros, distribution.snacks[i])
        await this.dailyMealPlanRepository.addMeal(
          dailyPlan.id,
          snackMeal.id,
          'snack',
          mealTimes.snacks?.[i] || null,
          servings,
          orderIndex++
        )
      }
    }

    // Добавляем рекомендованные добавки
    const recommendations = await this.recommendationService.getRecommendations(userId, {
      maxProducts: 5,
    })

    for (const rec of recommendations.slice(0, 3)) {
      // Определяем время приема добавки
      let timing = 'with_meal'
      let scheduledTime = mealTimes.breakfast || '08:00'

      if (rec.product.type === 'pre_workout') {
        timing = 'pre_workout'
        scheduledTime = '12:00' // предполагаем тренировку в обеденное время
      } else if (rec.product.type === 'post_workout') {
        timing = 'post_workout'
        scheduledTime = '14:00'
      } else if (rec.product.type === 'protein') {
        timing = 'with_meal'
        scheduledTime = mealTimes.lunch || '13:00'
      }

      await this.dailyMealPlanRepository.addSupplement(
        dailyPlan.id,
        rec.product.id,
        scheduledTime,
        null, // дозировка рассчитывается отдельно
        timing,
        orderIndex++
      )
    }

    // Получаем полный план
    const fullPlan = await this.dailyMealPlanRepository.findFullByUserIdAndDate(userId, date)
    if (!fullPlan) {
      throw new Error('Failed to generate meal plan')
    }

    return fullPlan
  }


  /**
   * Подбирает блюдо из базы данных по типу и целевым макронутриентам
   * Улучшенная версия с учетом аллергий, предпочтений и разнообразия
   */
  private async selectMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    targetMacros: { calories: number; protein: number; carbs: number; fats: number },
    preferences?: GenerateMealPlanInput['preferences'],
    alreadySelectedMealIds?: string[]
  ) {
    // Получаем блюда нужного типа
    let meals = await this.mealRepository.findByMealType(mealType, 100)

    if (meals.length === 0) {
      return null
    }

    // Фильтруем по типу кухни, если указано
    if (preferences?.cuisine_types && preferences.cuisine_types.length > 0) {
      meals = meals.filter((m) =>
        m.cuisine_type && preferences.cuisine_types!.includes(m.cuisine_type)
      )
    }

    // Если после фильтрации ничего не осталось, используем все доступные
    if (meals.length === 0) {
      meals = await this.mealRepository.findByMealType(mealType, 100)
    }

    // Фильтруем по исключенным ингредиентам и аллергиям
    const excludeIngredients = preferences?.exclude_ingredients || []
    if (excludeIngredients.length > 0) {
      meals = meals.filter((meal) => {
        // Проверяем ингредиенты блюда
        const ingredients = meal.ingredients || []
        const hasExcluded = ingredients.some((ing: any) => {
          const ingName = (ing.name || ing.name_key || '').toLowerCase()
          return excludeIngredients.some((excluded) =>
            ingName.includes(excluded.toLowerCase()) || excluded.toLowerCase().includes(ingName)
          )
        })

        return !hasExcluded
      })
    }

    // Избегаем повторения уже выбранных блюд (для разнообразия)
    if (alreadySelectedMealIds && alreadySelectedMealIds.length > 0) {
      const availableMeals = meals.filter((m) => !alreadySelectedMealIds.includes(m.id))
      if (availableMeals.length > 0) {
        meals = availableMeals
      }
    }

    // Выбираем блюдо, макронутриенты которого наиболее близки к целевым
    let bestMeal = meals[0]
    let bestScore = Infinity

    for (const meal of meals) {
      const macros = meal.total_macros
      if (!macros.calories || macros.calories === 0) {
        continue
      }

      // Рассчитываем разницу (чем меньше, тем лучше)
      // Используем взвешенную оценку с приоритетом калориям и белкам
      const calorieDiff = Math.abs(macros.calories - targetMacros.calories) / Math.max(targetMacros.calories, 1)
      const proteinDiff = Math.abs((macros.protein || 0) - targetMacros.protein) / Math.max(targetMacros.protein, 1)
      const carbsDiff = Math.abs((macros.carbs || 0) - targetMacros.carbs) / Math.max(targetMacros.carbs, 1)
      const fatsDiff = Math.abs((macros.fats || 0) - targetMacros.fats) / Math.max(targetMacros.fats, 1)

      // Улучшенная формула оценки (калории и белок важнее)
      const score = calorieDiff * 0.5 + proteinDiff * 0.3 + carbsDiff * 0.15 + fatsDiff * 0.05

      // Бонус за сербскую кухню (если предпочтения позволяют)
      if (meal.cuisine_type === 'serbian' || meal.cuisine_type === 'balkan') {
        // Небольшой бонус для сербской кухни
        if (preferences?.cuisine_types?.includes('serbian') || !preferences?.cuisine_types) {
          const adjustedScore = score * 0.95 // 5% бонус
          if (adjustedScore < bestScore) {
            bestScore = adjustedScore
            bestMeal = meal
          }
          continue
        }
      }

      if (score < bestScore) {
        bestScore = score
        bestMeal = meal
      }
    }

    return bestMeal
  }

  /**
   * Рассчитывает количество порций блюда для достижения целевых макронутриентов
   */
  private calculateServings(
    mealMacros: MacroNutrients,
    targetMacros: { calories: number; protein: number; carbs: number; fats: number }
  ): number {
    if (!mealMacros.calories || mealMacros.calories === 0) {
      return 1
    }

    // Рассчитываем по калориям (основной критерий)
    const servingsByCalories = targetMacros.calories / mealMacros.calories

    // Рассчитываем по белкам
    const servingsByProtein =
      mealMacros.protein > 0 ? targetMacros.protein / mealMacros.protein : servingsByCalories

    // Берем среднее значение
    const servings = (servingsByCalories + servingsByProtein) / 2

    // Округляем до ближайшего 0.5
    return Math.max(0.5, Math.round(servings * 2) / 2)
  }
}

