export interface UserProgress {
  id: string
  user_id: string
  date: string
  weight: number | null
  body_fat: number | null
  activity_data: Record<string, unknown>
  consumed_products: Array<Record<string, unknown>>
  notes: string | null
  created_at: string
}

export interface CreateUserProgressInput {
  date: string // YYYY-MM-DD
  weight?: number
  body_fat?: number
  activity_data?: Record<string, unknown>
  consumed_products?: Array<Record<string, unknown>>
  notes?: string
}

export interface ProgressStats {
  current_weight?: number
  weight_change?: number
  current_body_fat?: number
  body_fat_change?: number
  avg_calories_consumed?: number
  avg_protein?: number
  avg_carbs?: number
  avg_fats?: number
  days_tracked: number
}

export interface WeightDataPoint {
  date: string
  weight: number
}

export interface NutritionDataPoint {
  date: string
  calories: number
  protein: number
  carbs: number
  fats: number
}

