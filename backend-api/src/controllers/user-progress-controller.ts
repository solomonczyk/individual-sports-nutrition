import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { UserProgressService } from '../services/user-progress-service'
import { ApiError } from '../middlewares/error-handler'
import { CreateUserProgressInput } from '../models/user-progress'

export class UserProgressController {
  private service: UserProgressService

  constructor() {
    this.service = new UserProgressService()
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined

      const progress = await this.service.getByUserId(req.user.id, startDate, endDate)

      res.json({
        success: true,
        data: progress,
      })
    } catch (error) {
      next(error)
    }
  }

  async getByDate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const { date } = req.params
      if (!date) {
        const error: ApiError = new Error('Date parameter is required')
        error.statusCode = 400
        throw error
      }

      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) {
        const error: ApiError = new Error('Invalid date format. Use YYYY-MM-DD')
        error.statusCode = 400
        throw error
      }

      const progress = await this.service.getByUserIdAndDate(req.user.id, dateObj)

      if (!progress) {
        res.json({
          success: true,
          data: null,
        })
        return
      }

      res.json({
        success: true,
        data: progress,
      })
    } catch (error) {
      next(error)
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const input: CreateUserProgressInput = req.body

      if (!input.date) {
        const error: ApiError = new Error('Date is required')
        error.statusCode = 400
        throw error
      }

      const progress = await this.service.create(req.user.id, input)

      res.status(201).json({
        success: true,
        data: progress,
      })
    } catch (error) {
      next(error)
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const { date } = req.params
      if (!date) {
        const error: ApiError = new Error('Date parameter is required')
        error.statusCode = 400
        throw error
      }

      const input: Partial<CreateUserProgressInput> = req.body
      const progress = await this.service.update(req.user.id, date, input)

      res.json({
        success: true,
        data: progress,
      })
    } catch (error) {
      next(error)
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const { date } = req.params
      if (!date) {
        const error: ApiError = new Error('Date parameter is required')
        error.statusCode = 400
        throw error
      }

      await this.service.delete(req.user.id, date)

      res.json({
        success: true,
        message: 'Progress deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const error: ApiError = new Error('Unauthorized')
        error.statusCode = 401
        throw error
      }

      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined

      const stats = await this.service.getStats(req.user.id, startDate, endDate)

      res.json({
        success: true,
        data: stats,
      })
    } catch (error) {
      next(error)
    }
  }
}

