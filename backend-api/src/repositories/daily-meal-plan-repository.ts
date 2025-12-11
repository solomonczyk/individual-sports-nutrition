import { Pool } from 'pg'
import {
  DailyMealPlan,
  DailyMealPlanItem,
  DailyMealPlanSupplement,
  DailyMealPlanFull,
} from '../models/meal'
import { pool } from '../config/database'

export class DailyMealPlanRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<DailyMealPlan | null> {
    const result = await this.pool.query(
      'SELECT * FROM daily_meal_plans WHERE user_id = $1 AND date = $2',
      [userId, date]
    )
    return result.rows[0] ? this.mapRowToDailyMealPlan(result.rows[0]) : null
  }

  async findFullByUserIdAndDate(userId: string, date: Date): Promise<DailyMealPlanFull | null> {
    const plan = await this.findByUserIdAndDate(userId, date)
    if (!plan) {
      return null
    }

    // Получаем блюда
    const mealsResult = await this.pool.query(
      `SELECT dmpi.*, 
              json_build_object(
                'id', m.id,
                'name_key', m.name_key,
                'description_key', m.description_key,
                'meal_type', m.meal_type,
                'cuisine_type', m.cuisine_type,
                'cooking_time_minutes', m.cooking_time_minutes,
                'difficulty_level', m.difficulty_level,
                'servings', m.servings,
                'instructions_key', m.instructions_key,
                'total_macros', m.total_macros,
                'total_micronutrients', m.total_micronutrients,
                'image_url', m.image_url
              ) as meal
       FROM daily_meal_plan_items dmpi
       INNER JOIN meals m ON dmpi.meal_id = m.id
       WHERE dmpi.daily_meal_plan_id = $1
       ORDER BY dmpi.order_index, dmpi.scheduled_time`,
      [plan.id]
    )

    // Получаем добавки
    const supplementsResult = await this.pool.query(
      `SELECT dmps.*,
              json_build_object(
                'id', p.id,
                'name_key', p.name_key,
                'type', p.type,
                'macros', p.macros
              ) as product
       FROM daily_meal_plan_supplements dmps
       INNER JOIN products p ON dmps.product_id = p.id
       WHERE dmps.daily_meal_plan_id = $1
       ORDER BY dmps.order_index, dmps.scheduled_time`,
      [plan.id]
    )

    return {
      ...plan,
      meals: mealsResult.rows.map((row) => ({
        ...row,
        meal: typeof row.meal === 'string' ? JSON.parse(row.meal) : row.meal,
      })),
      supplements: supplementsResult.rows.map((row) => ({
        ...row,
        product: typeof row.product === 'string' ? JSON.parse(row.product) : row.product,
      })),
    }
  }

  async create(
    userId: string,
    nutritionPlanId: string | null,
    date: Date,
    totals: {
      calories: number
      protein: number
      carbs: number
      fats: number
      micronutrients: any
    }
  ): Promise<DailyMealPlan> {
    const result = await this.pool.query(
      `INSERT INTO daily_meal_plans (
        user_id, nutrition_plan_id, date, total_calories, total_protein, total_carbs, total_fats, total_micronutrients
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        nutritionPlanId,
        date,
        totals.calories,
        totals.protein,
        totals.carbs,
        totals.fats,
        JSON.stringify(totals.micronutrients),
      ]
    )
    return this.mapRowToDailyMealPlan(result.rows[0])
  }

  async addMeal(
    dailyMealPlanId: string,
    mealId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    scheduledTime: string | null,
    servings: number,
    orderIndex: number
  ): Promise<DailyMealPlanItem> {
    // Получаем макронутриенты блюда
    const mealResult = await this.pool.query('SELECT total_macros FROM meals WHERE id = $1', [mealId])
    const mealMacros = mealResult.rows[0]?.total_macros || {}

    const result = await this.pool.query(
      `INSERT INTO daily_meal_plan_items (
        daily_meal_plan_id, meal_id, meal_type, scheduled_time, servings,
        calories, protein, carbs, fats, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        dailyMealPlanId,
        mealId,
        mealType,
        scheduledTime,
        servings,
        (mealMacros.calories || 0) * servings,
        (mealMacros.protein || 0) * servings,
        (mealMacros.carbs || 0) * servings,
        (mealMacros.fats || 0) * servings,
        orderIndex,
      ]
    )
    return result.rows[0]
  }

  async addSupplement(
    dailyMealPlanId: string,
    productId: string,
    scheduledTime: string | null,
    dosageGrams: number | null,
    timing: string | null,
    orderIndex: number
  ): Promise<DailyMealPlanSupplement> {
    const result = await this.pool.query(
      `INSERT INTO daily_meal_plan_supplements (
        daily_meal_plan_id, product_id, scheduled_time, dosage_grams, timing, order_index
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [dailyMealPlanId, productId, scheduledTime, dosageGrams, timing, orderIndex]
    )
    return result.rows[0]
  }

  private mapRowToDailyMealPlan(row: any): DailyMealPlan {
    return {
      ...row,
      total_micronutrients:
        typeof row.total_micronutrients === 'string'
          ? JSON.parse(row.total_micronutrients)
          : row.total_micronutrients,
    }
  }
}

