import { Router } from 'express'
import { DosageController, PriceComparisonController } from '../controllers/dosage-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const dosageController = new DosageController()
const priceController = new PriceComparisonController()

router.get('/calculate', authMiddleware, (req, res, next) => dosageController.calculateDosages(req, res, next))
router.get('/shopping-options', authMiddleware, (req, res, next) =>
  dosageController.getShoppingOptions(req, res, next)
)

// Price comparison routes
router.get('/products/:productId/prices', (req: any, res, next) => priceController.compareProduct(req, res, next))

export default router

