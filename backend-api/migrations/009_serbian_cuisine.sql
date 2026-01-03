-- Migration: Add Serbian cuisine integration
-- Created: 2026-01-03

-- Serbian dishes table
CREATE TABLE IF NOT EXISTS serbian_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_sr VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  description TEXT,
  description_sr TEXT,
  description_en TEXT,
  category VARCHAR(50) NOT NULL, -- main, appetizer, dessert, snack
  calories_per_100g DECIMAL(10, 2) NOT NULL,
  protein_per_100g DECIMAL(10, 2) NOT NULL,
  carbs_per_100g DECIMAL(10, 2) NOT NULL,
  fat_per_100g DECIMAL(10, 2) NOT NULL,
  fiber_per_100g DECIMAL(10, 2),
  typical_serving_size INTEGER, -- in grams
  is_popular BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_category CHECK (category IN ('main', 'appetizer', 'dessert', 'snack', 'side'))
);

-- Serbian dish ingredients (for allergen tracking)
CREATE TABLE IF NOT EXISTS serbian_dish_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_id UUID NOT NULL REFERENCES serbian_dishes(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  ingredient_name_sr VARCHAR(255) NOT NULL,
  is_allergen BOOLEAN DEFAULT false,
  allergen_type VARCHAR(50), -- dairy, gluten, nuts, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User food preferences
CREATE TABLE IF NOT EXISTS user_food_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prefers_local_cuisine BOOLEAN DEFAULT true,
  favorite_dishes UUID[] DEFAULT '{}',
  avoided_ingredients TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}', -- vegetarian, vegan, halal, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Local brands priority
ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_local BOOLEAN DEFAULT false;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'RS';

-- Indexes
CREATE INDEX idx_serbian_dishes_category ON serbian_dishes(category);
CREATE INDEX idx_serbian_dishes_popular ON serbian_dishes(is_popular);
CREATE INDEX idx_serbian_dish_ingredients_dish ON serbian_dish_ingredients(dish_id);
CREATE INDEX idx_user_food_preferences_user ON user_food_preferences(user_id);
CREATE INDEX idx_brands_local ON brands(is_local);

-- Insert popular Serbian dishes
INSERT INTO serbian_dishes (name, name_sr, name_en, description_sr, description_en, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, typical_serving_size, is_popular) VALUES
('Ćevapi', 'Ћевапи', 'Cevapi', 'Tradicionalni balkanski roštilj od mlevenog mesa', 'Traditional Balkan grilled minced meat', 'main', 280, 18, 2, 22, 0.5, 200, true),
('Pljeskavica', 'Пљескавица', 'Pljeskavica', 'Velika pljeskavica od mlevenog mesa', 'Large grilled meat patty', 'main', 290, 20, 3, 23, 0.5, 250, true),
('Sarma', 'Сарма', 'Sarma', 'Kiseli kupus punjen mlevenim mesom i pirinčem', 'Cabbage rolls stuffed with meat and rice', 'main', 180, 12, 15, 8, 3, 300, true),
('Burek sa mesom', 'Бурек са месом', 'Burek with meat', 'Pita od kore sa mesom', 'Phyllo pastry with meat filling', 'main', 320, 14, 35, 15, 2, 200, true),
('Burek sa sirom', 'Бурек са сиром', 'Burek with cheese', 'Pita od kore sa sirom', 'Phyllo pastry with cheese filling', 'main', 310, 12, 32, 16, 1.5, 200, true),
('Gibanica', 'Гибаница', 'Gibanica', 'Pita sa sirom i jajima', 'Cheese and egg pie', 'main', 280, 11, 28, 14, 1, 200, true),
('Ajvar', 'Ајвар', 'Ajvar', 'Namaz od pečene paprike', 'Roasted red pepper spread', 'side', 80, 2, 12, 3, 4, 50, true),
('Kajmak', 'Кајмак', 'Kajmak', 'Mlečni proizvod sličan pavlaci', 'Creamy dairy product', 'side', 350, 8, 3, 35, 0, 30, true),
('Prebranac', 'Пребранац', 'Prebranac', 'Pečeni pasulj sa lukom', 'Baked beans with onions', 'side', 150, 8, 22, 3, 8, 250, true),
('Shopska salata', 'Шопска салата', 'Shopska salad', 'Salata od paradajza, krastavca i sira', 'Tomato, cucumber and cheese salad', 'appetizer', 90, 5, 8, 5, 2, 200, true);

-- Insert ingredients for allergen tracking
INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Meat', 'Meso', false, NULL FROM serbian_dishes WHERE name = 'Ćevapi';

INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Meat', 'Meso', false, NULL FROM serbian_dishes WHERE name = 'Pljeskavica';

INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Cabbage', 'Kupus', false, NULL FROM serbian_dishes WHERE name = 'Sarma';

INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Gluten', 'Gluten', true, 'gluten' FROM serbian_dishes WHERE name LIKE 'Burek%';

INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Dairy', 'Mlečni proizvodi', true, 'dairy' FROM serbian_dishes WHERE name IN ('Burek sa sirom', 'Gibanica', 'Kajmak');

INSERT INTO serbian_dish_ingredients (dish_id, ingredient_name, ingredient_name_sr, is_allergen, allergen_type) 
SELECT id, 'Eggs', 'Jaja', true, 'eggs' FROM serbian_dishes WHERE name = 'Gibanica';
