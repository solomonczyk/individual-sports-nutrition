export interface Product {
  id: string
  name_key: string
  brand_id: string | null
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
  created_at: Date
  updated_at: Date
}

export interface Brand {
  id: string
  name: string
  origin_country: string | null
  verified: boolean
  created_at: Date
  updated_at: Date
}

export interface ProductWithTranslation extends Product {
  name: string
  brand?: Brand
}

