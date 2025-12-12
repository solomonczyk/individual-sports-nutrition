import axios, { AxiosInstance } from 'axios'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export interface AIRecommendationRequest {
  user_id: string
  goal: string
  activity_level: string
  age: number
  gender: string
  weight: number
  height: number
  diseases?: string[]
  medications?: string[]
  allergies?: string[]
  max_products?: number
  exclude_product_ids?: string[]
}

export interface AIRecommendationResponse {
  product_id: string
  score: number
  confidence: number
  reasons: string[]
  warnings: string[]
  dosage_recommendation?: any
}

export interface AIRecommendationsResponse {
  recommendations: AIRecommendationResponse[]
  generated_at: string
  user_profile_summary: any
}

export class AIServiceClient {
  private client: AxiosInstance
  private baseURL: string

  constructor() {
    this.baseURL = config.AI_SERVICE_URL
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get AI-powered recommendations
   */
  async getAIRecommendations(
    request: AIRecommendationRequest
  ): Promise<AIRecommendationsResponse | null> {
    try {
      const response = await this.client.post<AIRecommendationsResponse>(
        '/recommendations/ai',
        request,
        {
          headers: {
            'X-User-ID': request.user_id,
          },
        }
      )

      return response.data
    } catch (error: any) {
      // Log error but don't throw - fallback to regular recommendations
      logger.warn('AI service unavailable, using fallback recommendations', {
        error: error.message,
        url: this.baseURL,
      })
      return null
    }
  }

  /**
   * Check if AI service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/health')
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}

