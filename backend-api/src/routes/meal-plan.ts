import { Router } from 'express'
import { MealPlanController } from '../controllers/meal-plan-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new MealPlanController()

router.post('/generate', authMiddleware, (req, res, next) => controller.generateDailyPlan(req, res, next))
router.get('/daily/:date', authMiddleware, (req, res, next) => controller.getDailyPlan(req, res, next))
router.get('/daily', authMiddleware, (req, res, next) => controller.getDailyPlan(req, res, next))
router.post('/weekly', authMiddleware, (req, res, next) => controller.generateWeeklyPlan(req, res, next))

export default router

