import { Pool } from 'pg'
import { Product, Brand } from '../models/product'
import { pool } from '../config/database'

export interface ProductFilters {
  type?: Product['type']
  brand_id?: string
  available?: boolean
  search?: string
}

export class ProductRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )
    return result.rows[0] ? this.mapRowToProduct(result.rows[0]) : null
  }

  async findAll(filters: ProductFilters = {}, limit = 50, offset = 0): Promise<Product[]> {
    let query = 'SELECT * FROM products WHERE 1=1'
    const params: unknown[] = []
    let paramIndex = 1

    if (filters.type) {
      query += ` AND type = $${paramIndex++}`
      params.push(filters.type)
    }

    if (filters.brand_id) {
      query += ` AND brand_id = $${paramIndex++}`
      params.push(filters.brand_id)
    }

    if (filters.available !== undefined) {
      query += ` AND available = $${paramIndex++}`
      params.push(filters.available)
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`
    params.push(limit, offset)

    const result = await this.pool.query(query, params)
    return result.rows.map((row) => this.mapRowToProduct(row))
  }

  async count(filters: ProductFilters = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM products WHERE 1=1'
    const params: unknown[] = []
    let paramIndex = 1

    if (filters.type) {
      query += ` AND type = $${paramIndex++}`
      params.push(filters.type)
    }

    if (filters.brand_id) {
      query += ` AND brand_id = $${paramIndex++}`
      params.push(filters.brand_id)
    }

    if (filters.available !== undefined) {
      query += ` AND available = $${paramIndex++}`
      params.push(filters.available)
    }

    const result = await this.pool.query(query, params)
    return parseInt(result.rows[0].count, 10)
  }

  async findByType(type: Product['type']): Promise<Product[]> {
    const result = await this.pool.query(
      'SELECT * FROM products WHERE type = $1 AND available = true ORDER BY created_at DESC',
      [type]
    )
    return result.rows.map((row) => this.mapRowToProduct(row))
  }

  private mapRowToProduct(row: any): Product {
    return {
      ...row,
      macros: typeof row.macros === 'string' ? JSON.parse(row.macros) : row.macros,
    }
  }
}

export class BrandRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Brand | null> {
    const result = await this.pool.query(
      'SELECT * FROM brands WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  async findAll(limit = 100, offset = 0): Promise<Brand[]> {
    const result = await this.pool.query(
      'SELECT * FROM brands ORDER BY name LIMIT $1 OFFSET $2',
      [limit, offset]
    )
    return result.rows
  }

  async findVerified(): Promise<Brand[]> {
    const result = await this.pool.query(
      'SELECT * FROM brands WHERE verified = true ORDER BY name'
    )
    return result.rows
  }
}

