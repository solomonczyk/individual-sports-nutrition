import { Pool } from 'pg'
import { NutritionPlan, CreateNutritionPlanInput } from '../models/nutrition-plan'
import { pool } from '../config/database'

export class NutritionPlanRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByUserId(userId: string, activeOnly = true): Promise<NutritionPlan | null> {
    let query = 'SELECT * FROM nutrition_plans WHERE user_id = $1'
    const params: unknown[] = [userId]

    if (activeOnly) {
      query += ' AND active = true'
    }

    query += ' ORDER BY created_at DESC LIMIT 1'

    const result = await this.pool.query(query, params)
    return result.rows[0] || null
  }

  async findById(id: string): Promise<NutritionPlan | null> {
    const result = await this.pool.query(
      'SELECT * FROM nutrition_plans WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  async deactivateAll(userId: string): Promise<void> {
    await this.pool.query(
      'UPDATE nutrition_plans SET active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [userId]
    )
  }

  async create(userId: string, input: CreateNutritionPlanInput): Promise<NutritionPlan> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Деактивируем предыдущие планы
      await client.query(
        'UPDATE nutrition_plans SET active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      )

      // Создаем новый план
      const planResult = await client.query(
        `INSERT INTO nutrition_plans (user_id, calories, protein, carbs, fats, active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [
          userId,
          input.calories || null,
          input.protein || null,
          input.carbs || null,
          input.fats || null,
        ]
      )

      const plan = planResult.rows[0]

      // Добавляем продукты, если есть
      if (input.products && input.products.length > 0) {
        for (const product of input.products) {
          await client.query(
            `INSERT INTO plan_products (plan_id, product_id, dosage, frequency, timing)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (plan_id, product_id) DO UPDATE
             SET dosage = $3, frequency = $4, timing = $5`,
            [plan.id, product.product_id, product.dosage || null, product.frequency || null, product.timing || null]
          )
        }
      }

      // Добавляем рецепты, если есть
      if (input.recipes && input.recipes.length > 0) {
        for (const recipe of input.recipes) {
          await client.query(
            `INSERT INTO plan_recipes (plan_id, recipe_id, meal_type, day_of_week)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (plan_id, recipe_id, meal_type, day_of_week) DO NOTHING`,
            [plan.id, recipe.recipe_id, recipe.meal_type, recipe.day_of_week]
          )
        }
      }

      await client.query('COMMIT')
      return plan
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async update(planId: string, input: Partial<CreateNutritionPlanInput>): Promise<NutritionPlan> {
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (input.calories !== undefined) {
      updates.push(`calories = $${paramIndex++}`)
      values.push(input.calories)
    }
    if (input.protein !== undefined) {
      updates.push(`protein = $${paramIndex++}`)
      values.push(input.protein)
    }
    if (input.carbs !== undefined) {
      updates.push(`carbs = $${paramIndex++}`)
      values.push(input.carbs)
    }
    if (input.fats !== undefined) {
      updates.push(`fats = $${paramIndex++}`)
      values.push(input.fats)
    }

    if (updates.length === 0) {
      const existing = await this.findById(planId)
      if (!existing) {
        throw new Error('Nutrition plan not found')
      }
      return existing
    }

    values.push(planId)
    const result = await this.pool.query(
      `UPDATE nutrition_plans
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return result.rows[0]
  }
}

