# API Contracts & OpenAPI Specification

## Overview

This document defines the contracts for inter-service communication between:
- `backend-api` ↔ `ai-service`
- `mobile-app` → `backend-api` → `ai-service`

## Backend API → AI Service Endpoints

### GET `/api/v1/recommendations`

**Purpose:** Backend fetches base product recommendations from database, AI service enriches them.

**Request Headers:**
```
X-User-ID: string (required) - User UUID or ID
```

**Response:**
```json
{
  "success": boolean,
  "data": [
    {
      "id": "string",
      "product": {
        "id": "string",
        "name": "string",
        "type": "protein | creatine | pre_workout | post_workout | fat_burner | amino | vitamin | other",
        "brand": {
          "name": "string",
          "verified": boolean,
          "premium": boolean
        },
        "macros": {
          "calories": number,
          "protein": number,
          "carbs": number,
          "fats": number
        }
      },
      "score": number (0-100),
      "reasons": ["string"],
      "warnings": ["string"]
    }
  ],
  "timestamp": "ISO8601"
}
```

**Error Responses:**
- `400 Bad Request` - Missing X-User-ID header
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database or processing error

**Status Code:** `200 OK`

---

### GET `/api/v1/nutrition/calculate`

**Purpose:** Backend calculates personalized nutritional needs (TDEE, macros) based on user profile.

**Request Headers:**
```
X-User-ID: string (required) - User UUID or ID
```

**Request Query Parameters:**
```
goal?: "mass" | "cut" | "maintain" | "endurance" (defaults to "maintain")
activity_level?: "low" | "moderate" | "high" | "very_high" (defaults to "moderate")
```

