import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'
import { DailyMealPlan, GenerateMealPlanInput } from '../types/meal-plan'

export const mealPlanService = {
  async generate(input: GenerateMealPlanInput): Promise<{ success: boolean; data: DailyMealPlan }> {
    return await apiClient.post(API_ENDPOINTS.mealPlan.generate, input)
  },

  async getDaily(date: string): Promise<{ success: boolean; data: DailyMealPlan | null }> {
    return await apiClient.get(`${API_ENDPOINTS.mealPlan.daily}/${date}`)
  },

  async getToday(): Promise<{ success: boolean; data: DailyMealPlan | null }> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return await apiClient.get(`${API_ENDPOINTS.mealPlan.daily}/${today}`)
  },

  async generateWeekly(startDate: string): Promise<{ success: boolean; data: DailyMealPlan[] }> {
    return await apiClient.post(API_ENDPOINTS.mealPlan.weekly, { start_date: startDate })
  },
}

