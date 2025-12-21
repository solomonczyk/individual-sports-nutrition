import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../src/services/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock bcrypt and jwt
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockHttpClient: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock dependencies
    mockUserRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    };

    mockHttpClient = {
      post: vi.fn(),
      get: vi.fn(),
    };

    // Initialize service with mocks
    authService = new AuthService(mockUserRepository, mockHttpClient);

    // Set process.env
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRY = '24h';
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashed-password-123';
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      const createdUser = {
        id: 'user_123',
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      const token = 'jwt-token-123';
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user_123',
          email: userData.email,
          firstName: userData.firstName,
        }),
        token: token,
      });
    });

    it('should reject registration with existing email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const existingUser = {
        id: 'user_456',
        email: userData.email,
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should validate password strength', async () => {
      // Arrange
      const userData = {
        email: 'user@example.com',
        password: 'weak', // Too weak
        firstName: 'John',
        lastName: 'Doe',
      };

      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should require all required fields', async () => {
      // Arrange
      const incompleteData = {
        email: 'user@example.com',
        password: 'SecurePassword123',
        // Missing firstName and lastName
      } as any;

      // Act & Assert
      await expect(authService.register(incompleteData)).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const credentials = {
        email: 'user@example.com',
        password: 'CorrectPassword123',
      };

      const hashedPassword = await bcrypt.hash(credentials.password, 10);
      const user = {
        id: 'user_123',
        email: credentials.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as any).mockResolvedValue(true);

      const token = 'jwt-token-123';
      (jwt.sign as any).mockReturnValue(token);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        credentials.password,
        user.password
      );
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'user_123',
          email: credentials.email,
        }),
        token: token,
      });
    });

    it('should reject login with non-existent email', async () => {
      // Arrange
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should reject login with incorrect password', async () => {
      // Arrange
      const credentials = {
        email: 'user@example.com',
        password: 'WrongPassword123',
      };

      const user = {
        id: 'user_123',
        email: credentials.email,
        password: 'hashed-correct-password',
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as any).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should reject login for inactive users', async () => {
      // Arrange
      const credentials = {
        email: 'inactive@example.com',
        password: 'CorrectPassword123',
      };

      const inactiveUser = {
        id: 'user_456',
        email: credentials.email,
        password: 'hashed-password',
        isActive: false,
      };

      mockUserRepository.findByEmail.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow(
        'User account is inactive'
      );
    });
  });

  describe('Token Validation', () => {
    it('should validate valid JWT token', async () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decoded = {
        userId: 'user_123',
        email: 'user@example.com',
      };

      (jwt.verify as any).mockReturnValue(decoded);

      // Act
      const result = authService.validateToken(token);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(decoded);
    });

    it('should reject expired token', () => {
      // Arrange
      const token = 'expired-jwt-token';

      (jwt.verify as any).mockImplementation(() => {
        const error = new Error('jwt expired');
        (error as any).name = 'TokenExpiredError';
        throw error;
      });

      // Act & Assert
      expect(() => authService.validateToken(token)).toThrow(
        'Token has expired'
      );
    });

    it('should reject invalid token', () => {
      // Arrange
      const token = 'invalid-jwt-token';

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // Act & Assert
      expect(() => authService.validateToken(token)).toThrow(
        'Invalid token'
      );
    });

    it('should extract user ID from token', () => {
      // Arrange
      const token = 'valid-jwt-token';
      const decoded = {
        userId: 'user_123',
        email: 'user@example.com',
        iat: 1234567890,
        exp: 1234571490,
      };

      (jwt.verify as any).mockReturnValue(decoded);

      // Act
      const result = authService.validateToken(token);

      // Assert
      expect(result.userId).toBe('user_123');
    });
  });

  describe('Token Refresh', () => {
    it('should generate new token from refresh token', async () => {
      // Arrange
      const refreshToken = 'refresh-token-123';
      const decoded = { userId: 'user_123' };
      const newToken = 'new-jwt-token';

      (jwt.verify as any).mockReturnValue(decoded);
      (jwt.sign as any).mockReturnValue(newToken);

      const user = {
        id: 'user_123',
        email: 'user@example.com',
        refreshToken: refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      mockUserRepository.findById.mockResolvedValue(user);

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_SECRET);
      expect(result).toEqual({
        token: newToken,
        refreshToken: expect.any(String),
      });
    });

    it('should reject expired refresh token', async () => {
      // Arrange
      const refreshToken = 'expired-refresh-token';
      const decoded = { userId: 'user_123' };

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });

    it('should reject invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-refresh-token';

      (jwt.verify as any).mockImplementation(() => {
        throw new Error('invalid signature');
      });

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow();
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset for existing user', async () => {
      // Arrange
      const email = 'user@example.com';
      const user = {
        id: 'user_123',
        email: email,
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue({
        ...user,
        resetToken: expect.any(String),
        resetTokenExpiry: expect.any(Date),
      });

      mockHttpClient.post.mockResolvedValue({ success: true });

      // Act
      const result = await authService.initiatePasswordReset(email);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockHttpClient.post).toHaveBeenCalled(); // Email service call
      expect(result).toEqual({ success: true });
    });

    it('should reject password reset for non-existent user', async () => {
      // Arrange
      const email = 'nonexistent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.initiatePasswordReset(email)
      ).rejects.toThrow('User not found');
    });

    it('should validate reset token and update password', async () => {
      // Arrange
      const resetToken = 'reset-token-123';
      const newPassword = 'NewPassword123';
      const hashedPassword = 'hashed-new-password';

      const user = {
        id: 'user_123',
        email: 'user@example.com',
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
      };

      mockUserRepository.findById.mockResolvedValue(user);
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      mockUserRepository.update.mockResolvedValue({
        ...user,
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      // Act
      await authService.resetPassword(resetToken, newPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          password: hashedPassword,
          resetToken: null,
        })
      );
    });

    it('should reject expired reset token', async () => {
      // Arrange
      const resetToken = 'expired-reset-token';
      const newPassword = 'NewPassword123';

      const user = {
        id: 'user_123',
        email: 'user@example.com',
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() - 1000), // 1 second ago (expired)
      };

      mockUserRepository.findById.mockResolvedValue(user);

      // Act & Assert
      await expect(
        authService.resetPassword(resetToken, newPassword)
      ).rejects.toThrow('Reset token has expired');
    });
  });

  describe('Logout', () => {
    it('should invalidate user token on logout', async () => {
      // Arrange
      const userId = 'user_123';
      const token = 'jwt-token-123';

      mockUserRepository.update.mockResolvedValue({
        id: userId,
      });

      // Act
      await authService.logout(userId, token);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastLogoutAt: expect.any(Date),
        })
      );
    });

    it('should handle logout for invalid user', async () => {
      // Arrange
      const userId = 'invalid_user';

      mockUserRepository.update.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(authService.logout(userId, 'token')).rejects.toThrow();
    });
  });

  describe('Two-Factor Authentication', () => {
    it('should enable 2FA for user', async () => {
      // Arrange
      const userId = 'user_123';
      const user = { id: userId, email: 'user@example.com' };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue({
        ...user,
        twoFactorEnabled: true,
        twoFactorSecret: expect.any(String),
      });

      // Act
      const result = await authService.enableTwoFactor(userId);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          twoFactorEnabled: true,
          qrCode: expect.any(String),
        })
      );
    });

    it('should verify 2FA code', async () => {
      // Arrange
      const userId = 'user_123';
      const code = '123456';

      const user = {
        id: userId,
        twoFactorSecret: 'secret-123',
        twoFactorEnabled: true,
      };

      mockUserRepository.findById.mockResolvedValue(user);

      // Mock speakeasy verification
      vi.mock('speakeasy', () => ({
        totp: { verify: vi.fn().mockReturnValue(true) },
      }));

      // Act
      const result = await authService.verifyTwoFactorCode(userId, code);

      // Assert
      expect(result).toBe(true);
    });

    it('should disable 2FA for user', async () => {
      // Arrange
      const userId = 'user_123';

      mockUserRepository.update.mockResolvedValue({
        id: userId,
        twoFactorEnabled: false,
      });

      // Act
      await authService.disableTwoFactor(userId);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          twoFactorEnabled: false,
          twoFactorSecret: null,
        })
      );
    });
  });
});
