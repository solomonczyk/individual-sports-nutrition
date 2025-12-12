from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.models.meal_plan import MealPlanRequest, MealPlanResponse
from app.services.meal_plan_service import MealPlanService
from app.config import get_settings

router = APIRouter(prefix="/meal-plan", tags=["meal-plan"])

settings = get_settings()
meal_plan_service = MealPlanService(settings.backend_api_url)


@router.post("/generate/ai", response_model=MealPlanResponse)
async def generate_ai_meal_plan(
    request: MealPlanRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """
    Generate AI-powered meal plan
    
    Uses ML models to generate personalized meal plans
    optimized for user goals, preferences, and nutritional needs.
    """
    try:
        # Validate user_id from header or request
        user_id = x_user_id or request.user_id
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        request.user_id = user_id
        
        meal_plan = await meal_plan_service.generate_ai_meal_plan(request)
        return meal_plan
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

