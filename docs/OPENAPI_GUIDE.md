# OpenAPI Specification Guide

## Overview

This guide covers the comprehensive OpenAPI 3.0 specification for the Sports Nutrition REST API. The specification provides:

- Complete endpoint documentation
- Request/response schemas
- Authentication methods
- Error handling
- Integration examples

## Quick Start

### View OpenAPI Spec

The specification is available in JSON format:

```bash
# File location
docs/openapi-spec.json

# Generate from script
bash scripts/generate-openapi-spec.sh
```

### Interactive Documentation Tools

#### Swagger UI (Recommended)
1. Go to https://editor.swagger.io
2. Click "File" → "Import URL"
3. Enter: `https://api.sports-nutrition.app/docs/openapi-spec.json`
4. Or paste the content from `docs/openapi-spec.json`

#### ReDoc (Alternative)
1. Go to https://redocly.github.io/redoc/
2. Click "Try it!" in top-right
3. Paste the OpenAPI JSON content
4. View beautiful interactive documentation

### Local Swagger UI

Setup local Swagger UI server:

```bash
# Using Docker
docker run -p 8080:8080 \
  -v $(pwd)/docs/openapi-spec.json:/openapi-spec.json \
  -e SWAGGER_JSON=/openapi-spec.json \
  swaggerapi/swagger-ui

# Access: http://localhost:8080
```

## API Organization

### Endpoints by Category

**Health & Monitoring**
- `GET /health` - Service health check

**Authentication** (2 endpoints)
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

**Health Profile** (2 endpoints)
- `GET /health-profile` - Get profile
- `PUT /health-profile` - Update profile

**Recommendations** (1 endpoint)
- `GET /recommendations` - Personalized recommendations

**Nutrition** (1 endpoint)
- `GET /nutrition/calculate` - Calculate nutritional needs

**AI Features** (2 endpoints)
- `POST /recommendations/ai` - AI recommendations
- `POST /meal-plan/generate/ai` - AI meal planning

**Products** (2 endpoints)
- `GET /products` - List products
- `GET /products/{id}` - Get product details

**Meals** (1 endpoint)
- `GET /meals` - List meals

**Total: 14 endpoints**

## Core Schemas

### Authentication
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Health Profile
```json
{
  "id": "profile_123",
  "userId": "user_123",
  "age": 30,
  "weight": 80,
  "height": 180,
  "gender": "M",
  "goal": "weight_loss",
  "activity_level": "moderate",
  "dietary_preferences": ["vegetarian"],
  "allergies": ["peanut"]
}
```

### Recommendations
```json
{
  "data": [
    {
      "product_id": "prod_123",
      "name": "Chicken Breast",
      "score": 95,
      "confidence": 0.92,
      "reason": "High protein, low fat",
      "nutritional_fit": "excellent"
    }
  ],
  "total": 1,
  "page": 1
}
```

### Nutrition Calculation
```json
{
  "bmr": 1700,
  "tdee": 2550,
  "macros": {
    "protein_grams": 120,
    "carbs_grams": 287,
    "fat_grams": 85
  },
  "water_liters": 3.5
}
```

## Authentication

### Bearer Token (JWT)

All protected endpoints require JWT authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.sports-nutrition.app/api/v1/health-profile
```

### Getting a Token

1. Register or login to get JWT token
2. Include in `Authorization` header: `Bearer <token>`
3. Token typically expires in 24 hours

## Common Use Cases

### 1. User Registration & Login

```bash
# Register
curl -X POST https://api.sports-nutrition.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "age": 30,
    "gender": "M"
  }'

# Login
curl -X POST https://api.sports-nutrition.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Get Personalized Recommendations

```bash
curl "https://api.sports-nutrition.app/api/v1/recommendations?goal=weight_loss&activity_level=moderate&limit=10" \
  -H "X-User-ID: user_123"
```

### 3. Calculate Nutritional Needs

```bash
curl "https://api.sports-nutrition.app/api/v1/nutrition/calculate?age=30&weight=80&height=180&gender=M&activity_level=moderate"
```

### 4. Generate AI Meal Plan

```bash
curl -X POST https://api.sports-nutrition.app/api/v1/meal-plan/generate/ai \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "meals_per_day": 3,
    "dietary_preferences": ["vegetarian"],
    "duration_days": 7
  }'
```

## Error Handling

### Error Response Format

```json
{
  "error": "ValidationError",
  "message": "Invalid input parameters",
  "code": "INVALID_PARAMS",
  "details": {
    "age": "Must be between 13 and 120"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Recommendation retrieved |
| 201 | Created | User registered |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Product not found |
| 409 | Conflict | User already exists |
| 500 | Server Error | Database error |
| 503 | Unavailable | AI Service down (uses fallback) |

## Parameter Validation

### Required Parameters

All endpoints have documented required parameters:

```
GET /recommendations
  REQUIRED: goal, activity_level
  OPTIONAL: limit, exclude_categories

