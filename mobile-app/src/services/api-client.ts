import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_CONFIG } from '../config/api'
import { useAuthStore } from '../store/auth-store'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - добавляем токен авторизации
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().user?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Добавляем язык из настроек пользователя
        const language = useAuthStore.getState().user?.language || 'sr'
        config.headers['Accept-Language'] = language

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - обработка ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ error: { message: string; code: string } }>) => {
        if (error.response?.status === 401) {
          // Токен невалидный - разлогиниваем пользователя
          useAuthStore.getState().logout()
        }

        return Promise.reject(error)
      }
    )
  }

  get instance() {
    return this.client
  }

  async get<T>(url: string, config?: any) {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: any) {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: any) {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: any) {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()

