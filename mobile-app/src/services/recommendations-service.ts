import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'
import { ProductRecommendation, DosageResponse } from '../types/recommendation'

export interface GetRecommendationsOptions {
  maxProducts?: number
  exclude?: string[]
}

export const recommendationsService = {
  async get(options?: GetRecommendationsOptions): Promise<{ success: boolean; data: ProductRecommendation[] }> {
    const params = new URLSearchParams()
    if (options?.maxProducts) {
      params.append('maxProducts', options.maxProducts.toString())
    }
    if (options?.exclude && options.exclude.length > 0) {
      params.append('exclude', options.exclude.join(','))
    }
    
    const queryString = params.toString()
    const url = queryString ? `${API_ENDPOINTS.recommendations}?${queryString}` : API_ENDPOINTS.recommendations
    
    return await apiClient.get(url)
  },

  async getDosages(durationDays: number = 30): Promise<{ success: boolean; data: DosageResponse }> {
    return await apiClient.get(`${API_ENDPOINTS.dosage.calculate}?duration_days=${durationDays}`)
  },

  async checkCompatibility(productId: string): Promise<{ success: boolean; data: { compatible: boolean; warnings: string[] } }> {
    return await apiClient.get(`${API_ENDPOINTS.recommendations}/products/${productId}/check`)
  },
}

