import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AdminController {
  // Dashboard stats
  async getDashboardStats(_req: Request, res: Response) {
    try {
      // Простая статистика без сложных запросов
      const stats = {
        users: {
          total: 0,
          active: 0,
          new: 0
        },
        products: {
          total: 0,
          pending: 0
        },
        stores: {
          total: 0,
          active: 0
        },
        aggregation: {
          lastRun: '',
          status: 'unknown' as const,
          productsUpdated: 0
        }
      }

      // Попробуем получить базовую статистику, если таблицы существуют
      try {
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users')
        stats.users.total = parseInt(usersResult.rows[0]?.total || '0')
      } catch (error) {
        // Таблица users не существует или недоступна
        console.log('Users table not available')
      }

      try {
        const productsResult = await pool.query('SELECT COUNT(*) as total FROM products')
        stats.products.total = parseInt(productsResult.rows[0]?.total || '0')
      } catch (error) {
        // Таблица products не существует или недоступна
        console.log('Products table not available')
      }

      try {
        const storesResult = await pool.query('SELECT COUNT(*) as total FROM stores')
        stats.stores.total = parseInt(storesResult.rows[0]?.total || '0')
      } catch (error) {
        // Таблица stores не существует или недоступна
        console.log('Stores table not available')
      }

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Dashboard stats error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats',
        message: 'Database connection or query error'
      })
    }
  }

  // Get all products
  async getProducts(_req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          name_key as name, 
          brand_id, 
          type, 
          status,
          created_at,
          updated_at
        FROM products 
        ORDER BY created_at DESC 
        LIMIT 100
      `)

      res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching products:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products'
      })
    }
  }

  // Get product by ID
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [id])
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        })
      }

      res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product'
      })
    }
  }

  // Update product
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, status } = req.body

      const result = await pool.query(
        'UPDATE products SET name_key = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [name, status, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        })
      }

      res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error updating product:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update product'
      })
    }
  }

  // Get all stores
  async getStores(_req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          name, 
          url, 
          status,
          created_at,
          updated_at
        FROM stores 
        ORDER BY name ASC
      `)

      res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching stores:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stores'
      })
    }
  }

  // Update store
  async updateStore(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, url, status } = req.body

      const result = await pool.query(
        'UPDATE stores SET name = $1, url = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, url, status, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        })
      }

      res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error updating store:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update store'
      })
    }
  }

  // Get all brands
  async getBrands(_req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          id, 
          name, 
          is_local,
          is_verified,
          created_at,
          updated_at
        FROM brands 
        ORDER BY name ASC
      `)

      res.json({
        success: true,
        data: result.rows
      })
    } catch (error) {
      console.error('Error fetching brands:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch brands'
      })
    }
  }

  // Update brand
  async updateBrand(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, is_local, is_verified } = req.body

      const result = await pool.query(
        'UPDATE brands SET name = $1, is_local = $2, is_verified = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, is_local, is_verified, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Brand not found'
        })
      }

      res.json({
        success: true,
        data: result.rows[0]
      })
    } catch (error) {
      console.error('Error updating brand:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update brand'
      })
    }
  }
}