**Response:**
```json
{
  "success": boolean,
  "data": {
    "user_id": "string",
    "weight": number (kg),
    "height": number (cm),
    "age": number,
    "gender": "male" | "female",
    "goal": "mass" | "cut" | "maintain" | "endurance",
    "activity_level": "low" | "moderate" | "high" | "very_high",
    "bmr": number (Basal Metabolic Rate, kcal/day),
    "tdee": number (Total Daily Energy Expenditure, kcal/day),
    "calories": number (adjusted for goal),
    "protein": number (grams/day),
    "carbs": number (grams/day),
    "fats": number (grams/day),
    "calculation_method": "Mifflin-St Jeor",
    "timestamp": "ISO8601"
  },
  "timestamp": "ISO8601"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid goal or activity_level
- `404 Not Found` - User profile not found
- `500 Internal Server Error` - Calculation error

**Status Code:** `200 OK`

---

## AI Service Endpoints

### POST `/recommendations/ai`

**Purpose:** AI service generates enhanced product recommendations using ML scoring.

**Request Body:**
```json
{
  "user_id": "string (required)",
  "goal": "mass" | "cut" | "maintain" | "endurance" (required)",
  "activity_level": "low" | "moderate" | "high" | "very_high" (required)",
  "age": number (required),
  "gender": "male" | "female" (required)",
  "weight": number (kg, required)",
  "height": number (cm, optional, defaults to 175)",
  "max_products": number (optional, defaults to 10),
  "exclude_products": ["string"] (optional)
}
```

**Request Headers:**
```
Content-Type: application/json
X-User-ID: string (optional, overrides user_id in body)
```

**Response:**
```json
{
  "recommendations": [
    {
      "product_id": "string",
      "score": number (0-100, AI-enhanced),
      "confidence": number (0-1, confidence in recommendation),
      "reasons": ["string"],
      "warnings": ["string"],
      "dosage_recommendation": {
        "frequency": "daily" | "post_workout",
        "timing": "string",
        "servings_per_day": number,
        "grams_per_day": number,
        "notes": ["string"]
      }
    }
  ],
  "generated_at": "ISO8601",
  "user_profile_summary": {
    "goal": "string",
    "activity_level": "string",
    "age": number,
    "gender": "string"
  }
}
```

**Status Code:** `200 OK`

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - ML processing error

---

### POST `/meal-plan/generate/ai`

**Purpose:** AI service generates personalized meal plans optimized for user goals.

**Request Body:**
```json
{
  "user_id": "string (required)",
  "goal": "mass" | "cut" | "maintain" | "endurance" (required)",
  "activity_level": "low" | "moderate" | "high" | "very_high" (required)",
  "age": number (required)",
  "gender": "male" | "female" (required)",
  "weight": number (kg, required)",
  "height": number (cm, optional)",
  "days": number (days to plan for, defaults to 7, max 30)",
  "preferences": {
    "allergies": ["string"],
    "exclude_ingredients": ["string"],
    "cuisine_preferences": ["string"]
  },
  "serbian_cuisine_ratio": number (0-1, defaults to 0.6)
}
```

**Request Headers:**
```
Content-Type: application/json
X-User-ID: string (optional, overrides user_id in body)
```

**Response:**
```json
{
  "meal_plan": [
    {
      "day": number (1-30),
      "date": "ISO8601",
      "meals": [
        {
          "meal_type": "breakfast" | "lunch" | "dinner" | "snack1" | "snack2" | "snack3",
          "time": "HH:MM",
          "foods": [
            {
              "id": "string",
              "name": "string",
              "quantity": number,
              "unit": "g" | "ml" | "serving",
              "calories": number,
              "macros": {
                "protein": number,
                "carbs": number,
                "fats": number
              }
            }
          ],
          "totals": {
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number
          }
        }
      ],
      "daily_totals": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number
      },
      "nutrition_notes": ["string"]
    }
  ],
  "summary": {
    "total_days": number,
    "average_daily_calories": number,
    "average_daily_protein": number,
    "serbian_cuisine_ratio": number,
    "generated_at": "ISO8601"
  }
}
```

**Status Code:** `200 OK`

**Error Responses:**
- `400 Bad Request` - Invalid request data or unsupported day range
- `500 Internal Server Error` - Meal plan generation error

---

## Data Type Definitions

### Product Type Enum
```
"protein"      - Protein powder/isolate
"creatine"     - Creatine supplements
"pre_workout"  - Pre-workout energizers
"post_workout" - Recovery supplements
"fat_burner"   - Weight loss supplements
"amino"        - Amino acid supplements
"vitamin"      - Vitamins and minerals
"other"        - Other supplements
```

### Goal Enum
```
"mass"       - Muscle gain (caloric surplus)
"cut"        - Fat loss (caloric deficit)
"maintain"   - Weight maintenance
"endurance"  - Endurance/stamina training
```

### Activity Level Enum
```
"low"       - Sedentary (little/no exercise)
"moderate"  - Lightly active (1-3 days/week)
"high"      - Very active (3-6 days/week)
"very_high" - Extremely active (6-7 days/week or professional)
```

---

## Validation Rules

### User ID
- Required in all requests
- Must be a valid UUID or alphanumeric string
- Cannot be empty or whitespace-only

### Age
- Must be between 13 and 120
- Integer only

### Weight / Height
- Weight: must be > 0 and < 500 kg
- Height: must be > 50 and < 300 cm

### Macros (in responses)
- All non-negative numbers
- In grams for daily values, in grams per serving for product macros
- Calories in kcal

### Confidence Score
- Range: 0.0 to 1.0 (float)
- 0 = no confidence, 1.0 = absolute certainty
- Capped at 0.98 (never 100% to avoid overconfidence)

---

## Integration Notes

### Between Backend & AI Service

1. **Timeout:** All HTTP calls should have 30-second timeout (backend → ai-service)
2. **Retry:** Implement exponential backoff with 3 retries for network failures
3. **Caching:** Consider caching `nutrition/calculate` for 1 hour per user
4. **Circuit Breaker:** Monitor AI service health; fallback to base recommendations if unavailable

### Between Mobile & Backend

1. **Authentication:** Use JWT token in `Authorization: Bearer <token>` header
2. **User Context:** `X-User-ID` header passed transparently to AI service
3. **Versioning:** All endpoints under `/api/v1/`; increment to `/api/v2/` for breaking changes
4. **Rate Limiting:** Recommend 100 requests/min per user ID

---

## Example Curl Requests

### Fetch Recommendations (Backend → AI)

```bash
curl -X POST http://ai-service:8000/recommendations/ai \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-12345" \
  -d '{
    "user_id": "user-12345",
    "goal": "mass",
    "activity_level": "high",
    "age": 28,
    "gender": "male",
    "weight": 80,
    "height": 180,
    "max_products": 10
  }'
```

### Calculate Nutrition (Backend)

```bash
curl -X GET "http://localhost:3000/api/v1/nutrition/calculate?goal=cut&activity_level=moderate" \
  -H "X-User-ID: user-12345"
```

### Generate Meal Plan (Backend → AI)

```bash
curl -X POST http://ai-service:8000/meal-plan/generate/ai \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-12345" \
  -d '{
    "user_id": "user-12345",
    "goal": "maintain",
    "activity_level": "moderate",
    "age": 28,
    "gender": "male",
    "weight": 80,
    "days": 7,
    "preferences": {
      "allergies": ["peanut"],
      "exclude_ingredients": ["gluten"]
    },
    "serbian_cuisine_ratio": 0.6
  }'
```

---

## Status & TODO

- [x] Document `/api/v1/recommendations` contract
- [x] Document `/api/v1/nutrition/calculate` contract
- [x] Document AI `/recommendations/ai` endpoint
- [x] Document AI `/meal-plan/generate/ai` endpoint
- [ ] Implement OpenAPI 3.0 YAML spec file
- [ ] Add request/response validation middleware to backend-api
- [ ] Add integration tests for all three services
- [ ] Document error scenarios and recovery strategies
