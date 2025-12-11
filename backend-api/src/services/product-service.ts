import { ProductRepository, BrandRepository } from '../repositories/product-repository'
import { Product, Brand, ProductWithTranslation } from '../models/product'
import { ProductFilters } from '../repositories/product-repository'
import { ContraindicationRepository } from '../repositories/contraindication-repository'

export interface ProductListResponse {
  products: ProductWithTranslation[]
  total: number
  limit: number
  offset: number
}

export class ProductService {
  private productRepository: ProductRepository
  private brandRepository: BrandRepository
  private contraindicationRepository: ContraindicationRepository

  constructor() {
    this.productRepository = new ProductRepository()
    this.brandRepository = new BrandRepository()
    this.contraindicationRepository = new ContraindicationRepository()
  }

  async getById(id: string): Promise<ProductWithTranslation | null> {
    const product = await this.productRepository.findById(id)
    if (!product) {
      return null
    }

    return await this.enrichProductWithTranslations(product)
  }

  async getList(
    filters: ProductFilters = {},
    limit = 50,
    offset = 0
  ): Promise<ProductListResponse> {
    const [products, total] = await Promise.all([
      this.productRepository.findAll(filters, limit, offset),
      this.productRepository.count(filters),
    ])

    const enrichedProducts = await Promise.all(
      products.map((p) => this.enrichProductWithTranslations(p))
    )

    return {
      products: enrichedProducts,
      total,
      limit,
      offset,
    }
  }

  async getByType(type: Product['type']): Promise<ProductWithTranslation[]> {
    const products = await this.productRepository.findByType(type)
    return Promise.all(products.map((p) => this.enrichProductWithTranslations(p)))
  }

  async getBrands(): Promise<Brand[]> {
    return await this.brandRepository.findAll()
  }

  async getVerifiedBrands(): Promise<Brand[]> {
    return await this.brandRepository.findVerified()
  }

  async getBrandById(id: string): Promise<Brand | null> {
    return await this.brandRepository.findById(id)
  }

  private async enrichProductWithTranslations(product: Product): Promise<ProductWithTranslation> {
    // Получаем переводы (по умолчанию английский)
    // В реальной реализации здесь будет запрос к таблице translations
    const enriched: ProductWithTranslation = {
      ...product,
      name: product.name_key, // Временно используем ключ как имя
    }

    if (product.brand_id) {
      const brand = await this.brandRepository.findById(product.brand_id)
      if (brand) {
        enriched.brand = brand
      }
    }

    return enriched
  }

  async getProductContraindications(productId: string) {
    return await this.contraindicationRepository.findByProductId(productId)
  }
}

