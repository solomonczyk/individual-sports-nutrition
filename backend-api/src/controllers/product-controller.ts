import { Request, Response, NextFunction } from 'express'
import { ProductService } from '../services/product-service'
import { ApiError } from '../middlewares/error-handler'

export class ProductController {
  private service: ProductService

  constructor() {
    this.service = new ProductService()
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const product = await this.service.getById(id)

      if (!product) {
        const error: ApiError = new Error('Product not found')
        error.statusCode = 404
        error.code = 'PRODUCT_NOT_FOUND'
        throw error
      }

      res.json({
        success: true,
        data: product,
      })
    } catch (error) {
      next(error)
    }
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined
      const brand_id = req.query.brand_id as string | undefined
      const available = req.query.available !== undefined ? req.query.available === 'true' : undefined
      const limit = parseInt(req.query.limit as string, 10) || 50
      const offset = parseInt(req.query.offset as string, 10) || 0

      const result = await this.service.getList({ type, brand_id, available } as any, limit, offset)

      res.json({
        success: true,
        data: result.products,
        meta: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  async getByType(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params
      const products = await this.service.getByType(type as any)

      res.json({
        success: true,
        data: products,
      })
    } catch (error) {
      next(error)
    }
  }

  async getContraindications(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const contraindications = await this.service.getProductContraindications(id)

      res.json({
        success: true,
        data: contraindications,
      })
    } catch (error) {
      next(error)
    }
  }
}

export class BrandController {
  private service: ProductService

  constructor() {
    this.service = new ProductService()
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const brand = await this.service.getBrandById(id)

      if (!brand) {
        const error: ApiError = new Error('Brand not found')
        error.statusCode = 404
        error.code = 'BRAND_NOT_FOUND'
        throw error
      }

      res.json({
        success: true,
        data: brand,
      })
    } catch (error) {
      next(error)
    }
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const verified = req.query.verified === 'true'
      const brands = verified
        ? await this.service.getVerifiedBrands()
        : await this.service.getBrands()

      res.json({
        success: true,
        data: brands,
      })
    } catch (error) {
      next(error)
    }
  }
}

