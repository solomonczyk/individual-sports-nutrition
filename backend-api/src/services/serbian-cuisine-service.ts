/**
 * Сервис для работы с сербской кухней и локальными продуктами
 * Service for Serbian cuisine and local products
 */

export interface SerbianMealTime {
  breakfast: string // обычно 7:00-9:00
  snack1: string // обычно 10:00-11:00
  lunch: string // обычно 13:00-15:00 (главный прием пищи)
  snack2: string // обычно 16:00-17:00
  dinner: string // обычно 19:00-21:00
}

export class SerbianCuisineService {
  /**
   * Получить стандартное сербское расписание приемов пищи
   */
  getDefaultMealTimes(): SerbianMealTime {
    return {
      breakfast: '08:00',
      snack1: '10:30',
      lunch: '14:00', // Главный прием пищи в Сербии обычно в обеденное время
      snack2: '16:30',
      dinner: '20:00',
    }
  }

  /**
   * Типичные сербские категории ингредиентов
   */
  getSerbianIngredientCategories(): string[] {
    return [
      'meat', // meso
      'dairy', // mlečni proizvodi
      'vegetable', // povrće
      'fruit', // voće
      'grain', // žitarice
      'legume', // mahunarke
      'nut', // orašasti plodovi
      'oil', // ulje
      'serbian_traditional', // srpsko tradicionalno
    ]
  }

  /**
   * Популярные блюда сербской кухни для планирования питания
   */
  getPopularSerbianMeals(): Array<{
    name_key: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    cuisine_type: string
    description: string
  }> {
    return [
      // Завтраки
      {
        name_key: 'meal.burek',
        meal_type: 'breakfast',
        cuisine_type: 'serbian',
        description: 'Традиционная сербская выпечка с начинкой',
      },
      {
        name_key: 'meal.gibanica',
        meal_type: 'breakfast',
        cuisine_type: 'serbian',
        description: 'Сербский сырный пирог',
      },
      {
        name_key: 'meal.proja',
        meal_type: 'breakfast',
        cuisine_type: 'serbian',
        description: 'Кукурузный хлеб',
      },

      // Обеды (главные приемы пищи)
      {
        name_key: 'meal.cevapi',
        meal_type: 'lunch',
        cuisine_type: 'serbian',
        description: 'Традиционные сербские колбаски с лепиньей и луком',
      },
      {
        name_key: 'meal.pljeskavica',
        meal_type: 'lunch',
        cuisine_type: 'serbian',
        description: 'Сербский бургер с луком и сыром',
      },
      {
        name_key: 'meal.sarma',
        meal_type: 'lunch',
        cuisine_type: 'serbian',
        description: 'Голубцы в кислой капусте',
      },
      {
        name_key: 'meal.prebranac',
        meal_type: 'lunch',
        cuisine_type: 'serbian',
        description: 'Запеченная фасоль',
      },
      {
        name_key: 'meal.musaka',
        meal_type: 'lunch',
        cuisine_type: 'balkan',
        description: 'Мусака (балканское блюдо)',
      },

      // Ужины
      {
        name_key: 'meal.riblja_corba',
        meal_type: 'dinner',
        cuisine_type: 'serbian',
        description: 'Рыбный суп',
      },
      {
        name_key: 'meal.pasulj',
        meal_type: 'dinner',
        cuisine_type: 'serbian',
        description: 'Фасолевый суп',
      },
      {
        name_key: 'meal.kajmak_mljeko',
        meal_type: 'dinner',
        cuisine_type: 'serbian',
        description: 'Традиционное молоко с каймаком',
      },
    ]
  }

  /**
   * Корректировка распределения калорий для сербских пищевых привычек
   * В Сербии основной прием пищи обычно в обеденное время (13-15)
   */
  adjustMealDistributionForSerbian(
    calories: number,
    protein: number,
    carbs: number,
    fats: number
  ) {
    return {
      breakfast: {
        calories: Math.round(calories * 0.20), // 20% - легкий завтрак
        protein: Math.round(protein * 0.20),
        carbs: Math.round(carbs * 0.20),
        fats: Math.round(fats * 0.20),
      },
      snack1: {
        calories: Math.round(calories * 0.10), // 10%
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.10),
        fats: Math.round(fats * 0.10),
      },
      lunch: {
        calories: Math.round(calories * 0.40), // 40% - главный прием пищи
        protein: Math.round(protein * 0.40),
        carbs: Math.round(carbs * 0.40),
        fats: Math.round(fats * 0.40),
      },
      snack2: {
        calories: Math.round(calories * 0.10), // 10%
        protein: Math.round(protein * 0.10),
        carbs: Math.round(carbs * 0.10),
        fats: Math.round(fats * 0.10),
      },
      dinner: {
        calories: Math.round(calories * 0.20), // 20% - легкий ужин
        protein: Math.round(protein * 0.20),
        carbs: Math.round(carbs * 0.20),
        fats: Math.round(fats * 0.20),
      },
    }
  }

  /**
   * Проверка, является ли продукт/ингредиент типично сербским
   */
  isSerbianIngredient(category: string | null): boolean {
    if (!category) {
      return false
    }
    const serbianCategories = ['serbian_traditional', 'balkan']
    return serbianCategories.includes(category.toLowerCase())
  }

  /**
   * Получить валюту по умолчанию (RSD - сербский динар)
   */
  getDefaultCurrency(): string {
    return 'RSD'
  }

  /**
   * Типичные размеры порций в Сербии (в граммах)
   */
  getTypicalSerbianPortionSizes() {
    return {
      cevapi: 200, // обычно 5-10 штук
      pljeskavica: 250,
      sarma: 200, // обычно 3-4 штуки
      prebranac: 200,
      burek: 150,
      ajvar: 50,
      kajmak: 50,
    }
  }
}

