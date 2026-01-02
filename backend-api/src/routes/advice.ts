import { Router } from 'express'
import { AdviceController } from '../controllers/advice-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new AdviceController()

/**
 * @route POST /api/v1/advice/personalized
 * @desc Get personalized nutritional advice via AI RAG
 * @access Private
 */
router.post('/personalized', authMiddleware, (req, res, next) =>
    controller.getPersonalizedAdvice(req as any, res, next)
)

export default router
