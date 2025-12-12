from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from app.models.recommendation import (
    ProductRecommendationRequest,
    RecommendationsResponse,
)
from app.services.recommendation_service import RecommendationService
from app.config import get_settings

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

settings = get_settings()
recommendation_service = RecommendationService(settings.backend_api_url)


@router.post("/ai", response_model=RecommendationsResponse)
async def get_ai_recommendations(
    request: ProductRecommendationRequest,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
):
    """
    Get AI-powered product recommendations
    
    Uses ML models to provide personalized product recommendations
    based on user profile, goals, and health data.
    """
    try:
        # Validate user_id from header or request
        user_id = x_user_id or request.user_id
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        request.user_id = user_id
        
        recommendations = await recommendation_service.get_ai_recommendations(request)
        return recommendations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

