"""
Advanced scoring algorithms for product recommendations
Enhanced with personalized nutritional needs calculation
"""
from typing import Dict, List, Optional
import math
from app.utils.ml_config import get_ml_config


class ProductScorer:
    """Advanced product scoring based on user profile and goals"""
    # Load configurable ML parameters (fallback to embedded defaults if missing)
    _ML_CONFIG = get_ml_config() or {}

    GOAL_WEIGHTS = _ML_CONFIG.get(
        "GOAL_WEIGHTS",
        {
            "mass": {"protein": 0.4, "calories": 0.3, "creatine": 0.2, "pre_workout": 0.1},
            "cut": {"protein": 0.35, "fat_burner": 0.3, "low_calories": 0.25, "vitamin": 0.1},
            "maintain": {"protein": 0.3, "balanced": 0.3, "vitamin": 0.2, "general": 0.2},
            "endurance": {"amino": 0.3, "carbs": 0.25, "hydration": 0.25, "protein": 0.2},
        },
    )

    ACTIVITY_MULTIPLIERS = _ML_CONFIG.get(
        "ACTIVITY_MULTIPLIERS",
        {"low": 0.8, "moderate": 1.0, "high": 1.2, "very_high": 1.4},
    )

    # Protein requirements per kg by goal (g/kg)
    PROTEIN_REQUIREMENTS = _ML_CONFIG.get(
        "PROTEIN_REQUIREMENTS",
        {"mass": 2.2, "cut": 2.5, "endurance": 1.8, "maintain": 2.0},
    )

    @staticmethod
    def calculate_score(
        product: Dict,
        user_profile: Dict,
        base_score: float = 50.0,
        nutritional_needs: Optional[Dict] = None,
    ) -> float:
        """
        Calculate comprehensive score for a product based on user profile
        
        Enhanced with:
        - Individual nutritional needs calculation
        - Macro deficit/surplus analysis
        - Brand quality consideration
        - Price-value ratio
        
        Args:
            product: Product data with type, macros, etc.
            user_profile: User profile with goal, activity_level, age, etc.
            base_score: Base score from rule-based system
            nutritional_needs: Optional pre-calculated nutritional needs (calories, protein, carbs, fats)
            
        Returns:
            Enhanced score (0-100)
        """
        # Start with weighted base score (60% of final score)
        score = base_score * 0.6
        
        goal = user_profile.get("goal", "maintain")
        activity_level = user_profile.get("activity_level", "moderate")
        age = user_profile.get("age", 25)
        gender = user_profile.get("gender", "male")
        weight = user_profile.get("weight", 70)
        height = user_profile.get("height", 175)
        
        product_type = product.get("type", "")
        macros = product.get("macros", {}) or {}
        
        # Calculate or use provided nutritional needs
        if not nutritional_needs:
            nutritional_needs = ProductScorer._calculate_nutritional_needs(
                user_profile, weight, height, age, gender
            )
        
        # Apply goal-based scoring (15% of final score)
        goal_weights = ProductScorer.GOAL_WEIGHTS.get(goal, ProductScorer.GOAL_WEIGHTS["maintain"])
        activity_mult = ProductScorer.ACTIVITY_MULTIPLIERS.get(activity_level, 1.0)
        type_score = ProductScorer._score_by_type(product_type, goal_weights)
        score += type_score * activity_mult * 0.15
        
        # Enhanced macro scoring based on individual needs (20% of final score)
        macro_score = ProductScorer._score_by_macros_enhanced(
            macros, goal, weight, activity_level, nutritional_needs
        )
        score += macro_score * 0.2
        
        # Age and gender adjustments (2% of final score)
        age_score = ProductScorer._score_by_age(product_type, age, gender)
        score += age_score
        
        # Activity level adjustments (2% of final score)
        activity_score = ProductScorer._score_by_activity(product_type, activity_level)
        score += activity_score
        
        # Brand quality bonus (1% of final score)
        brand_score = ProductScorer._score_by_brand(product)
        score += brand_score
        
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
    def _calculate_nutritional_needs(
        user_profile: Dict, weight: float, height: float, age: int, gender: str
    ) -> Dict:
        """Calculate individual nutritional needs based on Mifflin-St Jeor formula"""
        goal = user_profile.get("goal", "maintain")
        activity_level = user_profile.get("activity_level", "moderate")
        
        # Calculate BMR using Mifflin-St Jeor
        if gender == "male":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        # Activity multipliers
        activity_factors = {
            "low": 1.2,
            "moderate": 1.55,
            "high": 1.725,
            "very_high": 1.9,
        }
        
        activity_factor = activity_factors.get(activity_level, 1.55)
        tdee = bmr * activity_factor
        
        # Adjust calories by goal
        goal_adjustments = {
            "mass": 1.15,  # +15% surplus
            "cut": 0.80,   # -20% deficit
            "endurance": 1.05,  # +5% for energy
            "maintain": 1.0,
        }
        
        calories = tdee * goal_adjustments.get(goal, 1.0)
        
        # Calculate macros
        protein_per_kg = ProductScorer.PROTEIN_REQUIREMENTS.get(goal, 2.0)
        protein = weight * protein_per_kg
        
        fat_percentage = {
            "mass": 0.25,
            "cut": 0.20,
            "endurance": 0.30,
            "maintain": 0.25,
        }.get(goal, 0.25)
        
        fat_calories = calories * fat_percentage
        fats = fat_calories / 9
        
        protein_calories = protein * 4
        remaining_calories = calories - protein_calories - fat_calories
        carbs = remaining_calories / 4
        
        return {
            "calories": calories,
            "protein": protein,
            "carbs": carbs,
            "fats": fats,
        }
    
    @staticmethod
    def _score_by_macros_enhanced(
        macros: Dict,
        goal: str,
        weight: float,
        activity_level: str,
        nutritional_needs: Dict,
    ) -> float:
        """Enhanced macro scoring based on individual nutritional needs"""
        if not macros:
            return 0
        
        product_protein = macros.get("protein", 0)
        product_calories = macros.get("calories", 0)
        product_carbs = macros.get("carbs", 0)
        product_fats = macros.get("fats", 0)
        
        daily_protein = nutritional_needs.get("protein", weight * 2.0)
        daily_calories = nutritional_needs.get("calories", 2000)
        daily_carbs = nutritional_needs.get("carbs", 200)
        daily_fats = nutritional_needs.get("fats", 65)
        
        score = 0
        
        # Protein scoring - how much of daily needs does one serving provide
        if product_protein > 0:
            protein_contribution = product_protein / daily_protein
            # Optimal: 10-25% of daily protein per serving (multiple servings per day)
            if 0.10 <= protein_contribution <= 0.25:
                protein_score = 15  # Perfect range
            elif 0.25 < protein_contribution <= 0.40:
                protein_score = 12  # Still good, higher concentration
            elif 0.05 <= protein_contribution < 0.10:
                protein_score = 8  # Low but acceptable
            else:
                protein_score = max(0, 5 - abs(protein_contribution - 0.20) * 10)
            
            score += protein_score
        
        # Calorie scoring based on goal
        if goal == "mass":
            # Higher calories are better (up to a point)
            if 150 <= product_calories <= 400:
                score += 10
            elif 400 < product_calories <= 600:
                score += 8
            else:
                score += max(0, 5 - abs(product_calories - 300) / 100)
        
        elif goal == "cut":
            # Lower calories are better
            if product_calories <= 150:
                score += 12
            elif 150 < product_calories <= 250:
                score += 8
            else:
                score += max(0, 5 - (product_calories - 150) / 50)
        
        elif goal == "endurance":
            # Moderate calories with carbs
            if 100 <= product_calories <= 300 and product_carbs >= 20:
                score += 10
            elif product_carbs >= 15:
                score += 7
        
        # Macro balance scoring
        if product_protein > 0 and product_carbs > 0:
            # Good balance for recovery
            if 0.3 <= (product_protein / (product_protein + product_carbs)) <= 0.7:
                score += 5
        
        # Penalize excessive fats for cut goal
        if goal == "cut" and product_fats > 10:
            score -= min(5, (product_fats - 10) / 5)
        
        return min(score, 20)  # Cap at 20 points

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
    def _score_by_brand(product: Dict) -> float:
        """Score based on brand quality and verification"""
        brand = product.get("brand", {})
        if not brand:
            return 0
        
        score = 0
        
        # Verified brands get bonus
        if brand.get("verified", False):
            score += 3
        
        # Premium brands get bonus
        if brand.get("premium", False):
            score += 2
        
        return min(score, 5)
    
    @staticmethod
    def calculate_confidence(
        score: float,
        product_type: str,
        user_profile: Dict,
        base_reasons: List[str],
        product: Optional[Dict] = None,
    ) -> float:
        """
        Calculate confidence level (0-1) for a recommendation
        
        Enhanced with:
        - Score-based confidence
        - Goal alignment strength
        - Number of supporting reasons
        - Brand verification
        - Macro precision
        
        Higher confidence when:
        - High score
        - Clear alignment with goals
        - Multiple positive factors
        - Verified brand
        - Precise macro alignment
        """
        # Base confidence from score (0.5 to 0.95)
        confidence = 0.5 + (score / 100) * 0.45
        
        goal = user_profile.get("goal", "maintain")
        goal_weights = ProductScorer.GOAL_WEIGHTS.get(goal, {})
        
        # Boost confidence if product type strongly aligns with goal
        type_alignment = ProductScorer._score_by_type(product_type, goal_weights)
        if type_alignment > 15:  # Strong alignment
            confidence += 0.08
        elif type_alignment > 10:
            confidence += 0.04
        
        # Boost confidence if multiple reasons
        reason_count = len(base_reasons)
        if reason_count >= 4:
            confidence += 0.06
        elif reason_count >= 3:
            confidence += 0.04
        elif reason_count >= 2:
            confidence += 0.02
        
        # Boost confidence for verified brands
        if product and product.get("brand", {}).get("verified", False):
            confidence += 0.03
        
        # Boost confidence for high protein content (generally reliable)
        if product and product.get("macros", {}).get("protein", 0) >= 20:
            confidence += 0.02
        
        # Penalize if score is very low
        if score < 30:
            confidence *= 0.7
        
        return min(confidence, 0.98)  # Cap at 98% (never 100% certainty)

