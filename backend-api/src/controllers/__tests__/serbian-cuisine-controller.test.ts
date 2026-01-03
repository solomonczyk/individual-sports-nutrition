import { Request, Response } from 'express';
import { SerbianCuisineController } from '../serbian-cuisine-controller';
import { SerbianCuisineService } from '../../services/serbian-cuisine-service';

jest.mock('../../services/serbian-cuisine-service');

describe('SerbianCuisineController', () => {
  let controller: SerbianCuisineController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockService: jest.Mocked<SerbianCuisineService>;

  beforeEach(() => {
    controller = new SerbianCuisineController();
    mockService = new SerbianCuisineService() as jest.Mocked<SerbianCuisineService>;
    
    mockRequest = {
      query: {},
      params: {},
      body: {},
      user: { id: 'test-user-id' },
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getAllDishes', () => {
    it('should return all dishes', async () => {
      const mockDishes = [
        {
          id: '1',
          name_sr: 'Ћевапи',
          name_en: 'Cevapi',
          calories_per_100g: 280,
          protein_per_100g: 18,
        },
      ];

      mockService.getAllDishes.mockResolvedValue(mockDishes as any);

      await controller.getAllDishes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockDishes);
    });

    it('should handle errors', async () => {
      mockService.getAllDishes.mockRejectedValue(new Error('Database error'));

      await controller.getAllDishes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to fetch dishes',
      });
    });
  });

  describe('getPopularDishes', () => {
    it('should return popular dishes with default limit', async () => {
      const mockDishes = [{ id: '1', is_popular: true }];
      mockService.getPopularDishes.mockResolvedValue(mockDishes as any);

      await controller.getPopularDishes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getPopularDishes).toHaveBeenCalledWith(10);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDishes);
    });

    it('should respect custom limit', async () => {
      mockRequest.query = { limit: '5' };
      mockService.getPopularDishes.mockResolvedValue([]);

      await controller.getPopularDishes(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getPopularDishes).toHaveBeenCalledWith(5);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', async () => {
      const mockPreferences = {
        user_id: 'test-user-id',
        prefers_local_cuisine: true,
        favorite_dishes: [],
        avoided_ingredients: [],
        dietary_restrictions: [],
      };

      mockService.getUserPreferences.mockResolvedValue(mockPreferences as any);

      await controller.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockPreferences);
    });

    it('should return default preferences when none exist', async () => {
      mockService.getUserPreferences.mockResolvedValue(null);

      await controller.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        prefers_local_cuisine: true,
        favorite_dishes: [],
        avoided_ingredients: [],
        dietary_restrictions: [],
      });
    });

    it('should return 401 when user not authenticated', async () => {
      mockRequest.user = undefined;

      await controller.getUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('updateUserPreferences', () => {
    it('should update preferences', async () => {
      const updatedPreferences = {
        user_id: 'test-user-id',
        prefers_local_cuisine: false,
        favorite_dishes: ['dish-1'],
        avoided_ingredients: ['gluten'],
        dietary_restrictions: ['vegetarian'],
      };

      mockRequest.body = {
        prefers_local_cuisine: false,
        avoided_ingredients: ['gluten'],
      };

      mockService.updateUserPreferences.mockResolvedValue(updatedPreferences as any);

      await controller.updateUserPreferences(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.updateUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
        mockRequest.body
      );
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPreferences);
    });
  });

  describe('getRecommendations', () => {
    it('should return dish recommendations', async () => {
      const mockRecommendations = [
        {
          dish: { id: '1', name_sr: 'Ћевапи' },
          recommended_serving: 200,
          fits_macros: true,
          reason: 'Good protein source',
          reason_sr: 'Dobar izvor proteina',
        },
      ];

      mockService.getRecommendationsForUser.mockResolvedValue(mockRecommendations as any);

      await controller.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getRecommendationsForUser).toHaveBeenCalledWith(
        'test-user-id',
        2500,
        150,
        250,
        80
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockRecommendations);
    });

    it('should use custom macro targets', async () => {
      mockRequest.query = {
        targetCalories: '3000',
        targetProtein: '200',
        targetCarbs: '300',
        targetFat: '100',
      };

      mockService.getRecommendationsForUser.mockResolvedValue([]);

      await controller.getRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getRecommendationsForUser).toHaveBeenCalledWith(
        'test-user-id',
        3000,
        200,
        300,
        100
      );
    });
  });
});
