import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth'
import { AIServiceClient } from '../services/ai-service-client'
import { HealthProfileService } from '../services/health-profile-service'
import { ApiError } from '../middlewares/error-handler'
import { z } from 'zod'

const adviceRequestSchema = z.object({
    query: z.string().min(3).max(500),
})

export class AdviceController {
    private aiClient: AIServiceClient
    private healthProfileService: HealthProfileService

    constructor() {
        this.aiClient = new AIServiceClient()
        this.healthProfileService = new HealthProfileService()
    }

    async getPersonalizedAdvice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                const error: ApiError = new Error('Unauthorized')
                error.statusCode = 401
                throw error
            }

            const validated = adviceRequestSchema.parse(req.body)

            // Fetch user profile to enrich the AI request
            const profile = await this.healthProfileService.getByUserId(req.user.id)

            const adviceResult = await this.aiClient.getAIAdvice({
                user_id: req.user.id,
                query: validated.query,
                user_profile: profile || undefined
            })

            if (!adviceResult) {
                const error: ApiError = new Error('AI service returned no advice')
                error.statusCode = 503
                throw error
            }

            res.json({
                success: true,
                data: adviceResult,
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                const apiError: ApiError = new Error('Validation error')
                apiError.statusCode = 400
                apiError.code = 'VALIDATION_ERROR'
                apiError.message = error.errors.map((e) => e.message).join(', ')
                return next(apiError)
            }
            next(error)
        }
    }
}
