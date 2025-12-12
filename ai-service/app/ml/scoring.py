"""
Advanced scoring algorithms for product recommendations
"""
from typing import Dict, List, Optional
import math


class ProductScorer:
    """Advanced product scoring based on user profile and goals"""

    # Weights for different factors
    GOAL_WEIGHTS = {
        "mass": {
            "protein": 0.4,
            "calories": 0.3,
            "creatine": 0.2,
            "pre_workout": 0.1,
        },
        "cut": {
            "protein": 0.35,
            "fat_burner": 0.3,
            "low_calories": 0.25,
            "vitamin": 0.1,
        },
        "maintain": {
            "protein": 0.3,
            "balanced": 0.3,
            "vitamin": 0.2,
            "general": 0.2,
        },
        "endurance": {
            "amino": 0.3,
            "carbs": 0.25,
            "hydration": 0.25,
            "protein": 0.2,
        },
    }

    ACTIVITY_MULTIPLIERS = {
        "low": 0.8,
        "moderate": 1.0,
        "high": 1.2,
        "very_high": 1.4,
    }

    @staticmethod
    def calculate_score(
        product: Dict,
        user_profile: Dict,
        base_score: float = 50.0,
    ) -> float:
        """
        Calculate comprehensive score for a product based on user profile
        
        Args:
            product: Product data with type, macros, etc.
            user_profile: User profile with goal, activity_level, age, etc.
            base_score: Base score from rule-based system
            
        Returns:
            Enhanced score (0-100)
        """
        score = base_score
        
        goal = user_profile.get("goal", "maintain")
        activity_level = user_profile.get("activity_level", "moderate")
        age = user_profile.get("age", 25)
        gender = user_profile.get("gender", "male")
        weight = user_profile.get("weight", 70)
        
        product_type = product.get("type", "")
        macros = product.get("macros", {})
        
        # Apply goal-based scoring
        goal_weights = ProductScorer.GOAL_WEIGHTS.get(goal, ProductScorer.GOAL_WEIGHTS["maintain"])
        activity_mult = ProductScorer.ACTIVITY_MULTIPLIERS.get(activity_level, 1.0)
        
        # Score based on product type and goal alignment
        type_score = ProductScorer._score_by_type(product_type, goal_weights)
        score += type_score * activity_mult
        
        # Score based on macros alignment with goal
        macro_score = ProductScorer._score_by_macros(macros, goal, weight, activity_level)
        score += macro_score
        
        # Age-based adjustments
        age_score = ProductScorer._score_by_age(product_type, age, gender)
        score += age_score
        
        # Activity level adjustments
        activity_score = ProductScorer._score_by_activity(product_type, activity_level)
        score += activity_score
        
        # Normalize to 0-100 range
        score = max(0, min(100, score))
        
        return round(score, 2)

    @staticmethod
    def _score_by_type(product_type: str, goal_weights: Dict) -> float:
        """Score based on product type alignment with goal"""
        type_mapping = {
            "protein": goal_weights.get("protein", 0.1),
            "creatine": goal_weights.get("creatine", 0.1),
            "pre_workout": goal_weights.get("pre_workout", 0.1),
            "post_workout": goal_weights.get("post_workout", 0.1),
            "fat_burner": goal_weights.get("fat_burner", 0.1),
            "amino": goal_weights.get("amino", 0.1),
            "vitamin": goal_weights.get("vitamin", 0.1),
            "other": goal_weights.get("general", 0.05),
        }
        
        base_score = type_mapping.get(product_type, 0.05)
        return base_score * 20  # Scale to 0-20 points

    @staticmethod
    def _score_by_macros(macros: Dict, goal: str, weight: float, activity_level: str) -> float:
        """Score based on macro alignment with goal and user stats"""
        if not macros:
            return 0
        
        protein = macros.get("protein", 0)
        calories = macros.get("calories", 0)
        carbs = macros.get("carbs", 0)
        fats = macros.get("fats", 0)
        
        score = 0
        
        # Protein scoring (important for all goals, especially mass)
        if goal == "mass":
            # High protein is good for mass gain
            protein_score = min(protein / 25, 1.0) * 10  # Max 10 points
            score += protein_score
        
        elif goal == "cut":
            # Moderate-high protein, low calories
            protein_score = min(protein / 20, 1.0) * 5
            calorie_score = max(0, (200 - calories) / 200) * 5  # Lower calories = better
            score += protein_score + calorie_score
        
        elif goal == "endurance":
            # Carbs are important for endurance
            carb_score = min(carbs / 30, 1.0) * 8
            score += carb_score
        
        # Activity level multiplier for protein needs
        if activity_level in ["high", "very_high"]:
            protein_needs = weight * 2.2  # g per kg for high activity
            if protein >= protein_needs * 0.1:  # At least 10% of daily needs per serving
                score += 5
        
        return min(score, 15)  # Cap at 15 points

    @staticmethod
    def _score_by_age(product_type: str, age: int, gender: str) -> float:
        """Adjust score based on age and gender"""
        score = 0
        
        # Older users benefit more from vitamins and joint support
        if age > 40:
            if product_type in ["vitamin", "amino"]:
                score += 3
            if "joint" in product_type.lower() or "glucosamine" in product_type.lower():
                score += 5
        
        # Younger users can handle more intense supplements
        if age < 25:
            if product_type in ["pre_workout", "creatine"]:
                score += 2
        
        # Gender-specific adjustments
        if gender == "female":
            # Women often need more iron and calcium
            if product_type == "vitamin":
                score += 2
        
        return score

    @staticmethod
    def _score_by_activity(product_type: str, activity_level: str) -> float:
        """Adjust score based on activity level"""
        score = 0
        
        if activity_level in ["high", "very_high"]:
            # High activity users benefit from recovery and performance supplements
            if product_type in ["post_workout", "amino", "protein"]:
                score += 5
            if product_type == "creatine":
                score += 4
        
        elif activity_level == "low":
            # Lower activity users benefit from basic supplements
            if product_type in ["vitamin", "protein"]:
                score += 3
        
        return score

    @staticmethod
    def calculate_confidence(
        score: float,
        product_type: str,
        user_profile: Dict,
        base_reasons: List[str],
    ) -> float:
        """
        Calculate confidence level (0-1) for a recommendation
        
        Higher confidence when:
        - High score
        - Clear alignment with goals
        - Multiple positive factors
        """
        confidence = min(score / 100, 0.9)  # Base confidence from score
        
        goal = user_profile.get("goal", "maintain")
        goal_weights = ProductScorer.GOAL_WEIGHTS.get(goal, {})
        
        # Boost confidence if product type strongly aligns with goal
        type_alignment = ProductScorer._score_by_type(product_type, goal_weights)
        if type_alignment > 15:  # Strong alignment
            confidence += 0.05
        
        # Boost confidence if multiple reasons
        if len(base_reasons) >= 3:
            confidence += 0.05
        
        return min(confidence, 1.0)

