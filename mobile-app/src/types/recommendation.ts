import { Product } from './product'

export interface ProductRecommendation {
  product: Product
  score: number
  reasons: string[]
  warnings: string[]
  contraindications: Array<{
    id: string
    name: string
    severity: string
  }>
}

export interface Dosage {
  product_id: string
  product_name: string
  daily_grams: number
  daily_servings: number
  duration_days: number
  frequency_per_week: number
  optimal_package_id?: string
  optimal_package_name?: string
  packages_needed?: number
  recommendations: string[]
}

export interface DosageResponse {
  dosages: Dosage[]
  duration_days: number
}

