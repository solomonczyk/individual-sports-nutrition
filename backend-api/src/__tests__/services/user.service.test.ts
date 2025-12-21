import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../../src/services/user.service';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: any;
  let mockHealthProfileRepository: any;
  let mockNotificationService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
      updateProfile: vi.fn(),
    };

    mockHealthProfileRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    mockNotificationService = {
      sendEmail: vi.fn(),
      sendPushNotification: vi.fn(),
    };

    userService = new UserService(
      mockUserRepository,
      mockHealthProfileRepository,
      mockNotificationService
    );
  });

  describe('Get User Profile', () => {
    it('should return user profile with health data', async () => {
      // Arrange
      const userId = 'user_123';
      const user = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const healthProfile = {
        id: 'hp_123',
        userId: userId,
        age: 34,
        gender: 'male',
        weight: 80,
        height: 180,
        activityLevel: 'moderate',
        goal: 'weight_loss',
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockHealthProfileRepository.findByUserId.mockResolvedValue(healthProfile);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockHealthProfileRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        ...user,
        healthProfile: healthProfile,
      });
    });

    it('should handle user without health profile', async () => {
      // Arrange
      const userId = 'user_456';
      const user = {
        id: userId,
        email: 'user@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockHealthProfileRepository.findByUserId.mockResolvedValue(null);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result).toEqual({
        ...user,
        healthProfile: null,
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const userId = 'non_existent';

      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserProfile(userId)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('Update User Profile', () => {
    it('should update user information', async () => {
      // Arrange
      const userId = 'user_123';
      const updateData = {
        firstName: 'John',
        lastName: 'Doe Updated',
        phoneNumber: '+381234567890',
      };

      const updatedUser = {
        id: userId,
        email: 'user@example.com',
        ...updateData,
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUserProfile(userId, updateData);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should validate email format on update', async () => {
      // Arrange
      const userId = 'user_123';
      const updateData = {
        email: 'invalid-email-format',
      };

      // Act & Assert
      await expect(
        userService.updateUserProfile(userId, updateData)
      ).rejects.toThrow('Invalid email format');
    });

    it('should prevent duplicate email update', async () => {
      // Arrange
      const userId = 'user_123';
      const updateData = {
        email: 'taken@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'other_user',
      });

      // Act & Assert
      await expect(
        userService.updateUserProfile(userId, updateData)
      ).rejects.toThrow('Email already in use');
    });

    it('should allow updating own email', async () => {
      // Arrange
      const userId = 'user_123';
      const newEmail = 'newemail@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({
        id: userId,
        email: newEmail,
      });

      // Act
      const result = await userService.updateUserProfile(userId, { email: newEmail });

      // Assert
      expect(result.email).toBe(newEmail);
    });
  });

  describe('Update Health Profile', () => {
    it('should create health profile if not exists', async () => {
      // Arrange
      const userId = 'user_123';
      const healthData = {
        age: 34,
        gender: 'male',
        weight: 80,
        height: 180,
        activityLevel: 'moderate',
        goal: 'weight_loss',
      };

      mockHealthProfileRepository.findByUserId.mockResolvedValue(null);
      mockHealthProfileRepository.create.mockResolvedValue({
        id: 'hp_123',
        userId: userId,
        ...healthData,
      });

      // Act
      const result = await userService.updateHealthProfile(userId, healthData);

      // Assert
      expect(mockHealthProfileRepository.create).toHaveBeenCalledWith({
        userId: userId,
        ...healthData,
      });
      expect(result.id).toBe('hp_123');
    });

    it('should update existing health profile', async () => {
      // Arrange
      const userId = 'user_123';
      const healthData = {
        weight: 78, // Weight loss
        activityLevel: 'very_active',
      };

      const existingProfile = {
        id: 'hp_123',
        userId: userId,
        age: 34,
        gender: 'male',
        weight: 80,
        height: 180,
        activityLevel: 'moderate',
        goal: 'weight_loss',
      };

      mockHealthProfileRepository.findByUserId.mockResolvedValue(existingProfile);
      mockHealthProfileRepository.update.mockResolvedValue({
        ...existingProfile,
        ...healthData,
      });

      // Act
      const result = await userService.updateHealthProfile(userId, healthData);

      // Assert
      expect(mockHealthProfileRepository.update).toHaveBeenCalledWith(
        'hp_123',
        healthData
      );
      expect(result.weight).toBe(78);
      expect(result.activityLevel).toBe('very_active');
    });

    it('should validate health data ranges', async () => {
      // Arrange
      const userId = 'user_123';
      const invalidData = {
        age: 10, // Below minimum of 13
        weight: -80, // Negative weight
        height: 50, // Too short
      };

      // Act & Assert
      await expect(
        userService.updateHealthProfile(userId, invalidData)
      ).rejects.toThrow();
    });

    it('should validate activity level enum', async () => {
      // Arrange
      const userId = 'user_123';
      const invalidData = {
        activityLevel: 'super_active', // Invalid value
      };

      // Act & Assert
      await expect(
        userService.updateHealthProfile(userId, invalidData)
      ).rejects.toThrow('Invalid activity level');
    });

    it('should validate goal enum', async () => {
      // Arrange
      const userId = 'user_123';
      const invalidData = {
        goal: 'be_superhero', // Invalid value
      };

      // Act & Assert
      await expect(
        userService.updateHealthProfile(userId, invalidData)
      ).rejects.toThrow('Invalid goal');
    });
  });

  describe('User Preferences', () => {
    it('should update dietary preferences', async () => {
      // Arrange
      const userId = 'user_123';
      const preferences = {
        dietaryRestrictions: ['vegetarian', 'gluten-free'],
        allergens: ['peanuts', 'shellfish'],
        cuisinePreferences: ['Mediterranean', 'Asian'],
        mealsPerDay: 3,
      };

      mockUserRepository.update.mockResolvedValue({
        id: userId,
        preferences: preferences,
      });

      // Act
      const result = await userService.updatePreferences(userId, preferences);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ preferences })
      );
      expect(result.preferences).toEqual(preferences);
    });

    it('should validate dietary restrictions', async () => {
      // Arrange
      const userId = 'user_123';
      const invalidPreferences = {
        dietaryRestrictions: ['invalid_restriction'],
      };

      // Act & Assert
      await expect(
        userService.updatePreferences(userId, invalidPreferences)
      ).rejects.toThrow();
    });

    it('should validate meals per day', async () => {
      // Arrange
      const userId = 'user_123';
      const invalidPreferences = {
        mealsPerDay: 10, // More than 6 reasonable meals
      };

      // Act & Assert
      await expect(
        userService.updatePreferences(userId, invalidPreferences)
      ).rejects.toThrow('Meals per day must be between 1 and 6');
    });
  });

  describe('Delete User Account', () => {
    it('should delete user and associated data', async () => {
      // Arrange
      const userId = 'user_123';

      mockUserRepository.delete.mockResolvedValue(true);
      mockHealthProfileRepository.delete.mockResolvedValue(true);

      // Act
      await userService.deleteAccount(userId);

      // Assert
      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should send account deletion confirmation email', async () => {
      // Arrange
      const userId = 'user_123';
      const user = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.delete.mockResolvedValue(true);

      // Act
      await userService.deleteAccount(userId);

      // Assert
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('account has been deleted')
      );
    });
  });

  describe('Password Management', () => {
    it('should verify current password before change', async () => {
      // Arrange
      const userId = 'user_123';
      const currentPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      const user = {
        id: userId,
        email: 'user@example.com',
        password: 'hashed-old-password',
      };

      mockUserRepository.findById.mockResolvedValue(user);

      vi.mock('bcrypt', () => ({
        compare: vi.fn().mockResolvedValue(true),
        hash: vi.fn().mockResolvedValue('hashed-new-password'),
      }));

      mockUserRepository.update.mockResolvedValue({
        ...user,
        password: 'hashed-new-password',
      });

      // Act
      await userService.changePassword(userId, currentPassword, newPassword);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          password: expect.any(String),
        })
      );
    });

    it('should reject change with incorrect current password', async () => {
      // Arrange
      const userId = 'user_123';
      const currentPassword = 'WrongPassword';
      const newPassword = 'NewPassword456';

      vi.mock('bcrypt', () => ({
        compare: vi.fn().mockResolvedValue(false),
      }));

      // Act & Assert
      await expect(
        userService.changePassword(userId, currentPassword, newPassword)
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('User Search and Listing', () => {
    it('should list users with pagination', async () => {
      // Arrange
      const page = 1;
      const limit = 20;
      const users = [
        { id: 'user_1', email: 'user1@example.com', firstName: 'John' },
        { id: 'user_2', email: 'user2@example.com', firstName: 'Jane' },
      ];

      mockUserRepository.findAll.mockResolvedValue({
        data: users,
        total: 100,
        page: page,
        limit: limit,
        pages: 5,
      });

      // Act
      const result = await userService.listUsers(page, limit);

      // Assert
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(page, limit);
      expect(result).toEqual({
        data: users,
        total: 100,
        page: page,
        limit: limit,
        pages: 5,
      });
    });

    it('should search users by email', async () => {
      // Arrange
      const searchQuery = 'john@example.com';
      const user = {
        id: 'user_123',
        email: searchQuery,
        firstName: 'John',
      };

      mockUserRepository.findByEmail.mockResolvedValue(user);

      // Act
      const result = await userService.searchByEmail(searchQuery);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(searchQuery);
      expect(result).toEqual(user);
    });
  });

  describe('User Notifications', () => {
    it('should send email notification to user', async () => {
      // Arrange
      const userId = 'user_123';
      const user = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
      };

      const notification = {
        subject: 'Weekly Meal Plan',
        body: 'Your weekly meal plan is ready!',
      };

      mockUserRepository.findById.mockResolvedValue(user);
      mockNotificationService.sendEmail.mockResolvedValue({ success: true });

      // Act
      await userService.sendNotification(userId, notification);

      // Assert
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        user.email,
        notification.subject,
        notification.body
      );
    });

    it('should send push notification to user', async () => {
      // Arrange
      const userId = 'user_123';
      const notification = {
        title: 'Time for lunch!',
        body: 'Your next meal is ready',
        type: 'meal_reminder',
      };

      mockNotificationService.sendPushNotification.mockResolvedValue({
        success: true,
      });

      // Act
      await userService.sendPushNotification(userId, notification);

      // Assert
      expect(mockNotificationService.sendPushNotification).toHaveBeenCalledWith(
        userId,
        notification
      );
    });
  });

  describe('User Validation', () => {
    it('should validate user data on creation', async () => {
      // Arrange
      const invalidUserData = {
        email: 'invalid-email',
        firstName: '', // Empty name
        lastName: 'Doe',
      };

      // Act & Assert
      await expect(userService.validateUserData(invalidUserData)).rejects.toThrow();
    });

    it('should validate minimum age requirement', async () => {
      // Arrange
      const healthData = {
        age: 10, // Below 13 minimum
        gender: 'male',
        weight: 60,
        height: 140,
      };

      // Act & Assert
      await expect(
        userService.validateHealthData(healthData)
      ).rejects.toThrow('User must be at least 13 years old');
    });

    it('should validate reasonable weight and height ranges', async () => {
      // Arrange
      const validHealthData = {
        age: 25,
        gender: 'male',
        weight: 80,
        height: 180,
      };

      const invalidHealthData = {
        age: 25,
        gender: 'male',
        weight: 500, // Unrealistic
        height: 150, // Too short for the weight
      };

      // Act & Assert
      await expect(
        userService.validateHealthData(invalidHealthData)
      ).rejects.toThrow();
    });
  });

  describe('User Activity Tracking', () => {
    it('should update last login timestamp', async () => {
      // Arrange
      const userId = 'user_123';

      mockUserRepository.update.mockResolvedValue({
        id: userId,
        lastLoginAt: new Date(),
      });

      // Act
      await userService.recordLogin(userId);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastLoginAt: expect.any(Date),
        })
      );
    });

    it('should track user action frequency', async () => {
      // Arrange
      const userId = 'user_123';
      const action = 'meal_logged';

      mockUserRepository.update.mockResolvedValue({
        id: userId,
      });

      // Act
      await userService.recordAction(userId, action);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          lastActivityAt: expect.any(Date),
        })
      );
    });
  });
});
