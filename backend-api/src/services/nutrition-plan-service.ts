import { NutritionPlanRepository } from '../repositories/nutrition-plan-repository'
import { CreateNutritionPlanInput, NutritionPlan } from '../models/nutrition-plan'
import { CalculationResult } from '../services/nutrition-calculator'

export class NutritionPlanService {
  private repository: NutritionPlanRepository

  constructor() {
    this.repository = new NutritionPlanRepository()
  }

  async getByUserId(userId: string): Promise<NutritionPlan | null> {
    return await this.repository.findByUserId(userId)
  }

  async createFromCalculation(
    userId: string,
    calculation: CalculationResult
  ): Promise<NutritionPlan> {
    const input: CreateNutritionPlanInput = {
      calories: calculation.calories,
      protein: calculation.protein,
      carbs: calculation.carbs,
      fats: calculation.fats,
    }

    return await this.repository.create(userId, input)
  }

  async create(userId: string, input: CreateNutritionPlanInput): Promise<NutritionPlan> {
    return await this.repository.create(userId, input)
  }

  async update(planId: string, input: Partial<CreateNutritionPlanInput>): Promise<NutritionPlan> {
    return await this.repository.update(planId, input)
  }
}

