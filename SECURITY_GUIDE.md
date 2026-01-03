# Security Guide

Comprehensive security guide for the Individual Sports Nutrition platform.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [API Security](#api-security)
4. [Database Security](#database-security)
5. [Mobile App Security](#mobile-app-security)
6. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### 1. JWT Implementation

**Secure JWT configuration:**

```typescript
// backend-api/src/config/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'nutrition-api',
    audience: 'nutrition-app',
  });
}

export function generateRefreshToken(userId: string) {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2. Auth Middleware

```typescript
// backend-api/src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 3. Role-Based Access Control

```typescript
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = await getUserRole(req.user.id);
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
router.get('/admin/users', authMiddleware, requireRole('admin'), getUsers);
```

---

## Data Protection

### 1. Password Hashing

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 2. Sensitive Data Encryption

```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 3. Secure Storage (Mobile)

```typescript
import * as SecureStore from 'expo-secure-store';

export async function saveToken(key: string, value: string) {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

export async function getToken(key: string) {
  return await SecureStore.getItemAsync(key);
}

export async function deleteToken(key: string) {
  await SecureStore.deleteItemAsync(key);
}
```

---

## API Security

### 1. Input Validation

```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  brand: z.string().min(1).max(255),
  price: z.number().positive(),
  type: z.enum(['protein', 'creatine', 'vitamins', 'other']),
});

export async function createProduct(req: Request, res: Response) {
  try {
    const validated = createProductSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    res.status(400).json({ error: 'Invalid input' });
  }
}
```

### 2. SQL Injection Prevention

```typescript
// Always use parameterized queries
// Good
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Bad - Never do this!
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### 3. XSS Prevention

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}
```

### 4. CORS Configuration

```typescript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3001',
  'https://admin.nutrition-app.com',
  'https://nutrition-app.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
}));
```

### 5. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests',
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### 6. HTTPS Enforcement

```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

## Database Security

### 1. Connection Security

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(),
  },
});
```

### 2. Least Privilege Principle

```sql
-- Create read-only user for reporting
CREATE USER reporting_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE nutrition_db TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;

-- Create app user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE nutrition_db TO app_user;
GRANT SELECT, INSERT, UPDATE ON products, users TO app_user;
-- No DELETE or DROP permissions
```

### 3. Audit Logging

```sql
-- Enable audit logging
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    current_setting('app.user_id')::UUID,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Mobile App Security

### 1. Secure API Communication

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await getToken('refresh_token');
      if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);
        await saveToken('access_token', newToken);
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### 2. Certificate Pinning

```typescript
// expo-app.config.js
export default {
  ios: {
    infoPlist: {
      NSAppTransportSecurity: {
        NSPinnedDomains: {
          'api.nutrition-app.com': {
            NSIncludesSubdomains: true,
            NSPinnedCAIdentities: [
              {
                SPKI-SHA256-BASE64: 'your-certificate-hash',
              },
            ],
          },
        },
      },
    },
  },
};
```

### 3. Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

export async function authenticateWithBiometrics() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    return false;
  }
  
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your account',
    fallbackLabel: 'Use passcode',
  });
  
  return result.success;
}
```

---

## Security Checklist

### Authentication & Authorization
- [ ] Implement JWT with secure secret
- [ ] Use refresh tokens
- [ ] Implement role-based access control
- [ ] Add auth middleware to protected routes
- [ ] Implement password reset flow
- [ ] Add 2FA support (optional)

### Data Protection
- [ ] Hash passwords with bcrypt (12+ rounds)
- [ ] Encrypt sensitive data at rest
- [ ] Use secure storage for tokens (mobile)
- [ ] Implement data retention policies
- [ ] Add GDPR compliance features

### API Security
- [ ] Validate all inputs with schemas
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Sanitize HTML output (prevent XSS)
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Enforce HTTPS in production
- [ ] Add request size limits
- [ ] Implement CSRF protection

### Database Security
- [ ] Use SSL/TLS for connections
- [ ] Apply least privilege principle
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Monitor for suspicious activity

### Mobile App Security
- [ ] Secure API communication
- [ ] Implement certificate pinning
- [ ] Use biometric authentication
- [ ] Obfuscate sensitive code
- [ ] Implement jailbreak/root detection
- [ ] Clear sensitive data on logout

### Infrastructure
- [ ] Use environment variables for secrets
- [ ] Never commit secrets to git
- [ ] Regular dependency updates
- [ ] Security scanning (npm audit)
- [ ] Penetration testing
- [ ] Incident response plan

---

**Last Updated:** January 3, 2026
