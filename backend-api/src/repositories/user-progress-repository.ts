import { pool } from '../config/database'
import { UserProgress, CreateUserProgressInput } from '../models/user-progress'

export class UserProgressRepository {
  async findByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<UserProgress[]> {
    let query = `
      SELECT id, user_id, date, weight, body_fat, activity_data, consumed_products, notes, created_at
      FROM user_progress
      WHERE user_id = $1
    `
    const params: (string | Date)[] = [userId]

    if (startDate) {
      query += ` AND date >= $${params.length + 1}`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND date <= $${params.length + 1}`
      params.push(endDate)
    }

    query += ' ORDER BY date DESC'

    const result = await pool.query(query, params)
    return result.rows.map(this.mapRowToUserProgress)
  }

  async findByUserIdAndDate(userId: string, date: Date): Promise<UserProgress | null> {
    const query = `
      SELECT id, user_id, date, weight, body_fat, activity_data, consumed_products, notes, created_at
      FROM user_progress
      WHERE user_id = $1 AND date = $2
      LIMIT 1
    `
    const result = await pool.query(query, [userId, date])
    
    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUserProgress(result.rows[0])
  }

  async create(userId: string, input: CreateUserProgressInput): Promise<UserProgress> {
    const query = `
      INSERT INTO user_progress (user_id, date, weight, body_fat, activity_data, consumed_products, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, date, weight, body_fat, activity_data, consumed_products, notes, created_at
    `
    
    const values = [
      userId,
      input.date,
      input.weight || null,
      input.body_fat || null,
      JSON.stringify(input.activity_data || {}),
      JSON.stringify(input.consumed_products || []),
      input.notes || null,
    ]

    const result = await pool.query(query, values)
    return this.mapRowToUserProgress(result.rows[0])
  }

  async update(userId: string, date: Date, input: Partial<CreateUserProgressInput>): Promise<UserProgress> {
    const updates: string[] = []
    const values: (string | number | null | Date)[] = []
    let paramIndex = 1

    if (input.weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`)
      values.push(input.weight)
    }
    if (input.body_fat !== undefined) {
      updates.push(`body_fat = $${paramIndex++}`)
      values.push(input.body_fat)
    }
    if (input.activity_data !== undefined) {
      updates.push(`activity_data = $${paramIndex++}`)
      values.push(JSON.stringify(input.activity_data))
    }
    if (input.consumed_products !== undefined) {
      updates.push(`consumed_products = $${paramIndex++}`)
      values.push(JSON.stringify(input.consumed_products))
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`)
      values.push(input.notes)
    }

    if (updates.length === 0) {
      // No updates, just return existing
      const existing = await this.findByUserIdAndDate(userId, date)
      if (!existing) {
        throw new Error('User progress not found')
      }
      return existing
    }

    values.push(userId, date)
    const query = `
      UPDATE user_progress
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex++} AND date = $${paramIndex++}
      RETURNING id, user_id, date, weight, body_fat, activity_data, consumed_products, notes, created_at
    `

    const result = await pool.query(query, values)
    if (result.rows.length === 0) {
      throw new Error('User progress not found')
    }

    return this.mapRowToUserProgress(result.rows[0])
  }

  async delete(userId: string, date: Date): Promise<void> {
    const query = 'DELETE FROM user_progress WHERE user_id = $1 AND date = $2'
    await pool.query(query, [userId, date])
  }

  private mapRowToUserProgress(row: any): UserProgress {
    return {
      id: row.id,
      user_id: row.user_id,
      date: row.date,
      weight: row.weight ? parseFloat(row.weight) : null,
      body_fat: row.body_fat ? parseFloat(row.body_fat) : null,
      activity_data: typeof row.activity_data === 'string' ? JSON.parse(row.activity_data) : row.activity_data || {},
      consumed_products: typeof row.consumed_products === 'string' ? JSON.parse(row.consumed_products) : row.consumed_products || [],
      notes: row.notes,
      created_at: row.created_at,
    }
  }
}

