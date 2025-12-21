import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { useUserProfile } from '../../src/hooks/useUserProfile';
import { useMealPlan } from '../../src/hooks/useMealPlan';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock services
vi.mock('../../src/services/auth');
vi.mock('../../src/services/api');
vi.mock('@react-native-async-storage/async-storage');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null user and not authenticated', () => {
    // Arrange
    (AsyncStorage.getItem as any).mockResolvedValue(null);

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('should login user with valid credentials', async () => {
    // Arrange
    const credentials = {
      email: 'user@example.com',
      password: 'Password123',
    };

    const mockUser = {
      id: 'user_123',
      email: credentials.email,
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockToken = 'jwt-token-123';

    vi.mock('../../src/services/auth', () => ({
      login: vi.fn().mockResolvedValue({
        user: mockUser,
        token: mockToken,
      }),
    }));

    const { result } = renderHook(() => useAuth());

    // Act
    await act(async () => {
      await result.current.login(credentials);
    });

    // Assert
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle login error', async () => {
    // Arrange
    const credentials = {
      email: 'user@example.com',
      password: 'WrongPassword',
    };

    vi.mock('../../src/services/auth', () => ({
      login: vi.fn().mockRejectedValue(new Error('Invalid credentials')),
    }));

    const { result } = renderHook(() => useAuth());

    // Act & Assert
    await expect(
      act(async () => {
        await result.current.login(credentials);
      })
    ).rejects.toThrow('Invalid credentials');

    expect(result.current.user).toBeNull();
  });

  it('should logout user', async () => {
    // Arrange
    const mockUser = {
      id: 'user_123',
      email: 'user@example.com',
    };

    vi.mock('../../src/services/auth', () => ({
      logout: vi.fn().mockResolvedValue({ success: true }),
    }));

    const { result } = renderHook(() => useAuth());

    // Act
    await act(async () => {
      await result.current.logout();
    });

    // Assert
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should register new user', async () => {
    // Arrange
    const newUserData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockUser = {
      id: 'user_456',
      ...newUserData,
    };

    const mockToken = 'jwt-token-456';

    vi.mock('../../src/services/auth', () => ({
      register: vi.fn().mockResolvedValue({
        user: mockUser,
        token: mockToken,
      }),
    }));

    const { result } = renderHook(() => useAuth());

    // Act
    await act(async () => {
      await result.current.register(newUserData);
    });

    // Assert
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should refresh token on demand', async () => {
    // Arrange
    const oldToken = 'old-token';
    const newToken = 'new-token';

    vi.mock('../../src/services/auth', () => ({
      refreshToken: vi.fn().mockResolvedValue({
        token: newToken,
      }),
    }));

    const { result } = renderHook(() => useAuth());

    // Act
    await act(async () => {
      const token = await result.current.refreshToken();
      expect(token).toBe(newToken);
    });

    // Assert
    expect(result.current.token).toBe(newToken);
  });
});

