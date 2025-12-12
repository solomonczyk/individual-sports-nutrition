"""
AI-powered recommendation service
Uses ML models to provide personalized product recommendations
"""
from typing import List, Dict
from datetime import datetime
from app.models.recommendation import (
    ProductRecommendationRequest,
    ProductRecommendationResponse,
    RecommendationsResponse,
)
import httpx


class RecommendationService:
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_ai_recommendations(
        self, request: ProductRecommendationRequest
    ) -> RecommendationsResponse:
        """
        Generate AI-powered product recommendations
        
        This is a placeholder implementation that:
        1. Fetches base recommendations from backend API
        2. Enhances them with AI scoring
        3. Returns improved recommendations
        """
        # For now, delegate to backend API
        # In future, this will use ML models for better scoring
        
        try:
            # Fetch base recommendations from backend
            response = await self.client.get(
                f"{self.backend_api_url}/api/v1/recommendations",
                headers={"X-User-ID": request.user_id},
            )
            
            if response.status_code != 200:
                raise Exception(f"Backend API returned {response.status_code}")
            
            data = response.json()
            base_recommendations = data.get("data", [])
            
            # Enhance with AI scoring (placeholder)
            enhanced = self._enhance_recommendations(base_recommendations, request)
            
            return RecommendationsResponse(
                recommendations=enhanced,
                generated_at=datetime.utcnow(),
                user_profile_summary={
                    "goal": request.goal,
                    "activity_level": request.activity_level,
                    "age": request.age,
                    "gender": request.gender,
                },
            )
            
        except Exception as e:
            raise Exception(f"Failed to get recommendations: {str(e)}")

    def _enhance_recommendations(
        self, base_recommendations: List[Dict], request: ProductRecommendationRequest
    ) -> List[ProductRecommendationResponse]:
        """
        Enhance recommendations with AI scoring
        
        This is a placeholder that will be replaced with actual ML model inference
        """
        enhanced = []
        
        for rec in base_recommendations:
            product = rec.get("product", {})
            base_score = rec.get("score", 50)
            
            # Placeholder AI enhancement logic
            # In future, this will use trained ML models
            ai_score = self._calculate_ai_score(product, request, base_score)
            confidence = min(ai_score / 100, 1.0)  # Normalize to 0-1
            
            enhanced.append(
                ProductRecommendationResponse(
                    product_id=product.get("id", ""),
                    score=ai_score,
                    confidence=confidence,
                    reasons=rec.get("reasons", []),
                    warnings=rec.get("warnings", []),
                    dosage_recommendation=None,
                )
            )
        
        # Sort by AI score
        enhanced.sort(key=lambda x: x.score, reverse=True)
        
        return enhanced[: request.max_products or 10]

    def _calculate_ai_score(
        self, product: Dict, request: ProductRecommendationRequest, base_score: float
    ) -> float:
        """
        Calculate AI-enhanced score for a product
        
        Placeholder implementation - will use ML model in future
        """
        score = base_score
        
        # Simple rule-based enhancements (to be replaced with ML)
        product_type = product.get("type", "")
        goal = request.goal
        
        # Boost protein for mass gain goal
        if goal == "mass" and product_type == "protein":
            score += 15
        
        # Boost fat burners for cut goal
        if goal == "cut" and product_type == "fat_burner":
            score += 20
        
        # Boost creatine for high activity
        if request.activity_level in ["high", "very_high"] and product_type == "creatine":
            score += 10
        
        # Penalize based on contraindications
        if request.diseases:
            # Simple check - in future use NLP to match diseases
            score -= 5
        
        return min(score, 100)  # Cap at 100

