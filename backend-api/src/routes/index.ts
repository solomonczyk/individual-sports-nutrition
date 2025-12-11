import { Router } from 'express'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'individual-sports-nutrition-api',
  })
})

export default router

