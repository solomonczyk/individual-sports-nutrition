import Constants from 'expo-constants'

export const API_CONFIG = {
  baseURL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1',
  timeout: 30000,
}

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
  },
  healthProfile: '/health-profile',
  healthProfileUpdate: '/health-profile',
  nutrition: {
    calculate: '/nutrition/calculate',
  },
  nutritionPlan: '/nutrition-plan',
  products: '/products',
  recommendations: '/recommendations',
  dosage: {
    calculate: '/dosage/calculate',
    shoppingOptions: '/dosage/shopping-options',
  },
  mealPlan: {
    generate: '/meal-plan/generate',
    daily: '/meal-plan/daily',
    weekly: '/meal-plan/weekly',
  },
  progress: {
    list: '/progress',
    create: '/progress',
    update: '/progress',
    stats: '/progress/stats',
  },
} as const

