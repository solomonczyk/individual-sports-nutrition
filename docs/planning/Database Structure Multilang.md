# Структура базы данных для мультиязычного приложения спортивного питания

## 1. Users

* id (PK)
* email
* password_hash
* preferred_language (enum: sr, hu, ro, en, ru, ua)
* created_at, updated_at

## 2. Health Profiles

* id (PK)
* user_id (FK → users.id)
* age, gender, weight, height
* activity_level, goal (mass, cut, maintain)
* allergies, diseases (JSONB)
* created_at, updated_at

## 3. Products

* id (PK)
* name_key (FK → translations.key)
* brand_id (FK → brands.id)
* macros (JSONB: protein, carbs, fats)
* type (protein, creatine, amino, etc.)
* created_at, updated_at

## 4. Brands

* id (PK)
* name
* origin_country
* verified (bool)
* created_at, updated_at

## 5. Recipes

* id (PK)
* name_key (FK → translations.key)
* ingredients (JSONB: product_id → quantity)
* macros (JSONB)
* created_at, updated_at

## 6. Contraindications

* id (PK)
* name_key (FK → translations.key)
* description_key (FK → translations.key)
* created_at, updated_at

## 7. Translations

* key (PK)
* language (enum: sr, hu, ro, en, ru, ua)
* text

## 8. User Progress

* id (PK)
* user_id (FK → users.id)
* date
* weight, body_fat, activity_data (JSONB)
* consumed_products (JSONB)
