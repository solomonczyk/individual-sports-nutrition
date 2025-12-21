"""
Unit tests for ML modules: ProductScorer and MealPlanner.
"""
import pytest
from app.ml.scoring import ProductScorer
from app.ml.meal_planner import MealPlanner


class TestProductScorer:
    """Tests for ProductScorer class."""

    @pytest.fixture
    def scorer(self):
        return ProductScorer()

    def test_calculate_nutritional_needs_male_mass(self, scorer):
        """Test nutritional needs calculation for male targeting mass gain."""
        user_profile = {
            "goal": "mass",
            "activity_level": "high",
        }
        
        needs = scorer._calculate_nutritional_needs(
            user_profile,
            weight=80,
            height=180,
            age=28,
            gender="male",
        )
        
        # Should have surplus for mass gain
        assert needs["calories"] > 0
        assert needs["protein"] > 0
        assert needs["carbs"] > 0
        assert needs["fats"] > 0
        
        # Protein should be high for mass goal
        assert needs["protein"] >= 80 * 2.2

    def test_calculate_nutritional_needs_female_cut(self, scorer):
        """Test nutritional needs calculation for female targeting cut."""
        user_profile = {
            "goal": "cut",
            "activity_level": "moderate",
        }
        
        needs = scorer._calculate_nutritional_needs(
            user_profile,
            weight=60,
            height=165,
            age=28,
            gender="female",
        )
        
        # Should have deficit for cut
        assert needs["calories"] > 0
        assert needs["protein"] > 0
        
        # Protein should be high for cut goal
        assert needs["protein"] >= 60 * 2.5

    def test_calculate_score_high_protein_for_mass(self, scorer):
        """Test high score for protein product when targeting mass."""
        product = {
            "type": "protein",
            "macros": {"protein": 25, "carbs": 3, "fats": 2, "calories": 120},
            "brand": {"verified": True, "premium": False},
        }
        
        user_profile = {
            "goal": "mass",
            "activity_level": "high",
            "age": 28,
            "gender": "male",
            "weight": 80,
            "height": 180,
        }
        
        score = scorer.calculate_score(product, user_profile, base_score=50)
        
        # Should score higher due to goal alignment
        assert score > 50

    def test_calculate_score_low_calorie_for_cut(self, scorer):
        """Test high score for low-calorie product when cutting."""
        product = {
            "type": "protein",
            "macros": {"protein": 20, "carbs": 2, "fats": 1, "calories": 100},
            "brand": {"verified": True, "premium": True},
        }
        
        user_profile = {
            "goal": "cut",
            "activity_level": "moderate",
            "age": 28,
            "gender": "female",
            "weight": 60,
            "height": 165,
        }
        
        score = scorer.calculate_score(product, user_profile, base_score=50)
        
        # Should score well for low calories and verified brand
        assert score > 50

    def test_calculate_confidence_high_for_verified_brand(self, scorer):
        """Test confidence boost for verified brands."""
        product = {
            "type": "protein",
            "macros": {"protein": 25, "calories": 120},
            "brand": {"verified": True},
        }
        
        user_profile = {
            "goal": "mass",
            "activity_level": "high",
            "weight": 80,
        }
        
        confidence = scorer.calculate_confidence(
            score=85,
            product_type="protein",
            user_profile=user_profile,
            base_reasons=["High protein", "Good price"],
            product=product,
        )
        
        # Should be high confidence
        assert confidence > 0.8
        assert confidence <= 0.98

    def test_confidence_penalized_low_score(self, scorer):
        """Test confidence penalization for low score."""
        product = {"type": "other"}
        user_profile = {"goal": "mass", "weight": 80}
        
        confidence_low = scorer.calculate_confidence(
            score=25,
            product_type="other",
            user_profile=user_profile,
            base_reasons=[],
            product=product,
        )
        
        confidence_high = scorer.calculate_confidence(
            score=85,
            product_type="protein",
            user_profile=user_profile,
            base_reasons=["Good"],
            product=product,
        )
        
        # Low score should have lower confidence
        assert confidence_low < confidence_high


