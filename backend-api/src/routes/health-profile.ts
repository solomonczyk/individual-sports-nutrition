import { Router } from 'express'
import { HealthProfileController } from '../controllers/health-profile-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new HealthProfileController()

router.get('/', authMiddleware, (req, res, next) => controller.get(req, res, next))
router.post('/', authMiddleware, (req, res, next) => controller.create(req, res, next))
router.put('/', authMiddleware, (req, res, next) => controller.update(req, res, next))

export default router