GET /nutrition/calculate
  REQUIRED: age, weight, height, gender, activity_level
```

### Parameter Types

```
Query Parameters:  ?param=value
Path Parameters:   /resource/{id}
Header Parameters: X-Custom-Header: value
Body Parameters:   JSON in request body
```

### Enumerated Values

```
goal: ["weight_loss", "muscle_gain", "health", "strength"]
activity_level: ["sedentary", "lightly_active", "moderate", "very_active", "athlete"]
gender: ["M", "F"]
```

## Rate Limiting

Planned for future versions:
- Per-user rate limits: 1000 requests/hour
- Per-endpoint rate limits (varies)
- Burst allowance: 100 requests/minute

Monitor rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1638345600
```

## Versioning

Current version: **1.1.0**

### Version Strategy
- Major version in URL: `/api/v1/`
- Backwards-compatible changes: Minor/Patch version
- Breaking changes: Major version upgrade
- Deprecation period: 6 months notice

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.sports-nutrition.app/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get recommendations
const recommendations = await api.get('/recommendations', {
  params: {
    goal: 'weight_loss',
    activity_level: 'moderate'
  }
});

// Generate meal plan
const mealPlan = await api.post('/meal-plan/generate/ai', {
  user_goal: 'weight_loss',
  meals_per_day: 3,
  duration_days: 7
});
```

### Python

```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

api = 'https://api.sports-nutrition.app/api/v1'

# Get recommendations
response = requests.get(
    f'{api}/recommendations',
    params={
        'goal': 'weight_loss',
        'activity_level': 'moderate'
    },
    headers=headers
)
recommendations = response.json()

# Calculate nutrition
response = requests.get(
    f'{api}/nutrition/calculate',
    params={
        'age': 30,
        'weight': 80,
        'height': 180,
        'gender': 'M',
        'activity_level': 'moderate'
    }
)
nutrition = response.json()
```

### cURL

```bash
#!/bin/bash

API="https://api.sports-nutrition.app/api/v1"
TOKEN="your_jwt_token"

# Get recommendations
curl "$API/recommendations?goal=weight_loss&activity_level=moderate" \
  -H "X-User-ID: user_123"

# With authentication
curl "$API/health-profile" \
  -H "Authorization: Bearer $TOKEN"

# POST request with data
curl -X POST "$API/meal-plan/generate/ai" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_goal": "weight_loss",
    "meals_per_day": 3,
    "duration_days": 7
  }'
```

## Testing with OpenAPI Tools

### Generate Client SDKs

```bash
# Install OpenAPI Generator
npm install @openapitools/openapi-generator-cli

# Generate TypeScript client
npx openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g typescript-axios \
  -o generated/api-client

# Generate Python client
npx openapi-generator-cli generate \
  -i docs/openapi-spec.json \
  -g python \
  -o generated/api-client-python
```

### Validate Spec

```bash
# Install spectacle or api-extractor
npm install -g spectacle

# Validate spec
spectacle docs/openapi-spec.json --validate

# Generate static HTML docs
spectacle docs/openapi-spec.json -t docs/api-docs.html
```

## API Deployment

### Before Production

- [ ] All endpoints tested
- [ ] Error handling complete
- [ ] Rate limiting configured
- [ ] Documentation up-to-date
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Monitoring/logging enabled

### Health Check

Verify API health before use:

```bash
curl https://api.sports-nutrition.app/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "sports-nutrition-api",
  "timestamp": "2025-01-15T14:30:00Z",
  "version": "1.1.0"
}
```

## Changelog

### Version 1.1.0 (Current)
- Added AI-powered recommendations endpoint
- Added meal plan generation endpoint
- Improved error handling and validation
- Complete OpenAPI 3.0 specification

### Version 1.0.0
- Initial API release
- Basic recommendations
- Product catalog
- User authentication

## Resources

- **OpenAPI Spec:** [docs/openapi-spec.json](../openapi-spec.json)
- **API Contracts:** [docs/API_CONTRACTS.md](./API_CONTRACTS.md)
- **Backend Testing:** [backend-api/TESTING_GUIDE.md](../backend-api/TESTING_GUIDE.md)
- **Project Documentation:** [docs/PROJECT_ANALYSIS_REPORT.md](./PROJECT_ANALYSIS_REPORT.md)

## Support

For API issues:
1. Check endpoint documentation in OpenAPI spec
2. Review error response for details
3. Verify authentication token
4. Check health status
5. Contact support team

---

**Last Updated:** 2025-01-15
**Status:** Complete ✓
**Version:** 1.1.0
