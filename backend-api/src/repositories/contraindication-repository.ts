import { Pool } from 'pg'
import { pool } from '../config/database'

export interface Contraindication {
  id: string
  name_key: string
  description_key: string
  severity: 'low' | 'medium' | 'high'
  created_at: Date
  updated_at: Date
}

export class ContraindicationRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Contraindication | null> {
    const result = await this.pool.query(
      'SELECT * FROM contraindications WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  async findAll(): Promise<Contraindication[]> {
    const result = await this.pool.query(
      'SELECT * FROM contraindications ORDER BY severity DESC, name_key'
    )
    return result.rows
  }

  async findByProductId(productId: string): Promise<Contraindication[]> {
    const result = await this.pool.query(
      `SELECT c.* FROM contraindications c
       INNER JOIN product_contraindications pc ON c.id = pc.contraindication_id
       WHERE pc.product_id = $1
       ORDER BY c.severity DESC`,
      [productId]
    )
    return result.rows
  }

  async findByDiseaseName(diseaseName: string): Promise<Contraindication[]> {
    // Поиск по ключам переводов (упрощенная версия)
    const result = await this.pool.query(
      `SELECT DISTINCT c.* FROM contraindications c
       INNER JOIN translations t ON c.name_key = t.key
       WHERE LOWER(t.text) LIKE LOWER($1)
       ORDER BY c.severity DESC`,
      [`%${diseaseName}%`]
    )
    return result.rows
  }

  async addProductContraindication(productId: string, contraindicationId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO product_contraindications (product_id, contraindication_id)
       VALUES ($1, $2)
       ON CONFLICT (product_id, contraindication_id) DO NOTHING`,
      [productId, contraindicationId]
    )
  }

  async removeProductContraindication(productId: string, contraindicationId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM product_contraindications WHERE product_id = $1 AND contraindication_id = $2',
      [productId, contraindicationId]
    )
  }
}

