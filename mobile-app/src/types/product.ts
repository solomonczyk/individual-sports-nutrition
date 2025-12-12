export interface Brand {
  id: string
  name: string
  origin_country: string | null
  verified: boolean
}

export interface Product {
  id: string
  name_key: string
  name?: string // Translated name
  brand_id: string | null
  brand?: Brand
  type: 'protein' | 'creatine' | 'amino' | 'vitamin' | 'pre_workout' | 'post_workout' | 'fat_burner' | 'other'
  macros: {
    protein: number
    carbs: number
    fats: number
    calories: number
  }
  serving_size: string | null
  price: number | null
  available: boolean
  created_at: string
  updated_at: string
}

