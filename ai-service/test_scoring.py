"""
Simple test script for improved scoring algorithm
"""
import asyncio
import sys
from app.ml.scoring import ProductScorer


def test_scoring():
    """Test the improved scoring algorithm"""
    print("Testing Improved Scoring Algorithm\n")
    
    scorer = ProductScorer()
    
    # Test user profiles
    test_profiles = [
        {
            "name": "Mass gainer - young male",
            "goal": "mass",
            "activity_level": "high",
            "age": 22,
            "gender": "male",
            "weight": 75,
            "height": 180,
        },
        {
            "name": "Cutting - female athlete",
            "goal": "cut",
            "activity_level": "very_high",
            "age": 28,
            "gender": "female",
            "weight": 60,
            "height": 165,
        },
        {
            "name": "Endurance - older athlete",
            "goal": "endurance",
            "activity_level": "high",
            "age": 45,
            "gender": "male",
            "weight": 70,
            "height": 175,
        },
    ]
    
    # Test products
    test_products = [
        {
            "name": "High Protein Powder",
            "type": "protein",
            "macros": {"protein": 25, "carbs": 3, "fats": 2, "calories": 120},
            "brand": {"verified": True, "premium": False},
        },
        {
            "name": "Low-calorie Protein",
            "type": "protein",
            "macros": {"protein": 20, "carbs": 2, "fats": 1, "calories": 100},
            "brand": {"verified": True, "premium": True},
        },
        {
            "name": "Creatine Monohydrate",
            "type": "creatine",
            "macros": {"protein": 0, "carbs": 0, "fats": 0, "calories": 0},
            "brand": {"verified": True, "premium": False},
        },
        {
            "name": "Pre-Workout",
            "type": "pre_workout",
            "macros": {"protein": 5, "carbs": 15, "fats": 0, "calories": 80},
            "brand": {"verified": False, "premium": False},
        },
        {
            "name": "Fat Burner",
            "type": "fat_burner",
            "macros": {"protein": 0, "carbs": 2, "fats": 0, "calories": 10},
            "brand": {"verified": True, "premium": False},
        },
    ]
    
    print("=" * 80)
    for profile_data in test_profiles:
        profile_name = profile_data.pop("name")
        print(f"\nProfile: {profile_name}")
        print("-" * 80)
        
        # Calculate nutritional needs
        nutritional_needs = scorer._calculate_nutritional_needs(
            profile_data,
            profile_data["weight"],
            profile_data["height"],
            profile_data["age"],
            profile_data["gender"],
        )
        print(f"Daily needs: {int(nutritional_needs['calories'])} kcal, "
              f"{int(nutritional_needs['protein'])}g protein, "
              f"{int(nutritional_needs['carbs'])}g carbs, "
              f"{int(nutritional_needs['fats'])}g fats")
        
        # Score each product
        results = []
        for product in test_products:
            base_score = 50
            score = scorer.calculate_score(
                product,
                profile_data,
                base_score,
                nutritional_needs,
            )
            
            confidence = scorer.calculate_confidence(
                score,
                product["type"],
                profile_data,
                [],  # base_reasons
                product,
            )
            
            results.append({
                "product": product["name"],
                "score": score,
                "confidence": confidence,
            })
        
        # Sort by score
        results.sort(key=lambda x: x["score"], reverse=True)
        
        # Display results
        print("\nProduct Rankings:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['product']:<25} Score: {result['score']:6.2f} "
                  f"Confidence: {result['confidence']:.2%}")
        
        print()
    
    print("=" * 80)
    print("\nScoring algorithm test completed!")
    print("\nKey improvements:")
    print("  • Individual nutritional needs calculation")
    print("  • Macro alignment with daily requirements")
    print("  • Brand quality consideration")
    print("  • Enhanced confidence scoring")


if __name__ == "__main__":
    try:
        test_scoring()
    except Exception as e:
        print(f"\nERROR: Error during testing: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

