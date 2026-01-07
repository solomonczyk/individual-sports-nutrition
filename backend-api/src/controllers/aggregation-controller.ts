/**
 * Aggregation Controller
 * API endpoints для управления агрегацией данных
 */

import { Request, Response, NextFunction } from 'express'
import { AggregationService } from '../services/aggregation'
import { logger } from '../utils/logger'

const aggregationService = new AggregationService();

/**
 * Запустить агрегацию для магазина
 * POST /api/admin/aggregation/:storeId/run
 */
export async function runAggregation(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.params;
    
    logger.info(`Starting aggregation for store ${storeId}`);
    const result = await aggregationService.runAggregation(storeId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Получить статус последней агрегации
 * GET /api/admin/aggregation/:storeId/status
 */
export async function getAggregationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.params;
    const status = await aggregationService.getLastAggregationStatus(storeId);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Получить список pending products
 * GET /api/admin/aggregation/pending
 */
export async function getPendingProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId: _storeId, status: _status = 'pending', limit = 50, offset = 0 } = req.query;
    
    // TODO: Implement with repository
    res.json({
      success: true,
      data: [],
      pagination: { limit, offset, total: 0 },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Одобрить/отклонить pending product
 * POST /api/admin/aggregation/pending/:id/review
 */
export async function reviewPendingProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: _id } = req.params;
    const { action, matchedProductId: _matchedProductId } = req.body; // action: 'approve' | 'reject'
    
    // TODO: Implement review logic
    res.json({
      success: true,
      message: `Product ${action}d successfully`,
    });
  } catch (error) {
    next(error);
  }
}
