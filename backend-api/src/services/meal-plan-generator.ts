import { HealthProfileService } from './health-profile-service'
import { NutritionPlanService } from './nutrition-plan-service'
import { MealRepository } from '../repositories/meal-repository'
import { DailyMealPlanRepository } from '../repositories/daily-meal-plan-repository'
import { RecommendationService } from './recommendation-service'
import { SerbianCuisineService } from './serbian-cuisine-service'
import { MacroNutrients } from '../models/ingredient'
import { GenerateMealPlanInput, DailyMealPlanFull } from '../models/meal'

interface MealDistribution {
  breakfast: { calories: number; protein: number; carbs: number; fats: number }
  lunch: { calories: number; protein: number; carbs: number; fats: number }
  dinner: { calories: number; protein: number; carbs: number; fats: number }
  snacks: Array<{ calories: number; protein: number; carbs: number; fats: number }>
}

export class MealPlanGenerator {
  private healthProfileService: HealthProfileService
  private nutritionPlanService: NutritionPlanService
  private mealRepository: MealRepository
  private dailyMealPlanRepository: DailyMealPlanRepository
  private recommendationService: RecommendationService
  private serbianCuisineService: SerbianCuisineService

  constructor() {
    this.healthProfileService = new HealthProfileService()
    this.nutritionPlanService = new NutritionPlanService()
    this.mealRepository = new MealRepository()
    this.dailyMealPlanRepository = new DailyMealPlanRepository()
    this.recommendationService = new RecommendationService()
    this.serbianCuisineService = new SerbianCuisineService()
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
      throw new Error('Nutrition plan not found. Please calculate your nutrition needs first.')
    }

    const profile = await this.healthProfileService.getByUserId(userId)
    if (!profile) {
      throw new Error('Health profile not found')
    }

    // Распределяем калории и БЖУ по приемам пищи
    // Используем сербское распределение (главный прием пищи в обед)
    const serbianDistribution = this.serbianCuisineService.adjustMealDistributionForSerbian(
      nutritionPlan.calories || 0,
      nutritionPlan.protein || 0,
      nutritionPlan.carbs || 0,
      nutritionPlan.fats || 0
    )

    const distribution = {
      breakfast: serbianDistribution.breakfast,
      lunch: serbianDistribution.lunch,
      dinner: serbianDistribution.dinner,
      snacks: [serbianDistribution.snack1, serbianDistribution.snack2],
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
    const defaultSerbianTimes = this.serbianCuisineService.getDefaultMealTimes()
    const mealTimes = input.preferences?.meal_times || {
      breakfast: defaultSerbianTimes.breakfast,
      lunch: defaultSerbianTimes.lunch,
      dinner: defaultSerbianTimes.dinner,
      snacks: [defaultSerbianTimes.snack1, defaultSerbianTimes.snack2],
    }

    let orderIndex = 1

    // Завтрак
    const breakfastMeal = await this.selectMeal(
      'breakfast',
      distribution.breakfast,
      preferences
    )
    if (breakfastMeal) {
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
    const lunchMeal = await this.selectMeal('lunch', distribution.lunch, preferences)
    if (lunchMeal) {
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
    const dinnerMeal = await this.selectMeal('dinner', distribution.dinner, preferences)
    if (dinnerMeal) {
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
      const snackMeal = await this.selectMeal('snack', distribution.snacks[i], preferences)
      if (snackMeal) {
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
   * Распределяет калории и БЖУ по приемам пищи
   */
  private calculateMealDistribution(
    needs: MacroNutrients,
    goal: string
  ): MealDistribution {
    const { calories, protein, carbs, fats } = needs

    let breakfastPercent = 0.25 // 25%
    let lunchPercent = 0.35 // 35%
    let dinnerPercent = 0.30 // 30%
    let snacksPercent = 0.10 // 10% на перекусы

    // Корректировка по целям
    if (goal === 'cut') {
      // При сушке больше белка и меньше углеводов вечером
      breakfastPercent = 0.25
      lunchPercent = 0.35
      dinnerPercent = 0.25
      snacksPercent = 0.15
    } else if (goal === 'mass') {
      // При наборе массы равномерное распределение
      breakfastPercent = 0.25
      lunchPercent = 0.30
      dinnerPercent = 0.30
      snacksPercent = 0.15
    }

    const breakfast = {
      calories: Math.round(calories * breakfastPercent),
      protein: Math.round(protein * breakfastPercent),
      carbs: Math.round(carbs * breakfastPercent),
      fats: Math.round(fats * breakfastPercent),
    }

    const lunch = {
      calories: Math.round(calories * lunchPercent),
      protein: Math.round(protein * lunchPercent),
      carbs: Math.round(carbs * lunchPercent),
      fats: Math.round(fats * lunchPercent),
    }

    const dinner = {
      calories: Math.round(calories * dinnerPercent),
      protein: Math.round(protein * dinnerPercent),
      carbs: Math.round(carbs * dinnerPercent),
      fats: Math.round(fats * dinnerPercent),
    }

    // Перекусы делим на 2
    const snackCalories = Math.round(calories * snacksPercent / 2)
    const snackProtein = Math.round(protein * snacksPercent / 2)
    const snackCarbs = Math.round(carbs * snacksPercent / 2)
    const snackFats = Math.round(fats * snacksPercent / 2)

    const snacks = [
      { calories: snackCalories, protein: snackProtein, carbs: snackCarbs, fats: snackFats },
      { calories: snackCalories, protein: snackProtein, carbs: snackCarbs, fats: snackFats },
    ]

    return { breakfast, lunch, dinner, snacks }
  }

  /**
   * Подбирает блюдо из базы данных по типу и целевым макронутриентам
   */
  private async selectMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    targetMacros: { calories: number; protein: number; carbs: number; fats: number },
    preferences?: GenerateMealPlanInput['preferences']
  ) {
    // Получаем блюда нужного типа
    const meals = await this.mealRepository.findByMealType(mealType, 50)

    if (meals.length === 0) {
      return null
    }

    // Фильтруем по типу кухни, если указано
    let filteredMeals = meals
    if (preferences?.cuisine_types && preferences.cuisine_types.length > 0) {
      filteredMeals = meals.filter((m) =>
        m.cuisine_type && preferences.cuisine_types!.includes(m.cuisine_type)
      )
    }

    if (filteredMeals.length === 0) {
      filteredMeals = meals
    }

    // Выбираем блюдо, макронутриенты которого наиболее близки к целевым
    let bestMeal = filteredMeals[0]
    let bestScore = Infinity

    for (const meal of filteredMeals) {
      const macros = meal.total_macros
      if (!macros.calories || macros.calories === 0) {
        continue
      }

      // Рассчитываем разницу (чем меньше, тем лучше)
      const calorieDiff = Math.abs(macros.calories - targetMacros.calories) / targetMacros.calories
      const proteinDiff = Math.abs((macros.protein || 0) - targetMacros.protein) / Math.max(targetMacros.protein, 1)
      const carbsDiff = Math.abs((macros.carbs || 0) - targetMacros.carbs) / Math.max(targetMacros.carbs, 1)
      const fatsDiff = Math.abs((macros.fats || 0) - targetMacros.fats) / Math.max(targetMacros.fats, 1)

      const score = calorieDiff * 0.4 + proteinDiff * 0.3 + carbsDiff * 0.2 + fatsDiff * 0.1

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

