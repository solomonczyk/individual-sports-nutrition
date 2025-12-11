import { Pool } from 'pg'
import { Ingredient, CreateIngredientInput } from '../models/ingredient'
import { pool } from '../config/database'

export class IngredientRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Ingredient | null> {
    const result = await this.pool.query('SELECT * FROM ingredients WHERE id = $1', [id])
    return result.rows[0] ? this.mapRowToIngredient(result.rows[0]) : null
  }

  async findAll(filters?: { category?: string }): Promise<Ingredient[]> {
    let query = 'SELECT * FROM ingredients WHERE 1=1'
    const params: unknown[] = []
    let paramIndex = 1

    if (filters?.category) {
      query += ` AND category = $${paramIndex++}`
      params.push(filters.category)
    }

    query += ' ORDER BY name_key'

    const result = await this.pool.query(query, params)
    return result.rows.map((row) => this.mapRowToIngredient(row))
  }

  async findByCategory(category: string): Promise<Ingredient[]> {
    const result = await this.pool.query('SELECT * FROM ingredients WHERE category = $1 ORDER BY name_key', [category])
    return result.rows.map((row) => this.mapRowToIngredient(row))
  }

  async create(input: CreateIngredientInput): Promise<Ingredient> {
    const result = await this.pool.query(
      `INSERT INTO ingredients (name_key, category, macros, micronutrients, serving_size_grams, density)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.name_key,
        input.category || null,
        JSON.stringify(input.macros),
        JSON.stringify(input.micronutrients || {}),
        input.serving_size_grams || 100,
        input.density || null,
      ]
    )
    return this.mapRowToIngredient(result.rows[0])
  }

  private mapRowToIngredient(row: any): Ingredient {
    return {
      ...row,
      macros: typeof row.macros === 'string' ? JSON.parse(row.macros) : row.macros,
      micronutrients: typeof row.micronutrients === 'string' ? JSON.parse(row.micronutrients) : row.micronutrients,
    }
  }
}

