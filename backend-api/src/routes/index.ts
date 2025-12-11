import { Router } from 'express'
import authRouter from './auth'
import healthProfileRouter from './health-profile'

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

export default router

