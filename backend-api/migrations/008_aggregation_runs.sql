-- Migration: Add aggregation_runs table for tracking aggregation jobs
-- Created: 2026-01-03

CREATE TABLE IF NOT EXISTS aggregation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  products_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('running', 'success', 'error', 'cancelled'))
);

CREATE INDEX idx_aggregation_runs_status ON aggregation_runs(status);
CREATE INDEX idx_aggregation_runs_updated_at ON aggregation_runs(updated_at DESC);

-- Add last_login column to users table for dashboard stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Add status column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE products ADD CONSTRAINT valid_product_status CHECK (status IN ('active', 'pending', 'inactive'));

-- Add status column to stores if not exists
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE stores ADD CONSTRAINT valid_store_status CHECK (status IN ('active', 'inactive'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;

-- Add verified column to brands if not exists
ALTER TABLE brands ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
