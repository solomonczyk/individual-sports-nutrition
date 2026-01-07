/**
 * Aggregation Routes
 * API routes для системы агрегации (только для админов)
 */

import { Router } from 'express';
import { 
  runAggregation, 
  getAggregationStatus, 
  getPendingProducts,
  reviewPendingProduct 
} from '../controllers/aggregation-controller';
import { authenticate as authMiddleware } from '../middlewares/auth';

const router = Router();

// Все роуты требуют аутентификации
// TODO: Добавить проверку роли admin
router.use(authMiddleware);

// Запустить агрегацию для магазина
router.post('/:storeId/run', runAggregation);

// Получить статус последней агрегации
router.get('/:storeId/status', getAggregationStatus);

// Получить список pending products
router.get('/pending', getPendingProducts);

// Одобрить/отклонить pending product
router.post('/pending/:id/review', reviewPendingProduct);

export default router;
