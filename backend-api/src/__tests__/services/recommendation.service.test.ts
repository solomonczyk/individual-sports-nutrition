import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RecommendationService } from '../../src/services/recommendation.service';
import { NutritionService } from '../../src/services/nutrition.service';
import { UserRepository } from '../../src/repositories/user.repository';

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;
  let mockUserRepo: any;
  let mockHttpClient: any;

  beforeEach(() => {
    // Mock dependencies
    mockUserRepo = {
      findById: vi.fn(),
      getHealthProfile: vi.fn(),
    };

    mockHttpClient = {
      post: vi.fn(),
      get: vi.fn(),
    };

    recommendationService = new RecommendationService(mockUserRepo, mockHttpClient);
  });

  describe('getRecommendations', () => {
    it('should return recommendations for valid user', async () => {
      // Arrange
      const userId = 'user_123';
      const goal = 'weight_loss';
      const activityLevel = 'moderate';

      mockUserRepo.getHealthProfile.mockResolvedValue({
        id: 'profile_123',
        age: 30,
        weight: 80,
        height: 180,
        dietary_preferences: ['vegetarian'],
      });

      mockHttpClient.post.mockResolvedValue({
        recommendations: [
          {
            product_id: 'prod_1',
            name: 'Chicken Breast',
            score: 95,
            confidence: 0.92,
          },
        ],
      });

      // Act
      const result = await recommendationService.getRecommendations(
        userId,
        goal,
        activityLevel
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].score).toBe(95);
      expect(mockUserRepo.getHealthProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw error for invalid user', async () => {
      // Arrange
      const userId = 'invalid_user';
      mockUserRepo.getHealthProfile.mockResolvedValue(null);

      // Act & Assert
      await expect(
        recommendationService.getRecommendations(
          userId,
          'weight_loss',
          'moderate'
        )
      ).rejects.toThrow('User profile not found');
    });

    it('should apply dietary preferences filter', async () => {
      // Arrange
      const userId = 'user_123';
      mockUserRepo.getHealthProfile.mockResolvedValue({
        id: 'profile_123',
        dietary_preferences: ['vegetarian', 'gluten-free'],
      });

      mockHttpClient.post.mockResolvedValue({
        recommendations: [],
      });

      // Act
      await recommendationService.getRecommendations(
        userId,
        'weight_loss',
        'moderate'
      );

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dietary_preferences: ['vegetarian', 'gluten-free'],
        })
      );
    });

    it('should handle AI service timeout with fallback', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({
        id: 'profile_123',
      });

      mockHttpClient.post.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act
      const result = await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.fallback).toBe(true);
    });

    it('should sort recommendations by score', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({ id: 'profile_123' });

      mockHttpClient.post.mockResolvedValue({
        recommendations: [
          { product_id: 'prod_1', score: 90 },
          { product_id: 'prod_2', score: 95 },
          { product_id: 'prod_3', score: 85 },
        ],
      });

      // Act
      const result = await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );

      // Assert
      expect(result.recommendations[0].score).toBe(95);
      expect(result.recommendations[1].score).toBe(90);
      expect(result.recommendations[2].score).toBe(85);
    });

    it('should limit results to requested count', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({ id: 'profile_123' });

      mockHttpClient.post.mockResolvedValue({
        recommendations: Array(20)
          .fill(null)
          .map((_, i) => ({
            product_id: `prod_${i}`,
            score: 100 - i,
          })),
      });

      // Act
      const result = await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate',
        { limit: 5 }
      );

      // Assert
      expect(result.recommendations).toHaveLength(5);
    });
  });

  describe('filterByAllergies', () => {
    it('should exclude products with user allergies', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({
        id: 'profile_123',
        allergies: ['peanut', 'shellfish'],
      });

      mockHttpClient.post.mockResolvedValue({
        recommendations: [
          { product_id: 'prod_1', name: 'Peanut Butter', allergens: ['peanut'] },
          { product_id: 'prod_2', name: 'Shrimp Salad', allergens: ['shellfish'] },
          { product_id: 'prod_3', name: 'Chicken Breast', allergens: [] },
        ],
      });

      // Act
      const result = await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );

      // Assert
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].product_id).toBe('prod_3');
    });

    it('should not filter if no allergies specified', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({
        id: 'profile_123',
        allergies: [],
      });

      mockHttpClient.post.mockResolvedValue({
        recommendations: [
          { product_id: 'prod_1' },
          { product_id: 'prod_2' },
        ],
      });

      // Act
      const result = await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );

      // Assert
      expect(result.recommendations).toHaveLength(2);
    });
  });

  describe('caching', () => {
    it('should cache recommendations for same parameters', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({ id: 'profile_123' });
      mockHttpClient.post.mockResolvedValue({
        recommendations: [{ product_id: 'prod_1', score: 95 }],
      });

      // Act
      await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );
      await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );

      // Assert - Should only call AI service once
      expect(mockHttpClient.post).toHaveBeenCalledTimes(1);
    });

    it('should not use cache for different parameters', async () => {
      // Arrange
      mockUserRepo.getHealthProfile.mockResolvedValue({ id: 'profile_123' });
      mockHttpClient.post.mockResolvedValue({
        recommendations: [{ product_id: 'prod_1' }],
      });

      // Act
      await recommendationService.getRecommendations(
        'user_123',
        'weight_loss',
        'moderate'
      );
      await recommendationService.getRecommendations(
        'user_123',
        'muscle_gain',
        'moderate'
      );

      // Assert - Should call AI service twice
      expect(mockHttpClient.post).toHaveBeenCalledTimes(2);
    });
  });
});

