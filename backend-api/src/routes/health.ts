import { Router } from 'express'
import { HealthController } from '../controllers/health-controller'

const router = Router()
const healthController = new HealthController()

router.get('/health', (req, res) => healthController.healthCheck(req, res))
router.get('/ready', (req, res) => healthController.readiness(req, res))
router.get('/live', (req, res) => healthController.liveness(req, res))

export default router