class TestMealPlanner:
    """Tests for MealPlanner class."""

    @pytest.fixture
    def meal_planner(self):
        return MealPlanner()

    def test_calculate_meal_distribution_mass(self, meal_planner):
        """Test meal distribution for mass gain goal."""
        distribution = meal_planner.calculate_meal_distribution(
            total_calories=2800,
            goal="mass",
            activity_level="high",
        )
        
        # Should distribute calories across meals
        assert distribution["breakfast"] > 0
        assert distribution["lunch"] > 0
        assert distribution["dinner"] > 0
        assert distribution["snacks"] > 0
        
        # Total should equal input
        assert sum(distribution.values()) == pytest.approx(2800)

    def test_calculate_meal_distribution_cut(self, meal_planner):
        """Test meal distribution for cutting goal."""
        distribution = meal_planner.calculate_meal_distribution(
            total_calories=2000,
            goal="cut",
            activity_level="moderate",
        )
        
        # Snacks should be lower for cut
        cut_snacks_ratio = distribution["snacks"] / sum(distribution.values())
        assert cut_snacks_ratio < 0.15

    def test_calculate_macro_distribution_breakfast(self, meal_planner):
        """Test macro distribution for breakfast meal."""
        macros = meal_planner.calculate_macro_distribution(
            meal_calories=600,
            total_protein=160,
            total_carbs=300,
            total_fats=80,
            total_calories=2800,
            meal_type="breakfast",
            goal="mass",
        )
        
        # Breakfast should have moderate carbs, moderate protein
        assert macros["protein"] > 0
        assert macros["carbs"] > 0
        assert macros["fats"] > 0

    def test_calculate_macro_distribution_lunch(self, meal_planner):
        """Test macro distribution for lunch (highest protein)."""
        macros = meal_planner.calculate_macro_distribution(
            meal_calories=980,  # ~35% of daily
            total_protein=160,
            total_carbs=300,
            total_fats=80,
            total_calories=2800,
            meal_type="lunch",
            goal="mass",
        )
        
        # Lunch should have highest protein allocation
        assert macros["protein"] > 40

    def test_filter_meals_by_preferences(self, meal_planner):
        """Test meal filtering by allergies and exclusions."""
        available_meals = [
            {
                "id": "1",
                "name": "Chicken Salad",
                "ingredients": [{"name": "chicken"}, {"name": "peanut"}],
                "allergens": [{"name": "peanut"}],
            },
            {
                "id": "2",
                "name": "Fish Steak",
                "ingredients": [{"name": "fish"}],
                "allergens": [],
            },
        ]
        
        preferences = {"allergies": ["peanut"]}
        
        filtered = meal_planner.filter_meals_by_preferences(
            available_meals,
            preferences=preferences,
        )
        
        # Should exclude peanut-containing meal
        assert len(filtered) == 1
        assert filtered[0]["id"] == "2"

    def test_prioritize_serbian_cuisine(self, meal_planner):
        """Test Serbian cuisine prioritization."""
        available_meals = [
            {"id": "1", "name_key": "cevapi", "cuisine_type": "serbian"},
            {"id": "2", "name_key": "pizza", "cuisine_type": "italian"},
            {"id": "3", "name_key": "burek", "cuisine_type": "balkan"},
        ]
        
        prioritized = meal_planner.prioritize_serbian_cuisine(
            available_meals,
            serbian_ratio=0.6,
        )
        
        # First meals should be Serbian/Balkan
        assert "cevapi" in prioritized[0]["name_key"] or "burek" in prioritized[0]["name_key"]

    def test_ensure_meal_diversity(self, meal_planner):
        """Test meal diversity enforcement."""
        selected = [
            {"id": "meal-1", "name": "Chicken"},
            {"id": "meal-1", "name": "Chicken"},  # Repeat
        ]
        
        available = [
            {"id": "meal-1", "name": "Chicken"},
            {"id": "meal-2", "name": "Fish"},
            {"id": "meal-3", "name": "Beef"},
        ]
        
        diversified = meal_planner.ensure_meal_diversity(
            selected,
            available,
            max_repeats=1,
        )
        
        # Should have meal-2 and meal-3 before meal-1 (to avoid repeats)
        first_ids = [m.get("id") for m in diversified[:2]]
        assert "meal-2" in first_ids or "meal-3" in first_ids

    def test_select_optimal_meals(self, meal_planner):
        """Test optimal meal selection."""
        available_meals = [
            {
                "id": "1",
                "name_key": "chicken",
                "cuisine_type": "serbian",
                "total_macros": {"calories": 400, "protein": 45},
            },
            {
                "id": "2",
                "name_key": "pasta",
                "cuisine_type": "italian",
                "total_macros": {"calories": 350, "protein": 15},
            },
            {
                "id": "3",
                "name_key": "fish",
                "cuisine_type": "mediterranean",
                "total_macros": {"calories": 380, "protein": 35},
            },
        ]
        
        selected = meal_planner.select_optimal_meals(
            available_meals,
            target_calories=400,
            target_protein=40,
            meal_type="lunch",
            goal="mass",
        )
        
        # Should be sorted by suitability
        assert len(selected) > 0
        # Chicken should be high ranked (Serbian + high protein)
        assert selected[0]["id"] in ["1", "3"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
