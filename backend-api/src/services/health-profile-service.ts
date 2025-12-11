import { HealthProfileRepository } from '../repositories/health-profile-repository'
import { CreateHealthProfileInput, UpdateHealthProfileInput, HealthProfile } from '../models/health-profile'

export class HealthProfileService {
  private repository: HealthProfileRepository

  constructor() {
    this.repository = new HealthProfileRepository()
  }

  async getByUserId(userId: string): Promise<HealthProfile | null> {
    return await this.repository.findByUserId(userId)
  }

  async create(userId: string, input: CreateHealthProfileInput): Promise<HealthProfile> {
    const existing = await this.repository.findByUserId(userId)
    if (existing) {
      throw new Error('Health profile already exists')
    }

    return await this.repository.create(userId, input)
  }

  async update(userId: string, input: UpdateHealthProfileInput): Promise<HealthProfile> {
    const existing = await this.repository.findByUserId(userId)
    if (!existing) {
      return await this.repository.create(userId, input as CreateHealthProfileInput)
    }

    return await this.repository.update(userId, input)
  }

  async getOrCreate(userId: string): Promise<HealthProfile> {
    const existing = await this.repository.findByUserId(userId)
    if (existing) {
      return existing
    }

    return await this.repository.create(userId, {})
  }
}

