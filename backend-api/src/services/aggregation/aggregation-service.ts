/**
 * Aggregation Service
 * Основной сервис для агрегации данных о продуктах из партнёрских магазинов
 */

import { Pool } from 'pg';
import { pool } from '../../config/database';
import { ProductMatcher } from './product-matcher';
import { 
  PartnerConfig, 
  PartnerProductData, 
  ProductMatch, 
  AggregationResult,
  AggregationJob as _AggregationJob 
} from './types';
import { logger } from '../../utils/logger';

export class AggregationService {
  private pool: Pool;
  private matcher: ProductMatcher;

  constructor() {
    this.pool = pool;
    this.matcher = new ProductMatcher();
  }

  /**
   * Запустить агрегацию для партнёра
   */
  async runAggregation(partnerId: string): Promise<AggregationResult> {
    const startTime = Date.now();
    const result: AggregationResult = {
      partnerId,
      timestamp: new Date(),
      productsProcessed: 0,
      productsMatched: 0,
      productsNew: 0,
      pricesUpdated: 0,
      errors: 0,
      durationMs: 0,
    };

    try {
      // 1. Получить конфигурацию партнёра
      const partner = await this.getPartnerConfig(partnerId);
      if (!partner || !partner.enabled) {
        throw new Error(`Partner ${partnerId} not found or disabled`);
      }

      // 2. Получить данные от партнёра
      const products = await this.fetchPartnerData(partner);
      result.productsProcessed = products.length;

      // 3. Сопоставить продукты
      const matches = await this.matcher.matchProducts(products);

      // 4. Обновить базу данных
      for (const match of matches) {
        try {
          if (match.matchedProductId) {
            await this.updatePrice(partnerId, match);
            result.pricesUpdated++;
            result.productsMatched++;
          } else {
            await this.createPendingProduct(partnerId, match);
            result.productsNew++;
          }
        } catch (error) {
          logger.error(`Error processing match:`, error);
          result.errors++;
        }
      }

      result.durationMs = Date.now() - startTime;
      await this.saveAggregationResult(result);
      
      logger.info(`Aggregation completed for ${partner.name}:`, result);
      return result;

    } catch (error) {
      result.errors++;
      result.durationMs = Date.now() - startTime;
      logger.error(`Aggregation failed for partner ${partnerId}:`, error);
      throw error;
    }
  }

  /**
   * Получить конфигурацию партнёра
   */
  private async getPartnerConfig(partnerId: string): Promise<PartnerConfig | null> {
    const result = await this.pool.query(
      `SELECT id, name, slug, integration_type as type, api_url as "baseUrl", 
              api_key as "apiKey", rate_limit as "rateLimit", 
              update_interval_hours as "updateInterval", active as enabled
       FROM stores WHERE id = $1`,
      [partnerId]
    );
    return result.rows[0] || null;
  }

  /**
   * Получить данные от партнёра (заглушка - реализация зависит от типа интеграции)
   */
  private async fetchPartnerData(partner: PartnerConfig): Promise<PartnerProductData[]> {
    // TODO: Реализовать для каждого типа интеграции
    switch (partner.type) {
      case 'api':
        return this.fetchFromApi(partner);
      case 'feed':
        return this.fetchFromFeed(partner);
      case 'scraper':
        return this.fetchViaScraper(partner);
      default:
        return [];
    }
  }

  private async fetchFromApi(partner: PartnerConfig): Promise<PartnerProductData[]> {
    // Placeholder - implement actual API integration
    logger.info(`Fetching from API: ${partner.baseUrl}`);
    return [];
  }

  private async fetchFromFeed(partner: PartnerConfig): Promise<PartnerProductData[]> {
    // Placeholder - implement XML/JSON feed parsing
    logger.info(`Fetching from feed: ${partner.baseUrl}`);
    return [];
  }

  private async fetchViaScraper(partner: PartnerConfig): Promise<PartnerProductData[]> {
    // Placeholder - implement web scraping
    logger.info(`Scraping: ${partner.baseUrl}`);
    return [];
  }

  /**
   * Обновить цену продукта
   */
  private async updatePrice(storeId: string, match: ProductMatch): Promise<void> {
    const { partnerProduct, matchedProductId } = match;
    
    // Сохранить историю цен
    await this.pool.query(
      `INSERT INTO price_history (product_id, store_id, price, discount_price, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [matchedProductId, storeId, partnerProduct.price, partnerProduct.originalPrice]
    );

    // Обновить текущую цену
    await this.pool.query(
      `INSERT INTO product_prices (product_id, store_id, price, discount_price, in_stock, last_checked_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (product_id, store_id, COALESCE(package_id, '00000000-0000-0000-0000-000000000000'))
       DO UPDATE SET 
         price = EXCLUDED.price,
         discount_price = EXCLUDED.discount_price,
         in_stock = EXCLUDED.in_stock,
         last_checked_at = NOW()`,
      [matchedProductId, storeId, partnerProduct.price, partnerProduct.originalPrice, partnerProduct.inStock]
    );
  }

  /**
   * Создать продукт, требующий модерации
   */
  private async createPendingProduct(storeId: string, match: ProductMatch): Promise<void> {
    const { partnerProduct } = match;
    
    await this.pool.query(
      `INSERT INTO pending_products (store_id, external_id, name, brand, price, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (store_id, external_id) DO UPDATE SET
         name = EXCLUDED.name,
         price = EXCLUDED.price,
         data = EXCLUDED.data`,
      [storeId, partnerProduct.externalId, partnerProduct.name, partnerProduct.brand, 
       partnerProduct.price, JSON.stringify(partnerProduct)]
    );
  }

  /**
   * Сохранить результат агрегации
   */
  private async saveAggregationResult(result: AggregationResult): Promise<void> {
    await this.pool.query(
      `INSERT INTO aggregation_logs (store_id, products_processed, products_matched, 
       products_new, prices_updated, errors, duration_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [result.partnerId, result.productsProcessed, result.productsMatched,
       result.productsNew, result.pricesUpdated, result.errors, result.durationMs]
    );
  }

  /**
   * Получить статус последней агрегации
   */
  async getLastAggregationStatus(partnerId: string): Promise<AggregationResult | null> {
    const result = await this.pool.query(
      `SELECT store_id as "partnerId", products_processed as "productsProcessed",
              products_matched as "productsMatched", products_new as "productsNew",
              prices_updated as "pricesUpdated", errors, duration_ms as "durationMs",
              created_at as timestamp
       FROM aggregation_logs WHERE store_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [partnerId]
    );
    return result.rows[0] || null;
  }
}
