import { apiClient } from './api-client'

export interface AdviceRequest {
    query: string
}

export interface AdviceResponse {
    advice: string
    sources: string[]
    status: string
}

export class AdviceService {
    /**
     * Get personalized advice from the AI Nutritionist
     */
    static async getPersonalizedAdvice(query: string): Promise<AdviceResponse> {
        try {
            const response = await apiClient.post<{
                success: boolean
                data: AdviceResponse
            }>('/advice/personalized', { query })

            return response.data
        } catch (error) {
            console.error('Failed to get advice:', error)
            throw error
        }
    }
}

export const adviceService = AdviceService
