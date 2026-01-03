import { Request, Response } from 'express';
import { pool } from '../config/database';

export class AdminController {
  // Dashboard stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const [usersResult, productsResult, storesResult, aggregationResult] = await Promise.all([
        pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new
          FROM users
        `),
        pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending
          FROM products
        `),
        pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'active') as active
          FROM stores
        `),
        pool.query(`
          SELECT 
            status,
            updated_at as last_run,
            products_updated
          FROM aggregation_runs
          ORDER BY updated_at DESC
          LIMIT 1
        `)
      ]);

      const stats = {
        users: {
          total: parseInt(usersResult.rows[0]?.total || '0'),
          active: parseInt(usersResult.rows[0]?.active || '0'),
          new: parseInt(usersResult.rows[0]?.new || '0'),
        },
        products: {
          total: parseInt(productsResult.rows[0]?.total || '0'),
          pending: parseInt(productsResult.rows[0]?.pending || '0'),
        },
        stores: {
          total: parseInt(storesResult.rows[0]?.total || '0'),
          active: parseInt(storesResult.rows[0]?.active || '0'),
        },
        aggregation: {
          status: aggregationResult.rows[0]?.status || 'unknown',
          lastRun: aggregationResult.rows[0]?.last_run || null,
          productsUpdated: parseInt(aggregationResult.rows[0]?.products_updated || '0'),
        },
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  // Products
  async getProducts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search = '', status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT 
          p.id,
          p.name,
          b.name as brand,
          pt.name as type,
          COALESCE(MIN(pp.price), 0) as price_min,
          COALESCE(MAX(pp.price), 0) as price_max,
          p.status,
          p.created_at
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_types pt ON p.type_id = pt.id
        LEFT JOIN product_prices pp ON p.id = pp.product_id
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (p.name ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (status) {
        query += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` GROUP BY p.id, b.name, pt.name`;
      query += ` ORDER BY p.created_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(Number(limit), offset);

      const [productsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(`SELECT COUNT(*) FROM products WHERE 1=1 ${search ? 'AND name ILIKE $1' : ''}`, search ? [`%${search}%`] : [])
      ]);

      res.json({
        products: productsResult.rows,
        total: parseInt(countResult.rows[0].count),
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(`
        SELECT 
          p.*,
          b.name as brand,
          pt.name as type
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_types pt ON p.type_id = pt.id
        WHERE p.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  // Stores
  async getStores(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          s.id,
          s.name,
          s.url,
          s.status,
          s.last_sync,
          COUNT(pp.id) as products_count
        FROM stores s
        LEFT JOIN product_prices pp ON s.id = pp.store_id
        GROUP BY s.id
        ORDER BY s.name
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching stores:', error);
      res.status(500).json({ error: 'Failed to fetch stores' });
    }
  }

  async syncStore(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Trigger aggregation for specific store
      // This would call the aggregation service
      await pool.query(`
        UPDATE stores 
        SET last_sync = NOW() 
        WHERE id = $1
      `, [id]);

      res.json({ message: 'Sync initiated' });
    } catch (error) {
      console.error('Error syncing store:', error);
      res.status(500).json({ error: 'Failed to sync store' });
    }
  }

  // Brands
  async getBrands(req: Request, res: Response) {
    try {
      const result = await pool.query(`
        SELECT 
          b.id,
          b.name,
          b.verified,
          COUNT(p.id) as products_count
        FROM brands b
        LEFT JOIN products p ON b.id = p.brand_id
        GROUP BY b.id
        ORDER BY b.name
      `);

      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching brands:', error);
      res.status(500).json({ error: 'Failed to fetch brands' });
    }
  }

  async createBrand(req: Request, res: Response) {
    try {
      const { name, verified = false } = req.body;

      const result = await pool.query(`
        INSERT INTO brands (name, verified)
        VALUES ($1, $2)
        RETURNING *
      `, [name, verified]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating brand:', error);
      res.status(500).json({ error: 'Failed to create brand' });
    }
  }

  async updateBrand(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, verified } = req.body;

      const result = await pool.query(`
        UPDATE brands
        SET name = COALESCE($1, name),
            verified = COALESCE($2, verified),
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [name, verified, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Brand not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating brand:', error);
      res.status(500).json({ error: 'Failed to update brand' });
    }
  }
}
