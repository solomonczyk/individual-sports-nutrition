import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth-service'
import { ApiError } from './error-handler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error: ApiError = new Error('Unauthorized')
      error.statusCode = 401
      error.code = 'UNAUTHORIZED'
      throw error
    }

    const token = authHeader.substring(7)
    const authService = new AuthService()
    const user = await authService.verifyToken(token)

    if (!user) {
      const error: ApiError = new Error('Invalid token')
      error.statusCode = 401
      error.code = 'INVALID_TOKEN'
      throw error
    }

    req.user = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch (error) {
    next(error)
  }
}

