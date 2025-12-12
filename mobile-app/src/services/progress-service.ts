import { apiClient } from './api-client'
import { API_ENDPOINTS } from '../config/api'
import { UserProgress, CreateUserProgressInput, ProgressStats } from '../types/progress'

export const progressService = {
  async getAll(startDate?: string, endDate?: string): Promise<{ success: boolean; data: UserProgress[] }> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const queryString = params.toString()
    const url = queryString ? `${API_ENDPOINTS.progress.list}?${queryString}` : API_ENDPOINTS.progress.list
    
    return await apiClient.get(url)
  },

  async getByDate(date: string): Promise<{ success: boolean; data: UserProgress | null }> {
    return await apiClient.get(`${API_ENDPOINTS.progress.list}/${date}`)
  },

  async create(input: CreateUserProgressInput): Promise<{ success: boolean; data: UserProgress }> {
    return await apiClient.post(API_ENDPOINTS.progress.create, input)
  },

  async update(date: string, input: Partial<CreateUserProgressInput>): Promise<{ success: boolean; data: UserProgress }> {
    return await apiClient.put(`${API_ENDPOINTS.progress.update}/${date}`, input)
  },

  async getStats(startDate?: string, endDate?: string): Promise<{ success: boolean; data: ProgressStats }> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const queryString = params.toString()
    const url = queryString ? `${API_ENDPOINTS.progress.stats}?${queryString}` : API_ENDPOINTS.progress.stats
    
    return await apiClient.get(url)
  },
}

