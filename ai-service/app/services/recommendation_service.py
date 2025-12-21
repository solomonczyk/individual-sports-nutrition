"""
AI-powered recommendation service
Uses ML models to provide personalized product recommendations
"""
from typing import List, Dict, Optional
from datetime import datetime
from app.models.recommendation import (
    ProductRecommendationRequest,
    ProductRecommendationResponse,
    RecommendationsResponse,
)
from app.ml.scoring import ProductScorer
from app.utils.logger import logger
from app.utils.http_client import AsyncHTTPClient


class RecommendationService:
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url
        self.client = AsyncHTTPClient(timeout=30.0, max_retries=3, backoff_factor=0.5)
        self.scorer = ProductScorer()

    async def get_ai_recommendations(
        self, request: ProductRecommendationRequest
    ) -> RecommendationsResponse:
        """
        Generate AI-powered product recommendations
        
        Enhanced implementation that:
        1. Fetches base recommendations from backend API
        2. Fetches nutritional needs for personalized scoring
        3. Enhances them with advanced AI scoring
        4. Returns improved recommendations with confidence scores
        """
        try:
            logger.info(f"Generating AI recommendations for user {request.user_id}")
            
            # Fetch base recommendations from backend
            rec_response = await self.client.get(
                f"{self.backend_api_url}/api/v1/recommendations",
                headers={"X-User-ID": request.user_id},
            )
            
            if rec_response.status_code != 200:
                logger.warning(f"Backend API returned {rec_response.status_code}")
                raise Exception(f"Backend API returned {rec_response.status_code}")
            
            data = rec_response.json()
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
            
            # Fetch nutritional needs for enhanced scoring
            nutritional_needs = None
            try:
                nutrition_response = await self.client.get(
                    f"{self.backend_api_url}/api/v1/nutrition/calculate",
                    headers={"X-User-ID": request.user_id},
                )
                if nutrition_response.status_code == 200:
                    nutrition_data = nutrition_response.json()
                    if nutrition_data.get("success"):
                        needs_data = nutrition_data.get("data", {})
                        nutritional_needs = {
                            "calories": needs_data.get("calories", 0),
                            "protein": needs_data.get("protein", 0),
                            "carbs": needs_data.get("carbs", 0),
                            "fats": needs_data.get("fats", 0),
                        }
                        logger.info(f"Using nutritional needs: {nutritional_needs}")
            except Exception as e:
                logger.warning(f"Could not fetch nutritional needs: {str(e)}, using defaults")
            
            # Enhance with AI scoring
            enhanced = self._enhance_recommendations(
                base_recommendations, request, nutritional_needs
            )
            
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
        self,
        base_recommendations: List[Dict],
        request: ProductRecommendationRequest,
        nutritional_needs: Optional[Dict] = None,
    ) -> List[ProductRecommendationResponse]:
        """
        Enhance recommendations with AI scoring
        
        Args:
            base_recommendations: Base recommendations from backend
            request: Request with user profile data
            nutritional_needs: Optional pre-calculated nutritional needs
        """
        enhanced = []
        
        user_profile = {
            "goal": request.goal,
            "activity_level": request.activity_level,
            "age": request.age,
            "gender": request.gender,
            "weight": request.weight,
            "height": request.height if hasattr(request, "height") else 175,
        }
        
        for rec in base_recommendations:
            product = rec.get("product", {})
            base_score = rec.get("score", 50)
            
            # Calculate enhanced AI score with nutritional needs
            ai_score = self.scorer.calculate_score(
                product,
                user_profile,
                base_score,
                nutritional_needs,
            )
            
            # Calculate confidence with product data
            confidence = self.scorer.calculate_confidence(
                ai_score,
                product.get("type", ""),
                user_profile,
                rec.get("reasons", []),
                product,  # Pass product for brand verification
            )
            
            # Enhance reasons based on AI analysis
            enhanced_reasons = self._generate_ai_reasons(
                product,
                user_profile,
                rec.get("reasons", []),
                nutritional_needs,
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
        self,
        product: Dict,
        user_profile: Dict,
        base_reasons: List[str],
        nutritional_needs: Optional[Dict] = None,
    ) -> List[str]:
        """Generate enhanced reasons based on AI analysis with nutritional context"""
        reasons = list(base_reasons)  # Keep base reasons
        
        goal = user_profile.get("goal", "maintain")
        activity_level = user_profile.get("activity_level", "moderate")
        product_type = product.get("type", "")
        weight = user_profile.get("weight", 70)
        macros = product.get("macros", {}) or {}
        
        # Add AI-generated reasons based on goal
        if goal == "mass" and product_type == "protein":
            protein = macros.get("protein", 0)
            if protein >= 25:
                reasons.append(f"High protein content ({protein}g) ideal for muscle growth")
            else:
                reasons.append("High protein content ideal for muscle growth")
        
        if goal == "cut" and product_type == "fat_burner":
            reasons.append("Supports fat loss goals")
        
        if goal == "cut" and macros.get("calories", 0) < 150:
            reasons.append("Low-calorie option perfect for cutting phase")
        
        if activity_level in ["high", "very_high"] and product_type == "creatine":
            reasons.append("Enhances performance for high-intensity training")
        
        if activity_level in ["high", "very_high"] and product_type == "post_workout":
            reasons.append("Accelerates recovery after intense workouts")
        
        # Add reasons based on nutritional needs
        if nutritional_needs:
            daily_protein = nutritional_needs.get("protein", 0)
            product_protein = macros.get("protein", 0)
            if product_protein > 0 and daily_protein > 0:
                contribution = (product_protein / daily_protein) * 100
                if 10 <= contribution <= 25:
                    reasons.append(
                        f"Provides {contribution:.0f}% of daily protein needs per serving"
                    )
        
        # Protein quality reasons
        protein = macros.get("protein", 0)
        if protein >= 25:
            reasons.append("Excellent protein source (25g+)")
        elif protein >= 20:
            reasons.append("High-quality protein source")
        
        # Brand verification
        brand = product.get("brand", {})
        if brand.get("verified", False):
            reasons.append("Verified and trusted brand")
        
        # Remove duplicates and limit
        unique_reasons = []
        seen = set()
        for reason in reasons:
            reason_lower = reason.lower()
            if reason_lower not in seen:
                seen.add(reason_lower)
                unique_reasons.append(reason)
        
        return unique_reasons[:5]  # Limit to 5 most relevant reasons

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
