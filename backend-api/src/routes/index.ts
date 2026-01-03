import { Router } from 'express'
import authRouter from './auth'
import healthProfileRouter from './health-profile'
import nutritionRouter from './nutrition'
import nutritionPlanRouter from './nutrition-plan'
import productsRouter from './products'
import recommendationsRouter from './recommendations'
import dosageRouter from './dosage'
import mealPlanRouter from './meal-plan'
import progressRouter from './progress'
import adviceRouter from './advice'
import adminRouter from './admin'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'individual-sports-nutrition-api',
  })
})

router.use('/auth', authRouter)
router.use('/health-profile', healthProfileRouter)
router.use('/nutrition', nutritionRouter)
router.use('/nutrition-plan', nutritionPlanRouter)
router.use('/products', productsRouter)
router.use('/recommendations', recommendationsRouter)
router.use('/dosage', dosageRouter)
router.use('/meal-plan', mealPlanRouter)
router.use('/progress', progressRouter)
router.use('/advice', adviceRouter)
router.use('/admin', adminRouter)

export default router

