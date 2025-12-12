export interface NutritionCalculation {
  bmr: number
  tdee: number
  calories: number
  protein: number
  carbs: number
  fats: number
  method: string
}

export interface NutritionPlan {
  id: string
  user_id: string
  calories: number
  protein: number
  carbs: number
  fats: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface NutritionCalculationResponse {
  calculation: NutritionCalculation
  plan: NutritionPlan
}

