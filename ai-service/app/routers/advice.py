from fastapi import APIRouter, Header, HTTPException, Depends
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.services.rag_service import RagService, get_rag_service
from app.utils.logger import logger

router = APIRouter(prefix="/advice", tags=["advice"])

class AdviceRequest(BaseModel):
    user_id: str
    query: str
    user_profile: Optional[Dict[str, Any]] = None

@router.post("/personalized")
async def get_personalized_advice(
    request: AdviceRequest,
    rag_service: RagService = Depends(get_rag_service)
):
    """
    Get personalized nutritional advice based on user profile and knowledge base.
    """
    try:
        logger.info(f"Generating personalized advice for user {request.user_id}")
        
        # If profile isn't provided, in a real scenario we might fetch it from Backend API
        # but for this MVP endpoint we expect it in the request or use defaults.
        profile = request.user_profile or {
            "goal": "maintain",
            "activity_level": "moderate",
            "age": 25,
            "gender": "male"
        }
        
        result = await rag_service.generate_personalized_advice(profile, request.query)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Failed to generate advice: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
