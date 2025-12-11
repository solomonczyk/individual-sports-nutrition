import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'

export interface RegisterInput {
  email: string
  password: string
  preferred_language?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: {
      id: string
      email: string
      preferred_language: string
    }
    token: string
  }
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return await apiClient.post(API_ENDPOINTS.auth.register, input)
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return await apiClient.post(API_ENDPOINTS.auth.login, input)
  },
}

