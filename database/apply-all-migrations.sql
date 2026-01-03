-- Apply all migrations in order
-- Run this with: psql -U postgres -d nutrition_db -f apply-all-migrations.sql

\echo 'Starting migrations...'

-- Migration 001: Initial Schema
\echo 'Applying migration 001: Initial Schema...'
\i migrations/001_initial_schema.sql

-- Migration 002: Health Profiles
\echo 'Applying migration 002: Health Profiles...'
\i migrations/002_health_profiles.sql

-- Migration 003: Products
\echo 'Applying migration 003: Products...'
\i migrations/003_products.sql

-- Migration 004: Recommendations
\echo 'Applying migration 004: Recommendations...'
\i migrations/004_recommendations.sql

-- Migration 005: Progress Tracking
\echo 'Applying migration 005: Progress Tracking...'
\i migrations/005_progress_tracking.sql

-- Migration 006: Localization
\echo 'Applying migration 006: Localization...'
\i migrations/006_localization.sql

\echo 'All migrations completed successfully!'