describe('useUserProfile Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user profile on mount', async () => {
    // Arrange
    const mockProfile = {
      id: 'user_123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      healthProfile: {
        age: 34,
        gender: 'male',
        weight: 80,
        height: 180,
        activityLevel: 'moderate',
        goal: 'weight_loss',
      },
    };

    vi.mock('../../src/services/api', () => ({
      getUserProfile: vi.fn().mockResolvedValue(mockProfile),
    }));

    // Act
    const { result } = renderHook(() => useUserProfile('user_123'));

    // Assert
    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should update user profile', async () => {
    // Arrange
    const userId = 'user_123';
    const updateData = {
      firstName: 'John',
      lastName: 'Doe Updated',
    };

    const updatedProfile = {
      id: userId,
      ...updateData,
    };

    vi.mock('../../src/services/api', () => ({
      updateUserProfile: vi.fn().mockResolvedValue(updatedProfile),
    }));

    const { result } = renderHook(() => useUserProfile(userId));

    // Act
    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    // Assert
    expect(result.current.profile).toEqual(updatedProfile);
  });

  it('should update health profile', async () => {
    // Arrange
    const userId = 'user_123';
    const healthData = {
      weight: 78,
      activityLevel: 'very_active',
    };

    vi.mock('../../src/services/api', () => ({
      updateHealthProfile: vi.fn().mockResolvedValue({
        ...healthData,
      }),
    }));

    const { result } = renderHook(() => useUserProfile(userId));

    // Act
    await act(async () => {
      await result.current.updateHealthProfile(healthData);
    });

    // Assert
    expect(result.current.healthProfile).toEqual(
      expect.objectContaining(healthData)
    );
  });

  it('should handle profile fetch error', async () => {
    // Arrange
    vi.mock('../../src/services/api', () => ({
      getUserProfile: vi.fn().mockRejectedValue(new Error('Network error')),
    }));

    // Act
    const { result } = renderHook(() => useUserProfile('user_123'));

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useMealPlan Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch meal plan on mount', async () => {
    // Arrange
    const mockMealPlan = {
      id: 'plan_123',
      days: [
        {
          date: '2025-01-15',
          meals: [
            {
              mealType: 'breakfast',
              name: 'Oatmeal with berries',
              calories: 350,
            },
            {
              mealType: 'lunch',
              name: 'Grilled chicken salad',
              calories: 450,
            },
            {
              mealType: 'dinner',
              name: 'Salmon with vegetables',
              calories: 500,
            },
          ],
          totalCalories: 1300,
        },
      ],
    };

    vi.mock('../../src/services/api', () => ({
      getMealPlan: vi.fn().mockResolvedValue(mockMealPlan),
    }));

    // Act
    const { result } = renderHook(() => useMealPlan('user_123'));

    // Assert
    await waitFor(() => {
      expect(result.current.mealPlan).toEqual(mockMealPlan);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should generate new meal plan', async () => {
    // Arrange
    const preferences = {
      days: 7,
      dietaryRestrictions: ['vegetarian'],
      allergens: ['peanuts'],
    };

    const newMealPlan = {
      id: 'plan_456',
      days: [],
    };

    vi.mock('../../src/services/api', () => ({
      generateMealPlan: vi.fn().mockResolvedValue(newMealPlan),
    }));

    const { result } = renderHook(() => useMealPlan('user_123'));

    // Act
    await act(async () => {
      await result.current.generatePlan(preferences);
    });

    // Assert
    expect(result.current.mealPlan).toEqual(newMealPlan);
  });

  it('should log meal consumption', async () => {
    // Arrange
    const mealLog = {
      mealId: 'meal_123',
      date: '2025-01-15',
      mealType: 'breakfast',
      calories: 350,
      macros: { protein: 15, carbs: 50, fat: 10 },
    };

    vi.mock('../../src/services/api', () => ({
      logMeal: vi.fn().mockResolvedValue({ success: true }),
    }));

    const { result } = renderHook(() => useMealPlan('user_123'));

    // Act
    await act(async () => {
      await result.current.logMeal(mealLog);
    });

    // Assert
    expect(result.current.todayCalories).toEqual(350);
  });

  it('should calculate daily nutrition summary', async () => {
    // Arrange
    const mockMealPlan = {
      id: 'plan_123',
      days: [
        {
          date: '2025-01-15',
          meals: [
            { calories: 350, protein: 15, carbs: 50, fat: 10 },
            { calories: 450, protein: 35, carbs: 50, fat: 15 },
            { calories: 500, protein: 40, carbs: 60, fat: 15 },
          ],
          totalCalories: 1300,
        },
      ],
    };

    vi.mock('../../src/services/api', () => ({
      getMealPlan: vi.fn().mockResolvedValue(mockMealPlan),
    }));

    const { result } = renderHook(() => useMealPlan('user_123'));

    // Assert
    await waitFor(() => {
      expect(result.current.todayNutrition).toEqual({
        calories: 1300,
        protein: 90,
        carbs: 160,
        fat: 40,
      });
    });
  });

  it('should handle meal plan fetch error', async () => {
    // Arrange
    vi.mock('../../src/services/api', () => ({
      getMealPlan: vi.fn().mockRejectedValue(new Error('Network error')),
    }));

    // Act
    const { result } = renderHook(() => useMealPlan('user_123'));

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// Test utility functions
describe('Hook Test Utilities', () => {
  it('should create mock navigation', () => {
    // Arrange
    const mockNav = global.testUtils?.createMockNavigator();

    // Assert
    expect(mockNav).toBeDefined();
    expect(mockNav?.navigate).toBeDefined();
    expect(mockNav?.goBack).toBeDefined();
  });

  it('should create mock dispatch', () => {
    // Arrange
    const mockDispatch = global.testUtils?.createMockDispatch();

    // Act
    mockDispatch?.({ type: 'TEST_ACTION' });

    // Assert
    expect(mockDispatch).toBeDefined();
  });

  it('should create mock selector', () => {
    // Arrange
    const testValue = { test: true };
    const mockSelector = global.testUtils?.createMockSelector(testValue);

    // Act
    const result = mockSelector?.();

    // Assert
    expect(result).toEqual(testValue);
  });
});
