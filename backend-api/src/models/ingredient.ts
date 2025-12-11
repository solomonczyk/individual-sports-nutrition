export interface MacroNutrients {
  protein: number // г
  carbs: number // г
  fats: number // г
  calories: number // ккал
  fiber?: number // г
  sugar?: number // г
  saturated_fat?: number // г
  trans_fat?: number // г
  monounsaturated_fat?: number // г
  polyunsaturated_fat?: number // г
}

export interface MicroNutrients {
  // Vitamins (в мг или мкг, зависит от витамина)
  vitamin_a?: number // мкг
  vitamin_c?: number // мг
  vitamin_d?: number // мкг
  vitamin_e?: number // мг
  vitamin_k?: number // мкг
  thiamin?: number // мг (B1)
  riboflavin?: number // мг (B2)
  niacin?: number // мг (B3)
  vitamin_b6?: number // мг
  folate?: number // мкг (B9)
  vitamin_b12?: number // мкг
  
  // Minerals (в мг)
  calcium?: number // мг
  iron?: number // мг
  magnesium?: number // мг
  phosphorus?: number // мг
  potassium?: number // мг
  sodium?: number // мг
  zinc?: number // мг
  copper?: number // мг
  manganese?: number // мг
  selenium?: number // мкг
}

export interface Ingredient {
  id: string
  name_key: string
  category: string | null
  macros: MacroNutrients
  micronutrients: MicroNutrients
  serving_size_grams: number
  density: number | null
  created_at: Date
  updated_at: Date
}

export interface CreateIngredientInput {
  name_key: string
  category?: string
  macros: MacroNutrients
  micronutrients?: MicroNutrients
  serving_size_grams?: number
  density?: number
}

