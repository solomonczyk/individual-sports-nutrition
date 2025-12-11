import { Pool } from 'pg'
import { HealthProfile, CreateHealthProfileInput, UpdateHealthProfileInput } from '../models/health-profile'
import { pool } from '../config/database'

export class HealthProfileRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByUserId(userId: string): Promise<HealthProfile | null> {
    const result = await this.pool.query(
      'SELECT * FROM health_profiles WHERE user_id = $1',
      [userId]
    )
    return result.rows[0] || null
  }

  async create(userId: string, input: CreateHealthProfileInput): Promise<HealthProfile> {
    const result = await this.pool.query(
      `INSERT INTO health_profiles (
        user_id, age, gender, weight, height, activity_level, goal,
        allergies, diseases, medications
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        userId,
        input.age || null,
        input.gender || null,
        input.weight || null,
        input.height || null,
        input.activity_level || null,
        input.goal || null,
        JSON.stringify(input.allergies || []),
        JSON.stringify(input.diseases || []),
        JSON.stringify(input.medications || []),
      ]
    )
    return this.mapRowToHealthProfile(result.rows[0])
  }

  async update(userId: string, input: UpdateHealthProfileInput): Promise<HealthProfile> {
    const existing = await this.findByUserId(userId)
    if (!existing) {
      throw new Error('Health profile not found')
    }

    const updates = []
    const values: unknown[] = []
    let paramIndex = 1

    if (input.age !== undefined) {
      updates.push(`age = $${paramIndex++}`)
      values.push(input.age)
    }
    if (input.gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`)
      values.push(input.gender)
    }
    if (input.weight !== undefined) {
      updates.push(`weight = $${paramIndex++}`)
      values.push(input.weight)
    }
    if (input.height !== undefined) {
      updates.push(`height = $${paramIndex++}`)
      values.push(input.height)
    }
    if (input.activity_level !== undefined) {
      updates.push(`activity_level = $${paramIndex++}`)
      values.push(input.activity_level)
    }
    if (input.goal !== undefined) {
      updates.push(`goal = $${paramIndex++}`)
      values.push(input.goal)
    }
    if (input.allergies !== undefined) {
      updates.push(`allergies = $${paramIndex++}`)
      values.push(JSON.stringify(input.allergies))
    }
    if (input.diseases !== undefined) {
      updates.push(`diseases = $${paramIndex++}`)
      values.push(JSON.stringify(input.diseases))
    }
    if (input.medications !== undefined) {
      updates.push(`medications = $${paramIndex++}`)
      values.push(JSON.stringify(input.medications))
    }

    if (updates.length === 0) {
      return existing
    }

    values.push(userId)
    const result = await this.pool.query(
      `UPDATE health_profiles
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    )

    return this.mapRowToHealthProfile(result.rows[0])
  }

  private mapRowToHealthProfile(row: any): HealthProfile {
    return {
      ...row,
      allergies: Array.isArray(row.allergies) ? row.allergies : JSON.parse(row.allergies || '[]'),
      diseases: Array.isArray(row.diseases) ? row.diseases : JSON.parse(row.diseases || '[]'),
      medications: Array.isArray(row.medications) ? row.medications : JSON.parse(row.medications || '[]'),
    }
  }
}

