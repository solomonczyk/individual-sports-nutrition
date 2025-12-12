import { UserProgressRepository } from '../repositories/user-progress-repository'
import { UserProgress, CreateUserProgressInput } from '../models/user-progress'

export interface ProgressStats {
  current_weight?: number
  weight_change?: number
  current_body_fat?: number
  body_fat_change?: number
  avg_calories_consumed?: number
  avg_protein?: number
  avg_carbs?: number
  avg_fats?: number
  days_tracked: number
}

export class UserProgressService {
  private repository: UserProgressRepository

  constructor() {
    this.repository = new UserProgressRepository()
  }

  async getByUserId(userId: string, startDate?: Date, endDate?: Date): Promise<UserProgress[]> {
    return await this.repository.findByUserId(userId, startDate, endDate)
  }

  async getByUserIdAndDate(userId: string, date: Date): Promise<UserProgress | null> {
    return await this.repository.findByUserIdAndDate(userId, date)
  }

  async create(userId: string, input: CreateUserProgressInput): Promise<UserProgress> {
    // Check if progress for this date already exists
    const date = new Date(input.date)
    const existing = await this.repository.findByUserIdAndDate(userId, date)
    
    if (existing) {
      // Update existing instead of creating new
      return await this.repository.update(userId, date, input)
    }

    return await this.repository.create(userId, input)
  }

  async update(userId: string, date: string, input: Partial<CreateUserProgressInput>): Promise<UserProgress> {
    const dateObj = new Date(date)
    return await this.repository.update(userId, dateObj, input)
  }

  async delete(userId: string, date: string): Promise<void> {
    const dateObj = new Date(date)
    return await this.repository.delete(userId, dateObj)
  }

  async getStats(userId: string, startDate?: Date, endDate?: Date): Promise<ProgressStats> {
    const progress = await this.repository.findByUserId(userId, startDate, endDate)
    
    if (progress.length === 0) {
      return {
        days_tracked: 0,
      }
    }

    // Sort by date
    const sorted = [...progress].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const weights = sorted.filter((p) => p.weight !== null).map((p) => p.weight!)
    const bodyFats = sorted.filter((p) => p.body_fat !== null).map((p) => p.body_fat!)

    const current_weight = weights.length > 0 ? weights[weights.length - 1] : undefined
    const weight_change = weights.length > 1 ? current_weight! - weights[0] : undefined

    const current_body_fat = bodyFats.length > 0 ? bodyFats[bodyFats.length - 1] : undefined
    const body_fat_change = bodyFats.length > 1 ? current_body_fat! - bodyFats[0] : undefined

    // Calculate averages from consumed products (would need meal plan data for accurate stats)
    // For now, return basic stats
    return {
      current_weight,
      weight_change,
      current_body_fat,
      body_fat_change,
      days_tracked: progress.length,
    }
  }
}

