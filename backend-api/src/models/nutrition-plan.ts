export interface NutritionPlan {
  id: string
  user_id: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  active: boolean
  created_at: Date
  updated_at: Date
}

export interface PlanProduct {
  plan_id: string
  product_id: string
  dosage: string | null
  frequency: string | null
  timing: string | null
}

export interface PlanRecipe {
  plan_id: string
  recipe_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  day_of_week: number
}

export interface CreateNutritionPlanInput {
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
  products?: Array<{
    product_id: string
    dosage?: string
    frequency?: string
    timing?: string
  }>
  recipes?: Array<{
    recipe_id: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    day_of_week: number
  }>
}

