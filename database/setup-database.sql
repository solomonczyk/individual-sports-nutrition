-- Setup script for Individual Sports Nutrition Database
-- Run this with: psql -U postgres -f setup-database.sql

-- Create database
DROP DATABASE IF EXISTS nutrition_db;
CREATE DATABASE nutrition_db;

-- Connect to the database
\c nutrition_db

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Success message
SELECT 'Database nutrition_db created successfully!' as status;
