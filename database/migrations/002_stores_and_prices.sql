-- Migration: Stores and Prices for Serbian Market Integration
-- Created: 2025-12-11
-- Description: Adds tables for stores, product prices, and price comparisons

-- 1. Stores table (магазины Сербии)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    description TEXT,
    verified BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    delivery_available BOOLEAN DEFAULT false,
    delivery_fee DECIMAL(10,2),
    min_order_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_slug ON stores(slug);
CREATE INDEX idx_stores_active ON stores(active);

-- 2. Product Prices table (цены продуктов в магазинах)
CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RSD',
    discount_price DECIMAL(10,2),
    discount_percentage INTEGER,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, store_id)
);

CREATE INDEX idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX idx_product_prices_store_id ON product_prices(store_id);
CREATE INDEX idx_product_prices_price ON product_prices(price);
CREATE INDEX idx_product_prices_in_stock ON product_prices(in_stock);
CREATE INDEX idx_product_prices_last_checked ON product_prices(last_checked_at);

-- 3. Price History table (история изменения цен)
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_price_id UUID NOT NULL REFERENCES product_prices(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    discount_price DECIMAL(10,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_product_price_id ON price_history(product_price_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at DESC);

-- 4. Product Packages table (разные упаковки продуктов)
CREATE TABLE product_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    weight_grams INTEGER, -- вес в граммах
    servings INTEGER, -- количество порций
    package_type VARCHAR(50), -- 'container', 'sachet', 'bottle', etc.
    barcode VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_packages_product_id ON product_packages(product_id);

-- Link product_prices to product_packages (цены могут быть на конкретную упаковку)
ALTER TABLE product_prices ADD COLUMN package_id UUID REFERENCES product_packages(id) ON DELETE SET NULL;

-- 5. Shopping Lists table (списки покупок пользователей с расчетом)
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES nutrition_plans(id) ON DELETE SET NULL,
    name VARCHAR(255),
    total_cost DECIMAL(10,2),
    estimated_duration_days INTEGER, -- на сколько дней рассчитан план
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);

-- 6. Shopping List Items table (элементы списка с расчетом количества)
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    package_id UUID REFERENCES product_packages(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    required_quantity DECIMAL(8,2) NOT NULL, -- необходимое количество (в граммах/мл или порциях)
    package_quantity INTEGER NOT NULL, -- сколько упаковок нужно купить
    daily_dosage DECIMAL(8,2), -- дневная дозировка
    frequency_per_week INTEGER, -- сколько раз в неделю принимать
    duration_days INTEGER, -- продолжительность приема
    unit_price DECIMAL(10,2), -- цена за единицу из выбранного магазина
    total_price DECIMAL(10,2), -- общая стоимость
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_product_id ON shopping_list_items(product_id);

-- Triggers for updated_at
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON product_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_packages_updated_at BEFORE UPDATE ON product_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

