import { AuthService } from '../auth-service'
import { UserRepository } from '../../repositories/user-repository'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../../config/env'

// Mock dependencies
jest.mock('../../repositories/user-repository')
jest.mock('bcryptjs')
jest.mock('jsonwebtoken')

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('AuthService Enhanced JWT', () => {
  let authService: AuthService
  let mockUserRepo: jest.Mocked<UserRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    authService = new AuthService()
    mockUserRepo = new mockUserRepository() as jest.Mocked<UserRepository>
    ;(authService as any).userRepository = mockUserRepo
  })

  describe('register', () => {
    it('should create user with enhanced password hashing', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        preferred_language: 'en' as const,
      }

      const mockUser = {
        id: 'user-id',
        email: input.email,
        preferred_language: 'en',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed-password')
      mockUserRepo.create.mockResolvedValue(mockUser)
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      const result = await authService.register(input)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(input.password, 12) // Enhanced to 12 rounds
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          preferred_language: mockUser.preferred_language,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })

    it('should generate tokens with correct payload and options', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: 'user-id',
        email: input.email,
        preferred_language: 'en',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockBcrypt.hash.mockResolvedValue('hashed-password')
      mockUserRepo.create.mockResolvedValue(mockUser)
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      await authService.register(input)

      // Check access token generation
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          type: 'access',
        },
        config.JWT_SECRET,
        {
          expiresIn: '15m',
          issuer: 'nutrition-api',
          audience: 'nutrition-app',
        }
      )

      // Check refresh token generation
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          type: 'refresh',
        },
        config.JWT_SECRET,
        {
          expiresIn: '7d',
          issuer: 'nutrition-api',
          audience: 'nutrition-app',
        }
      )
    })
  })

  describe('login', () => {
    it('should return access and refresh tokens on successful login', async () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser = {
        id: 'user-id',
        email: input.email,
        preferred_language: 'en',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true)
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      const result = await authService.login(input)

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          preferred_language: mockUser.preferred_language,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })
  })

  describe('refreshToken', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token'
      const mockDecoded = {
        userId: 'user-id',
        type: 'refresh',
      }

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        preferred_language: 'en',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockJwt.verify.mockReturnValue(mockDecoded)
      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockJwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token')

      const result = await authService.refreshToken(refreshToken)

      expect(mockJwt.verify).toHaveBeenCalledWith(refreshToken, config.JWT_SECRET)
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
    })

    it('should throw error for invalid token type', async () => {
      const refreshToken = 'invalid-token'
      const mockDecoded = {
        userId: 'user-id',
        type: 'access', // Wrong type
      }

      mockJwt.verify.mockReturnValue(mockDecoded)

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error for non-existent user', async () => {
      const refreshToken = 'valid-refresh-token'
      const mockDecoded = {
        userId: 'non-existent-user',
        type: 'refresh',
      }

      mockJwt.verify.mockReturnValue(mockDecoded)
      mockUserRepo.findById.mockResolvedValue(null)

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token')
    })

    it('should throw error for invalid JWT', async () => {
      const refreshToken = 'invalid-jwt'

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('verifyToken', () => {
    it('should return user for valid token', async () => {
      const token = 'valid-token'
      const mockDecoded = { userId: 'user-id' }
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        preferred_language: 'en',
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockJwt.verify.mockReturnValue(mockDecoded)
      mockUserRepo.findById.mockResolvedValue(mockUser)

      const result = await authService.verifyToken(token)

      expect(result).toEqual(mockUser)
    })

    it('should return null for invalid token', async () => {
      const token = 'invalid-token'

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await authService.verifyToken(token)

      expect(result).toBeNull()
    })

    it('should return null for non-existent user', async () => {
      const token = 'valid-token'
      const mockDecoded = { userId: 'non-existent-user' }

      mockJwt.verify.mockReturnValue(mockDecoded)
      mockUserRepo.findById.mockResolvedValue(null)

      const result = await authService.verifyToken(token)

      expect(result).toBeNull()
    })
  })
})