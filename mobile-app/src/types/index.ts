// Re-export all types from specific files
export * from './nutrition'
export * from './recommendation'
export * from './product'
export * from './meal-plan'
export * from './progress'

export interface User {
  id: string
  email: string
  name?: string
  language: string
  token?: string
}

// Legacy types (kept for backward compatibility)
export interface HealthProfile {
  gender: 'male' | 'female'
  age: number
  weight: number
  height: number
  activityLevel: 'low' | 'moderate' | 'high' | 'very_high'
  goals: string[]
  medicalConditions?: string[]
  medications?: string[]
  contraindications?: string[]
}
