import { Router } from 'express'
import { NutritionController } from '../controllers/nutrition-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new NutritionController()

router.get('/calculate', authMiddleware, (req, res, next) => controller.calculate(req, res, next))

export default router

