import { Pool } from 'pg'
import { Meal, MealWithIngredients, CreateMealInput, MealIngredient } from '../models/meal'
import { pool } from '../config/database'

export class MealRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Meal | null> {
    const result = await this.pool.query('SELECT * FROM meals WHERE id = $1', [id])
    return result.rows[0] ? this.mapRowToMeal(result.rows[0]) : null
  }

  async findByIdWithIngredients(id: string): Promise<MealWithIngredients | null> {
    const meal = await this.findById(id)
    if (!meal) {
      return null
    }

    const ingredientsResult = await this.pool.query(
      `SELECT mi.ingredient_id, mi.quantity_grams, mi.preparation_method, i.name_key
       FROM meal_ingredients mi
       INNER JOIN ingredients i ON mi.ingredient_id = i.id
       WHERE mi.meal_id = $1`,
      [id]
    )

    return {
      ...meal,
      ingredients: ingredientsResult.rows.map((row) => ({
        ingredient_id: row.ingredient_id,
        ingredient_name: row.name_key,
        quantity_grams: parseFloat(row.quantity_grams),
        preparation_method: row.preparation_method,
      })),
    }
  }

  async findByMealType(mealType: Meal['meal_type'], limit = 50): Promise<Meal[]> {
    const result = await this.pool.query(
      'SELECT * FROM meals WHERE meal_type = $1 ORDER BY name_key LIMIT $2',
      [mealType, limit]
    )
    return result.rows.map((row) => this.mapRowToMeal(row))
  }

  async findByCuisineType(cuisineType: string): Promise<Meal[]> {
    const result = await this.pool.query(
      'SELECT * FROM meals WHERE cuisine_type = $1 ORDER BY name_key',
      [cuisineType]
    )
    return result.rows.map((row) => this.mapRowToMeal(row))
  }

  async create(input: CreateMealInput): Promise<Meal> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Создаем блюдо
      const mealResult = await client.query(
        `INSERT INTO meals (
          name_key, description_key, meal_type, cuisine_type, cooking_time_minutes,
          difficulty_level, servings, instructions_key, image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          input.name_key,
          input.description_key || null,
          input.meal_type,
          input.cuisine_type || null,
          input.cooking_time_minutes || null,
          input.difficulty_level || null,
          input.servings || 1,
          input.instructions_key || null,
          input.image_url || null,
        ]
      )

      const meal = this.mapRowToMeal(mealResult.rows[0])

      // Добавляем ингредиенты
      for (const ingredient of input.ingredients) {
        await client.query(
          `INSERT INTO meal_ingredients (meal_id, ingredient_id, quantity_grams, preparation_method)
           VALUES ($1, $2, $3, $4)`,
          [
            meal.id,
            ingredient.ingredient_id,
            ingredient.quantity_grams,
            ingredient.preparation_method || null,
          ]
        )
      }

      // Рассчитываем макронутриенты из ингредиентов
      await client.query('SELECT calculate_meal_macros($1)', [meal.id])

      // Получаем обновленное блюдо
      const updatedMeal = await this.findById(meal.id)

      await client.query('COMMIT')
      return updatedMeal || meal
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private mapRowToMeal(row: any): Meal {
    return {
      ...row,
      total_macros: typeof row.total_macros === 'string' ? JSON.parse(row.total_macros) : row.total_macros,
      total_micronutrients:
        typeof row.total_micronutrients === 'string'
          ? JSON.parse(row.total_micronutrients)
          : row.total_micronutrients,
    }
  }
}

