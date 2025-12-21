"""
Advanced meal plan generation algorithms
"""
from typing import Dict, List, Optional
from datetime import date, time
from app.utils.ml_config import get_ml_config


class MealPlanner:
    """Advanced meal planning based on goals, preferences, and Serbian cuisine"""
    _ML_CONFIG = get_ml_config() or {}

    # Meal distribution (fractions) per goal
    MEAL_DISTRIBUTION = _ML_CONFIG.get(
        "MEAL_DISTRIBUTION",
        {
            "mass": {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.25, "snacks": 0.15},
            "cut": {"breakfast": 0.30, "lunch": 0.35, "dinner": 0.25, "snacks": 0.10},
            "maintain": {"breakfast": 0.25, "lunch": 0.35, "dinner": 0.25, "snacks": 0.15},
            "endurance": {"breakfast": 0.20, "lunch": 0.30, "dinner": 0.25, "snacks": 0.25},
        },
    )

    # Serbian meal times stored as HH:MM strings in config
    _SERB_TIMES = _ML_CONFIG.get(
        "SERBIAN_MEAL_TIMES",
        {"breakfast": "08:00", "snack1": "11:00", "lunch": "13:30", "snack2": "17:00", "dinner": "19:30"},
    )

    SERBIAN_MEAL_TIMES = {}
    for k, v in _SERB_TIMES.items():
        try:
            # parse HH:MM
            hh, mm = v.split(":")
            SERBIAN_MEAL_TIMES[k] = time(int(hh), int(mm))
        except Exception:
            # fallback to defaults
            SERBIAN_MEAL_TIMES[k] = time(8, 0) if k == "breakfast" else time(13, 30)

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
    def filter_meals_by_preferences(
        available_meals: List[Dict],
        preferences: Optional[Dict] = None,
        exclude_ingredients: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Filter meals based on preferences, allergies, and excluded ingredients
        
        Args:
            available_meals: List of available meals
            preferences: User preferences (allergies, dietary restrictions)
            exclude_ingredients: List of ingredient names to exclude
            
        Returns:
            Filtered list of meals
        """
        if not preferences and not exclude_ingredients:
            return available_meals
        
        filtered = []
        exclude_list = []
        
        # Get allergies from preferences
        if preferences:
            exclude_list.extend(preferences.get("allergies", []))
            exclude_list.extend(preferences.get("exclude_ingredients", []))
        
        # Add explicit exclude_ingredients
        if exclude_ingredients:
            exclude_list.extend(exclude_ingredients)
        
        # Normalize exclude list (lowercase)
        exclude_list = [item.lower() for item in exclude_list if item]
        
        for meal in available_meals:
            # Check ingredients
            ingredients = meal.get("ingredients", [])
            meal_allergens = meal.get("allergens", [])
            
            # Convert to lowercase for comparison
            ingredient_names = [
                ing.get("name", "").lower() if isinstance(ing, dict) else str(ing).lower()
                for ing in ingredients
            ]
            
            allergen_names = [
                allergen.get("name", "").lower() if isinstance(allergen, dict) else str(allergen).lower()
                for allergen in meal_allergens
            ]
            
            # Check if meal contains excluded ingredients
            has_excluded = any(
                excluded in name or name in excluded
                for excluded in exclude_list
                for name in ingredient_names + allergen_names
            )
            
            if not has_excluded:
                filtered.append(meal)
        
        return filtered if filtered else available_meals
    
    @staticmethod
    def prioritize_serbian_cuisine(
        available_meals: List[Dict],
        preferences: Optional[Dict] = None,
        serbian_ratio: float = 0.6,
    ) -> List[Dict]:
        """
        Prioritize Serbian/Balkan cuisine meals when available
        
        Enhanced with:
        - Configurable Serbian cuisine ratio
        - Better meal diversity
        - Preference-aware selection
        """
        serbian_keywords = [
            "cevap", "pljeskavica", "burek", "sarma",
            "musaka", "prebranac", "ajvar", "kajmak",
            "gibanica", "proja", "riblja", "pasulj",
            "gulas", "karadjordjeva", "cevapi", "pita",
            "pasulj", "riblja corba", "srpska salata",
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
                "balkan" in cuisine_type or
                "srpska" in meal_name
            )
            
            if is_serbian:
                serbian_meals.append(meal)
            else:
                other_meals.append(meal)
        
        # Prioritize Serbian meals, but mix with others
        result = []
        target_serbian_count = int(len(available_meals) * serbian_ratio)
        
        # Take Serbian meals up to target ratio
        result.extend(serbian_meals[:target_serbian_count])
        
        # Fill remaining with other meals
        remaining_count = len(available_meals) - len(result)
        result.extend(other_meals[:remaining_count])
        
        return result if result else available_meals
    
    @staticmethod
    def ensure_meal_diversity(
        selected_meals: List[Dict],
        available_meals: List[Dict],
        max_repeats: int = 1,
    ) -> List[Dict]:
        """
        Ensure meal diversity by avoiding too many repeats
        
        Args:
            selected_meals: Already selected meals
            available_meals: Pool of available meals
            max_repeats: Maximum number of times a meal can be repeated
            
        Returns:
            Diversified list of meals
        """
        if not selected_meals:
            return available_meals[:len(available_meals)]
        
        # Count meal occurrences
        meal_counts = {}
        for meal in selected_meals:
            meal_id = meal.get("id") or meal.get("name_key", "")
            meal_counts[meal_id] = meal_counts.get(meal_id, 0) + 1
        
        # Separate meals that haven't been used too much
        available = []
        overused = []
        
        for meal in available_meals:
            meal_id = meal.get("id") or meal.get("name_key", "")
            count = meal_counts.get(meal_id, 0)
            
            if count < max_repeats:
                available.append(meal)
            else:
                overused.append(meal)
        
        # Prioritize unused meals, then less used ones
        # This ensures diversity
        result = available + overused
        
        return result
    
    @staticmethod
    def select_optimal_meals(
        available_meals: List[Dict],
        target_calories: float,
        target_protein: float,
        meal_type: str,
        goal: str,
        preferences: Optional[Dict] = None,
        exclude_ingredients: Optional[List[str]] = None,
        already_selected: Optional[List[Dict]] = None,
    ) -> List[Dict]:
        """
        Select optimal meals based on multiple criteria
        
        Enhanced meal selection that considers:
        - Calorie and macro targets
        - Preferences and allergies
        - Meal diversity
        - Serbian cuisine priority
        - Goal alignment
        
        Returns:
            List of selected meals sorted by suitability
        """
        # Step 1: Filter by preferences and allergies
        filtered_meals = MealPlanner.filter_meals_by_preferences(
            available_meals,
            preferences,
            exclude_ingredients,
        )
        
        # Step 2: Ensure diversity (avoid repeats)
        if already_selected:
            filtered_meals = MealPlanner.ensure_meal_diversity(
                already_selected,
                filtered_meals,
                max_repeats=1,
            )
        
        # Step 3: Score meals based on targets and goal
        scored_meals = []
        for meal in filtered_meals:
            meal_calories = meal.get("total_macros", {}).get("calories", 0)
            meal_protein = meal.get("total_macros", {}).get("protein", 0)
            
            # Calculate suitability score
            score = 0
            
            # Calorie match (closer to target = better)
            if meal_calories > 0:
                calorie_diff = abs(meal_calories - target_calories) / target_calories
                score += max(0, 10 * (1 - calorie_diff))  # Max 10 points
            
            # Protein match (important for all goals)
            if meal_protein > 0 and target_protein > 0:
                protein_ratio = meal_protein / target_protein
                if 0.8 <= protein_ratio <= 1.2:  # Within 20% of target
                    score += 10
                elif 0.6 <= protein_ratio <= 1.4:  # Within 40% of target
                    score += 5
            
            # Goal-specific bonuses
            if goal == "cut":
                # Prefer lower calorie meals
                if meal_calories < target_calories * 0.9:
                    score += 5
            elif goal == "mass":
                # Prefer higher calorie meals
                if meal_calories > target_calories * 1.1:
                    score += 5
            
            # Serbian cuisine bonus (if preferences allow)
            meal_name = meal.get("name_key", "").lower()
            cuisine_type = meal.get("cuisine_type", "").lower()
            if "serbian" in cuisine_type or "balkan" in cuisine_type:
                score += 3
            
            scored_meals.append({
                "meal": meal,
                "score": score,
            })
        
        # Sort by score (descending)
        scored_meals.sort(key=lambda x: x["score"], reverse=True)
        
        # Return meals (without scores)
        return [item["meal"] for item in scored_meals]

