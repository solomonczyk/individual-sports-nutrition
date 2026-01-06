import { Router } from 'express'
import { AuthController } from '../controllers/auth-controller'
import { authLimiter } from '../middlewares/rate-limit'

const router = Router()
const authController = new AuthController()

// Apply auth rate limiting to all auth routes
router.use(authLimiter)

router.post('/register', (req, res, next) => authController.register(req, res, next))
router.post('/login', (req, res, next) => authController.login(req, res, next))
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next))

export default router

