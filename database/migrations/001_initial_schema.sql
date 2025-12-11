-- Migration: Initial Database Schema
-- Created: 2025-12-11
-- Description: Creates all tables for Individual Sports Nutrition application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_language AS ENUM ('sr', 'hu', 'ro', 'en', 'ru', 'ua');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE activity_level_type AS ENUM ('low', 'moderate', 'high', 'very_high');
CREATE TYPE goal_type AS ENUM ('mass', 'cut', 'maintain', 'endurance');
CREATE TYPE product_type AS ENUM ('protein', 'creatine', 'amino', 'vitamin', 'pre_workout', 'post_workout', 'fat_burner', 'other');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
CREATE TYPE severity_type AS ENUM ('low', 'medium', 'high');

-- 1. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_language user_language DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Health Profiles table
CREATE TABLE health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender gender_type,
    weight DECIMAL(5,2), -- в кг
    height DECIMAL(5,2), -- в см
    activity_level activity_level_type,
    goal goal_type,
    allergies JSONB DEFAULT '[]'::jsonb,
    diseases JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);

-- 3. Brands table
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    origin_country VARCHAR(3), -- ISO код страны
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_brands_name ON brands(name);

-- 4. Translations table (должна быть создана первой для foreign keys)
CREATE TABLE translations (
    key VARCHAR(255),
    language user_language,
    text TEXT NOT NULL,
    PRIMARY KEY (key, language)
);

CREATE INDEX idx_translations_key_language ON translations(key, language);

-- 5. Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_key VARCHAR(255) NOT NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    type product_type NOT NULL,
    macros JSONB DEFAULT '{"protein": 0, "carbs": 0, "fats": 0, "calories": 0}'::jsonb,
    serving_size VARCHAR(100),
    price DECIMAL(10,2), -- цена в RSD
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_available ON products(available);

-- 6. Contraindications table
CREATE TABLE contraindications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_key VARCHAR(255) NOT NULL,
    description_key VARCHAR(255),
    severity severity_type DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Product Contraindications (связующая таблица)
CREATE TABLE product_contraindications (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    contraindication_id UUID REFERENCES contraindications(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, contraindication_id)
);

-- 8. Recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_key VARCHAR(255) NOT NULL,
    ingredients JSONB DEFAULT '{}'::jsonb, -- {product_id: quantity, ...}
    macros JSONB DEFAULT '{"protein": 0, "carbs": 0, "fats": 0, "calories": 0}'::jsonb,
    instructions_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Nutrition Plans table
CREATE TABLE nutrition_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calories INTEGER,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fats DECIMAL(6,2),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nutrition_plans_user_id ON nutrition_plans(user_id);
CREATE INDEX idx_nutrition_plans_active ON nutrition_plans(active);

-- 10. Plan Products (связующая таблица)
CREATE TABLE plan_products (
    plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    dosage VARCHAR(255),
    frequency VARCHAR(100),
    timing VARCHAR(50), -- morning, pre_workout, post_workout, evening
    PRIMARY KEY (plan_id, product_id)
);

-- 11. Plan Recipes (связующая таблица)
CREATE TABLE plan_recipes (
    plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    meal_type meal_type NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    PRIMARY KEY (plan_id, recipe_id, meal_type, day_of_week)
);

-- 12. User Progress table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL(5,2),
    body_fat DECIMAL(5,2),
    activity_data JSONB DEFAULT '{}'::jsonb,
    consumed_products JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_progress_user_id_date ON user_progress(user_id, date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contraindications_updated_at BEFORE UPDATE ON contraindications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_plans_updated_at BEFORE UPDATE ON nutrition_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

