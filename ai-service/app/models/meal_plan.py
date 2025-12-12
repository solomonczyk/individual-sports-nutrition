from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime


class MealPlanRequest(BaseModel):
    user_id: str
    date: date
    target_calories: float
    target_protein: float
    target_carbs: float
    target_fats: float
    preferences: Optional[Dict] = None
    cuisine_types: Optional[List[str]] = None
    exclude_ingredients: Optional[List[str]] = None
    meal_times: Optional[Dict[str, str]] = None


class MealPlanResponse(BaseModel):
    meal_plan_id: str
    date: date
    meals: List[Dict]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fats: float
    generated_at: datetime
    preferences_applied: Dict

