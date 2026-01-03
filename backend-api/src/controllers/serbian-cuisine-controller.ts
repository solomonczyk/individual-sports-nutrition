import { Request, Response } from 'express';
import { SerbianCuisineService } from '../services/serbian-cuisine-service';

const cuisineService = new SerbianCuisineService();

export class SerbianCuisineController {
  // Get all dishes
  async getAllDishes(req: Request, res: Response) {
    try {
      const { language = 'sr' } = req.query;
      const dishes = await cuisineService.getAllDishes(language as string);
      res.json(dishes);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      res.status(500).json({ error: 'Failed to fetch dishes' });
    }
  }

  // Get popular dishes
  async getPopularDishes(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      const dishes = await cuisineService.getPopularDishes(Number(limit));
      res.json(dishes);
    } catch (error) {
      console.error('Error fetching popular dishes:', error);
      res.status(500).json({ error: 'Failed to fetch popular dishes' });
    }
  }

  // Get dish by ID
  async getDishById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dish = await cuisineService.getDishById(id);

      if (!dish) {
        return res.status(404).json({ error: 'Dish not found' });
      }

      res.json(dish);
    } catch (error) {
      console.error('Error fetching dish:', error);
      res.status(500).json({ error: 'Failed to fetch dish' });
    }
  }

  // Get user food preferences
  async getUserPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const preferences = await cuisineService.getUserPreferences(userId);
      res.json(preferences || {
        prefers_local_cuisine: true,
        favorite_dishes: [],
        avoided_ingredients: [],
        dietary_restrictions: [],
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
      res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  // Update user food preferences
  async updateUserPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const preferences = await cuisineService.updateUserPreferences(userId, req.body);
      res.json(preferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  // Get dish recommendations for user
  async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        targetCalories = 2500,
        targetProtein = 150,
        targetCarbs = 250,
        targetFat = 80,
      } = req.query;

      const recommendations = await cuisineService.getRecommendationsForUser(
        userId,
        Number(targetCalories),
        Number(targetProtein),
        Number(targetCarbs),
        Number(targetFat)
      );

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }

  // Get local brands
  async getLocalBrands(req: Request, res: Response) {
    try {
      const brands = await cuisineService.getLocalBrands();
      res.json(brands);
    } catch (error) {
      console.error('Error fetching local brands:', error);
      res.status(500).json({ error: 'Failed to fetch local brands' });
    }
  }

  // Mark brand as local (admin only)
  async markBrandAsLocal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isLocal = true } = req.body;

      await cuisineService.markBrandAsLocal(id, isLocal);
      res.json({ message: 'Brand updated successfully' });
    } catch (error) {
      console.error('Error updating brand:', error);
      res.status(500).json({ error: 'Failed to update brand' });
    }
  }
}
