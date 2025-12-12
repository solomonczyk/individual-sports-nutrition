"""
AI-powered meal plan generation service
Uses ML models to generate personalized meal plans
"""
from typing import List, Dict
from datetime import datetime, date
from app.models.meal_plan import MealPlanRequest, MealPlanResponse
from app.ml.meal_planner import MealPlanner
from app.utils.logger import logger
import httpx


class MealPlanService:
    def __init__(self, backend_api_url: str):
        self.backend_api_url = backend_api_url
        self.client = httpx.AsyncClient(timeout=30.0)
        self.meal_planner = MealPlanner()

    async def generate_ai_meal_plan(
        self, request: MealPlanRequest
    ) -> MealPlanResponse:
        """
        Generate AI-powered meal plan
        
        This is a placeholder implementation that:
        1. Fetches base meal plan from backend API
        2. Enhances it with AI optimization
        3. Returns improved meal plan
        """
        try:
            # For now, delegate to backend API
            # In future, this will use ML models for meal selection and optimization
            
            response = await self.client.post(
                f"{self.backend_api_url}/api/v1/meal-plan/generate",
                json={
                    "date": request.date.isoformat(),
                    "preferences": {
                        "cuisine_types": request.cuisine_types,
                        "exclude_ingredients": request.exclude_ingredients,
                        "meal_times": request.meal_times,
                    },
                },
                headers={"X-User-ID": request.user_id},
            )
            
            if response.status_code != 200:
                raise Exception(f"Backend API returned {response.status_code}")
            
            data = response.json()
            meal_plan_data = data.get("data", {})
            
            # Enhance with AI optimization
            enhanced_plan = self._enhance_meal_plan(meal_plan_data, request)
            
            logger.info(f"Generated enhanced meal plan for user {request.user_id}")
            
            return MealPlanResponse(
                meal_plan_id=enhanced_plan.get("id", ""),
                date=request.date,
                meals=enhanced_plan.get("meals", []),
                total_calories=enhanced_plan.get("total_calories", request.target_calories),
                total_protein=enhanced_plan.get("total_protein", request.target_protein),
                total_carbs=enhanced_plan.get("total_carbs", request.target_carbs),
                total_fats=enhanced_plan.get("total_fats", request.target_fats),
                generated_at=datetime.utcnow(),
                preferences_applied=request.preferences or {},
            )
            
        except Exception as e:
            raise Exception(f"Failed to generate meal plan: {str(e)}")

    def _enhance_meal_plan(
        self, base_plan: Dict, request: MealPlanRequest
    ) -> Dict:
        """
        Enhance meal plan with AI optimization
        """
        # Calculate optimal meal distribution
        meal_distribution = self.meal_planner.calculate_meal_distribution(
            request.target_calories,
            request.preferences.get("goal", "maintain") if request.preferences else "maintain",
            request.preferences.get("activity_level", "moderate") if request.preferences else "moderate",
        )
        
        # Get optimal meal times
        meal_times = self.meal_planner.get_optimal_meal_times(
            request.preferences.get("goal", "maintain") if request.preferences else "maintain",
            request.preferences.get("activity_level", "moderate") if request.preferences else "moderate",
        )
        
        # Optimize meals if available
        if "meals" in base_plan and base_plan["meals"]:
            # Prioritize Serbian cuisine if preference exists
            if request.cuisine_types and "serbian" in [c.lower() for c in request.cuisine_types]:
                base_plan["meals"] = self.meal_planner.prioritize_serbian_cuisine(
                    base_plan["meals"],
                    request.preferences,
                )
            
            # Optimize meal timing
            for meal_item in base_plan.get("meals", []):
                meal_type = meal_item.get("meal_type", "")
                if meal_type in meal_times:
                    meal_item["scheduled_time"] = meal_times[meal_type]
        
        # Add optimization metadata
        base_plan["optimization"] = {
            "meal_distribution": meal_distribution,
            "algorithm_version": "1.0",
            "enhanced": True,
        }
        
        return base_plan

