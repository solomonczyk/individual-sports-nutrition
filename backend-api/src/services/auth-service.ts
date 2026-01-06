import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user-repository'
import { CreateUserInput, User } from '../models/user'
import { config } from '../config/env'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    preferred_language: string
  }
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export class AuthService {
  private userRepository: UserRepository

  constructor() {
    this.userRepository = new UserRepository()
  }

  async register(input: CreateUserInput): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) {
      const error: Error & { code?: string } = new Error('User with this email already exists')
      error.code = 'USER_EXISTS'
      throw error
    }

    const password_hash = await bcrypt.hash(input.password, 12) // Increased to 12 rounds

    const user = await this.userRepository.create({
      ...input,
      password_hash,
    })

    const { accessToken, refreshToken } = this.generateTokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        preferred_language: user.preferred_language,
      },
      accessToken,
      refreshToken,
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email)
    if (!user) {
      const error: Error & { code?: string } = new Error('Invalid email or password')
      error.code = 'INVALID_CREDENTIALS'
      throw error
    }

    const isValidPassword = await bcrypt.compare(input.password, user.password_hash)
    if (!isValidPassword) {
      const error: Error & { code?: string } = new Error('Invalid email or password')
      error.code = 'INVALID_CREDENTIALS'
      throw error
    }

    const { accessToken, refreshToken } = this.generateTokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        preferred_language: user.preferred_language,
      },
      accessToken,
      refreshToken,
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string }
      const user = await this.userRepository.findById(decoded.userId)
      return user
    } catch (error) {
      return null
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as { 
        userId: string
        type: string 
      }
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      const user = await this.userRepository.findById(decoded.userId)
      if (!user) {
        throw new Error('User not found')
      }

      const tokens = this.generateTokens(user)
      return tokens
    } catch (error) {
      const authError: Error & { code?: string } = new Error('Invalid refresh token')
      authError.code = 'INVALID_REFRESH_TOKEN'
      throw authError
    }
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessPayload = { 
      userId: user.id, 
      email: user.email,
      type: 'access'
    }
    
    const refreshPayload = { 
      userId: user.id,
      type: 'refresh'
    }

    const accessToken = jwt.sign(accessPayload, config.JWT_SECRET, {
      expiresIn: '15m', // Short-lived access token
      issuer: 'nutrition-api',
      audience: 'nutrition-app',
    })

    const refreshToken = jwt.sign(refreshPayload, config.JWT_SECRET, {
      expiresIn: '7d', // Long-lived refresh token
      issuer: 'nutrition-api',
      audience: 'nutrition-app',
    })

    return { accessToken, refreshToken }
  }
}

