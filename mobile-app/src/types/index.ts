export interface User {
  id: string
  email: string
  name?: string
  language: string
}

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

export interface NutritionPlan {
  id: string
  calories: number
  protein: number
  carbs: number
  fats: number
  supplements: Supplement[]
  meals: Meal[]
}

export interface Supplement {
  id: string
  name: string
  dosage: string
  frequency: string
  contraindications?: string[]
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  time: string
}

