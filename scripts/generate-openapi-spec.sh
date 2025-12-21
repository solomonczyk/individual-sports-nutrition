#!/bin/bash
# OpenAPI Specification Generator for Sports Nutrition API
# Generates comprehensive OpenAPI 3.0 spec from Express routes

# Output file
OUTPUT_FILE="docs/openapi-spec.json"

# Generate OpenAPI spec
cat > "$OUTPUT_FILE" << 'OPENAPI_SPEC'
{
  "openapi": "3.0.0",
  "info": {
    "title": "Sports Nutrition API",
    "description": "Comprehensive REST API for nutritional recommendations, meal planning, and product management",
    "version": "1.1.0",
    "contact": {
      "name": "Sports Nutrition Team",
      "email": "api@sports-nutrition.app"
    },
    "license": {
      "name": "Apache 2.0"
    }
  },
  "servers": [
    {
      "url": "http://localhost:3000/api/v1",
      "description": "Development server"
    },
    {
      "url": "https://api.sports-nutrition.app/api/v1",
      "description": "Production server"
    },
    {
      "url": "https://staging-api.sports-nutrition.app/api/v1",
      "description": "Staging server"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "tags": ["Health"],
        "summary": "Health check endpoint",
        "description": "Returns the health status of the API service",
        "operationId": "getHealth",
        "responses": {
          "200": {
            "description": "Service is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthResponse"
                },
                "example": {
                  "status": "healthy",
                  "service": "sports-nutrition-api",
                  "timestamp": "2025-01-15T14:30:00Z",
                  "version": "1.1.0",
                  "uptime_seconds": 3600
                }
              }
            }
          }
        }
      }
    },
    "/auth/register": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Register new user",
        "description": "Create a new user account",
        "operationId": "registerUser",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RegisterRequest"
              },
              "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!",
                "firstName": "John",
                "lastName": "Doe",
                "age": 30,
                "gender": "M"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User registered successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "409": {
            "description": "User already exists"
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Authentication"],
        "summary": "User login",
        "description": "Authenticate user and return JWT token",
        "operationId": "loginUser",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthResponse"
                }
              }
            }
          },
          "401": {
            "description": "Invalid credentials"
          }
        }
      }
    },
    "/health-profile": {
      "get": {
        "tags": ["Health Profile"],
        "summary": "Get user health profile",
        "operationId": "getHealthProfile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "userId",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "User ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Health profile retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthProfile"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized"
          },
          "404": {
            "description": "Profile not found"
          }
        }
      },
      "put": {
        "tags": ["Health Profile"],
        "summary": "Update user health profile",
        "operationId": "updateHealthProfile",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/HealthProfileUpdate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile updated successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HealthProfile"
                }
              }
            }
          },
          "400": {
            "description": "Invalid input"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/recommendations": {
      "get": {
        "tags": ["Recommendations"],
        "summary": "Get personalized recommendations",
        "operationId": "getRecommendations",
        "parameters": [
          {
            "name": "X-User-ID",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "User ID"
          },
          {
            "name": "goal",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": ["weight_loss", "muscle_gain", "health", "strength"]
            },
            "description": "User fitness goal"
          },
          {
            "name": "activity_level",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": ["sedentary", "lightly_active", "moderate", "very_active", "athlete"]
            },
            "description": "Activity level"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 10,
              "minimum": 1,
              "maximum": 50
            },
            "description": "Maximum number of recommendations"
          },
          {
            "name": "exclude_categories",
            "in": "query",
            "schema": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "description": "Product categories to exclude"
          }
        ],
        "responses": {
          "200": {
            "description": "Recommendations retrieved",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RecommendationsResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid parameters",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/nutrition/calculate": {
      "get": {
        "tags": ["Nutrition"],
        "summary": "Calculate nutritional requirements",
        "operationId": "calculateNutrition",
        "parameters": [
          {
            "name": "age",
            "in": "query",
            "required": true,
            "schema": {
              "type": "integer",
              "minimum": 13,
              "maximum": 120
            },
            "description": "User age in years"
          },
          {
            "name": "weight",
            "in": "query",
            "required": true,
            "schema": {
              "type": "number",
              "minimum": 30,
              "maximum": 300
            },
            "description": "Weight in kilograms"
          },
          {
            "name": "height",
            "in": "query",
            "required": true,
            "schema": {
              "type": "number",
              "minimum": 100,
              "maximum": 250
            },
            "description": "Height in centimeters"
          },
          {
            "name": "gender",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": ["M", "F"]
            },
            "description": "Biological gender"
          },
          {
            "name": "activity_level",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "enum": ["sedentary", "lightly_active", "moderate", "very_active", "athlete"]
            },
            "description": "Activity level"
          }
        ],
        "responses": {
          "200": {
            "description": "Nutritional requirements calculated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/NutritionCalculation"
                },
                "example": {
                  "bmr": 1700,
                  "tdee": 2550,
                  "macros": {
                    "protein_grams": 120,
                    "carbs_grams": 287,
                    "fat_grams": 85
                  },
                  "water_liters": 3.5
                }
              }
            }
          },
          "400": {
            "description": "Invalid parameters"
          }
        }
      }
    },
    "/recommendations/ai": {
      "post": {
        "tags": ["AI Recommendations"],
        "summary": "Generate AI-powered recommendations",
        "operationId": "generateAIRecommendations",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/AIRecommendationRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "AI recommendations generated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AIRecommendationResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          },
          "503": {
            "description": "AI Service temporarily unavailable, using fallback"
          }
        }
      }
    },
    "/meal-plan/generate/ai": {
      "post": {
        "tags": ["Meal Planning"],
        "summary": "Generate AI meal plan",
        "operationId": "generateAIMealPlan",
        "security": [
          {
            "BearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MealPlanRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Meal plan generated",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MealPlanResponse"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/products": {
      "get": {
        "tags": ["Products"],
        "summary": "List products with filters",
        "operationId": "listProducts",
        "parameters": [
          {
            "name": "category",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Product category"
          },
          {
            "name": "search",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Search term"
          },
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Page number"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 20,
              "maximum": 100
            },
            "description": "Results per page"
          }
        ],
        "responses": {
          "200": {
            "description": "Products list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ProductsListResponse"
                }
              }
            }
          }
        }
      }
    },
    "/products/{id}": {
      "get": {
        "tags": ["Products"],
        "summary": "Get product details",
        "operationId": "getProduct",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Product ID"
          }
        ],
        "responses": {
          "200": {
            "description": "Product details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Product"
                }
              }
            }
          },
          "404": {
            "description": "Product not found"
          }
        }
      }
    },
    "/meals": {
      "get": {
        "tags": ["Meals"],
        "summary": "List meals",
        "operationId": "listMeals",
        "parameters": [
          {
            "name": "meal_type",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": ["breakfast", "lunch", "dinner", "snack"]
            },
            "description": "Type of meal"
          },
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer",
              "default": 1
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Meals list",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MealsListResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT Bearer token for API authentication"
      }
    },
    "schemas": {
      "HealthResponse": {
        "type": "object",
        "properties": {
          "status": {
            "type": "string",
            "enum": ["healthy", "degraded", "unhealthy"]
          },
          "service": {
            "type": "string"
          },
          "timestamp": {
            "type": "string",
            "format": "date-time"
          },
          "version": {
            "type": "string"
          },
          "uptime_seconds": {
            "type": "integer"
          }
        },
        "required": ["status", "service", "timestamp"]
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "details": {
            "type": "object"
          }
        },
        "required": ["error", "message"]
      },
      "RegisterRequest": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string",
            "format": "email"
          },
          "password": {
            "type": "string",
            "minLength": 8
          },
          "firstName": {
            "type": "string"
          },
          "lastName": {
            "type": "string"
          },
          "age": {
            "type": "integer"
          },
          "gender": {
            "type": "string",
            "enum": ["M", "F"]
          }
        },
        "required": ["email", "password", "firstName", "lastName"]
      },
      "LoginRequest": {
        "type": "object",
        "properties": {
          "email": {
            "type": "string",
            "format": "email"
          },
          "password": {
            "type": "string"
          }
        },
        "required": ["email", "password"]
      },
      "AuthResponse": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string",
            "description": "JWT access token"
          },
          "user": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "email": {
                "type": "string"
              },
              "firstName": {
                "type": "string"
              },
              "lastName": {
                "type": "string"
              }
            }
          }
        }
      },
      "HealthProfile": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "userId": {
            "type": "string"
          },
          "age": {
            "type": "integer"
          },
          "weight": {
            "type": "number"
          },
          "height": {
            "type": "number"
          },
          "gender": {
            "type": "string"
          },
          "goal": {
            "type": "string"
          },
          "activity_level": {
            "type": "string"
          },
          "dietary_preferences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "allergies": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "HealthProfileUpdate": {
        "type": "object",
        "properties": {
          "weight": {
            "type": "number"
          },
          "goal": {
            "type": "string"
          },
          "activity_level": {
            "type": "string"
          },
          "dietary_preferences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "allergies": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "RecommendationsResponse": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Recommendation"
            }
          },
          "total": {
            "type": "integer"
          },
          "page": {
            "type": "integer"
          }
        }
      },
      "Recommendation": {
        "type": "object",
        "properties": {
          "product_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100
          },
          "confidence": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          },
          "reason": {
            "type": "string"
          },
          "nutritional_fit": {
            "type": "string"
          }
        }
      },
      "NutritionCalculation": {
        "type": "object",
        "properties": {
          "bmr": {
            "type": "number",
            "description": "Basal Metabolic Rate (calories/day)"
          },
          "tdee": {
            "type": "number",
            "description": "Total Daily Energy Expenditure (calories/day)"
          },
          "macros": {
            "type": "object",
            "properties": {
              "protein_grams": {
                "type": "number"
              },
              "carbs_grams": {
                "type": "number"
              },
              "fat_grams": {
                "type": "number"
              }
            }
          },
          "water_liters": {
            "type": "number"
          }
        }
      },
      "AIRecommendationRequest": {
        "type": "object",
        "properties": {
          "user_goal": {
            "type": "string"
          },
          "dietary_preferences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "allergies": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "meal_count": {
            "type": "integer"
          }
        }
      },
      "AIRecommendationResponse": {
        "type": "object",
        "properties": {
          "recommendations": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Recommendation"
            }
          },
          "ai_score": {
            "type": "number"
          },
          "generated_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "MealPlanRequest": {
        "type": "object",
        "properties": {
          "user_goal": {
            "type": "string"
          },
          "meals_per_day": {
            "type": "integer",
            "minimum": 1,
            "maximum": 6
          },
          "dietary_preferences": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "duration_days": {
            "type": "integer",
            "minimum": 1,
            "maximum": 30
          }
        }
      },
      "MealPlanResponse": {
        "type": "object",
        "properties": {
          "meal_plan": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "day": {
                  "type": "integer"
                },
                "meals": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Meal"
                  }
                }
              }
            }
          },
          "total_calories": {
            "type": "number"
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Product": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "nutrition": {
            "type": "object",
            "properties": {
              "calories": {
                "type": "number"
              },
              "protein": {
                "type": "number"
              },
              "carbs": {
                "type": "number"
              },
              "fat": {
                "type": "number"
              }
            }
          },
          "price": {
            "type": "number"
          },
          "availability": {
            "type": "boolean"
          }
        }
      },
      "Meal": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "meal_type": {
            "type": "string",
            "enum": ["breakfast", "lunch", "dinner", "snack"]
          },
          "products": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Product"
            }
          },
          "total_calories": {
            "type": "number"
          }
        }
      },
      "ProductsListResponse": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Product"
            }
          },
          "total": {
            "type": "integer"
          },
          "page": {
            "type": "integer"
          },
          "pages": {
            "type": "integer"
          }
        }
      },
      "MealsListResponse": {
        "type": "object",
        "properties": {
          "data": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/Meal"
            }
          },
          "total": {
            "type": "integer"
          },
          "page": {
            "type": "integer"
          }
        }
      }
    }
  },
  "tags": [
    {
      "name": "Health",
      "description": "Service health and status"
    },
    {
      "name": "Authentication",
      "description": "User authentication endpoints"
    },
    {
      "name": "Health Profile",
      "description": "User health profile management"
    },
    {
      "name": "Recommendations",
      "description": "Personalized product recommendations"
    },
    {
      "name": "Nutrition",
      "description": "Nutritional calculations and information"
    },
    {
      "name": "AI Recommendations",
      "description": "AI-powered recommendations"
    },
    {
      "name": "Meal Planning",
      "description": "Meal plan generation"
    },
    {
      "name": "Products",
      "description": "Product catalog"
    },
    {
      "name": "Meals",
      "description": "Meal management"
    }
  ]
}
OPENAPI_SPEC

echo "✓ OpenAPI spec generated: $OUTPUT_FILE"
echo ""
echo "Spec can be viewed with:"
echo "  - Swagger UI: https://editor.swagger.io (paste spec content)"
echo "  - ReDoc: https://redocly.github.io/redoc/ (paste spec content)"
echo "  - OpenAPI CLI: openapi info $OUTPUT_FILE"
