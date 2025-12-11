-- Migration: Ingredients and Meal Planning System
-- Created: 2025-12-11
-- Description: Adds tables for ingredients, meals, and daily meal schedules

-- 1. Ingredients table (ингредиенты/продукты питания с полной нутриентной информацией)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_key VARCHAR(255) NOT NULL, -- ключ для перевода
    category VARCHAR(100), -- 'meat', 'dairy', 'vegetable', 'fruit', 'grain', 'legume', 'nut', 'oil', etc.
    macros JSONB NOT NULL DEFAULT '{
        "protein": 0,
        "carbs": 0,
        "fats": 0,
        "calories": 0,
        "fiber": 0,
        "sugar": 0,
        "saturated_fat": 0,
        "trans_fat": 0,
        "monounsaturated_fat": 0,
        "polyunsaturated_fat": 0
    }'::jsonb,
    micronutrients JSONB DEFAULT '{
        "vitamin_a": 0,
        "vitamin_c": 0,
        "vitamin_d": 0,
        "vitamin_e": 0,
        "vitamin_k": 0,
        "thiamin": 0,
        "riboflavin": 0,
        "niacin": 0,
        "vitamin_b6": 0,
        "folate": 0,
        "vitamin_b12": 0,
        "calcium": 0,
        "iron": 0,
        "magnesium": 0,
        "phosphorus": 0,
        "potassium": 0,
        "sodium": 0,
        "zinc": 0,
        "copper": 0,
        "manganese": 0,
        "selenium": 0
    }'::jsonb,
    serving_size_grams INTEGER DEFAULT 100, -- стандартная порция в граммах
    density DECIMAL(5,2), -- калорийность на 100г
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name_key ON ingredients(name_key);

-- 2. Meals table (блюда/рецепты с ингредиентами)
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_key VARCHAR(255) NOT NULL,
    description_key VARCHAR(255),
    meal_type meal_type NOT NULL, -- breakfast, lunch, dinner, snack
    cuisine_type VARCHAR(100), -- 'serbian', 'mediterranean', 'asian', etc.
    cooking_time_minutes INTEGER,
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
    servings INTEGER DEFAULT 1,
    instructions_key VARCHAR(255), -- ключ для инструкций по приготовлению
    total_macros JSONB DEFAULT '{
        "protein": 0,
        "carbs": 0,
        "fats": 0,
        "calories": 0,
        "fiber": 0
    }'::jsonb,
    total_micronutrients JSONB DEFAULT '{}'::jsonb,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_cuisine_type ON meals(cuisine_type);

-- 3. Meal Ingredients (связующая таблица: блюдо -> ингредиенты с количеством)
CREATE TABLE meal_ingredients (
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_grams DECIMAL(8,2) NOT NULL, -- количество в граммах
    preparation_method VARCHAR(100), -- 'raw', 'cooked', 'fried', 'baked', etc.
    PRIMARY KEY (meal_id, ingredient_id)
);

CREATE INDEX idx_meal_ingredients_meal_id ON meal_ingredients(meal_id);
CREATE INDEX idx_meal_ingredients_ingredient_id ON meal_ingredients(ingredient_id);

-- 4. Daily Meal Plans (дневные планы питания пользователей)
CREATE TABLE daily_meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nutrition_plan_id UUID REFERENCES nutrition_plans(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_calories INTEGER,
    total_protein DECIMAL(6,2),
    total_carbs DECIMAL(6,2),
    total_fats DECIMAL(6,2),
    total_micronutrients JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_meal_plans_user_id_date ON daily_meal_plans(user_id, date DESC);

-- 5. Daily Meal Plan Items (блюда в дневном плане)
CREATE TABLE daily_meal_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_meal_plan_id UUID NOT NULL REFERENCES daily_meal_plans(id) ON DELETE CASCADE,
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    meal_type meal_type NOT NULL,
    scheduled_time TIME, -- время приема пищи (например, 08:00 для завтрака)
    servings DECIMAL(3,1) DEFAULT 1.0, -- количество порций
    calories DECIMAL(8,2),
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fats DECIMAL(6,2),
    order_index INTEGER, -- порядок в течение дня
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_meal_plan_items_daily_plan_id ON daily_meal_plan_items(daily_meal_plan_id);
CREATE INDEX idx_daily_meal_plan_items_meal_type ON daily_meal_plan_items(meal_type);

-- 6. Daily Meal Plan Supplements (добавки в дневном плане - интеграция с product_prices)
CREATE TABLE daily_meal_plan_supplements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_meal_plan_id UUID NOT NULL REFERENCES daily_meal_plans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    scheduled_time TIME,
    dosage_grams DECIMAL(6,2), -- дозировка в граммах
    timing VARCHAR(50), -- 'morning', 'pre_workout', 'post_workout', 'evening', 'with_meal'
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_meal_plan_supplements_daily_plan_id ON daily_meal_plan_supplements(daily_meal_plan_id);

-- Triggers for updated_at
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_meal_plans_updated_at BEFORE UPDATE ON daily_meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate meal macros from ingredients (можно вызвать при создании/обновлении блюда)
CREATE OR REPLACE FUNCTION calculate_meal_macros(meal_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_macros JSONB;
    total_micronutrients JSONB;
BEGIN
    -- Calculate totals from meal_ingredients
    WITH ingredient_macros AS (
        SELECT 
            mi.quantity_grams / 100.0 as multiplier,
            i.macros,
            i.micronutrients
        FROM meal_ingredients mi
        INNER JOIN ingredients i ON mi.ingredient_id = i.id
        WHERE mi.meal_id = meal_uuid
    )
    SELECT 
        jsonb_build_object(
            'protein', COALESCE(SUM((macros->>'protein')::numeric * multiplier), 0),
            'carbs', COALESCE(SUM((macros->>'carbs')::numeric * multiplier), 0),
            'fats', COALESCE(SUM((macros->>'fats')::numeric * multiplier), 0),
            'calories', COALESCE(SUM((macros->>'calories')::numeric * multiplier), 0),
            'fiber', COALESCE(SUM((macros->>'fiber')::numeric * multiplier), 0)
        )
    INTO total_macros
    FROM ingredient_macros;
    
    -- Calculate micronutrients (simplified - aggregate all micronutrients)
    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
    INTO total_micronutrients
    FROM (
        SELECT 
            key,
            SUM((value::numeric) * (mi.quantity_grams / 100.0)) as value
        FROM meal_ingredients mi
        INNER JOIN ingredients i ON mi.ingredient_id = i.id
        CROSS JOIN LATERAL jsonb_each_text(i.micronutrients)
        WHERE mi.meal_id = meal_uuid
        GROUP BY key
    ) micronutrients;
    
    -- Update meal with calculated values
    UPDATE meals 
    SET total_macros = COALESCE(total_macros, '{}'::jsonb),
        total_micronutrients = COALESCE(total_micronutrients, '{}'::jsonb),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = meal_uuid;
END;
$$ LANGUAGE plpgsql;

