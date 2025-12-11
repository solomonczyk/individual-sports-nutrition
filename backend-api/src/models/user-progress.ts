export interface UserProgress {
  id: string
  user_id: string
  date: Date
  weight: number | null
  body_fat: number | null
  activity_data: Record<string, unknown>
  consumed_products: Array<Record<string, unknown>>
  notes: string | null
  created_at: Date
}

export interface CreateUserProgressInput {
  date: string
  weight?: number
  body_fat?: number
  activity_data?: Record<string, unknown>
  consumed_products?: Array<Record<string, unknown>>
  notes?: string
}

