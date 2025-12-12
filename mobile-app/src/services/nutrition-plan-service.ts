import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'
import { NutritionPlan } from '../types/nutrition'

export const nutritionPlanService = {
  async get(): Promise<{ success: boolean; data: NutritionPlan | null }> {
    return await apiClient.get(API_ENDPOINTS.nutritionPlan)
  },
}

