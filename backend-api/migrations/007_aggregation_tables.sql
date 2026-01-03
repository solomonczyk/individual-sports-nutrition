-- Migration: Aggregation System Tables
-- Description: Tables for product aggregation from partner stores

-- Price History Table
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    package_id UUID REFERENCES product_packages(id) ON DELETE SET NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_price DECIMAL(10, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_store ON price_history(store_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at);

-- Pending Products (requires moderation)
CREATE TABLE IF NOT EXISTS pending_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255),
    price DECIMAL(10, 2),
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    matched_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, external_id)
);

CREATE INDEX idx_pending_products_status ON pending_products(status);
CREATE INDEX idx_pending_products_store ON pending_products(store_id);

-- Aggregation Logs
CREATE TABLE IF NOT EXISTS aggregation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    products_processed INTEGER DEFAULT 0,
    products_matched INTEGER DEFAULT 0,
    products_new INTEGER DEFAULT 0,
    prices_updated INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aggregation_logs_store ON aggregation_logs(store_id);
CREATE INDEX idx_aggregation_logs_created ON aggregation_logs(created_at);

-- Add integration fields to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS integration_type VARCHAR(50) DEFAULT 'manual';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS api_url VARCHAR(500);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 60;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS update_interval_hours INTEGER DEFAULT 24;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Enable pg_trgm extension for fuzzy matching (if not exists)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN index for fuzzy search on translations
CREATE INDEX IF NOT EXISTS idx_translations_text_trgm ON translations USING GIN (text gin_trgm_ops);
