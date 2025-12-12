"""
Advanced meal plan generation algorithms
"""
from typing import Dict, List, Optional
from datetime import date, time


class MealPlanner:
    """Advanced meal planning based on goals, preferences, and Serbian cuisine"""

    MEAL_DISTRIBUTION = {
        "mass": {
            "breakfast": 0.25,
            "lunch": 0.35,
            "dinner": 0.25,
            "snacks": 0.15,
        },
        "cut": {
            "breakfast": 0.30,
            "lunch": 0.35,
            "dinner": 0.25,
            "snacks": 0.10,
        },
        "maintain": {
            "breakfast": 0.25,
            "lunch": 0.35,
            "dinner": 0.25,
            "snacks": 0.15,
        },
        "endurance": {
            "breakfast": 0.20,
            "lunch": 0.30,
            "dinner": 0.25,
            "snacks": 0.25,  # More snacks for endurance
        },
    }

    SERBIAN_MEAL_TIMES = {
        "breakfast": time(8, 0),
        "snack1": time(11, 0),
        "lunch": time(13, 30),  # Main meal in Serbia
        "snack2": time(17, 0),
        "dinner": time(19, 30),
    }

    @staticmethod
    def calculate_meal_distribution(
        total_calories: float,
        goal: str,
        activity_level: str,
    ) -> Dict[str, float]:
        """
        Calculate calorie distribution across meals based on goal and activity
        """
        base_distribution = MealPlanner.MEAL_DISTRIBUTION.get(
            goal, MealPlanner.MEAL_DISTRIBUTION["maintain"]
        )
        
        # Adjust for activity level
        if activity_level in ["high", "very_high"]:
            # Shift more calories to post-workout (lunch/dinner)
            base_distribution["lunch"] *= 1.1
            base_distribution["snacks"] *= 0.9
        
        # Calculate calories per meal
        distribution = {}
        for meal_type, ratio in base_distribution.items():
            distribution[meal_type] = total_calories * ratio
        
        return distribution

    @staticmethod
    def calculate_macro_distribution(
        meal_calories: float,
        total_protein: float,
        total_carbs: float,
        total_fats: float,
        total_calories: float,
        meal_type: str,
        goal: str,
    ) -> Dict[str, float]:
        """
        Calculate macro distribution for a specific meal
        """
        # Base ratio
        meal_ratio = meal_calories / total_calories if total_calories > 0 else 0.25
        
        # Adjust protein distribution based on meal type
        if meal_type == "breakfast":
            # Breakfast: moderate protein, higher carbs
            protein_ratio = meal_ratio * 0.9
            carbs_ratio = meal_ratio * 1.1
            fats_ratio = meal_ratio
        
        elif meal_type == "lunch":
            # Lunch: higher protein (main meal)
            protein_ratio = meal_ratio * 1.15
            carbs_ratio = meal_ratio * 1.05
            fats_ratio = meal_ratio * 0.95
        
        elif meal_type == "dinner":
            # Dinner: moderate protein, lower carbs
            protein_ratio = meal_ratio * 1.0
            carbs_ratio = meal_ratio * 0.85
            fats_ratio = meal_ratio * 1.1
        
        else:  # snacks
            # Snacks: balanced, but adjust for goal
            protein_ratio = meal_ratio * 1.1 if goal == "mass" else meal_ratio * 0.9
            carbs_ratio = meal_ratio * 1.0
            fats_ratio = meal_ratio * 0.9
        
        return {
            "protein": total_protein * protein_ratio,
            "carbs": total_carbs * carbs_ratio,
            "fats": total_fats * fats_ratio,
        }

    @staticmethod
    def get_optimal_meal_times(goal: str, activity_level: str) -> Dict[str, str]:
        """Get optimal meal times based on Serbian schedule and goals"""
        times = MealPlanner.SERBIAN_MEAL_TIMES.copy()
        
        # Adjust for goal
        if goal == "mass":
            # Add extra snack for mass gain
            times["snack3"] = time(21, 30)
        
        elif goal == "cut":
            # Earlier dinner for cut
            times["dinner"] = time(19, 0)
        
        # Format as strings
        return {k: v.strftime("%H:%M") for k, v in times.items()}

    @staticmethod
    def prioritize_serbian_cuisine(
        available_meals: List[Dict],
        preferences: Optional[Dict] = None,
    ) -> List[Dict]:
        """
        Prioritize Serbian/Balkan cuisine meals when available
        """
        serbian_keywords = [
            "cevap", "pljeskavica", "burek", "sarma",
            "musaka", "prebranac", "ajvar", "kajmak",
            "gibanica", "proja", "riblja", "pasulj",
        ]
        
        # Separate Serbian and other meals
        serbian_meals = []
        other_meals = []
        
        for meal in available_meals:
            meal_name = meal.get("name_key", "").lower()
            cuisine_type = meal.get("cuisine_type", "").lower()
            
            is_serbian = (
                any(keyword in meal_name for keyword in serbian_keywords) or
                "serbian" in cuisine_type or
                "balkan" in cuisine_type
            )
            
            if is_serbian:
                serbian_meals.append(meal)
            else:
                other_meals.append(meal)
        
        # Prioritize Serbian meals, but mix with others
        # Return 60% Serbian, 40% other if available
        result = []
        serbian_count = int(len(available_meals) * 0.6)
        
        result.extend(serbian_meals[:serbian_count])
        result.extend(other_meals[:len(available_meals) - len(result)])
        
        return result if result else available_meals

