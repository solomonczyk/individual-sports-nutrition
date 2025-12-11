export interface HealthProfile {
  id: string
  user_id: string
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  weight: number | null
  height: number | null
  activity_level: 'low' | 'moderate' | 'high' | 'very_high' | null
  goal: 'mass' | 'cut' | 'maintain' | 'endurance' | null
  allergies: string[]
  diseases: string[]
  medications: string[]
  created_at: Date
  updated_at: Date
}

export interface CreateHealthProfileInput {
  age?: number
  gender?: 'male' | 'female' | 'other'
  weight?: number
  height?: number
  activity_level?: 'low' | 'moderate' | 'high' | 'very_high'
  goal?: 'mass' | 'cut' | 'maintain' | 'endurance'
  allergies?: string[]
  diseases?: string[]
  medications?: string[]
}

export interface UpdateHealthProfileInput extends Partial<CreateHealthProfileInput> {}

