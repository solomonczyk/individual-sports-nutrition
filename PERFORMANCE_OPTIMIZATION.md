# Performance Optimization Guide

Comprehensive guide for optimizing performance across the Individual Sports Nutrition platform.

---

## Table of Contents

1. [Mobile App Optimization](#mobile-app-optimization)
2. [Backend API Optimization](#backend-api-optimization)
3. [Admin Panel Optimization](#admin-panel-optimization)
4. [Database Optimization](#database-optimization)
5. [Monitoring & Metrics](#monitoring--metrics)

---

## Mobile App Optimization

### 1. Code Splitting & Lazy Loading

**Implement lazy loading for screens:**

```typescript
// app/_layout.tsx
import { lazy, Suspense } from 'react';

const CatalogScreen = lazy(() => import('./(tabs)/catalog'));
const ProgressScreen = lazy(() => import('./(tabs)/progress'));
const CuisineScreen = lazy(() => import('./(tabs)/cuisine'));

// Wrap with Suspense
<Suspense fallback={<LoadingScreen />}>
  <CatalogScreen />
</Suspense>
```

### 2. Image Optimization

**Use optimized image formats:**

```typescript
// components/OptimizedImage.tsx
import { Image } from 'expo-image';

export function OptimizedImage({ uri, ...props }) {
  return (
    <Image
      source={{ uri }}
      placeholder={blurhash}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      {...props}
    />
  );
}
```

**Recommendations:**
- Use WebP format for images
- Implement progressive loading
- Cache images locally
- Use appropriate image sizes (no oversized images)

### 3. List Virtualization

**Use FlashList for large lists:**

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={200}
  keyExtractor={(item) => item.id}
/>
```

### 4. Memoization

**Memoize expensive components:**

```typescript
import { memo } from 'react';

export const ProductCard = memo(({ product }) => {
  return <Card>{/* ... */}</Card>;
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
```

**Memoize expensive calculations:**

```typescript
import { useMemo } from 'react';

const filteredProducts = useMemo(() => {
  return products.filter(p => p.category === selectedCategory);
}, [products, selectedCategory]);
```

### 5. React Query Optimization

**Configure caching strategy:**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
```

**Implement prefetching:**

```typescript
// Prefetch next page
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['products', page + 1],
    queryFn: () => fetchProducts(page + 1),
  });
};
```

### 6. Bundle Size Optimization

**Analyze bundle size:**

```bash
npx expo-bundle-visualizer
```

**Remove unused dependencies:**

```bash
npx depcheck
```

**Use tree-shaking friendly imports:**

```typescript
// Good
import { Button } from '@/components/ui/Button';

// Bad
import * as UI from '@/components/ui';
```

### 7. Performance Monitoring

**Add performance tracking:**

```typescript
import * as Performance from 'expo-performance';

// Track screen render time
Performance.mark('screen-start');
// ... render logic
Performance.mark('screen-end');
Performance.measure('screen-render', 'screen-start', 'screen-end');
```

---

## Backend API Optimization

### 1. Database Query Optimization

**Use indexes:**

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_type_id ON products(type_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_product_prices_product_id ON product_prices(product_id);
CREATE INDEX idx_product_prices_store_id ON product_prices(store_id);

-- Composite indexes for common queries
CREATE INDEX idx_products_brand_type ON products(brand_id, type_id);
CREATE INDEX idx_products_status_created ON products(status, created_at DESC);
```

**Optimize queries:**

```typescript
// Bad - N+1 query problem
const products = await pool.query('SELECT * FROM products');
for (const product of products.rows) {
  const brand = await pool.query('SELECT * FROM brands WHERE id = $1', [product.brand_id]);
}

// Good - Use JOIN
const products = await pool.query(`
  SELECT p.*, b.name as brand_name
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.id
`);
```

### 2. Caching Strategy

**Implement Redis caching:**

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
async function getPopularDishes() {
  const cacheKey = 'dishes:popular';
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const dishes = await fetchPopularDishes();
  await redis.setex(cacheKey, 3600, JSON.stringify(dishes)); // 1 hour
  
  return dishes;
}
```

### 3. Response Compression

**Enable gzip compression:**

```typescript
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
}));
```

### 4. Rate Limiting

**Implement rate limiting:**

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

### 5. Connection Pooling

**Optimize database pool:**

```typescript
const pool = new Pool({
  max: 20, // Maximum pool size
  min: 5, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 6. Async Processing

**Use job queues for heavy tasks:**

```typescript
import Bull from 'bull';

const aggregationQueue = new Bull('aggregation', {
  redis: process.env.REDIS_URL,
});

// Add job
aggregationQueue.add('sync-store', { storeId: '123' });

// Process job
aggregationQueue.process('sync-store', async (job) => {
  await syncStore(job.data.storeId);
});
```

### 7. API Response Optimization

**Implement pagination:**

```typescript
async function getProducts(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  
  const result = await pool.query(`
    SELECT * FROM products
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total: await getTotalCount(),
    },
  };
}
```

**Use field selection:**

```typescript
// Allow clients to specify fields
async function getProducts(fields = '*') {
  const allowedFields = ['id', 'name', 'brand', 'price'];
  const selectedFields = fields === '*' ? allowedFields : 
    fields.split(',').filter(f => allowedFields.includes(f));
  
  return pool.query(`SELECT ${selectedFields.join(',')} FROM products`);
}
```

---

## Admin Panel Optimization

### 1. Next.js Optimization

**Enable static generation:**

```typescript
// app/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  return <Dashboard stats={stats} />;
}
```

**Implement dynamic imports:**

```typescript
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### 2. Image Optimization

**Use Next.js Image component:**

```typescript
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={300}
  height={300}
  loading="lazy"
  quality={75}
/>
```

### 3. Bundle Analysis

**Analyze bundle size:**

```bash
npm run build
npx @next/bundle-analyzer
```

### 4. Font Optimization

**Use next/font:**

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

---

## Database Optimization

### 1. Query Performance

**Analyze slow queries:**

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Vacuum & Analyze

**Regular maintenance:**

```sql
-- Vacuum to reclaim space
VACUUM ANALYZE products;

-- Auto-vacuum configuration
ALTER TABLE products SET (autovacuum_vacuum_scale_factor = 0.1);
```

### 3. Partitioning

**Partition large tables:**

```sql
-- Partition price_history by date
CREATE TABLE price_history (
  id UUID,
  product_id UUID,
  price DECIMAL,
  recorded_at TIMESTAMP
) PARTITION BY RANGE (recorded_at);

CREATE TABLE price_history_2026_01 PARTITION OF price_history
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 4. Connection Pooling

**Use PgBouncer:**

```ini
[databases]
nutrition_db = host=localhost port=5432 dbname=nutrition

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

---

## Monitoring & Metrics

### 1. Application Monitoring

**Setup Sentry for error tracking:**

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV,
});
```

### 2. Performance Metrics

**Track key metrics:**

```typescript
// API response time
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
});
```

### 3. Database Monitoring

**Monitor connection pool:**

```typescript
setInterval(() => {
  console.log({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}, 60000);
```

### 4. Health Checks

**Implement health endpoints:**

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
  
  const healthy = checks.database && checks.redis;
  res.status(healthy ? 200 : 503).json(checks);
});
```

---

## Performance Checklist

### Mobile App
- [ ] Implement lazy loading for screens
- [ ] Use FlashList for large lists
- [ ] Optimize images (WebP, caching)
- [ ] Memoize expensive components
- [ ] Configure React Query caching
- [ ] Analyze and reduce bundle size
- [ ] Add performance monitoring

### Backend API
- [ ] Add database indexes
- [ ] Implement caching (Redis)
- [ ] Enable response compression
- [ ] Add rate limiting
- [ ] Optimize connection pooling
- [ ] Use job queues for heavy tasks
- [ ] Implement pagination

### Admin Panel
- [ ] Enable static generation
- [ ] Use dynamic imports
- [ ] Optimize images with next/image
- [ ] Analyze bundle size
- [ ] Optimize fonts

### Database
- [ ] Analyze slow queries
- [ ] Add appropriate indexes
- [ ] Regular VACUUM ANALYZE
- [ ] Consider partitioning
- [ ] Use connection pooling

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Track performance metrics
- [ ] Monitor database connections
- [ ] Implement health checks

---

**Last Updated:** January 3, 2026
