import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'
import { NutritionCalculationResponse } from '../types/nutrition'

export const nutritionService = {
  async calculate(): Promise<{ success: boolean; data: NutritionCalculationResponse }> {
    return await apiClient.get(API_ENDPOINTS.nutrition.calculate)
  },
}

