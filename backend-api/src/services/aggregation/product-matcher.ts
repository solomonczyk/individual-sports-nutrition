/**
 * Product Matcher Service
 * Сопоставление продуктов из партнёрских магазинов с внутренней базой
 */

import { Pool } from 'pg';
import { pool } from '../../config/database';
import { PartnerProductData, ProductMatch } from './types';
import { logger } from '../../utils/logger';

export class ProductMatcher {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * Сопоставить продукт партнёра с внутренней базой
   */
  async matchProduct(partnerProduct: PartnerProductData): Promise<ProductMatch> {
    // 1. Попробовать точное совпадение по SKU/EAN
    if (partnerProduct.sku || partnerProduct.ean) {
      const skuMatch = await this.matchBySku(partnerProduct);
      if (skuMatch) return skuMatch;
    }

    // 2. Попробовать совпадение по названию + бренду
    const nameMatch = await this.matchByNameAndBrand(partnerProduct);
    if (nameMatch && nameMatch.matchConfidence >= 0.9) {
      return nameMatch;
    }

    // 3. Fuzzy matching для неточных совпадений
    const fuzzyMatch = await this.fuzzyMatch(partnerProduct);
    if (fuzzyMatch && fuzzyMatch.matchConfidence >= 0.7) {
      return fuzzyMatch;
    }

    // 4. Новый продукт - требует модерации
    return {
      partnerProduct,
      matchConfidence: 0,
      matchMethod: 'new',
      requiresModeration: true,
    };
  }

  private async matchBySku(product: PartnerProductData): Promise<ProductMatch | null> {
    const query = `
      SELECT p.id FROM products p
      JOIN product_packages pp ON p.id = pp.product_id
      WHERE pp.barcode = $1 OR pp.barcode = $2
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [product.sku, product.ean]);
    
    if (result.rows.length > 0) {
      return {
        partnerProduct: product,
        matchedProductId: result.rows[0].id,
        matchConfidence: 1.0,
        matchMethod: 'sku',
        requiresModeration: false,
      };
    }
    return null;
  }

  private async matchByNameAndBrand(product: PartnerProductData): Promise<ProductMatch | null> {
    const query = `
      SELECT p.id, t.text as name, b.name as brand_name
      FROM products p
      LEFT JOIN translations t ON t.key = p.name_key AND t.language = 'en'
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE LOWER(b.name) = LOWER($1)
      AND (
        LOWER(t.text) = LOWER($2)
        OR LOWER(p.name_key) LIKE LOWER($3)
      )
      LIMIT 1
    `;
    
    const result = await this.pool.query(query, [
      product.brand,
      product.name,
      `%${product.name.split(' ').slice(0, 3).join('%')}%`
    ]);
    
    if (result.rows.length > 0) {
      return {
        partnerProduct: product,
        matchedProductId: result.rows[0].id,
        matchConfidence: 0.95,
        matchMethod: 'name_brand',
        requiresModeration: false,
      };
    }
    return null;
  }

  private async fuzzyMatch(product: PartnerProductData): Promise<ProductMatch | null> {
    // Используем pg_trgm для fuzzy matching
    const query = `
      SELECT p.id, 
             similarity(COALESCE(t.text, p.name_key), $1) as name_sim,
             similarity(COALESCE(b.name, ''), $2) as brand_sim
      FROM products p
      LEFT JOIN translations t ON t.key = p.name_key AND t.language = 'en'
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE similarity(COALESCE(t.text, p.name_key), $1) > 0.3
      ORDER BY (similarity(COALESCE(t.text, p.name_key), $1) + similarity(COALESCE(b.name, ''), $2)) DESC
      LIMIT 1
    `;
    
    try {
      const result = await this.pool.query(query, [product.name, product.brand]);
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        const confidence = (row.name_sim * 0.7 + row.brand_sim * 0.3);
        
        return {
          partnerProduct: product,
          matchedProductId: row.id,
          matchConfidence: confidence,
          matchMethod: 'fuzzy',
          requiresModeration: confidence < 0.85,
        };
      }
    } catch (error) {
      // pg_trgm extension might not be installed
      logger.warn('Fuzzy matching failed, extension might not be installed');
    }
    return null;
  }

  /**
   * Batch match multiple products
   */
  async matchProducts(products: PartnerProductData[]): Promise<ProductMatch[]> {
    const results: ProductMatch[] = [];
    
    for (const product of products) {
      try {
        const match = await this.matchProduct(product);
        results.push(match);
      } catch (error) {
        logger.error(`Error matching product ${product.name}:`, error);
        results.push({
          partnerProduct: product,
          matchConfidence: 0,
          matchMethod: 'new',
          requiresModeration: true,
        });
      }
    }
    
    return results;
  }
}