describe('NutritionService', () => {
  let nutritionService: NutritionService;

  beforeEach(() => {
    nutritionService = new NutritionService();
  });

  describe('calculateNutrition', () => {
    it('should calculate BMR using Mifflin-St Jeor formula for male', () => {
      // Arrange
      const params = {
        age: 30,
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'moderate',
      };

      // Act
      const result = nutritionService.calculateNutrition(params);

      // Assert
      // BMR = 10*weight + 6.25*height - 5*age + 5 (for male)
      // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(result.bmr).toBeCloseTo(1780, 5);
      expect(result.tdee).toBeGreaterThan(result.bmr);
    });

    it('should calculate BMR for female', () => {
      // Arrange
      const params = {
        age: 25,
        weight: 65,
        height: 165,
        gender: 'F',
        activityLevel: 'moderate',
      };

      // Act
      const result = nutritionService.calculateNutrition(params);

      // Assert
      // BMR = 10*weight + 6.25*height - 5*age - 161 (for female)
      // BMR = 10*65 + 6.25*165 - 5*25 - 161 = 650 + 1031.25 - 125 - 161 = 1395.25
      expect(result.bmr).toBeCloseTo(1395, 5);
    });

    it('should apply activity multiplier correctly', () => {
      // Arrange
      const baseBmr = nutritionService.calculateNutrition({
        age: 30,
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'sedentary',
      });

      const activeBmr = nutritionService.calculateNutrition({
        age: 30,
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'very_active',
      });

      // Assert
      // sedentary: BMR * 1.2, very_active: BMR * 1.725
      expect(activeBmr.tdee).toBeGreaterThan(baseBmr.tdee);
      expect(activeBmr.tdee / baseBmr.tdee).toBeCloseTo(1.725 / 1.2, 1);
    });

    it('should calculate macros based on goal', () => {
      // Arrange
      const result = nutritionService.calculateNutrition({
        age: 30,
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'moderate',
        goal: 'weight_loss',
      });

      // Assert
      expect(result.macros).toBeDefined();
      expect(result.macros.protein_grams).toBeGreaterThan(0);
      expect(result.macros.carbs_grams).toBeGreaterThan(0);
      expect(result.macros.fat_grams).toBeGreaterThan(0);
      
      // For weight loss, protein should be higher (1.6-2.2g per kg)
      expect(result.macros.protein_grams / 80).toBeGreaterThanOrEqual(1.6);
    });

    it('should throw error for invalid age', () => {
      // Arrange
      const params = {
        age: 10, // Below minimum
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'moderate',
      };

      // Act & Assert
      expect(() => nutritionService.calculateNutrition(params)).toThrow(
        'Age must be between 13 and 120'
      );
    });

    it('should throw error for invalid weight', () => {
      // Arrange
      const params = {
        age: 30,
        weight: 20, // Below minimum
        height: 180,
        gender: 'M',
        activityLevel: 'moderate',
      };

      // Act & Assert
      expect(() => nutritionService.calculateNutrition(params)).toThrow(
        'Weight must be between 30 and 300 kg'
      );
    });

    it('should throw error for invalid height', () => {
      // Arrange
      const params = {
        age: 30,
        weight: 80,
        height: 80, // Below minimum
        gender: 'M',
        activityLevel: 'moderate',
      };

      // Act & Assert
      expect(() => nutritionService.calculateNutrition(params)).toThrow(
        'Height must be between 100 and 250 cm'
      );
    });

    it('should calculate water intake', () => {
      // Arrange
      const result = nutritionService.calculateNutrition({
        age: 30,
        weight: 80,
        height: 180,
        gender: 'M',
        activityLevel: 'moderate',
      });

      // Assert
      expect(result.water_liters).toBeGreaterThan(0);
      // Typical: 35-40 ml per kg
      expect(result.water_liters).toBeCloseTo((80 * 35) / 1000, 1);
    });
  });

  describe('getMacroDistribution', () => {
    it('should distribute macros by goal', () => {
      // Arrange
      const tdee = 2500;
      const weight = 80;

      // Act
      const result = nutritionService.getMacroDistribution(tdee, weight, 'weight_loss');

      // Assert
      expect(result.protein_grams).toBeDefined();
      expect(result.carbs_grams).toBeDefined();
      expect(result.fat_grams).toBeDefined();

      // Check calorie calculation: protein * 4 + carbs * 4 + fat * 9
      const calories =
        result.protein_grams * 4 +
        result.carbs_grams * 4 +
        result.fat_grams * 9;
      expect(calories).toBeCloseTo(tdee, -1); // Within 10 calories
    });

    it('should prioritize protein for weight loss', () => {
      // Arrange
      const tdee = 2500;
      const weight = 80;

      // Act
      const result = nutritionService.getMacroDistribution(tdee, weight, 'weight_loss');

      // Assert
      // For weight loss: high protein (1.6-2.2g/kg)
      expect(result.protein_grams / weight).toBeGreaterThanOrEqual(1.6);
    });

    it('should balance macros for muscle gain', () => {
      // Arrange
      const tdee = 3000;
      const weight = 80;

      // Act
      const result = nutritionService.getMacroDistribution(tdee, weight, 'muscle_gain');

      // Assert
      // For muscle gain: 1.6-2.2g protein per kg, moderate carbs
      expect(result.protein_grams / weight).toBeGreaterThanOrEqual(1.6);
      expect(result.carbs_grams).toBeGreaterThan(0);
      expect(result.fat_grams).toBeGreaterThan(0);
    });
  });
});
