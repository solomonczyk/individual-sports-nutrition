-- Migration: Serbian Market Localization
-- Created: 2025-12-11
-- Description: Adds Serbian-specific data and configurations

-- 1. Update default language to Serbian
ALTER TABLE users ALTER COLUMN preferred_language SET DEFAULT 'sr';

-- 2. Serbian ingredient categories (сербские категории продуктов)
-- Добавляем специфичные для Сербии категории ингредиентов
COMMENT ON COLUMN ingredients.category IS 'Categories: meat (meso), dairy (mlečni), vegetable (povrće), fruit (voće), grain (žitarice), legume (mahunarke), nut (orašasti), oil (ulje), serbian_traditional (srpsko tradicionalno), etc.';

-- 3. Serbian cuisine types for meals
COMMENT ON COLUMN meals.cuisine_type IS 'Cuisine types: serbian, balkan, mediterranean, asian, etc. Serbian includes: ćevapi, pljeskavica, sarma, prebranac, ajvar, kajmak, etc.';

-- 4. Serbian stores (популярные магазины спортивного питания в Сербии)
INSERT INTO stores (name, slug, website_url, verified, active, delivery_available, delivery_fee, min_order_amount) VALUES
('Muscle Shop', 'muscle-shop', 'https://www.muscleshop.rs', true, true, true, 300.00, 2000.00),
('Strong Shop', 'strong-shop', 'https://www.strongshop.rs', true, true, true, 250.00, 1500.00),
('Fitness Centar', 'fitness-centar', 'https://www.fitnesscentar.rs', true, true, true, 400.00, 3000.00),
('Body Shop', 'body-shop', 'https://www.bodyshop.rs', true, true, true, 350.00, 2500.00),
('Sport Nutrition', 'sport-nutrition', 'https://www.sportnutrition.rs', true, true, true, 300.00, 2000.00),
('Maxi', 'maxi', 'https://www.maxi.rs', true, true, true, 500.00, 5000.00),
('Idea', 'idea', 'https://www.idea.rs', true, true, true, 500.00, 5000.00),
('Roda', 'roda', 'https://www.roda.rs', true, true, true, 500.00, 5000.00)
ON CONFLICT (slug) DO NOTHING;

-- 5. Serbian brands (популярные бренды в Сербии)
INSERT INTO brands (name, origin_country, verified) VALUES
('Proteini.sr', 'RS', true),
('Strong Nutrition', 'RS', true),
('Fitness Pro', 'RS', true),
('Optimum Nutrition', 'US', true),
('Dymatize', 'US', true),
('BSN', 'US', true),
('Universal Nutrition', 'US', true),
('BioTech USA', 'HU', true),
('Scivation', 'US', true),
('Mutant', 'CA', true)
ON CONFLICT DO NOTHING;

-- 6. Common Serbian ingredients (базовые сербские ингредиенты)
-- Note: These will need translations in the translations table
-- Основные продукты сербской кухни для планирования питания
INSERT INTO ingredients (name_key, category, macros, micronutrients, serving_size_grams, density) VALUES
-- Мясо (Mesna jela)
('ingredient.cevapi', 'meat', '{"protein": 20, "carbs": 0, "fats": 15, "calories": 250, "fiber": 0, "saturated_fat": 6}', '{"iron": 2.5, "zinc": 4.2, "vitamin_b12": 2.4}', 100, 2.5),
('ingredient.pljeskavica', 'meat', '{"protein": 18, "carbs": 2, "fats": 20, "calories": 270, "fiber": 0, "saturated_fat": 8}', '{"iron": 2.3, "zinc": 3.8, "vitamin_b12": 2.1}', 100, 2.7),
('ingredient.kajmak', 'dairy', '{"protein": 8, "carbs": 3, "fats": 50, "calories": 500, "fiber": 0, "saturated_fat": 30}', '{"calcium": 200, "vitamin_a": 400}', 50, 10.0),

-- Овощи (Povrće)
('ingredient.ajvar', 'vegetable', '{"protein": 2, "carbs": 12, "fats": 5, "calories": 100, "fiber": 3, "sugar": 8}', '{"vitamin_c": 15, "vitamin_a": 800, "potassium": 300}', 50, 2.0),
('ingredient.prebranac', 'legume', '{"protein": 8, "carbs": 25, "fats": 1, "calories": 140, "fiber": 8, "sugar": 2}', '{"iron": 3.5, "magnesium": 80, "folate": 150, "potassium": 400}', 150, 0.93),

-- Молочные продукты (Mlečni proizvodi)
('ingredient.kajmak_mleko', 'dairy', '{"protein": 6, "carbs": 4, "fats": 30, "calories": 310, "fiber": 0, "saturated_fat": 18}', '{"calcium": 250, "vitamin_d": 1, "vitamin_b12": 1.1}', 100, 3.1),
('ingredient.pavlaka', 'dairy', '{"protein": 3, "carbs": 3, "fats": 20, "calories": 200, "fiber": 0, "saturated_fat": 12}', '{"calcium": 100, "vitamin_a": 200}', 100, 2.0),

-- Хлеб и злаки (Hleb i žitarice)
('ingredient.lepinja', 'grain', '{"protein": 8, "carbs": 45, "fats": 2, "calories": 230, "fiber": 2, "sugar": 1}', '{"thiamin": 0.3, "folate": 50, "iron": 2.0}', 100, 2.3),
('ingredient.somun', 'grain', '{"protein": 9, "carbs": 48, "fats": 1, "calories": 240, "fiber": 3, "sugar": 2}', '{"thiamin": 0.4, "folate": 60, "iron": 2.5}', 100, 2.4)
ON CONFLICT DO NOTHING;

-- 7. Serbian meal translations (примеры переводов - нужно будет заполнить полностью)
-- Note: Translations should be added to translations table
-- Это пример структуры, полные переводы нужно добавить отдельно

-- 8. Add Serbian time preferences (сербские предпочтения по времени еды)
-- Типичное расписание в Сербии:
-- Завтрак: 7:00-9:00
-- Перекус: 10:00-11:00
-- Обед: 13:00-15:00 (главный прием пищи)
-- Перекус: 16:00-17:00
-- Ужин: 19:00-21:00

COMMENT ON TABLE daily_meal_plan_items IS 'Typical Serbian meal times: breakfast 7-9, lunch 13-15 (main meal), dinner 19-21';

