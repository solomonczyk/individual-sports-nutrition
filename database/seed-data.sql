-- Seed data for testing
-- Run this with: psql -U postgres -d nutrition_db -f seed-data.sql

\echo 'Seeding test data...'

-- Insert test user
INSERT INTO users (id, email, password_hash, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqXqXqXq', NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert test brands
INSERT INTO brands (id, name, verified, is_local, country_code) VALUES
('10000000-0000-0000-0000-000000000001', 'Optimum Nutrition', true, false, 'US'),
('10000000-0000-0000-0000-000000000002', 'MyProtein', true, false, 'UK'),
('10000000-0000-0000-0000-000000000003', 'Scitec Nutrition', true, true, 'RS'),
('10000000-0000-0000-0000-000000000004', 'BioTech USA', true, true, 'RS')
ON CONFLICT (id) DO NOTHING;

-- Insert test product types
INSERT INTO product_types (id, name, name_sr, name_en) VALUES
('20000000-0000-0000-0000-000000000001', 'Protein', 'Протеин', 'Protein'),
('20000000-0000-0000-0000-000000000002', 'Creatine', 'Креатин', 'Creatine'),
('20000000-0000-0000-0000-000000000003', 'Vitamins', 'Витамини', 'Vitamins')
ON CONFLICT (id) DO NOTHING;

-- Insert test products
INSERT INTO products (id, name, brand_id, type_id, status) VALUES
('30000000-0000-0000-0000-000000000001', 'Gold Standard Whey', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'active'),
('30000000-0000-0000-0000-000000000002', 'Impact Whey Protein', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'active'),
('30000000-0000-0000-0000-000000000003', 'Creatine Monohydrate', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert test stores
INSERT INTO stores (id, name, url, status) VALUES
('40000000-0000-0000-0000-000000000001', 'X Sport', 'https://xsport.rs', 'active'),
('40000000-0000-0000-0000-000000000002', 'NSSport', 'https://nssport.rs', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert test prices
INSERT INTO product_prices (product_id, store_id, price, currency, in_stock) VALUES
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 5500, 'RSD', true),
('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 5200, 'RSD', true),
('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 4800, 'RSD', true),
('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 2500, 'RSD', true)
ON CONFLICT (product_id, store_id) DO UPDATE SET
  price = EXCLUDED.price,
  in_stock = EXCLUDED.in_stock,
  updated_at = NOW();

\echo 'Test data seeded successfully!'
\echo 'Test user: test@example.com'
\echo 'Products: 3'
\echo 'Stores: 2'
\echo 'Brands: 4'
