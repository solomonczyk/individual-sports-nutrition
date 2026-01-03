import { Router } from 'express';
import { AdminController } from '../controllers/admin-controller';

const router = Router();
const adminController = new AdminController();

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats.bind(adminController));

// Products
router.get('/products', adminController.getProducts.bind(adminController));
router.get('/products/:id', adminController.getProductById.bind(adminController));

// Stores
router.get('/stores', adminController.getStores.bind(adminController));
router.post('/stores/:id/sync', adminController.syncStore.bind(adminController));

// Brands
router.get('/brands', adminController.getBrands.bind(adminController));
router.post('/brands', adminController.createBrand.bind(adminController));
router.put('/brands/:id', adminController.updateBrand.bind(adminController));

export default router;
