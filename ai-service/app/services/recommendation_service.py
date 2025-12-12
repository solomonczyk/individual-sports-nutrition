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
from app.ml.scoring import ProductScorer
from app.utils.logger import logger
import httpx


class RecommendationService:
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.scorer = ProductScorer()

    async def get_ai_recommendations(
        self, request: ProductRecommendationRequest
    ) -> RecommendationsResponse:
        """
        Generate AI-powered product recommendations
        
        Enhanced implementation that:
        1. Fetches base recommendations from backend API
        2. Enhances them with advanced AI scoring
        3. Returns improved recommendations with confidence scores
        """
        try:
            logger.info(f"Generating AI recommendations for user {request.user_id}")
            
            # Fetch base recommendations from backend
            response = await self.client.get(
                f"{self.backend_api_url}/api/v1/recommendations",
                headers={"X-User-ID": request.user_id},
            )
            
            if response.status_code != 200:
                logger.warning(f"Backend API returned {response.status_code}")
                raise Exception(f"Backend API returned {response.status_code}")
            
            data = response.json()
            base_recommendations = data.get("data", [])
            
            if not base_recommendations:
                logger.warning("No base recommendations found")
                return RecommendationsResponse(
                    recommendations=[],
                    generated_at=datetime.utcnow(),
                    user_profile_summary={
                        "goal": request.goal,
                        "activity_level": request.activity_level,
                    },
                )
            
            # Enhance with AI scoring
            enhanced = self._enhance_recommendations(base_recommendations, request)
            
            logger.info(f"Generated {len(enhanced)} enhanced recommendations")
            
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
            logger.error(f"Failed to get recommendations: {str(e)}")
            raise Exception(f"Failed to get recommendations: {str(e)}")

    def _enhance_recommendations(
        self, base_recommendations: List[Dict], request: ProductRecommendationRequest
    ) -> List[ProductRecommendationResponse]:
        """
        Enhance recommendations with AI scoring
        """
        enhanced = []
        
        user_profile = {
            "goal": request.goal,
            "activity_level": request.activity_level,
            "age": request.age,
            "gender": request.gender,
            "weight": request.weight,
        }
        
        for rec in base_recommendations:
            product = rec.get("product", {})
            base_score = rec.get("score", 50)
            
            # Calculate enhanced AI score
            ai_score = self.scorer.calculate_score(
                product,
                user_profile,
                base_score,
            )
            
            # Calculate confidence
            confidence = self.scorer.calculate_confidence(
                ai_score,
                product.get("type", ""),
                user_profile,
                rec.get("reasons", []),
            )
            
            # Enhance reasons based on AI analysis
            enhanced_reasons = self._generate_ai_reasons(
                product,
                user_profile,
                rec.get("reasons", []),
            )
            
            enhanced.append(
                ProductRecommendationResponse(
                    product_id=product.get("id", ""),
                    score=ai_score,
                    confidence=round(confidence, 2),
                    reasons=enhanced_reasons,
                    warnings=rec.get("warnings", []),
                    dosage_recommendation=self._suggest_dosage(product, user_profile),
                )
            )
        
        # Sort by AI score (not base score)
        enhanced.sort(key=lambda x: x.score, reverse=True)
        
        # Filter and limit
        max_products = request.max_products or 10
        return enhanced[:max_products]

    def _generate_ai_reasons(
        self, product: Dict, user_profile: Dict, base_reasons: List[str]
    ) -> List[str]:
        """Generate enhanced reasons based on AI analysis"""
        reasons = list(base_reasons)  # Keep base reasons
        
        goal = user_profile.get("goal", "maintain")
        activity_level = user_profile.get("activity_level", "moderate")
        product_type = product.get("type", "")
        
        # Add AI-generated reasons
        if goal == "mass" and product_type == "protein":
            reasons.append("High protein content ideal for muscle growth")
        
        if goal == "cut" and product_type == "fat_burner":
            reasons.append("Supports fat loss goals")
        
        if activity_level in ["high", "very_high"] and product_type == "creatine":
            reasons.append("Enhances performance for high-intensity training")
        
        if activity_level in ["high", "very_high"] and product_type == "post_workout":
            reasons.append("Accelerates recovery after intense workouts")
        
        macros = product.get("macros", {})
        if macros.get("protein", 0) >= 20:
            reasons.append("Excellent protein source")
        
        return reasons[:5]  # Limit to 5 most relevant reasons

    def _suggest_dosage(self, product: Dict, user_profile: Dict) -> Dict:
        """Suggest optimal dosage based on product and user profile"""
        product_type = product.get("type", "")
        weight = user_profile.get("weight", 70)
        activity_level = user_profile.get("activity_level", "moderate")
        
        dosage = {
            "frequency": "daily",
            "timing": "post_workout",
            "notes": [],
        }
        
        if product_type == "protein":
            # Protein: 1.6-2.2g per kg bodyweight
            daily_protein_needs = weight * 2.0
            serving_protein = product.get("macros", {}).get("protein", 20)
            servings = max(1, int(daily_protein_needs / (serving_protein * 3)))  # Split across meals
            dosage["servings_per_day"] = servings
            dosage["timing"] = "post_workout and between meals"
        
        elif product_type == "creatine":
            dosage["grams_per_day"] = 5
            dosage["timing"] = "post_workout or before bed"
            dosage["notes"].append("Start with 3-5g daily")
        
        elif product_type == "pre_workout":
            dosage["servings_per_day"] = 1
            dosage["timing"] = "30 minutes before workout"
            dosage["notes"].append("Use only on training days")
        
        elif product_type == "post_workout":
            dosage["servings_per_day"] = 1
            dosage["timing"] = "immediately after workout"
        
        # Adjust for activity level
        if activity_level in ["high", "very_high"]:
            if "servings_per_day" in dosage:
                dosage["servings_per_day"] = int(dosage["servings_per_day"] * 1.2)
        
        return dosage
