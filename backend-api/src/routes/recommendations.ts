import { Router } from 'express'
import { RecommendationController } from '../controllers/recommendation-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new RecommendationController()

router.get('/', authMiddleware, (req, res, next) => controller.getRecommendations(req, res, next))
router.get(
  '/products/:productId/check',
  authMiddleware,
  (req, res, next) => controller.checkCompatibility(req, res, next)
)

export default router

