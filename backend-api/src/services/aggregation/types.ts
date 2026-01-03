/**
 * Aggregation System Types
 * Типы для системы агрегации данных о продуктах из партнёрских магазинов
 */

export interface PartnerConfig {
  id: string;
  name: string;
  slug: string;
  type: 'api' | 'feed' | 'scraper';
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  updateInterval: number; // hours between updates
  enabled: boolean;
}

export interface PartnerProductData {
  externalId: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  originalPrice?: number;
  inStock: boolean;
  stockQuantity?: number;
  url: string;
  imageUrl?: string;
  sku?: string;
  ean?: string;
  description?: string;
  category?: string;
  weight?: number;
  servings?: number;
}

export interface ProductMatch {
  partnerProduct: PartnerProductData;
  matchedProductId?: string;
  matchConfidence: number; // 0-1
  matchMethod: 'sku' | 'ean' | 'name_brand' | 'fuzzy' | 'new';
  requiresModeration: boolean;
}

export interface AggregationResult {
  partnerId: string;
  timestamp: Date;
  productsProcessed: number;
  productsMatched: number;
  productsNew: number;
  pricesUpdated: number;
  errors: number;
  durationMs: number;
}

export interface AggregationJob {
  id: string;
  partnerId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: AggregationResult;
  error?: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  storeId: string;
  packageId?: string;
  price: number;
  discountPrice?: number;
  recordedAt: Date;
}
