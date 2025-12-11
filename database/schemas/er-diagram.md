# ER-диаграмма базы данных Individual Sports Nutrition

## Сущности и связи

```
Users (1) ──< (N) Health Profiles
Users (1) ──< (N) User Progress
Users (1) ──< (N) Nutrition Plans

Brands (1) ──< (N) Products
Products (N) ──< (N) Nutrition Plans (через plan_products)
Products (N) ──< (N) Contraindications (через product_contraindications)

Recipes (N) ──< (N) Products (через recipe_products)
Recipes (N) ──< (N) Nutrition Plans

Translations ──< Products (name_key)
Translations ──< Recipes (name_key)
Translations ──< Contraindications (name_key, description_key)
```

## Описание таблиц

### 1. users
- id (UUID, PK)
- email (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- preferred_language (VARCHAR(2), DEFAULT 'en')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2. health_profiles
- id (UUID, PK)
- user_id (UUID, FK → users.id, UNIQUE)
- age (INTEGER)
- gender (VARCHAR(10)) - 'male' | 'female' | 'other'
- weight (DECIMAL(5,2)) - в кг
- height (DECIMAL(5,2)) - в см
- activity_level (VARCHAR(20)) - 'low' | 'moderate' | 'high' | 'very_high'
- goal (VARCHAR(20)) - 'mass' | 'cut' | 'maintain' | 'endurance'
- allergies (JSONB) - массив строк
- diseases (JSONB) - массив строк
- medications (JSONB) - массив строк
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 3. brands
- id (UUID, PK)
- name (VARCHAR, NOT NULL)
- origin_country (VARCHAR(3)) - ISO код страны
- verified (BOOLEAN, DEFAULT false)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 4. products
- id (UUID, PK)
- name_key (VARCHAR, FK → translations.key)
- brand_id (UUID, FK → brands.id)
- type (VARCHAR(50)) - 'protein' | 'creatine' | 'amino' | 'vitamin' | etc.
- macros (JSONB) - {protein: number, carbs: number, fats: number, calories: number}
- serving_size (VARCHAR) - размер порции
- price (DECIMAL(10,2)) - цена в RSD
- available (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 5. recipes
- id (UUID, PK)
- name_key (VARCHAR, FK → translations.key)
- ingredients (JSONB) - {product_id: quantity, ...}
- macros (JSONB) - {protein, carbs, fats, calories}
- instructions_key (VARCHAR, FK → translations.key)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 6. contraindications
- id (UUID, PK)
- name_key (VARCHAR, FK → translations.key)
- description_key (VARCHAR, FK → translations.key)
- severity (VARCHAR(20)) - 'low' | 'medium' | 'high'
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 7. product_contraindications (связующая таблица)
- product_id (UUID, FK → products.id)
- contraindication_id (UUID, FK → contraindications.id)
- PRIMARY KEY (product_id, contraindication_id)

### 8. nutrition_plans
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- calories (INTEGER)
- protein (DECIMAL(6,2))
- carbs (DECIMAL(6,2))
- fats (DECIMAL(6,2))
- active (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 9. plan_products (связующая таблица)
- plan_id (UUID, FK → nutrition_plans.id)
- product_id (UUID, FK → products.id)
- dosage (VARCHAR) - дозировка
- frequency (VARCHAR) - частота приема
- timing (VARCHAR) - время приема (morning, pre_workout, post_workout, evening)
- PRIMARY KEY (plan_id, product_id)

### 10. plan_recipes (связующая таблица)
- plan_id (UUID, FK → nutrition_plans.id)
- recipe_id (UUID, FK → recipes.id)
- meal_type (VARCHAR) - 'breakfast' | 'lunch' | 'dinner' | 'snack'
- day_of_week (INTEGER) - 0-6 (понедельник-воскресенье)
- PRIMARY KEY (plan_id, recipe_id, meal_type, day_of_week)

### 11. user_progress
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- date (DATE, NOT NULL)
- weight (DECIMAL(5,2))
- body_fat (DECIMAL(5,2))
- activity_data (JSONB) - данные о тренировках
- consumed_products (JSONB) - потребленные продукты
- notes (TEXT)
- created_at (TIMESTAMP)

### 12. translations
- key (VARCHAR, PK)
- language (VARCHAR(2), PK) - 'sr' | 'hu' | 'ro' | 'en' | 'ru' | 'ua'
- text (TEXT, NOT NULL)
- PRIMARY KEY (key, language)

## Индексы

- users.email (UNIQUE INDEX)
- health_profiles.user_id (UNIQUE INDEX)
- products.brand_id (INDEX)
- products.type (INDEX)
- nutrition_plans.user_id (INDEX)
- nutrition_plans.active (INDEX)
- user_progress.user_id, date (INDEX)
- translations.key, language (INDEX)

