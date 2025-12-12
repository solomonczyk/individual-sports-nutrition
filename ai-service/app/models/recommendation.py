from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProductRecommendationRequest(BaseModel):
    user_id: str
    goal: str  # mass, cut, maintain, endurance
    activity_level: str  # low, moderate, high, very_high
    age: int
    gender: str  # male, female, other
    weight: float
    height: float
    diseases: Optional[List[str]] = []
    medications: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    max_products: Optional[int] = 10
    exclude_product_ids: Optional[List[str]] = []


class ProductRecommendationResponse(BaseModel):
    product_id: str
    score: float
    confidence: float
    reasons: List[str]
    warnings: List[str]
    dosage_recommendation: Optional[dict] = None


class RecommendationsResponse(BaseModel):
    recommendations: List[ProductRecommendationResponse]
    generated_at: datetime
    user_profile_summary: dict

