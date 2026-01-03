import { Router } from 'express';
import { SerbianCuisineController } from '../controllers/serbian-cuisine-controller';

const router = Router();
const controller = new SerbianCuisineController();

// Public routes
router.get('/dishes', controller.getAllDishes.bind(controller));
router.get('/dishes/popular', controller.getPopularDishes.bind(controller));
router.get('/dishes/:id', controller.getDishById.bind(controller));
router.get('/brands/local', controller.getLocalBrands.bind(controller));

// Protected routes (require authentication)
// Note: Add auth middleware when implementing authentication
router.get('/preferences', controller.getUserPreferences.bind(controller));
router.put('/preferences', controller.updateUserPreferences.bind(controller));
router.get('/recommendations', controller.getRecommendations.bind(controller));

// Admin routes
router.put('/brands/:id/local', controller.markBrandAsLocal.bind(controller));

export default router;
