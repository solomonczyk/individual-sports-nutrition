import { Pool } from 'pg'
import { Store, ProductPrice, ProductPackage } from '../models/store'
import { pool } from '../config/database'

export class StoreRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findById(id: string): Promise<Store | null> {
    const result = await this.pool.query('SELECT * FROM stores WHERE id = $1', [id])
    return result.rows[0] || null
  }

  async findAll(activeOnly = true): Promise<Store[]> {
    let query = 'SELECT * FROM stores'
    if (activeOnly) {
      query += ' WHERE active = true'
    }
    query += ' ORDER BY name'
    const result = await this.pool.query(query)
    return result.rows
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const result = await this.pool.query('SELECT * FROM stores WHERE slug = $1', [slug])
    return result.rows[0] || null
  }
}

export class ProductPriceRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByProductId(productId: string, inStockOnly = true): Promise<ProductPrice[]> {
    let query = `
      SELECT pp.* FROM product_prices pp
      WHERE pp.product_id = $1
    `
    const params: unknown[] = [productId]
    
    if (inStockOnly) {
      query += ' AND pp.in_stock = true'
    }
    
    query += ' ORDER BY pp.price ASC'
    
    const result = await this.pool.query(query, params)
    return result.rows
  }

  async findByProductAndStore(
    productId: string,
    storeId: string
  ): Promise<ProductPrice | null> {
    const result = await this.pool.query(
      'SELECT * FROM product_prices WHERE product_id = $1 AND store_id = $2',
      [productId, storeId]
    )
    return result.rows[0] || null
  }

  async findBestPrice(productId: string): Promise<ProductPrice | null> {
    const result = await this.pool.query(
      `SELECT * FROM product_prices 
       WHERE product_id = $1 AND in_stock = true 
       ORDER BY COALESCE(discount_price, price) ASC 
       LIMIT 1`,
      [productId]
    )
    return result.rows[0] || null
  }

  async findByProductPackage(
    productId: string,
    packageId: string | null
  ): Promise<ProductPrice[]> {
    let query = 'SELECT * FROM product_prices WHERE product_id = $1 AND in_stock = true'
    const params: unknown[] = [productId]
    
    if (packageId) {
      query += ' AND (package_id = $2 OR package_id IS NULL)'
      params.push(packageId)
    }
    
    query += ' ORDER BY COALESCE(discount_price, price) ASC'
    
    const result = await this.pool.query(query, params)
    return result.rows
  }

  async getPriceComparison(
    productId: string,
    packageId: string | null = null
  ): Promise<Array<ProductPrice & { store: Store }>> {
    let query = `
      SELECT pp.*, 
             json_build_object(
               'id', s.id,
               'name', s.name,
               'slug', s.slug,
               'website_url', s.website_url,
               'logo_url', s.logo_url,
               'verified', s.verified,
               'delivery_available', s.delivery_available,
               'delivery_fee', s.delivery_fee,
               'min_order_amount', s.min_order_amount
             ) as store
      FROM product_prices pp
      INNER JOIN stores s ON pp.store_id = s.id
      WHERE pp.product_id = $1 AND pp.in_stock = true AND s.active = true
    `
    const params: unknown[] = [productId]

    if (packageId) {
      query += ' AND (pp.package_id = $2 OR pp.package_id IS NULL)'
      params.push(packageId)
    }

    query += ' ORDER BY COALESCE(pp.discount_price, pp.price) ASC'

    const result = await this.pool.query(query, params)
    return result.rows.map((row) => ({
      ...row,
      store: typeof row.store === 'string' ? JSON.parse(row.store) : row.store,
    }))
  }
}

export class ProductPackageRepository {
  private pool: Pool

  constructor() {
    this.pool = pool
  }

  async findByProductId(productId: string): Promise<ProductPackage[]> {
    const result = await this.pool.query(
      'SELECT * FROM product_packages WHERE product_id = $1 ORDER BY weight_grams DESC',
      [productId]
    )
    return result.rows
  }

  async findById(id: string): Promise<ProductPackage | null> {
    const result = await this.pool.query('SELECT * FROM product_packages WHERE id = $1', [id])
    return result.rows[0] || null
  }
}

