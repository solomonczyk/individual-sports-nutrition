export interface MacroNutrients {
  protein: number
  carbs: number
  fats: number
  calories: number
  fiber?: number
  sugar?: number
  saturated_fat?: number
  trans_fat?: number
  monounsaturated_fat?: number
  polyunsaturated_fat?: number
}

export interface MicroNutrients {
  [key: string]: number
}

export interface Meal {
  id: string
  name_key: string
  name?: string // Translated name
  description_key: string | null
  description?: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  cuisine_type: string | null
  cooking_time_minutes: number | null
  difficulty_level: string | null
  servings: number
  instructions_key: string | null
  instructions?: string
  total_macros: MacroNutrients
  total_micronutrients: MicroNutrients
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface DailyMealPlanItem {
  id: string
  daily_meal_plan_id: string
  meal_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  scheduled_time: string | null
  servings: number
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  order_index: number | null
  meal: Meal
}

export interface DailyMealPlanSupplement {
  id: string
  daily_meal_plan_id: string
  product_id: string
  scheduled_time: string | null
  dosage_grams: number | null
  timing: string | null
  order_index: number | null
  product?: any
}

export interface DailyMealPlan {
  id: string
  user_id: string
  nutrition_plan_id: string | null
  date: string
  total_calories: number | null
  total_protein: number | null
  total_carbs: number | null
  total_fats: number | null
  total_micronutrients: MicroNutrients
  meals: DailyMealPlanItem[]
  supplements: DailyMealPlanSupplement[]
  created_at: string
  updated_at: string
}

export interface GenerateMealPlanInput {
  date: string // YYYY-MM-DD
  preferences?: {
    cuisine_types?: string[]
    exclude_ingredients?: string[]
    meal_times?: {
      breakfast?: string
      lunch?: string
      dinner?: string
      snacks?: string[]
    }
  }
}

