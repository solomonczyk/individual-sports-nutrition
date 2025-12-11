import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'

export interface CreateHealthProfileInput {
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  activity_level: 'low' | 'moderate' | 'high' | 'very_high'
  goal: 'mass' | 'cut' | 'maintain' | 'endurance'
  allergies?: string[]
  diseases?: string[]
  medications?: string[]
}

export interface HealthProfile {
  id: string
  user_id: string
  age: number
  gender: 'male' | 'female' | 'other'
  weight: number
  height: number
  activity_level: 'low' | 'moderate' | 'high' | 'very_high'
  goal: 'mass' | 'cut' | 'maintain' | 'endurance'
  allergies: string[]
  diseases: string[]
  medications: string[]
}

export const healthProfileService = {
  async get(): Promise<{ success: boolean; data: HealthProfile }> {
    return await apiClient.get(API_ENDPOINTS.healthProfile)
  },

  async create(input: CreateHealthProfileInput): Promise<{ success: boolean; data: HealthProfile }> {
    return await apiClient.post(API_ENDPOINTS.healthProfile, input)
  },

  async update(input: Partial<CreateHealthProfileInput>): Promise<{ success: boolean; data: HealthProfile }> {
    return await apiClient.put(API_ENDPOINTS.healthProfile, input)
  },
}

