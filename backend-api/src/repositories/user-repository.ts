import { Pool } from 'pg'
import { User, CreateUserInput } from '../models/user'
import { pool } from '../config/database'

export class UserRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    return result.rows[0] || null
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  async create(input: CreateUserInput & { password_hash: string }): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, preferred_language)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        input.email,
        input.password_hash,
        input.preferred_language || 'en',
      ]
    )
    return result.rows[0]
  }

  async updateLanguage(userId: string, language: string): Promise<User> {
    const result = await this.pool.query(
      `UPDATE users SET preferred_language = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [language, userId]
    )
    return result.rows[0]
  }
}

