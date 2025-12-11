import { Router } from 'express'
import { NutritionPlanController } from '../controllers/nutrition-plan-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new NutritionPlanController()

router.get('/', authMiddleware, (req, res, next) => controller.get(req, res, next))

export default router

