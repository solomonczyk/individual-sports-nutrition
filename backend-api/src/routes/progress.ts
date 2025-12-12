import { Router } from 'express'
import { UserProgressController } from '../controllers/user-progress-controller'
import { authMiddleware } from '../middlewares/auth'

const router = Router()
const controller = new UserProgressController()

// Get all progress entries (with optional date range)
router.get('/', authMiddleware, (req, res, next) => controller.get(req, res, next))

// Get progress by date
router.get('/:date', authMiddleware, (req, res, next) => controller.getByDate(req, res, next))

// Create progress entry
router.post('/', authMiddleware, (req, res, next) => controller.create(req, res, next))

// Update progress entry
router.put('/:date', authMiddleware, (req, res, next) => controller.update(req, res, next))

// Delete progress entry
router.delete('/:date', authMiddleware, (req, res, next) => controller.delete(req, res, next))

// Get statistics
router.get('/stats', authMiddleware, (req, res, next) => controller.getStats(req, res, next))

export default router

