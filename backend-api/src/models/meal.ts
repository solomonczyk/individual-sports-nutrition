import { MacroNutrients, MicroNutrients } from './ingredient'

export interface Meal {
  id: string
  name_key: string
  description_key: string | null
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  cuisine_type: string | null
  cooking_time_minutes: number | null
  difficulty_level: string | null
  servings: number
  instructions_key: string | null
  total_macros: MacroNutrients
  total_micronutrients: MicroNutrients
  ingredients?: any[]
  image_url: string | null
  created_at: Date
  updated_at: Date
}

export interface MealIngredient {
  meal_id: string
  ingredient_id: string
  quantity_grams: number
  preparation_method: string | null
}

export interface MealWithIngredients extends Meal {
  ingredients: Array<{
    ingredient_id: string
    ingredient_name: string
    quantity_grams: number
    preparation_method: string | null
  }>
}

export interface CreateMealInput {
  name_key: string
  description_key?: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  cuisine_type?: string
  cooking_time_minutes?: number
  difficulty_level?: string
  servings?: number
  instructions_key?: string
  ingredients: Array<{
    ingredient_id: string
    quantity_grams: number
    preparation_method?: string
  }>
  image_url?: string
}

export interface DailyMealPlan {
  id: string
  user_id: string
  nutrition_plan_id: string | null
  date: Date
  total_calories: number | null
  total_protein: number | null
  total_carbs: number | null
  total_fats: number | null
  total_micronutrients: MicroNutrients
  created_at: Date
  updated_at: Date
}

export interface DailyMealPlanItem {
  id: string
  daily_meal_plan_id: string
  meal_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  scheduled_time: string | null // TIME format HH:MM
  servings: number
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  order_index: number | null
  created_at: Date
}

export interface DailyMealPlanSupplement {
  id: string
  daily_meal_plan_id: string
  product_id: string
  scheduled_time: string | null
  dosage_grams: number | null
  timing: string | null
  order_index: number | null
  created_at: Date
}

export interface DailyMealPlanFull extends DailyMealPlan {
  meals: Array<DailyMealPlanItem & { meal: Meal }>
  supplements: Array<DailyMealPlanSupplement & { product: any }>
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

