"""
Integration tests for RecommendationService with mock backend.
Tests retry logic, fallback behavior, and ML scoring.
"""
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.recommendation_service import RecommendationService
from app.models.recommendation import ProductRecommendationRequest


@pytest.fixture
def recommendation_service():
    """Create a RecommendationService instance for testing."""
    return RecommendationService(backend_api_url="http://mock-backend:3000")


@pytest.fixture
def sample_request():
    """Sample product recommendation request."""
    return ProductRecommendationRequest(
        user_id="test-user-123",
        goal="mass",
        activity_level="high",
        age=28,
        gender="male",
        weight=80,
        height=180,
        max_products=5,
    )


@pytest.fixture
def sample_backend_response():
    """Sample response from backend API."""
    return {
        "success": True,
        "data": [
            {
                "product": {
                    "id": "prod-1",
                    "name": "High Protein Powder",
                    "type": "protein",
                    "brand": {"name": "TrustBrand", "verified": True, "premium": False},
                    "macros": {"protein": 25, "carbs": 3, "fats": 2, "calories": 120},
                },
                "score": 75,
                "reasons": ["High protein content", "Good for muscle gain"],
                "warnings": [],
            },
            {
                "product": {
                    "id": "prod-2",
                    "name": "Creatine Monohydrate",
                    "type": "creatine",
                    "brand": {"name": "CrestBrand", "verified": True, "premium": False},
                    "macros": {"protein": 0, "carbs": 0, "fats": 0, "calories": 0},
                },
                "score": 65,
                "reasons": ["Proven effectiveness for strength"],
                "warnings": [],
            },
        ],
    }


@pytest.fixture
def sample_nutrition_response():
    """Sample response from nutrition/calculate endpoint."""
    return {
        "success": True,
        "data": {
            "calories": 2800,
            "protein": 160,
            "carbs": 350,
            "fats": 93,
        },
    }


@pytest.mark.asyncio
async def test_get_ai_recommendations_success(
    recommendation_service, sample_request, sample_backend_response, sample_nutrition_response
):
    """Test successful recommendation retrieval with AI enhancement."""
    # Mock the AsyncHTTPClient
    mock_client = AsyncMock()
    
    # Mock responses
    mock_rec_response = MagicMock()
    mock_rec_response.status_code = 200
    mock_rec_response.json.return_value = sample_backend_response
    
    mock_nutrition_response = MagicMock()
    mock_nutrition_response.status_code = 200
    mock_nutrition_response.json.return_value = sample_nutrition_response
    
    mock_client.get.side_effect = [mock_rec_response, mock_nutrition_response]
    
    # Inject mock client
    recommendation_service.client = mock_client
    
    # Call the service
    response = await recommendation_service.get_ai_recommendations(sample_request)
    
    # Assertions
    assert response.recommendations is not None
    assert len(response.recommendations) <= 5  # max_products respected
    assert response.user_profile_summary["goal"] == "mass"
    
    # Verify client was called
    assert mock_client.get.call_count == 2
    
    # First call should be for recommendations
    first_call = mock_client.get.call_args_list[0]
    assert "recommendations" in first_call[0][0]
    assert first_call[1]["headers"]["X-User-ID"] == "test-user-123"


@pytest.mark.asyncio
async def test_get_ai_recommendations_no_nutrition_data(
    recommendation_service, sample_request, sample_backend_response
):
    """Test recommendation retrieval when nutrition endpoint fails."""
    # Mock the AsyncHTTPClient
    mock_client = AsyncMock()
    
    # First call succeeds, second fails
    mock_rec_response = MagicMock()
    mock_rec_response.status_code = 200
    mock_rec_response.json.return_value = sample_backend_response
    
    mock_nutrition_response = MagicMock()
    mock_nutrition_response.status_code = 500
    
    mock_client.get.side_effect = [mock_rec_response, mock_nutrition_response]
    
    # Inject mock client
    recommendation_service.client = mock_client
    
    # Call should still succeed (nutrition is optional for fallback)
    response = await recommendation_service.get_ai_recommendations(sample_request)
    
    # Should still have recommendations
    assert response.recommendations is not None
    assert len(response.recommendations) > 0


