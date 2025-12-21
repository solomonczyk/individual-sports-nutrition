import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { RecommendationController } from '../../src/controllers/recommendation.controller';
import { HealthController } from '../../src/controllers/health.controller';
import { UserController } from '../../src/controllers/user.controller';

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let mockRecommendationService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRecommendationService = {
      getRecommendations: vi.fn(),
      getPersonalizedMealPlan: vi.fn(),
      updateRecommendationPreferences: vi.fn(),
    };

    controller = new RecommendationController(mockRecommendationService);

    mockRequest = {
      params: {},
      query: {},
      body: {},
      userId: 'user_123',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should get recommendations for user', async () => {
    // Arrange
    const recommendations = [
      { id: 'rec_1', mealName: 'Grilled Chicken', score: 0.95 },
      { id: 'rec_2', mealName: 'Salmon Rice Bowl', score: 0.92 },
    ];

    mockRequest.query = {
      goal: 'weight_loss',
      activityLevel: 'moderate',
    };

    mockRecommendationService.getRecommendations.mockResolvedValue(recommendations);

    // Act
    await controller.getRecommendations(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: recommendations,
    });
  });

  it('should handle missing required query parameters', async () => {
    // Arrange
    mockRequest.query = {}; // Missing goal and activityLevel

    // Act
    await controller.getRecommendations(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });

  it('should get personalized meal plan', async () => {
    // Arrange
    const mealPlan = {
      id: 'plan_123',
      days: [
        {
          date: '2025-01-15',
          meals: [
            { mealType: 'breakfast', name: 'Oatmeal with berries' },
            { mealType: 'lunch', name: 'Grilled chicken salad' },
            { mealType: 'dinner', name: 'Salmon with vegetables' },
          ],
        },
      ],
    };

    mockRequest.body = {
      days: 7,
      preferences: { dietaryRestrictions: ['dairy'] },
    };

    mockRecommendationService.getPersonalizedMealPlan.mockResolvedValue(mealPlan);

    // Act
    await controller.getPersonalizedMealPlan(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: mealPlan,
    });
  });
});

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockHealthService = {
      getHealthProfile: vi.fn(),
      updateHealthProfile: vi.fn(),
      calculateNutritionGoals: vi.fn(),
    };

    controller = new HealthController(mockHealthService);

    mockRequest = {
      params: {},
      userId: 'user_123',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should get user health profile', async () => {
    // Arrange
    const healthProfile = {
      id: 'hp_123',
      age: 34,
      gender: 'male',
      weight: 80,
      height: 180,
      activityLevel: 'moderate',
      goal: 'weight_loss',
    };

    mockHealthService.getHealthProfile.mockResolvedValue(healthProfile);

    // Act
    await controller.getHealthProfile(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: healthProfile,
    });
  });

  it('should update health profile', async () => {
    // Arrange
    mockRequest.body = {
      weight: 78,
      activityLevel: 'very_active',
    };

    const updatedProfile = {
      id: 'hp_123',
      age: 34,
      gender: 'male',
      weight: 78,
      height: 180,
      activityLevel: 'very_active',
      goal: 'weight_loss',
      updatedAt: new Date(),
    };

    mockHealthService.updateHealthProfile.mockResolvedValue(updatedProfile);

    // Act
    await controller.updateHealthProfile(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: updatedProfile,
    });
  });

  it('should calculate nutrition goals', async () => {
    // Arrange
    const nutritionGoals = {
      tdee: 2400,
      protein: 180,
      carbs: 240,
      fat: 80,
      water: 3200,
    };

    mockHealthService.calculateNutritionGoals.mockResolvedValue(nutritionGoals);

    // Act
    await controller.calculateNutritionGoals(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: nutritionGoals,
    });
  });
});

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserService = {
      getUserProfile: vi.fn(),
      updateUserProfile: vi.fn(),
      updatePreferences: vi.fn(),
      deleteAccount: vi.fn(),
    };

    controller = new UserController(mockUserService);

    mockRequest = {
      params: {},
      userId: 'user_123',
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    mockNext = vi.fn();
  });

  it('should get user profile', async () => {
    // Arrange
    const profile = {
      id: 'user_123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    mockUserService.getUserProfile.mockResolvedValue(profile);

    // Act
    await controller.getUserProfile(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: profile,
    });
  });

  it('should update user profile', async () => {
    // Arrange
    mockRequest.body = {
      firstName: 'John',
      lastName: 'Doe Updated',
    };

    const updatedProfile = {
      id: 'user_123',
      email: 'user@example.com',
      ...mockRequest.body,
      updatedAt: new Date(),
    };

    mockUserService.updateUserProfile.mockResolvedValue(updatedProfile);

    // Act
    await controller.updateUserProfile(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: updatedProfile,
    });
  });

  it('should delete user account', async () => {
    // Arrange
    mockUserService.deleteAccount.mockResolvedValue({ success: true });

    // Act
    await controller.deleteAccount(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Account deleted successfully',
    });
  });

  it('should update user preferences', async () => {
    // Arrange
    mockRequest.body = {
      dietaryRestrictions: ['vegetarian'],
      allergens: ['peanuts'],
    };

    const updatedPreferences = {
      id: 'user_123',
      preferences: mockRequest.body,
    };

    mockUserService.updatePreferences.mockResolvedValue(updatedPreferences);

    // Act
    await controller.updatePreferences(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: updatedPreferences,
    });
  });
});

describe('Error Handling in Controllers', () => {
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  it('should handle service errors', async () => {
    // Arrange
    const mockService = {
      getRecommendations: vi.fn().mockRejectedValue(
        new Error('Service unavailable')
      ),
    };

    const controller = new RecommendationController(mockService);

    const mockRequest = {
      userId: 'user_123',
      query: { goal: 'weight_loss', activityLevel: 'moderate' },
    } as any;

    // Act
    await controller.getRecommendations(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should handle validation errors', async () => {
    // Arrange
    const mockService = {
      updateHealthProfile: vi.fn().mockRejectedValue(
        new Error('Invalid health data')
      ),
    };

    const controller = new HealthController(mockService);

    const mockRequest = {
      userId: 'user_123',
      body: { age: 10 }, // Invalid age
    } as any;

    // Act
    await controller.updateHealthProfile(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
  });
});
