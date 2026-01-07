import Constants from 'expo-constants'

// For web builds, EXPO_PUBLIC_* variables are inlined at build time
// @ts-ignore - EXPO_PUBLIC_API_URL is injected at build time
const WEB_API_URL = typeof __EXPO_PUBLIC_API_URL !== 'undefined' ? __EXPO_PUBLIC_API_URL : null

// Use EXPO_PUBLIC_API_URL for web builds, fallback to Constants for native
const getApiUrl = () => {
  // Check for web environment variable (injected at build time)
  if (WEB_API_URL) {
    return WEB_API_URL
  }
  // Check process.env for SSR/Node environments
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL
  }
  // Fallback to expo constants for native builds
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl
  }
  // Default fallback - use relative URL for same-origin requests
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`
  }
  return 'http://localhost:3000/api/v1'
}

export const API_CONFIG = {
  baseURL: getApiUrl(),
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