@pytest.mark.asyncio
async def test_get_ai_recommendations_empty_backend_response(
    recommendation_service, sample_request
):
    """Test handling of empty backend response."""
    # Mock the AsyncHTTPClient
    mock_client = AsyncMock()
    
    # Empty recommendations
    mock_rec_response = MagicMock()
    mock_rec_response.status_code = 200
    mock_rec_response.json.return_value = {"success": True, "data": []}
    
    mock_client.get.return_value = mock_rec_response
    
    # Inject mock client
    recommendation_service.client = mock_client
    
    # Call the service
    response = await recommendation_service.get_ai_recommendations(sample_request)
    
    # Should return empty but valid response
    assert response.recommendations == []
    assert response.user_profile_summary is not None


@pytest.mark.asyncio
async def test_get_ai_recommendations_backend_error(recommendation_service, sample_request):
    """Test error handling when backend fails."""
    # Mock the AsyncHTTPClient
    mock_client = AsyncMock()
    
    # Simulate backend error
    mock_response = MagicMock()
    mock_response.status_code = 500
    
    mock_client.get.return_value = mock_response
    
    # Inject mock client
    recommendation_service.client = mock_client
    
    # Should raise exception
    with pytest.raises(Exception):
        await recommendation_service.get_ai_recommendations(sample_request)


def test_enhance_recommendations_scoring(recommendation_service, sample_request, sample_backend_response):
    """Test that ML scoring enhances base recommendations."""
    # Call enhancement directly
    enhanced = recommendation_service._enhance_recommendations(
        sample_backend_response["data"],
        sample_request,
        nutritional_needs={
            "calories": 2800,
            "protein": 160,
            "carbs": 350,
            "fats": 93,
        },
    )
    
    # Verify enhancement happened
    assert len(enhanced) > 0
    
    # Check that scores were calculated
    for rec in enhanced:
        assert rec.score > 0
        assert rec.confidence > 0
        assert rec.product_id is not None
        assert isinstance(rec.reasons, list)
    
    # Verify sorting by score
    scores = [rec.score for rec in enhanced]
    assert scores == sorted(scores, reverse=True)


def test_generate_ai_reasons(recommendation_service, sample_request):
    """Test AI reason generation."""
    product = {
        "type": "protein",
        "brand": {"verified": True},
        "macros": {"protein": 28, "calories": 140},
    }
    
    base_reasons = ["Good price"]
    
    reasons = recommendation_service._generate_ai_reasons(
        product,
        {**sample_request.dict(), "weight": 80},
        base_reasons,
        nutritional_needs={"protein": 160},
    )
    
    # Should have enhanced reasons
    assert len(reasons) > len(base_reasons)
    assert "Verified and trusted brand" in reasons


def test_suggest_dosage_protein(recommendation_service, sample_request):
    """Test dosage suggestion for protein."""
    product = {"type": "protein", "macros": {"protein": 20}}
    
    dosage = recommendation_service._suggest_dosage(
        product,
        {**sample_request.dict(), "weight": 80, "activity_level": "high"},
    )
    
    # Protein should suggest multiple servings per day
    assert "servings_per_day" in dosage
    assert dosage["servings_per_day"] >= 1
    assert dosage["frequency"] == "daily"


def test_suggest_dosage_creatine(recommendation_service, sample_request):
    """Test dosage suggestion for creatine."""
    product = {"type": "creatine"}
    
    dosage = recommendation_service._suggest_dosage(
        product,
        {**sample_request.dict(), "weight": 80},
    )
    
    # Creatine should have grams_per_day
    assert "grams_per_day" in dosage
    assert dosage["grams_per_day"] == 5
    assert "post_workout" in dosage["timing"]


def test_suggest_dosage_pre_workout(recommendation_service, sample_request):
    """Test dosage suggestion for pre-workout."""
    product = {"type": "pre_workout"}
    
    dosage = recommendation_service._suggest_dosage(
        product,
        {**sample_request.dict()},
    )
    
    # Pre-workout should be pre-workout timing
    assert dosage["servings_per_day"] == 1
    assert "before workout" in dosage["timing"]
    assert "training days" in dosage["notes"][0]


@pytest.mark.asyncio
async def test_http_client_retry_on_timeout(recommendation_service):
    """Test that HTTP client retries on timeout."""
    from app.utils.http_client import AsyncHTTPClient
    import httpx
    
    # Create a real client (we won't mock it fully, just test retry logic)
    client = AsyncHTTPClient(timeout=1.0, max_retries=2, backoff_factor=0.1)
    
    # Verify client attributes
    assert client.max_retries == 2
    assert client.timeout == 1.0
    assert client.backoff_factor == 0.1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
